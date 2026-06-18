package com.helpdesk.domain.agent;

import com.helpdesk.domain.ticket.entity.Ticket;

public interface AgentCapabilityHandler {

    AgentCapability getCapability();

    /**
     * Performs the capability's action and returns the comment body to post on the ticket.
     * Throws if the action cannot be completed.
     */
    String execute(Ticket ticket);
}
