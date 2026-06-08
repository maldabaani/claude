package com.helpdesk.domain.task;

import com.helpdesk.domain.user.repository.UserRepository;
import com.helpdesk.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TicketTaskService {

    private final TicketTaskRepository taskRepository;
    private final UserRepository userRepository;

    public List<TicketTaskDto> getTasks(UUID ticketId) {
        return taskRepository.findByTicketIdOrderByCreatedAtAsc(ticketId)
                .stream().map(this::toDto).toList();
    }

    @Transactional
    public TicketTaskDto create(UUID ticketId, CreateTaskRequest request, UUID createdById) {
        TicketTask task = TicketTask.builder()
                .ticketId(ticketId)
                .title(request.title())
                .assignedTo(request.assignedToId())
                .dueDate(request.dueDate())
                .createdBy(createdById)
                .build();
        return toDto(taskRepository.save(task));
    }

    @Transactional
    public TicketTaskDto toggleCompleted(UUID ticketId, UUID taskId) {
        TicketTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("TicketTask", taskId));
        task.setCompleted(!task.isCompleted());
        task.setCompletedAt(task.isCompleted() ? Instant.now() : null);
        return toDto(taskRepository.save(task));
    }

    @Transactional
    public void delete(UUID ticketId, UUID taskId) {
        taskRepository.deleteById(taskId);
    }

    private TicketTaskDto toDto(TicketTask task) {
        String assignedToName = null;
        if (task.getAssignedTo() != null) {
            assignedToName = userRepository.findById(task.getAssignedTo())
                    .map(u -> u.getFullName()).orElse(null);
        }
        return new TicketTaskDto(
                task.getId(),
                task.getTicketId(),
                task.getTitle(),
                task.isCompleted(),
                task.getAssignedTo(),
                assignedToName,
                task.getDueDate(),
                task.getCreatedAt()
        );
    }
}
