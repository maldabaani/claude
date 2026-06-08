package com.helpdesk.domain.organization;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrganizationRepository extends JpaRepository<Organization, UUID> {
    List<Organization> findByNameContainingIgnoreCase(String name);
    Optional<Organization> findByDomain(String domain);
}
