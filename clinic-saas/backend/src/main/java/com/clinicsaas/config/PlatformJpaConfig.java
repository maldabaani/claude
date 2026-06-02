package com.clinicsaas.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.orm.jpa.EntityManagerFactoryBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.transaction.PlatformTransactionManager;

import javax.sql.DataSource;
import java.util.Map;

@Configuration
@EnableJpaRepositories(
        basePackages = "com.clinicsaas.repositories.platform",
        entityManagerFactoryRef = "platformEntityManagerFactory",
        transactionManagerRef = "platformTransactionManager"
)
public class PlatformJpaConfig {

    @Bean(name = "platformEntityManagerFactory")
    @Primary
    public LocalContainerEntityManagerFactoryBean platformEntityManagerFactory(
            EntityManagerFactoryBuilder builder,
            @Qualifier("platformDataSource") DataSource ds) {
        return builder
                .dataSource(ds)
                .packages("com.clinicsaas.entities.platform")
                .persistenceUnit("platform")
                .properties(Map.of(
                        "hibernate.hbm2ddl.auto", "validate",
                        "hibernate.dialect", "org.hibernate.dialect.PostgreSQLDialect"
                ))
                .build();
    }

    @Bean(name = "platformTransactionManager")
    @Primary
    public PlatformTransactionManager platformTransactionManager(
            @Qualifier("platformEntityManagerFactory") LocalContainerEntityManagerFactoryBean emf) {
        JpaTransactionManager tm = new JpaTransactionManager();
        tm.setEntityManagerFactory(emf.getObject());
        return tm;
    }
}
