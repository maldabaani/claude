package com.clinicsaas.dtos.request;

import com.clinicsaas.entities.enums.ImagingModality;
import com.clinicsaas.entities.enums.LabOrderPriority;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateRadiologyOrderRequest(
        @NotNull UUID visitId,
        @NotNull ImagingModality modality,
        String bodyPart,
        String laterality,
        String clinicalIndication,
        LabOrderPriority priority
) {}
