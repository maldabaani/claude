package com.helpdesk.domain.businesshours;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BusinessHoursService {

    private final BusinessHoursRepository businessHoursRepository;
    private final BusinessHolidayRepository businessHolidayRepository;

    public List<BusinessHours> getAll() {
        return businessHoursRepository.findAll();
    }

    @Transactional
    public BusinessHours upsertDay(int dayOfWeek, boolean isOpen, LocalTime openTime, LocalTime closeTime, String timezone) {
        BusinessHours bh = businessHoursRepository.findByDayOfWeek(dayOfWeek)
                .orElse(BusinessHours.builder()
                        .dayOfWeek(dayOfWeek)
                        .timezone(timezone != null ? timezone : "UTC")
                        .build());
        bh.setOpen(isOpen);
        bh.setOpenTime(isOpen ? openTime : null);
        bh.setCloseTime(isOpen ? closeTime : null);
        bh.setTimezone(timezone != null ? timezone : "UTC");
        return businessHoursRepository.save(bh);
    }

    public BusinessHoursStatusResponse isCurrentlyOpen() {
        List<BusinessHours> allHours = businessHoursRepository.findAll();
        if (allHours.isEmpty()) {
            return new BusinessHoursStatusResponse(false, null);
        }

        String timezone = allHours.get(0).getTimezone();
        ZoneId zone;
        try {
            zone = ZoneId.of(timezone);
        } catch (Exception e) {
            zone = ZoneId.of("UTC");
        }

        ZonedDateTime now = ZonedDateTime.now(zone);
        LocalDate today = now.toLocalDate();
        LocalTime currentTime = now.toLocalTime();

        if (businessHolidayRepository.existsByHolidayDate(today)) {
            String nextOpen = findNextOpenTime(now, allHours, zone);
            return new BusinessHoursStatusResponse(false, nextOpen);
        }

        int isoDow = now.getDayOfWeek().getValue();
        BusinessHours todayHours = allHours.stream()
                .filter(bh -> bh.getDayOfWeek() == isoDow)
                .findFirst().orElse(null);

        if (todayHours == null || !todayHours.isOpen() || todayHours.getOpenTime() == null || todayHours.getCloseTime() == null) {
            String nextOpen = findNextOpenTime(now, allHours, zone);
            return new BusinessHoursStatusResponse(false, nextOpen);
        }

        boolean open = !currentTime.isBefore(todayHours.getOpenTime()) && currentTime.isBefore(todayHours.getCloseTime());
        if (open) {
            return new BusinessHoursStatusResponse(true, null);
        }

        String nextOpen = findNextOpenTime(now, allHours, zone);
        return new BusinessHoursStatusResponse(false, nextOpen);
    }

    private String findNextOpenTime(ZonedDateTime from, List<BusinessHours> allHours, ZoneId zone) {
        for (int i = 1; i <= 8; i++) {
            ZonedDateTime candidate = from.plusDays(i);
            LocalDate candidateDate = candidate.toLocalDate();

            if (businessHolidayRepository.existsByHolidayDate(candidateDate)) continue;

            int isoDow = candidate.getDayOfWeek().getValue();
            BusinessHours bh = allHours.stream()
                    .filter(h -> h.getDayOfWeek() == isoDow)
                    .findFirst().orElse(null);

            if (bh != null && bh.isOpen() && bh.getOpenTime() != null) {
                ZonedDateTime nextOpen = candidateDate.atTime(bh.getOpenTime()).atZone(zone);
                return nextOpen.toInstant().toString();
            }
        }
        return null;
    }

    public List<BusinessHoliday> getHolidays() {
        return businessHolidayRepository.findAllByOrderByHolidayDateAsc();
    }

    @Transactional
    public BusinessHoliday addHoliday(LocalDate date, String name) {
        BusinessHoliday holiday = BusinessHoliday.builder()
                .holidayDate(date)
                .name(name)
                .build();
        return businessHolidayRepository.save(holiday);
    }

    @Transactional
    public void deleteHoliday(UUID id) {
        businessHolidayRepository.deleteById(id);
    }

    public record BusinessHoursStatusResponse(boolean isOpen, String nextOpenAt) {}
}
