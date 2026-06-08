package com.clinicsaas.repositories.tenant;

import com.clinicsaas.entities.tenant.ClinicSetting;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ClinicSettingRepository extends JpaRepository<ClinicSetting, UUID> {
    Optional<ClinicSetting> findBySettingKey(String key);
    List<ClinicSetting> findAllByOrderBySettingKeyAsc();
}
