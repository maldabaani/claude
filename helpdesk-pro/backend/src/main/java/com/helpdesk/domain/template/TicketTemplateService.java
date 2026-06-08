package com.helpdesk.domain.template;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TicketTemplateService {

    private final TicketTemplateRepository templateRepository;

    public List<TicketTemplate> getActiveTemplates() {
        return templateRepository.findByActiveTrue();
    }

    @Transactional
    public TicketTemplate createTemplate(TicketTemplate template) {
        template.setId(null);
        return templateRepository.save(template);
    }

    @Transactional
    public TicketTemplate updateTemplate(UUID id, TicketTemplate updated) {
        TicketTemplate existing = templateRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Template not found"));
        existing.setName(updated.getName());
        existing.setSubject(updated.getSubject());
        existing.setDescription(updated.getDescription());
        existing.setPriority(updated.getPriority());
        existing.setCategory(updated.getCategory());
        existing.setActive(updated.isActive());
        return templateRepository.save(existing);
    }

    @Transactional
    public void deleteTemplate(UUID id) {
        templateRepository.findById(id).ifPresent(t -> {
            t.setActive(false);
            templateRepository.save(t);
        });
    }
}
