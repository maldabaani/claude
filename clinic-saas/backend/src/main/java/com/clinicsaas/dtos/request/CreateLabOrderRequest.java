package com.clinicsaas.dtos.request;

import com.clinicsaas.entities.enums.LabOrderPriority;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record CreateLabOrderRequest(
        @NotNull UUID visitId,
        @NotEmpty List<UUID> labTestIds,
        LabOrderPriority priority,
        String clinicalIndication
) {}
