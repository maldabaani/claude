package com.helpdesk.domain.ticket.dto;
import java.util.List;
public record DuplicateDetectionResult(List<DuplicateCandidate> duplicates) {}
