package com.helpdesk.domain.timeentry;

import com.helpdesk.domain.user.repository.UserRepository;
import com.helpdesk.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TimeEntryService {

    private final TimeEntryRepository timeEntryRepository;
    private final UserRepository userRepository;

    public List<TimeEntryResponse> getEntriesForTicket(UUID ticketId) {
        return timeEntryRepository.findByTicketIdOrderByLoggedAtDesc(ticketId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public TimeEntryResponse logTime(UUID ticketId, TimeEntryRequest request, UUID agentId) {
        TimeEntry entry = TimeEntry.builder()
                .ticketId(ticketId)
                .agentId(agentId)
                .minutes(request.minutes())
                .note(request.note())
                .loggedAt(request.loggedAt() != null ? request.loggedAt() : LocalDateTime.now())
                .build();
        return toResponse(timeEntryRepository.save(entry));
    }

    @Transactional
    public void deleteEntry(UUID ticketId, UUID entryId, UUID requestingAgentId, boolean isAdmin) {
        TimeEntry entry = timeEntryRepository.findById(entryId)
                .orElseThrow(() -> new ResourceNotFoundException("TimeEntry", entryId));
        if (!isAdmin && !entry.getAgentId().equals(requestingAgentId)) {
            throw new AccessDeniedException("You can only delete your own time entries");
        }
        timeEntryRepository.delete(entry);
    }

    public Integer getTotalMinutesForTicket(UUID ticketId) {
        return timeEntryRepository.sumMinutesByTicketId(ticketId);
    }

    private TimeEntryResponse toResponse(TimeEntry entry) {
        String agentName = userRepository.findById(entry.getAgentId())
                .map(u -> u.getFullName()).orElse("Unknown");
        return new TimeEntryResponse(
                entry.getId(),
                entry.getTicketId(),
                entry.getAgentId(),
                agentName,
                entry.getMinutes(),
                entry.getNote(),
                entry.getLoggedAt()
        );
    }
}
