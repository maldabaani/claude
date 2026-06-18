package com.helpdesk.domain.agent;

import com.helpdesk.domain.ticket.entity.Ticket;
import com.helpdesk.domain.user.entity.User;
import com.helpdesk.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class HardwareCapabilityHandler implements AgentCapabilityHandler {

    private static final Logger log = LoggerFactory.getLogger(HardwareCapabilityHandler.class);
    private final UserRepository userRepository;

    @Override
    public String getCapabilityKey() {
        return "HARDWARE_REQUEST";
    }

    @Override
    public String execute(Ticket ticket) {
        User requester = userRepository.findById(ticket.getCreatedById())
                .orElseThrow(() -> new IllegalStateException("Requester not found for ticket " + ticket.getTicketNumber()));


        log.info("Hardware AI agent working for ticket {} - would email {}",
                ticket.getTicketNumber(), requester.getEmail());

        return "AI Hardware Agent: " + requester.getEmail() + " has requested hardware assistance. Email delivery is currently paused pending mail server setup - please reach out to the customer manually for now to provide support.";
    }

}
