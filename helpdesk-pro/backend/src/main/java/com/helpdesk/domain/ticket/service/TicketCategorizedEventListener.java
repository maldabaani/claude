package com.helpdesk.domain.ticket.service;

import com.helpdesk.domain.ticket.event.TicketCategorizedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class TicketCategorizedEventListener {

    private final AccountAccessAgentService accountAccessAgentService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onTicketCategorized(TicketCategorizedEvent event) {
        accountAccessAgentService.process(event.ticketId());
    }
}
