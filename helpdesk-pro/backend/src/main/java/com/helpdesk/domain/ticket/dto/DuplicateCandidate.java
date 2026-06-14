package com.helpdesk.domain.ticket.dto;
public record DuplicateCandidate(String id, String ticketNumber, String title, int similarityScore, String reason) {}
