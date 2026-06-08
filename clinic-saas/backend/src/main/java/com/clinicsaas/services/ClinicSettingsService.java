package com.clinicsaas.services;

import com.clinicsaas.dtos.request.UpdateSettingsRequest;
import com.clinicsaas.dtos.response.ClinicSettingsResponse;
import com.clinicsaas.entities.tenant.ClinicSetting;
import com.clinicsaas.repositories.tenant.ClinicSettingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClinicSettingsService {

    private final ClinicSettingRepository clinicSettingRepository;

    @Transactional(value = "tenantTransactionManager", readOnly = true)
    public ClinicSettingsResponse getAll() {
        log.debug("Fetching all clinic settings");
        Map<String, String> map = new LinkedHashMap<>();
        clinicSettingRepository.findAllByOrderBySettingKeyAsc()
                .forEach(s -> map.put(s.getSettingKey(), s.getSettingValue()));
        return new ClinicSettingsResponse(map);
    }

    @Transactional("tenantTransactionManager")
    public ClinicSettingsResponse update(UpdateSettingsRequest req) {
        log.debug("Updating clinic settings, keys={}", req.settings() != null ? req.settings().keySet() : null);
        if (req.settings() != null) {
            req.settings().forEach((key, value) -> {
                ClinicSetting setting = clinicSettingRepository.findBySettingKey(key)
                        .orElseGet(() -> {
                            ClinicSetting s = new ClinicSetting();
                            s.setSettingKey(key);
                            return s;
                        });
                setting.setSettingValue(value);
                clinicSettingRepository.save(setting);
            });
        }
        return getAll();
    }
}
