package com.helpdesk.domain.businesshours;

import com.helpdesk.shared.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/business-hours")
@RequiredArgsConstructor
public class BusinessHoursController {

    private final BusinessHoursService businessHoursService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<BusinessHours>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(businessHoursService.getAll()));
    }

    @PutMapping("/{dayOfWeek}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BusinessHours>> upsertDay(
            @PathVariable int dayOfWeek,
            @RequestBody Map<String, Object> body) {
        boolean isOpen = Boolean.TRUE.equals(body.get("isOpen"));
        LocalTime openTime = body.get("openTime") != null ? LocalTime.parse(body.get("openTime").toString()) : null;
        LocalTime closeTime = body.get("closeTime") != null ? LocalTime.parse(body.get("closeTime").toString()) : null;
        String timezone = body.get("timezone") != null ? body.get("timezone").toString() : "UTC";
        BusinessHours result = businessHoursService.upsertDay(dayOfWeek, isOpen, openTime, closeTime, timezone);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<BusinessHoursService.BusinessHoursStatusResponse>> getStatus() {
        return ResponseEntity.ok(ApiResponse.ok(businessHoursService.isCurrentlyOpen()));
    }

    @GetMapping("/holidays")
    public ResponseEntity<ApiResponse<List<BusinessHoliday>>> getHolidays() {
        return ResponseEntity.ok(ApiResponse.ok(businessHoursService.getHolidays()));
    }

    @PostMapping("/holidays")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BusinessHoliday>> addHoliday(@RequestBody Map<String, String> body) {
        LocalDate date = LocalDate.parse(body.get("holidayDate"));
        String name = body.get("name");
        return ResponseEntity.ok(ApiResponse.ok(businessHoursService.addHoliday(date, name)));
    }

    @DeleteMapping("/holidays/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteHoliday(@PathVariable UUID id) {
        businessHoursService.deleteHoliday(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
