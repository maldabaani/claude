package com.clinicsaas.multitenancy;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;
import java.util.Map;
import java.util.Properties;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class TenantDataSourceManager {

    private final Map<String, DataSource> cache = new ConcurrentHashMap<>();

    @Value("${app.tenant-db.host}")
    private String host;

    @Value("${app.tenant-db.port}")
    private int port;

    @Value("${app.tenant-db.admin-user}")
    private String adminUser;

    @Value("${app.tenant-db.admin-password}")
    private String adminPassword;

    public DataSource getDataSourceForTenant(String dbName) {
        return cache.computeIfAbsent(dbName, this::buildDataSource);
    }

    public void evict(String dbName) {
        DataSource ds = cache.remove(dbName);
        if (ds instanceof HikariDataSource hikari) {
            hikari.close();
        }
    }

    /**
     * Creates the physical PostgreSQL database for a new tenant.
     * DB name must be alphanumeric + underscore to prevent SQL injection.
     */
    public void provisionDatabase(String dbName) {
        validateDbName(dbName);
        String url = jdbcUrl("postgres");
        try (Connection conn = openAdminConnection(url);
             Statement stmt = conn.createStatement()) {
            stmt.executeUpdate("CREATE DATABASE \"" + dbName + "\"");
            log.info("Provisioned tenant database: {}", dbName);
        } catch (Exception ex) {
            throw new RuntimeException("Failed to provision database: " + dbName, ex);
        }
    }

    private DataSource buildDataSource(String dbName) {
        HikariConfig cfg = new HikariConfig();
        cfg.setJdbcUrl(jdbcUrl(dbName));
        cfg.setUsername(adminUser);
        cfg.setPassword(adminPassword);
        cfg.setMaximumPoolSize(5);
        cfg.setMinimumIdle(1);
        cfg.setConnectionTimeout(30_000);
        cfg.setPoolName("tenant-pool-" + dbName);
        log.debug("Creating datasource pool for tenant db: {}", dbName);
        return new HikariDataSource(cfg);
    }

    private Connection openAdminConnection(String url) throws Exception {
        Properties props = new Properties();
        props.setProperty("user", adminUser);
        props.setProperty("password", adminPassword);
        return DriverManager.getConnection(url, props);
    }

    private String jdbcUrl(String dbName) {
        return String.format("jdbc:postgresql://%s:%d/%s", host, port, dbName);
    }

    private void validateDbName(String dbName) {
        if (dbName == null || !dbName.matches("^[a-zA-Z0-9_]{3,63}$")) {
            throw new IllegalArgumentException("Invalid database name: " + dbName);
        }
    }
}
