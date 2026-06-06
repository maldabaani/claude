package com.helpdesk.domain.ticket.service;

import com.helpdesk.domain.notification.service.NotificationService;
import com.helpdesk.domain.ticket.entity.Ticket;
import com.helpdesk.domain.ticket.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class SlaScheduler {

    private final TicketRepository ticketRepository;
    private final NotificationService notificationService;

    @Scheduled(fixedDelayString = "${app.sla.check-interval-ms:300000}")
    @Transactional
    public void checkSlaBreaches() {
        List<Ticket> breached = ticketRepository.findSlaBreachedTickets(Instant.now());
        if (breached.isEmpty()) return;
        log.info("SLA check: {} tickets breached", breached.size());
        breached.forEach(ticket -> {
            ticket.setSlaBreached(true);
            ticketRepository.save(ticket);
            notificationService.notifySlaBreached(ticket);
        });
    }
}
