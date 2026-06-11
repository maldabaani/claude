package com.helpdesk.domain.businesshours;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface BusinessHolidayRepository extends JpaRepository<BusinessHoliday, UUID> {
    List<BusinessHoliday> findAllByOrderByHolidayDateAsc();
    boolean existsByHolidayDate(LocalDate date);
}
