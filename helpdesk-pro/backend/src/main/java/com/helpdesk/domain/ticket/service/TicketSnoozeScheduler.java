package com.helpdesk.domain.ticket.service;

import com.helpdesk.domain.notification.service.NotificationService;
import com.helpdesk.domain.ticket.entity.Ticket;
import com.helpdesk.domain.ticket.entity.TicketStatus;
import com.helpdesk.domain.ticket.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class TicketSnoozeScheduler {

    private final TicketRepository ticketRepository;
    private final NotificationService notificationService;

    @Scheduled(fixedDelay = 60_000)
    @Transactional
    public void wakeExpiredSnoozes() {
        List<Ticket> expired = ticketRepository.findExpiredSnoozedTickets(LocalDateTime.now());
        if (expired.isEmpty()) return;
        log.info("Snooze check: {} tickets waking up", expired.size());
        for (Ticket ticket : expired) {
            String restore = ticket.getPreSnoozeStatus();
            TicketStatus restoreStatus = (restore != null && !restore.isBlank())
                    ? TicketStatus.valueOf(restore) : TicketStatus.OPEN;
            ticket.setStatus(restoreStatus);
            ticket.setSnoozedUntil(null);
            ticket.setSnoozedById(null);
            ticket.setPreSnoozeStatus(null);
            ticketRepository.save(ticket);
            try {
                notificationService.notifySnoozeWakeUp(ticket);
            } catch (Exception e) {
                log.warn("Failed to notify snooze wake-up for ticket {}: {}", ticket.getId(), e.getMessage());
            }
        }
    }
}
