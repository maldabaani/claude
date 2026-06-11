package com.helpdesk.domain.ticketlink;

public enum LinkType {
    RELATED_TO,
    BLOCKS,
    IS_BLOCKED_BY,
    DUPLICATES,
    IS_DUPLICATED_BY;

    public LinkType inverse() {
        return switch (this) {
            case BLOCKS -> IS_BLOCKED_BY;
            case IS_BLOCKED_BY -> BLOCKS;
            case DUPLICATES -> IS_DUPLICATED_BY;
            case IS_DUPLICATED_BY -> DUPLICATES;
            case RELATED_TO -> RELATED_TO;
        };
    }
}
