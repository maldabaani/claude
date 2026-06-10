package com.helpdesk.domain.customerprofile.dto;

import com.helpdesk.domain.ticket.dto.TicketResponse;
import com.helpdesk.domain.user.dto.UserResponse;

import java.util.List;

public record CustomerProfileResponse(
        UserResponse user,
        CustomerStatsResponse stats,
        List<TicketResponse> recentTickets,
        List<CustomerNoteResponse> notes
) {}
