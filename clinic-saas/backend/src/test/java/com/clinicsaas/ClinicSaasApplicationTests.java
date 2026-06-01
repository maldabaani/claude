package com.clinicsaas;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest
@ActiveProfiles("test")
@Testcontainers
class ClinicSaasApplicationTests {

    @Container
    static PostgreSQLContainer<?> postgres =
        new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("clinic_platform_test")
            .withUsername("test_user")
            .withPassword("test_pass");

    @DynamicPropertySource
    static void overrideDataSourceProperties(DynamicPropertyRegistry registry) {
        registry.add("PLATFORM_DB_URL",       postgres::getJdbcUrl);
        registry.add("PLATFORM_DB_USER",       postgres::getUsername);
        registry.add("PLATFORM_DB_PASSWORD",   postgres::getPassword);
        registry.add("POSTGRES_HOST",          postgres::getHost);
        registry.add("POSTGRES_PORT",          () -> String.valueOf(postgres.getMappedPort(5432)));
        registry.add("POSTGRES_ADMIN_USER",    postgres::getUsername);
        registry.add("POSTGRES_ADMIN_PASSWORD", postgres::getPassword);
    }

    @Test
    void contextLoads() {}
}
