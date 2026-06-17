package com.helpdesk.domain.sla.repository;

import com.helpdesk.domain.sla.entity.SlaPolicy;
import com.helpdesk.domain.ticket.entity.Priority;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SlaPolicyRepository extends JpaRepository<SlaPolicy, UUID> {
    Optional<SlaPolicy> findByIdAndDeletedAtIsNull(UUID id);
    Page<SlaPolicy> findByDeletedAtIsNull(Pageable pageable);
    Optional<SlaPolicy> findByPriorityAndDeletedAtIsNull(Priority priority);
}
