package com.helpdesk.domain.issue;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface IssueTicketRepository extends JpaRepository<IssueTicket, IssueTicketId> {
    List<IssueTicket> findByIssueId(UUID issueId);
    List<IssueTicket> findByTicketId(UUID ticketId);
    void deleteByIssueIdAndTicketId(UUID issueId, UUID ticketId);
    long countByIssueId(UUID issueId);
}
