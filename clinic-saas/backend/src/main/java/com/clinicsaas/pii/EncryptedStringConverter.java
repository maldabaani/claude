package com.clinicsaas.pii;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.extern.slf4j.Slf4j;

/**
 * Transparent AES-256-GCM encryption for @Column fields marked with
 * @Convert(converter = EncryptedStringConverter.class).
 */
@Slf4j
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
        if (svc == null) return dbData;
        try {
            return svc.decrypt(dbData);
        } catch (Exception e) {
            // Data was encrypted with a different key (e.g. after key rotation or fresh dev setup).
            // Return null so the row loads without crashing; field will be re-encrypted on next write.
            log.warn("PII decryption failed for a field — likely a key mismatch. Field will appear blank.");
            return null;
        }
    }
}
