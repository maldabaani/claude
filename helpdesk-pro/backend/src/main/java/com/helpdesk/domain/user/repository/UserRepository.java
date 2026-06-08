package com.helpdesk.domain.user.repository;

import com.helpdesk.domain.user.entity.Role;
import com.helpdesk.domain.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmailAndDeletedAtIsNull(String email);
    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u WHERE u.deletedAt IS NULL AND (:role IS NULL OR u.role = :role)")
    Page<User> findAllActive(Role role, Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.deletedAt IS NULL AND u.role IN ('AGENT', 'TEAM_LEAD') AND u.departmentId = :departmentId AND u.active = true")
    List<User> findActiveAgentsByDepartment(UUID departmentId);

    @Query("SELECT u FROM User u WHERE u.deletedAt IS NULL AND u.role IN ('AGENT', 'TEAM_LEAD') AND u.active = true")
    List<User> findAllActiveAgents();

    List<User> findByOrganizationId(UUID organizationId);

    long countByOrganizationId(UUID organizationId);

    @Query("SELECT u FROM User u WHERE u.deletedAt IS NULL AND u.organizationId = :orgId")
    List<User> findActiveByOrganizationId(UUID orgId);
}
