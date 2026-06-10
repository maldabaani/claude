package com.helpdesk.domain.ticket.entity;

import java.util.Set;

public enum TicketStatus {
    NEW, OPEN, PENDING, ON_HOLD, RESOLVED, CLOSED, SNOOZED;

    public boolean canTransitionTo(TicketStatus next) {
        return switch (this) {
            case NEW -> Set.of(OPEN, PENDING, ON_HOLD, CLOSED, SNOOZED).contains(next);
            case OPEN -> Set.of(PENDING, ON_HOLD, RESOLVED, CLOSED, SNOOZED).contains(next);
            case PENDING -> Set.of(OPEN, ON_HOLD, RESOLVED, CLOSED, SNOOZED).contains(next);
            case ON_HOLD -> Set.of(OPEN, PENDING, RESOLVED, CLOSED, SNOOZED).contains(next);
            case RESOLVED -> Set.of(OPEN, CLOSED).contains(next);
            case CLOSED -> Set.of(OPEN).contains(next);
            case SNOOZED -> Set.of(NEW, OPEN, PENDING, ON_HOLD).contains(next);
        };
    }
}
