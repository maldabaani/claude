package com.helpdesk.domain.ticket.entity;

import java.util.Set;

public enum TicketStatus {
    NEW, OPEN, PENDING, ON_HOLD, RESOLVED, CLOSED;

    public boolean canTransitionTo(TicketStatus next) {
        return switch (this) {
            case NEW -> Set.of(OPEN, CLOSED).contains(next);
            case OPEN -> Set.of(PENDING, ON_HOLD, RESOLVED, CLOSED).contains(next);
            case PENDING -> Set.of(OPEN, ON_HOLD, RESOLVED, CLOSED).contains(next);
            case ON_HOLD -> Set.of(OPEN, PENDING, RESOLVED, CLOSED).contains(next);
            case RESOLVED -> Set.of(OPEN, CLOSED).contains(next);
            case CLOSED -> Set.of(OPEN).contains(next);
        };
    }
}
