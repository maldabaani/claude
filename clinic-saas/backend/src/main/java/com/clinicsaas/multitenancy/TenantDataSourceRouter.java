package com.clinicsaas.multitenancy;

import org.springframework.jdbc.datasource.lookup.AbstractRoutingDataSource;

import javax.sql.DataSource;
import java.util.HashMap;

public class TenantDataSourceRouter extends AbstractRoutingDataSource {

    private final TenantDataSourceManager dataSourceManager;

    public TenantDataSourceRouter(TenantDataSourceManager dataSourceManager) {
        this.dataSourceManager = dataSourceManager;
        // Required by AbstractRoutingDataSource.afterPropertiesSet() — we bypass the map at runtime
        setTargetDataSources(new HashMap<>());
    }

    @Override
    protected Object determineCurrentLookupKey() {
        return TenantContext.getCurrentTenant();
    }

    /**
     * Bypasses the static target map — delegates directly to the manager
     * so new tenant datasources are picked up without restart.
     */
    @Override
    protected DataSource determineTargetDataSource() {
        String tenantId = TenantContext.getCurrentTenant();
        if (tenantId == null) {
            throw new IllegalStateException("No tenant ID found in request context");
        }
        return dataSourceManager.getDataSourceForTenant(tenantId);
    }
}
