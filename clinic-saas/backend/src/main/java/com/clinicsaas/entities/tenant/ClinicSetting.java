package com.clinicsaas.entities.tenant;

import com.clinicsaas.entities.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "clinic_settings")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ClinicSetting extends BaseEntity {

    @Column(name = "setting_key", length = 100, unique = true, nullable = false)
    private String settingKey;

    @Column(name = "setting_value", columnDefinition = "TEXT")
    private String settingValue;
}
