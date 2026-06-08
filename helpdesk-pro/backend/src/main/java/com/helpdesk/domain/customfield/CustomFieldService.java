package com.helpdesk.domain.customfield;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomFieldService {

    private final CustomFieldRepository customFieldRepository;
    private final TicketCustomValueRepository ticketCustomValueRepository;
    private final ObjectMapper objectMapper;

    public List<CustomFieldDto> getActiveFields() {
        return customFieldRepository.findByActiveTrueOrderByDisplayOrderAsc()
                .stream().map(this::toDto).toList();
    }

    @Transactional
    public CustomFieldDto createField(CustomFieldDto dto) {
        CustomField field = CustomField.builder()
                .name(dto.name())
                .fieldKey(dto.fieldKey())
                .fieldType(dto.fieldType())
                .options(toJson(dto.options()))
                .required(dto.required())
                .displayOrder(dto.displayOrder())
                .build();
        return toDto(customFieldRepository.save(field));
    }

    @Transactional
    public void deleteField(UUID id) {
        customFieldRepository.findById(id).ifPresent(f -> {
            f.setActive(false);
            customFieldRepository.save(f);
        });
    }

    public Map<String, String> getValuesForTicket(UUID ticketId) {
        Map<String, String> result = new LinkedHashMap<>();
        ticketCustomValueRepository.findByIdTicketId(ticketId)
                .forEach(v -> result.put(v.getId().getFieldKey(), v.getValue()));
        return result;
    }

    @Transactional
    public Map<String, String> saveValues(UUID ticketId, Map<String, String> values) {
        values.forEach((key, value) -> {
            TicketCustomValue.TicketCustomValueId id =
                    new TicketCustomValue.TicketCustomValueId(ticketId, key);
            TicketCustomValue entity = ticketCustomValueRepository.findById(id)
                    .orElse(TicketCustomValue.builder().id(id).build());
            entity.setValue(value);
            ticketCustomValueRepository.save(entity);
        });
        return getValuesForTicket(ticketId);
    }

    private CustomFieldDto toDto(CustomField f) {
        return new CustomFieldDto(
                f.getId(), f.getName(), f.getFieldKey(), f.getFieldType(),
                fromJson(f.getOptions()), f.isRequired(), f.getDisplayOrder()
        );
    }

    private String toJson(List<String> list) {
        if (list == null || list.isEmpty()) return null;
        try { return objectMapper.writeValueAsString(list); } catch (Exception e) { return null; }
    }

    private List<String> fromJson(String json) {
        if (json == null || json.isBlank()) return List.of();
        try { return objectMapper.readValue(json, new TypeReference<List<String>>() {}); } catch (Exception e) { return List.of(); }
    }
}
