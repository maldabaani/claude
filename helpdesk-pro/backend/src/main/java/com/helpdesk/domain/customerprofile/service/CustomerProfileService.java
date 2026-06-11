package com.helpdesk.domain.customerprofile.service;

import com.helpdesk.domain.csat.repository.CsatRatingRepository;
import com.helpdesk.domain.customerprofile.dto.*;
import com.helpdesk.domain.customerprofile.entity.CustomerNote;
import com.helpdesk.domain.customerprofile.repository.CustomerNoteRepository;
import com.helpdesk.domain.ticket.entity.Ticket;
import com.helpdesk.domain.ticket.entity.TicketStatus;
import com.helpdesk.domain.ticket.repository.TicketRepository;
import com.helpdesk.domain.ticket.service.TicketService;
import com.helpdesk.domain.timeentry.TimeEntryRepository;
import com.helpdesk.domain.user.entity.User;
import com.helpdesk.domain.user.repository.UserRepository;
import com.helpdesk.domain.user.service.UserService;
import com.helpdesk.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomerProfileService {

    private final UserRepository userRepository;
    private final UserService userService;
    private final TicketRepository ticketRepository;
    private final TicketService ticketService;
    private final CsatRatingRepository csatRatingRepository;
    private final TimeEntryRepository timeEntryRepository;
    private final CustomerNoteRepository customerNoteRepository;

    @Transactional(readOnly = true)
    public CustomerProfileResponse getProfile(UUID customerId) {
        User customer = userRepository.findById(customerId)
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("User", customerId));

        // Stats
        List<Ticket> allTickets = ticketRepository.findByCreatedByIdAndDeletedAtIsNullOrderByCreatedAtDesc(customerId);

        long total = allTickets.size();
        long open = allTickets.stream()
                .filter(t -> t.getStatus() != TicketStatus.RESOLVED && t.getStatus() != TicketStatus.CLOSED)
                .count();
        long resolved = allTickets.stream()
                .filter(t -> t.getStatus() == TicketStatus.RESOLVED || t.getStatus() == TicketStatus.CLOSED)
                .count();

        List<UUID> ticketIds = allTickets.stream().map(Ticket::getId).toList();

        double avgCsat = 0.0;
        if (!ticketIds.isEmpty()) {
            double sum = 0;
            int count = 0;
            for (UUID tid : ticketIds) {
                var rating = csatRatingRepository.findByTicketId(tid);
                if (rating.isPresent()) {
                    sum += rating.get().getRating();
                    count++;
                }
            }
            if (count > 0) avgCsat = sum / count;
        }

        long totalMinutes = 0;
        for (UUID tid : ticketIds) {
            Integer mins = timeEntryRepository.sumMinutesByTicketId(tid);
            if (mins != null) totalMinutes += mins;
        }

        // Recent tickets (last 10)
        var recentTickets = allTickets.stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .limit(10)
                .map(ticketService::toResponse)
                .toList();

        // Notes
        var notes = customerNoteRepository.findByCustomerIdOrderByCreatedAtDesc(customerId).stream()
                .map(n -> toNoteResponse(n))
                .toList();

        return new CustomerProfileResponse(
                userService.toResponse(customer),
                new CustomerStatsResponse(total, open, resolved, avgCsat > 0 ? avgCsat : null, totalMinutes),
                recentTickets,
                notes
        );
    }

    public List<CustomerNoteResponse> getNotes(UUID customerId) {
        return customerNoteRepository.findByCustomerIdOrderByCreatedAtDesc(customerId).stream()
                .map(this::toNoteResponse)
                .toList();
    }

    @Transactional
    public CustomerNoteResponse addNote(UUID customerId, UUID agentId, String content) {
        userRepository.findById(customerId)
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("User", customerId));

        CustomerNote note = CustomerNote.builder()
                .customerId(customerId)
                .agentId(agentId)
                .content(content)
                .build();
        return toNoteResponse(customerNoteRepository.save(note));
    }

    @Transactional
    public void deleteNote(UUID customerId, UUID noteId, UUID requesterId) {
        CustomerNote note = customerNoteRepository.findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException("CustomerNote", noteId));
        if (!note.getCustomerId().equals(customerId)) {
            throw new ResourceNotFoundException("CustomerNote", noteId);
        }
        if (!note.getAgentId().equals(requesterId)) {
            throw new IllegalStateException("Cannot delete another agent's note");
        }
        customerNoteRepository.delete(note);
    }

    private CustomerNoteResponse toNoteResponse(CustomerNote note) {
        String agentName = userRepository.findById(note.getAgentId())
                .map(User::getFullName).orElse("Unknown");
        return new CustomerNoteResponse(
                note.getId(),
                note.getCustomerId(),
                note.getAgentId(),
                agentName,
                note.getContent(),
                note.getCreatedAt(),
                note.getUpdatedAt()
        );
    }
}
