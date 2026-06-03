package com.clinicsaas.pii;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Transparent AES-256-GCM encryption for @Column fields marked with
 * @Convert(converter = EncryptedStringConverter.class).
 */
@Converter
public class EncryptedStringConverter implements AttributeConverter<String, String> {

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null) return null;
        EncryptionService svc = EncryptionService.instance();
        return svc != null ? svc.encrypt(attribute) : attribute;
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null) return null;
        EncryptionService svc = EncryptionService.instance();
        return svc != null ? svc.decrypt(dbData) : dbData;
    }
}
