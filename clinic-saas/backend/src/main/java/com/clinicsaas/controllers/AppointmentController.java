package com.clinicsaas.controllers;

import com.clinicsaas.dtos.request.CreateAppointmentRequest;
import com.clinicsaas.dtos.response.AppointmentResponse;
import com.clinicsaas.entities.enums.AppointmentStatus;
import com.clinicsaas.services.AppointmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/appointments")
@RequiredArgsConstructor
@Tag(name = "Appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    @PostMapping
    @Operation(summary = "Book a new appointment")
    public ResponseEntity<AppointmentResponse> create(@Valid @RequestBody CreateAppointmentRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(appointmentService.create(req));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get appointment by ID")
    public ResponseEntity<AppointmentResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(appointmentService.getById(id));
    }

    @GetMapping("/doctor/{doctorId}")
    @Operation(summary = "List appointments for a doctor")
    public ResponseEntity<Page<AppointmentResponse>> byDoctor(
            @PathVariable UUID doctorId,
            @PageableDefault(size = 20, sort = "scheduledAt") Pageable pageable) {
        return ResponseEntity.ok(appointmentService.getByDoctor(doctorId, pageable));
    }

    @GetMapping("/range")
    @Operation(summary = "List appointments within a date range (for scheduler)")
    public ResponseEntity<List<AppointmentResponse>> byRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(appointmentService.getByDateRange(from, to));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update appointment status")
    public ResponseEntity<AppointmentResponse> updateStatus(
            @PathVariable UUID id,
            @RequestParam AppointmentStatus status) {
        return ResponseEntity.ok(appointmentService.updateStatus(id, status));
    }
}
