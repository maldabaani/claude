package com.clinicsaas.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.orm.jpa.EntityManagerFactoryBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.transaction.PlatformTransactionManager;

import javax.sql.DataSource;
import java.util.Map;

@Configuration
@EnableJpaRepositories(
        basePackages = {"com.clinicsaas.repositories.tenant", "com.clinicsaas.pii"},
        entityManagerFactoryRef = "tenantEntityManagerFactory",
        transactionManagerRef = "tenantTransactionManager"
)
public class TenantJpaConfig {

    @Bean(name = "tenantEntityManagerFactory")
    public LocalContainerEntityManagerFactoryBean tenantEntityManagerFactory(
            EntityManagerFactoryBuilder builder,
            @Qualifier("tenantDataSource") DataSource ds) {
        return builder
                .dataSource(ds)
                .packages("com.clinicsaas.entities.tenant", "com.clinicsaas.pii")
                .persistenceUnit("tenant")
                .properties(Map.of(
                        "hibernate.hbm2ddl.auto", "none",
                        "hibernate.dialect", "org.hibernate.dialect.PostgreSQLDialect",
                        // Prevent Hibernate from probing JDBC metadata at startup (no tenant DB available then)
                        "hibernate.temp.use_jdbc_metadata_defaults", "false"
                ))
                .build();
    }

    @Bean(name = "tenantTransactionManager")
    public PlatformTransactionManager tenantTransactionManager(
            @Qualifier("tenantEntityManagerFactory") LocalContainerEntityManagerFactoryBean emf) {
        JpaTransactionManager tm = new JpaTransactionManager();
        tm.setEntityManagerFactory(emf.getObject());
        return tm;
    }
}
