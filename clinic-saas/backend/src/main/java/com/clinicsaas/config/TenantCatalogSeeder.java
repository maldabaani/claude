package com.clinicsaas.config;

import com.clinicsaas.entities.enums.MedicationForm;
import com.clinicsaas.entities.tenant.LabTest;
import com.clinicsaas.entities.tenant.Medication;
import com.clinicsaas.multitenancy.TenantContext;
import com.clinicsaas.repositories.platform.TenantRepository;
import com.clinicsaas.repositories.tenant.LabTestRepository;
import com.clinicsaas.repositories.tenant.MedicationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Component
@Profile("dev")
@Order(2)
@RequiredArgsConstructor
public class TenantCatalogSeeder implements ApplicationRunner {

    private final TenantRepository tenantRepository;
    private final LabTestRepository labTestRepository;
    private final MedicationRepository medicationRepository;

    @Override
    public void run(ApplicationArguments args) {
        tenantRepository.findAll().stream()
                .filter(t -> t.isActive())
                .forEach(tenant -> {
                    try {
                        TenantContext.setCurrentTenant(tenant.getDbName());
                        log.info("TenantCatalogSeeder: seeding catalog for tenant={}", tenant.getDbName());
                        seedLabTests(tenant.getDbName());
                        seedMedications(tenant.getDbName());
                    } catch (Exception e) {
                        log.error("TenantCatalogSeeder: failed for tenant={}", tenant.getDbName(), e);
                    } finally {
                        TenantContext.clear();
                    }
                });
    }

    private void seedLabTests(String tenantDb) {
        if (labTestRepository.count() != 0) {
            log.info("TenantCatalogSeeder: lab tests already seeded for tenant={}", tenantDb);
            return;
        }

        List<LabTest> tests = List.of(
                LabTest.builder()
                        .code("CBC").name("CBC (Complete Blood Count)")
                        .category("Hematology").unit("cells/µL").build(),
                LabTest.builder()
                        .code("BMP").name("BMP (Basic Metabolic Panel)")
                        .category("Chemistry").build(),
                LabTest.builder()
                        .code("HBA1C").name("HbA1c")
                        .category("Endocrinology").unit("%")
                        .normalRangeMin(new BigDecimal("4.0"))
                        .normalRangeMax(new BigDecimal("5.6")).build(),
                LabTest.builder()
                        .code("TSH").name("TSH")
                        .category("Endocrinology").unit("mIU/L")
                        .normalRangeMin(new BigDecimal("0.4"))
                        .normalRangeMax(new BigDecimal("4.0")).build(),
                LabTest.builder()
                        .code("CHOL_TOTAL").name("Total Cholesterol")
                        .category("Lipids").unit("mg/dL")
                        .normalRangeMax(new BigDecimal("200")).build(),
                LabTest.builder()
                        .code("CHOL_LDL").name("LDL Cholesterol")
                        .category("Lipids").unit("mg/dL")
                        .normalRangeMax(new BigDecimal("100")).build(),
                LabTest.builder()
                        .code("CHOL_HDL").name("HDL Cholesterol")
                        .category("Lipids").unit("mg/dL")
                        .normalRangeMin(new BigDecimal("40")).build(),
                LabTest.builder()
                        .code("FBG").name("Fasting Blood Glucose")
                        .category("Endocrinology").unit("mg/dL")
                        .normalRangeMin(new BigDecimal("70"))
                        .normalRangeMax(new BigDecimal("99")).build(),
                LabTest.builder()
                        .code("CREAT").name("Creatinine")
                        .category("Renal").unit("mg/dL")
                        .normalRangeMin(new BigDecimal("0.6"))
                        .normalRangeMax(new BigDecimal("1.2")).build(),
                LabTest.builder()
                        .code("ALT").name("ALT (Liver)")
                        .category("Hepatic").unit("U/L")
                        .normalRangeMax(new BigDecimal("56")).build()
        );

        labTestRepository.saveAll(tests);
        log.info("TenantCatalogSeeder: seeded {} lab tests for tenant={}", tests.size(), tenantDb);
    }

    private void seedMedications(String tenantDb) {
        if (medicationRepository.count() != 0) {
            log.info("TenantCatalogSeeder: medications already seeded for tenant={}", tenantDb);
            return;
        }

        List<Medication> medications = List.of(
                Medication.builder()
                        .genericName("Paracetamol").brandName("Tylenol")
                        .drugClass("Analgesic").form(MedicationForm.TABLET).strength("500mg").build(),
                Medication.builder()
                        .genericName("Amoxicillin")
                        .drugClass("Antibiotic").form(MedicationForm.CAPSULE).strength("500mg").build(),
                Medication.builder()
                        .genericName("Metformin")
                        .drugClass("Antidiabetic").form(MedicationForm.TABLET).strength("500mg").build(),
                Medication.builder()
                        .genericName("Amlodipine")
                        .drugClass("Calcium Channel Blocker").form(MedicationForm.TABLET).strength("5mg").build(),
                Medication.builder()
                        .genericName("Atorvastatin")
                        .drugClass("Statin").form(MedicationForm.TABLET).strength("20mg").build(),
                Medication.builder()
                        .genericName("Omeprazole")
                        .drugClass("PPI").form(MedicationForm.CAPSULE).strength("20mg").build(),
                Medication.builder()
                        .genericName("Ibuprofen")
                        .drugClass("NSAID").form(MedicationForm.TABLET).strength("400mg")
                        .requiresPrescription(false).build(),
                Medication.builder()
                        .genericName("Cetirizine")
                        .drugClass("Antihistamine").form(MedicationForm.TABLET).strength("10mg")
                        .requiresPrescription(false).build(),
                Medication.builder()
                        .genericName("Salbutamol")
                        .drugClass("Bronchodilator").form(MedicationForm.INHALER).strength("100mcg").build(),
                Medication.builder()
                        .genericName("Metronidazole")
                        .drugClass("Antibiotic").form(MedicationForm.TABLET).strength("400mg").build()
        );

        medicationRepository.saveAll(medications);
        log.info("TenantCatalogSeeder: seeded {} medications for tenant={}", medications.size(), tenantDb);
    }
}
