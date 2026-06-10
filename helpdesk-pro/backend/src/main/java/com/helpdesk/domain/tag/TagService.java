package com.helpdesk.domain.tag;

import com.helpdesk.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TagService {

    private final TagRepository tagRepository;
    private final TicketTagLinkRepository ticketTagLinkRepository;

    @Transactional(readOnly = true)
    public List<TagResponse> getAllTags() {
        return tagRepository.findAll().stream()
                .sorted((a, b) -> a.getName().compareToIgnoreCase(b.getName()))
                .map(tag -> toResponse(tag, ticketTagLinkRepository.countByTagId(tag.getId())))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TagResponse> searchTags(String query) {
        return tagRepository.search(query == null ? "" : query).stream()
                .map(tag -> toResponse(tag, ticketTagLinkRepository.countByTagId(tag.getId())))
                .collect(Collectors.toList());
    }

    @Transactional
    public TagResponse createTag(TagRequest request) {
        Tag tag = Tag.builder()
                .name(request.name().trim())
                .color(request.color() != null ? request.color() : "#6366F1")
                .build();
        tag = tagRepository.save(tag);
        return toResponse(tag, 0);
    }

    @Transactional
    public TagResponse updateTag(UUID id, TagRequest request) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tag not found"));
        tag.setName(request.name().trim());
        if (request.color() != null) {
            tag.setColor(request.color());
        }
        tag = tagRepository.save(tag);
        return toResponse(tag, ticketTagLinkRepository.countByTagId(id));
    }

    @Transactional
    public void deleteTag(UUID id) {
        if (!tagRepository.existsById(id)) {
            throw new ResourceNotFoundException("Tag not found");
        }
        tagRepository.deleteById(id);
    }

    @Transactional
    public TagResponse mergeTags(UUID sourceId, UUID targetId) {
        Tag source = tagRepository.findById(sourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Source tag not found"));
        Tag target = tagRepository.findById(targetId)
                .orElseThrow(() -> new ResourceNotFoundException("Target tag not found"));

        // Move all links from source to target (skip duplicates)
        ticketTagLinkRepository.reassignLinks(sourceId, targetId);
        // Delete any remaining source links (duplicates that weren't moved)
        ticketTagLinkRepository.deleteByTagId(sourceId);
        // Delete source tag
        tagRepository.delete(source);

        return toResponse(target, ticketTagLinkRepository.countByTagId(targetId));
    }

    @Transactional
    public void setTicketTags(UUID ticketId, List<UUID> tagIds) {
        ticketTagLinkRepository.deleteByTicketId(ticketId);
        for (UUID tagId : tagIds) {
            if (tagRepository.existsById(tagId)) {
                ticketTagLinkRepository.save(new TicketTagLink(ticketId, tagId));
            }
        }
    }

    @Transactional(readOnly = true)
    public List<TagResponse> getTicketTags(UUID ticketId) {
        return ticketTagLinkRepository.findByTicketId(ticketId).stream()
                .map(link -> tagRepository.findById(link.getTagId()).orElse(null))
                .filter(tag -> tag != null)
                .map(tag -> toResponse(tag, ticketTagLinkRepository.countByTagId(tag.getId())))
                .collect(Collectors.toList());
    }

    private TagResponse toResponse(Tag tag, long usageCount) {
        return new TagResponse(tag.getId(), tag.getName(), tag.getColor(), usageCount, tag.getCreatedAt());
    }
}
