package com.helpdesk.domain.slaescalation;

import com.helpdesk.domain.audit.service.AuditLogService;
import com.helpdesk.domain.notification.service.NotificationService;
import com.helpdesk.domain.ticket.entity.Ticket;
import com.helpdesk.domain.ticket.repository.TicketRepository;
import com.helpdesk.domain.user.entity.User;
import com.helpdesk.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class SlaEscalationService {

    private final SlaEscalationRuleRepository ruleRepository;
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    // Track which (ticketId, ruleId) combos have already been triggered to avoid duplicate notifications
    private final Set<String> triggeredKeys = Collections.synchronizedSet(new HashSet<>());

    @Scheduled(fixedDelay = 60000)
    @Transactional
    public void runEscalationCheck() {
        List<SlaEscalationRule> rules = ruleRepository.findByActiveTrue();
        if (rules.isEmpty()) return;

        Instant now = Instant.now();
        List<Ticket> openTickets = ticketRepository.findAll().stream()
                .filter(t -> t.getDueDate() != null && !t.isDeleted())
                .filter(t -> {
                    String status = t.getStatus().name();
                    return !status.equals("RESOLVED") && !status.equals("CLOSED");
                })
                .toList();

        for (Ticket ticket : openTickets) {
            Instant createdAt = ticket.getCreatedAt();
            Instant dueAt = ticket.getDueDate();
            if (createdAt == null || dueAt == null) continue;

            long total = dueAt.toEpochMilli() - createdAt.toEpochMilli();
            if (total <= 0) continue;
            long elapsed = now.toEpochMilli() - createdAt.toEpochMilli();
            int percent = (int) ((elapsed * 100L) / total);

            for (SlaEscalationRule rule : rules) {
                if (!rule.getPriority().equals(ticket.getPriority().name())) continue;
                if (percent < rule.getThresholdPercent()) continue;

                String key = ticket.getId() + "_" + rule.getId();
                if (triggeredKeys.contains(key)) continue;
                triggeredKeys.add(key);

                log.info("SLA escalation triggered: ticket={} rule={} percent={}%", ticket.getTicketNumber(), rule.getName(), percent);
                applyAction(ticket, rule);
                auditLogService.log("TICKET", ticket.getId(), "SLA_ESCALATION_" + rule.getAction(), null,
                        null, rule.getName() + " at " + percent + "%");
            }
        }
    }

    private void applyAction(Ticket ticket, SlaEscalationRule rule) {
        switch (rule.getAction()) {
            case "NOTIFY_AGENT" -> {
                if (ticket.getAssignedAgentId() != null) {
                    notificationService.notifySlaBreached(ticket);
                }
            }
            case "NOTIFY_ADMIN" -> notificationService.notifySlaBreached(ticket);
            case "REASSIGN_ADMIN" -> {
                List<User> admins = userRepository.findAll().stream()
                        .filter(u -> "ADMIN".equals(u.getRole().name()) && u.isActive())
                        .toList();
                if (!admins.isEmpty()) {
                    ticket.setAssignedAgentId(admins.get(0).getId());
                    ticketRepository.save(ticket);
                    notificationService.notifyTicketAssigned(ticket);
                }
            }
        }
    }

    public List<SlaEscalationRule> getAllRules() {
        return ruleRepository.findAll();
    }

    @Transactional
    public SlaEscalationRule createRule(SlaEscalationRule rule) {
        return ruleRepository.save(rule);
    }

    @Transactional
    public void deleteRule(UUID id) {
        ruleRepository.findById(id).ifPresent(r -> {
            r.setActive(false);
            ruleRepository.save(r);
        });
    }
}
