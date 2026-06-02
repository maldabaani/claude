package com.clinicsaas.entities.tenant;

import com.clinicsaas.entities.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "lab_tests")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LabTest extends BaseEntity {

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 100)
    private String category;

    @Column(length = 50)
    private String unit;

    @Column(name = "normal_range_min", precision = 10, scale = 3)
    private BigDecimal normalRangeMin;

    @Column(name = "normal_range_max", precision = 10, scale = 3)
    private BigDecimal normalRangeMax;

    @Column(name = "normal_range_text", length = 200)
    private String normalRangeText;

    @Column(name = "turnaround_hours")
    private Integer turnaroundHours;

    @Column(precision = 10, scale = 2)
    private BigDecimal price;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;
}
