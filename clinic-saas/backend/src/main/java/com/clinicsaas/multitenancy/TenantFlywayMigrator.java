package com.clinicsaas.multitenancy;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.flywaydb.core.Flyway;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;

@Slf4j
@Component
@RequiredArgsConstructor
public class TenantFlywayMigrator {

    private final TenantDataSourceManager dataSourceManager;

    public void migrate(String tenantDbName) {
        DataSource ds = dataSourceManager.getDataSourceForTenant(tenantDbName);
        Flyway flyway = Flyway.configure()
                .dataSource(ds)
                .locations("classpath:db/tenant/migration")
                .table("flyway_schema_history")
                .baselineOnMigrate(true)
                .load();
        int applied = flyway.migrate().migrationsExecuted;
        log.info("Flyway applied {} migration(s) for tenant db: {}", applied, tenantDbName);
    }
}
