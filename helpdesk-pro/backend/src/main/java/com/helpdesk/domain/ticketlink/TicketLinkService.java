package com.helpdesk.domain.ticketlink;

import com.helpdesk.domain.ticket.entity.Ticket;
import com.helpdesk.domain.ticket.repository.TicketRepository;
import com.helpdesk.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TicketLinkService {

    private final TicketLinkRepository linkRepository;
    private final TicketRepository ticketRepository;

    public List<TicketLinkResponse> getLinks(UUID ticketId) {
        List<TicketLinkResponse> result = new ArrayList<>();

        // As source
        for (TicketLink link : linkRepository.findBySourceTicketId(ticketId)) {
            Ticket target = ticketRepository.findById(link.getTargetTicketId()).orElse(null);
            if (target != null) {
                result.add(toResponse(link.getId(), target, link.getLinkType(), "outbound"));
            }
        }

        // As target
        for (TicketLink link : linkRepository.findByTargetTicketId(ticketId)) {
            Ticket source = ticketRepository.findById(link.getSourceTicketId()).orElse(null);
            if (source != null) {
                result.add(toResponse(link.getId(), source, link.getLinkType().inverse(), "inbound"));
            }
        }

        return result;
    }

    @Transactional
    public List<TicketLinkResponse> addLink(UUID ticketId, UUID targetTicketId, LinkType linkType, UUID userId) {
        ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket", ticketId));
        ticketRepository.findById(targetTicketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket", targetTicketId));

        // Create forward link
        TicketLink forward = TicketLink.builder()
                .sourceTicketId(ticketId)
                .targetTicketId(targetTicketId)
                .linkType(linkType)
                .createdBy(userId)
                .build();
        linkRepository.save(forward);

        // Create inverse link only if not RELATED_TO (already symmetric via forward) — but
        // we still store it explicitly for bidirectional querying.
        TicketLink inverse = TicketLink.builder()
                .sourceTicketId(targetTicketId)
                .targetTicketId(ticketId)
                .linkType(linkType.inverse())
                .createdBy(userId)
                .build();
        linkRepository.save(inverse);

        return getLinks(ticketId);
    }

    @Transactional
    public void removeLink(UUID linkId, UUID userId) {
        TicketLink link = linkRepository.findById(linkId)
                .orElseThrow(() -> new ResourceNotFoundException("TicketLink", linkId));

        UUID sourceId = link.getSourceTicketId();
        UUID targetId = link.getTargetTicketId();
        LinkType inverseType = link.getLinkType().inverse();

        // Delete both directions
        linkRepository.deleteById(linkId);
        linkRepository.deleteBySourceTicketIdAndTargetTicketIdAndLinkType(targetId, sourceId, inverseType);
    }

    private TicketLinkResponse toResponse(UUID linkId, Ticket ticket, LinkType displayLinkType, String direction) {
        return new TicketLinkResponse(
                linkId,
                ticket.getId(),
                ticket.getTicketNumber(),
                ticket.getTitle(),
                ticket.getStatus(),
                displayLinkType,
                direction
        );
    }
}
