package com.helpdesk.domain.helptopic;

import com.helpdesk.domain.department.entity.Department;
import com.helpdesk.domain.department.repository.DepartmentRepository;
import com.helpdesk.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class HelpTopicService {

    private final HelpTopicRepository helpTopicRepository;
    private final DepartmentRepository departmentRepository;

    public List<HelpTopicDto> findAllActive() {
        return helpTopicRepository.findByActiveTrueOrderByDisplayOrderAsc()
                .stream().map(this::toDto).toList();
    }

    public List<HelpTopicDto> findAll() {
        return helpTopicRepository.findAll().stream().map(this::toDto).toList();
    }

    @Transactional
    public HelpTopicDto create(HelpTopicDto request) {
        HelpTopic topic = HelpTopic.builder()
                .name(request.name())
                .description(request.description())
                .defaultPriority(request.defaultPriority() != null ? request.defaultPriority() : "MEDIUM")
                .autoAssignTeamLead(request.autoAssignTeamLead())
                .displayOrder(request.displayOrder())
                .active(true)
                .build();
        if (request.departmentId() != null) {
            Department dept = departmentRepository.findById(request.departmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department", request.departmentId()));
            topic.setDepartment(dept);
        }
        return toDto(helpTopicRepository.save(topic));
    }

    @Transactional
    public HelpTopicDto update(UUID id, HelpTopicDto request) {
        HelpTopic topic = helpTopicRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("HelpTopic", id));
        if (request.name() != null) topic.setName(request.name());
        if (request.description() != null) topic.setDescription(request.description());
        if (request.defaultPriority() != null) topic.setDefaultPriority(request.defaultPriority());
        topic.setAutoAssignTeamLead(request.autoAssignTeamLead());
        topic.setDisplayOrder(request.displayOrder());
        if (request.departmentId() != null) {
            Department dept = departmentRepository.findById(request.departmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department", request.departmentId()));
            topic.setDepartment(dept);
        } else {
            topic.setDepartment(null);
        }
        return toDto(helpTopicRepository.save(topic));
    }

    @Transactional
    public void delete(UUID id) {
        HelpTopic topic = helpTopicRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("HelpTopic", id));
        topic.setActive(false);
        helpTopicRepository.save(topic);
    }

    public HelpTopicDto toDto(HelpTopic topic) {
        return new HelpTopicDto(
                topic.getId(),
                topic.getName(),
                topic.getDescription(),
                topic.getDepartment() != null ? topic.getDepartment().getId() : null,
                topic.getDefaultPriority(),
                topic.isAutoAssignTeamLead(),
                topic.getDisplayOrder()
        );
    }
}
