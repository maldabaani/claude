package com.clinicsaas.repositories.platform;

import com.clinicsaas.entities.platform.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface TenantRepository extends JpaRepository<Tenant, UUID> {
    Optional<Tenant> findByDbName(String dbName);
    boolean existsByDbName(String dbName);
    boolean existsByAdminEmail(String adminEmail);
}
