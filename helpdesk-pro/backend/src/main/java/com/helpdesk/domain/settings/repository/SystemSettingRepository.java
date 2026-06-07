package com.helpdesk.domain.settings.repository;

import com.helpdesk.domain.settings.entity.SystemSetting;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SystemSettingRepository extends JpaRepository<SystemSetting, String> {
}
