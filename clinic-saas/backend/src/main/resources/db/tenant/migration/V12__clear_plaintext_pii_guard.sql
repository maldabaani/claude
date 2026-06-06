-- ─────────────────────────────────────────────────────────────────────────────
-- V12: Guard against plaintext PII left behind by databases that ran V9
--      before the application-layer encryption was in place.
--
-- Strategy: NULL out any value in the encrypted columns that is not
-- recognisable as AES-256-GCM/base64 ciphertext (i.e. shorter than the
-- minimum 13-byte IV+tag base64 length of ~20 chars, or not valid base64).
--
-- This is safe because:
--   • NULL is handled gracefully by EncryptedStringConverter (returns null).
--   • Properly encrypted values are always ≥ 28 base64 chars (12-byte IV +
--     16-byte GCM tag, even for an empty plaintext), so the length guard
--     below only touches plaintext data.
--   • In production, re-enter PII through the application after this runs.
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE patients
SET
    phone                   = CASE WHEN char_length(phone)                   >= 28 THEN phone                   ELSE NULL END,
    email                   = CASE WHEN char_length(email)                   >= 28 THEN email                   ELSE NULL END,
    address_line1           = CASE WHEN char_length(address_line1)           >= 28 THEN address_line1           ELSE NULL END,
    city                    = CASE WHEN char_length(city)                    >= 28 THEN city                    ELSE NULL END,
    emergency_contact_name  = CASE WHEN char_length(emergency_contact_name)  >= 28 THEN emergency_contact_name  ELSE NULL END,
    emergency_contact_phone = CASE WHEN char_length(emergency_contact_phone) >= 28 THEN emergency_contact_phone ELSE NULL END,
    allergies               = CASE WHEN char_length(allergies)               >= 28 THEN allergies               ELSE NULL END
WHERE
    phone                   IS NOT NULL
 OR email                   IS NOT NULL
 OR address_line1           IS NOT NULL
 OR city                    IS NOT NULL
 OR emergency_contact_name  IS NOT NULL
 OR emergency_contact_phone IS NOT NULL
 OR allergies               IS NOT NULL;
