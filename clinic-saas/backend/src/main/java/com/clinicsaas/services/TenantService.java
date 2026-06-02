package com.clinicsaas.services;

import com.clinicsaas.dtos.request.CreateTenantRequest;
import com.clinicsaas.dtos.response.TenantResponse;
import com.clinicsaas.entities.enums.Role;
import com.clinicsaas.entities.platform.Tenant;
import com.clinicsaas.entities.tenant.User;
import com.clinicsaas.exceptions.BadRequestException;
import com.clinicsaas.exceptions.ResourceNotFoundException;
import com.clinicsaas.exceptions.TenantProvisioningException;
import com.clinicsaas.multitenancy.TenantContext;
import com.clinicsaas.multitenancy.TenantDataSourceManager;
import com.clinicsaas.multitenancy.TenantFlywayMigrator;
import com.clinicsaas.repositories.platform.TenantRepository;
import com.clinicsaas.repositories.tenant.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TenantService {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final TenantDataSourceManager dataSourceManager;
    private final TenantFlywayMigrator flywayMigrator;
    private final PasswordEncoder passwordEncoder;

    @Transactional("platformTransactionManager")
    public TenantResponse provision(CreateTenantRequest req) {
        if (tenantRepository.existsByDbName(req.dbName())) {
            throw new BadRequestException("Database name already in use: " + req.dbName());
        }
        if (tenantRepository.existsByAdminEmail(req.adminEmail())) {
            throw new BadRequestException("Admin email already registered: " + req.adminEmail());
        }

        try {
            dataSourceManager.provisionDatabase(req.dbName());
            flywayMigrator.migrate(req.dbName());
            createTenantAdminUser(req);
        } catch (Exception ex) {
            throw new TenantProvisioningException("Failed to provision tenant: " + req.dbName(), ex);
        }

        Tenant tenant = tenantRepository.save(Tenant.builder()
                .name(req.name())
                .dbName(req.dbName())
                .adminEmail(req.adminEmail())
                .build());

        log.info("Tenant provisioned: {} (db={})", tenant.getName(), tenant.getDbName());
        return TenantResponse.from(tenant);
    }

    public List<TenantResponse> listAll() {
        return tenantRepository.findAll().stream().map(TenantResponse::from).toList();
    }

    public TenantResponse getById(UUID id) {
        return tenantRepository.findById(id)
                .map(TenantResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant", id));
    }

    private void createTenantAdminUser(CreateTenantRequest req) {
        TenantContext.setCurrentTenant(req.dbName());
        try {
            User admin = User.builder()
                    .email(req.adminEmail())
                    .passwordHash(passwordEncoder.encode(req.adminPassword()))
                    .firstName("Clinic")
                    .lastName("Admin")
                    .role(Role.ADMIN)
                    .build();
            userRepository.save(admin);
        } finally {
            TenantContext.clear();
        }
    }
}
