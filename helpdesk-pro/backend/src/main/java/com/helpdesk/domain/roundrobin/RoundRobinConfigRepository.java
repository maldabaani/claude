package com.helpdesk.domain.roundrobin;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface RoundRobinConfigRepository extends JpaRepository<RoundRobinConfig, UUID> {

    Optional<RoundRobinConfig> findByDepartmentIdIsNull();

    Optional<RoundRobinConfig> findByDepartmentId(UUID departmentId);
}
