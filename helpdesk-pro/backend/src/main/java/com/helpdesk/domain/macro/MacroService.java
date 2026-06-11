package com.helpdesk.domain.macro;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.helpdesk.domain.comment.dto.CreateCommentRequest;
import com.helpdesk.domain.comment.service.CommentService;
import com.helpdesk.domain.tag.Tag;
import com.helpdesk.domain.tag.TagRepository;
import com.helpdesk.domain.tag.TagService;
import com.helpdesk.domain.tag.TicketTagLink;
import com.helpdesk.domain.tag.TicketTagLinkRepository;
import com.helpdesk.domain.ticket.dto.UpdateTicketRequest;
import com.helpdesk.domain.ticket.entity.Priority;
import com.helpdesk.domain.ticket.entity.TicketStatus;
import com.helpdesk.domain.ticket.service.TicketService;
import com.helpdesk.domain.user.entity.User;
import com.helpdesk.domain.user.repository.UserRepository;
import com.helpdesk.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MacroService {

    private final MacroRepository macroRepository;
    private final TicketService ticketService;
    private final TagService tagService;
    private final CommentService commentService;
    private final ObjectMapper objectMapper;
    private final UserRepository userRepository;
    private final TagRepository tagRepository;
    private final TicketTagLinkRepository ticketTagLinkRepository;

    public List<Macro> findActive() {
        return macroRepository.findAllByActiveTrue();
    }

    public List<Macro> findAll() {
        return macroRepository.findAll();
    }

    public Macro create(MacroRequest req, UUID createdBy) {
        Macro macro = Macro.builder()
                .name(req.name())
                .description(req.description())
                .actions(req.actions() != null ? req.actions() : "[]")
                .active(true)
                .createdBy(createdBy)
                .build();
        return macroRepository.save(macro);
    }

    public Macro update(UUID id, MacroRequest req) {
        Macro macro = macroRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Macro not found"));
        macro.setName(req.name());
        macro.setDescription(req.description());
        if (req.actions() != null) {
            macro.setActions(req.actions());
        }
        return macroRepository.save(macro);
    }

    public void softDelete(UUID id) {
        Macro macro = macroRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Macro not found"));
        macro.setActive(false);
        macroRepository.save(macro);
    }

    @Transactional
    public void applyMacro(UUID macroId, UUID ticketId, User currentUser) {
        Macro macro = macroRepository.findById(macroId)
                .orElseThrow(() -> new ResourceNotFoundException("Macro not found"));
        try {
            JsonNode actions = objectMapper.readTree(macro.getActions());
            for (JsonNode action : actions) {
                String type = action.path("type").asText();
                String value = action.path("value").asText();
                switch (type) {
                    case "SET_STATUS" -> ticketService.changeStatus(ticketId, TicketStatus.valueOf(value));
                    case "ASSIGN_TO" -> ticketService.assign(ticketId, UUID.fromString(value));
                    case "ADD_TAG" -> {
                        Tag tag = tagRepository.findAll().stream()
                                .filter(t -> t.getName().equalsIgnoreCase(value))
                                .findFirst()
                                .orElseGet(() -> tagRepository.save(Tag.builder().name(value).color("#6366F1").build()));
                        boolean alreadyLinked = ticketTagLinkRepository.findByTicketId(ticketId).stream()
                                .anyMatch(l -> l.getTagId().equals(tag.getId()));
                        if (!alreadyLinked) {
                            ticketTagLinkRepository.save(new TicketTagLink(ticketId, tag.getId()));
                        }
                    }
                    case "ADD_COMMENT" -> commentService.create(ticketId, new CreateCommentRequest(value, false), currentUser);
                    case "SET_PRIORITY" -> ticketService.update(ticketId, new UpdateTicketRequest(null, null, Priority.valueOf(value), null, null, null));
                }
            }
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to parse macro actions", e);
        }
    }
}
