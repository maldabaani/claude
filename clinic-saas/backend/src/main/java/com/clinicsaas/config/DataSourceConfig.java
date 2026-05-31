package com.clinicsaas.config;

import com.clinicsaas.multitenancy.TenantDataSourceManager;
import com.clinicsaas.multitenancy.TenantDataSourceRouter;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.slf4j.Slf4j;
import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;

@Slf4j
@Configuration
public class DataSourceConfig {

    @Value("${app.platform-db.url}")
    private String platformDbUrl;

    @Value("${app.platform-db.username}")
    private String platformDbUser;

    @Value("${app.platform-db.password}")
    private String platformDbPassword;

    @Bean(name = "platformDataSource")
    @Primary
    public DataSource platformDataSource() {
        HikariConfig cfg = new HikariConfig();
        cfg.setJdbcUrl(platformDbUrl);
        cfg.setUsername(platformDbUser);
        cfg.setPassword(platformDbPassword);
        cfg.setMaximumPoolSize(10);
        cfg.setMinimumIdle(2);
        cfg.setPoolName("platform-pool");
        HikariDataSource ds = new HikariDataSource(cfg);
        runPlatformMigrations(ds);
        return ds;
    }

    @Bean(name = "tenantDataSource")
    public DataSource tenantDataSource(TenantDataSourceManager manager) {
        return new TenantDataSourceRouter(manager);
    }

    private void runPlatformMigrations(DataSource ds) {
        log.info("Running platform Flyway migrations");
        Flyway.configure()
                .dataSource(ds)
                .locations("classpath:db/platform/migration")
                .table("flyway_schema_history")
                .baselineOnMigrate(true)
                .load()
                .migrate();
    }
}
