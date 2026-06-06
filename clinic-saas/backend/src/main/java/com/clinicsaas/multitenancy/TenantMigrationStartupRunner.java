package com.clinicsaas.multitenancy;

import com.clinicsaas.entities.platform.Tenant;
import com.clinicsaas.repositories.platform.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class TenantMigrationStartupRunner implements ApplicationRunner {

    private final TenantRepository tenantRepository;
    private final TenantFlywayMigrator flywayMigrator;

    @Override
    public void run(ApplicationArguments args) {
        List<Tenant> tenants = tenantRepository.findAll();
        if (tenants.isEmpty()) {
            log.info("No tenants found — skipping startup migrations");
            return;
        }
        log.info("Running Flyway migrations for {} existing tenant(s)", tenants.size());
        for (Tenant tenant : tenants) {
            try {
                flywayMigrator.migrate(tenant.getDbName());
            } catch (Exception ex) {
                log.error("Failed to migrate tenant db '{}': {}", tenant.getDbName(), ex.getMessage(), ex);
            }
        }
    }
}
