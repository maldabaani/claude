package com.helpdesk.domain.ticket.service;

import com.helpdesk.domain.ticket.dto.TicketDraftRequest;
import com.helpdesk.domain.ticket.dto.TicketDraftResponse;
import com.helpdesk.domain.ticket.entity.TicketDraft;
import com.helpdesk.domain.ticket.repository.TicketDraftRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TicketDraftService {

    private final TicketDraftRepository draftRepository;

    public Optional<TicketDraftResponse> getDraft(UUID ticketId, UUID agentId) {
        return draftRepository.findByTicketIdAndAgentId(ticketId, agentId)
                .map(this::toResponse);
    }

    @Transactional
    public TicketDraftResponse saveDraft(UUID ticketId, UUID agentId, TicketDraftRequest request) {
        TicketDraft draft = draftRepository.findByTicketIdAndAgentId(ticketId, agentId)
                .orElse(TicketDraft.builder()
                        .ticketId(ticketId)
                        .agentId(agentId)
                        .build());
        draft.setContent(request.content());
        draft.setInternal(request.isInternal());
        draft.setUpdatedAt(Instant.now());
        return toResponse(draftRepository.save(draft));
    }

    @Transactional
    public void deleteDraft(UUID ticketId, UUID agentId) {
        draftRepository.deleteByTicketIdAndAgentId(ticketId, agentId);
    }

    private TicketDraftResponse toResponse(TicketDraft draft) {
        return new TicketDraftResponse(
                draft.getId(),
                draft.getTicketId(),
                draft.getAgentId(),
                draft.getContent(),
                draft.isInternal(),
                draft.getUpdatedAt()
        );
    }
}
