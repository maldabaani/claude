package com.helpdesk.domain.csat.service;

import com.helpdesk.domain.csat.dto.CsatRequest;
import com.helpdesk.domain.csat.dto.CsatResponse;
import com.helpdesk.domain.csat.dto.CsatStatsResponse;
import com.helpdesk.domain.csat.entity.CsatRating;
import com.helpdesk.domain.csat.repository.CsatRatingRepository;
import com.helpdesk.domain.ticket.entity.Ticket;
import com.helpdesk.domain.ticket.entity.TicketStatus;
import com.helpdesk.domain.ticket.service.TicketService;
import com.helpdesk.domain.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CsatService {

    private final TicketService ticketService;
    private final CsatRatingRepository csatRatingRepository;

    @Transactional
    public CsatResponse submitRating(UUID ticketId, CsatRequest request, User customer) {
        Ticket ticket = ticketService.getTicket(ticketId);

        if (ticket.getStatus() != TicketStatus.RESOLVED && ticket.getStatus() != TicketStatus.CLOSED)
            throw new IllegalStateException("Can only rate resolved or closed tickets");

        if (csatRatingRepository.findByTicketId(ticketId).isPresent())
            throw new IllegalStateException("Already rated");

        CsatRating rating = CsatRating.builder()
                .ticketId(ticketId)
                .customerId(customer.getId())
                .agentId(ticket.getAssignedAgentId())
                .rating(request.rating())
                .comment(request.comment())
                .build();

        CsatRating saved = csatRatingRepository.save(rating);
        return new CsatResponse(saved.getId(), saved.getTicketId(), saved.getRating(), saved.getComment(), saved.getCreatedAt());
    }

    public Optional<CsatResponse> getRating(UUID ticketId) {
        return csatRatingRepository.findByTicketId(ticketId)
                .map(r -> new CsatResponse(r.getId(), r.getTicketId(), r.getRating(), r.getComment(), r.getCreatedAt()));
    }

    public CsatStatsResponse getOverallStats() {
        long total = csatRatingRepository.count();
        double avg = csatRatingRepository.avgOverall().orElse(0.0);

        Map<Integer, Long> dist = new LinkedHashMap<>();
        for (int i = 1; i <= 5; i++) dist.put(i, 0L);

        return new CsatStatsResponse(Math.round(avg * 10.0) / 10.0, total, dist);
    }
}
