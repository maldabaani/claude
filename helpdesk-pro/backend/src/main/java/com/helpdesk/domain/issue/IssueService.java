package com.helpdesk.domain.issue;

import com.helpdesk.domain.ticket.dto.TicketResponse;
import com.helpdesk.domain.ticket.service.TicketService;
import com.helpdesk.domain.user.repository.UserRepository;
import com.helpdesk.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class IssueService {

    private final IssueRepository issueRepository;
    private final IssueTicketRepository issueTicketRepository;
    private final UserRepository userRepository;
    private final TicketService ticketService;

    public List<IssueDto> findAll() {
        return issueRepository.findAll().stream().map(this::toDto).toList();
    }

    public IssueDto findById(UUID id) {
        return toDto(getIssue(id));
    }

    @Transactional
    public IssueDto create(IssueRequest request, UUID createdBy) {
        Issue issue = Issue.builder()
                .title(request.title())
                .description(request.description())
                .status(request.status() != null ? request.status() : "OPEN")
                .priority(request.priority() != null ? request.priority() : "MEDIUM")
                .createdBy(createdBy)
                .assignedTo(request.assignedTo())
                .build();
        return toDto(issueRepository.save(issue));
    }

    @Transactional
    public IssueDto update(UUID id, IssueRequest request) {
        Issue issue = getIssue(id);
        if (request.title() != null) issue.setTitle(request.title());
        if (request.description() != null) issue.setDescription(request.description());
        if (request.status() != null) issue.setStatus(request.status());
        if (request.priority() != null) issue.setPriority(request.priority());
        if (request.assignedTo() != null) issue.setAssignedTo(request.assignedTo());
        return toDto(issueRepository.save(issue));
    }

    @Transactional
    public void delete(UUID id) {
        issueRepository.deleteById(id);
    }

    @Transactional
    public void linkTicket(UUID issueId, UUID ticketId) {
        getIssue(issueId);
        IssueTicket it = new IssueTicket(issueId, ticketId);
        issueTicketRepository.save(it);
    }

    @Transactional
    public void unlinkTicket(UUID issueId, UUID ticketId) {
        issueTicketRepository.deleteByIssueIdAndTicketId(issueId, ticketId);
    }

    public List<TicketResponse> getLinkedTickets(UUID issueId) {
        return issueTicketRepository.findByIssueId(issueId).stream()
                .map(it -> ticketService.findById(it.getTicketId()))
                .toList();
    }

    public List<IssueDto> getIssuesByTicket(UUID ticketId) {
        return issueTicketRepository.findByTicketId(ticketId).stream()
                .map(it -> issueRepository.findById(it.getIssueId()).map(this::toDto).orElse(null))
                .filter(java.util.Objects::nonNull)
                .toList();
    }

    private Issue getIssue(UUID id) {
        return issueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Issue", id));
    }

    private IssueDto toDto(Issue issue) {
        String createdByName = issue.getCreatedBy() != null
                ? userRepository.findById(issue.getCreatedBy()).map(u -> u.getFullName()).orElse(null)
                : null;
        String assignedToName = issue.getAssignedTo() != null
                ? userRepository.findById(issue.getAssignedTo()).map(u -> u.getFullName()).orElse(null)
                : null;
        long ticketCount = issueTicketRepository.countByIssueId(issue.getId());
        return new IssueDto(issue.getId(), issue.getTitle(), issue.getDescription(),
                issue.getStatus(), issue.getPriority(), createdByName, assignedToName,
                ticketCount, issue.getCreatedAt());
    }
}
