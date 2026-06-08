package com.helpdesk.domain.customfield;

import java.util.List;
import java.util.UUID;

public record CustomFieldDto(
    UUID id,
    String name,
    String fieldKey,
    String fieldType,
    List<String> options,
    boolean required,
    int displayOrder
) {}
