package com.clinicsaas.pii;

import io.jsonwebtoken.io.Decoders;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;

/**
 * AES-256-GCM encryption for PII fields stored in the database.
 * Key must be a base64-encoded 32-byte value supplied via PII_ENCRYPTION_KEY env var.
 */
@Slf4j
@Service
public class EncryptionService {

    private static final int GCM_IV_LENGTH  = 12;
    private static final int GCM_TAG_LENGTH = 128;

    @Value("${app.encryption.key}")
    private String base64Key;

    private SecretKey secretKey;
    private static EncryptionService INSTANCE;

    @PostConstruct
    void init() {
        byte[] keyBytes = Decoders.BASE64.decode(base64Key);
        if (keyBytes.length != 32) {
            throw new IllegalStateException(
                "PII encryption key must decode to exactly 32 bytes (256 bits). Got: " + keyBytes.length);
        }
        this.secretKey = new SecretKeySpec(keyBytes, "AES");
        INSTANCE = this;
        log.info("PII EncryptionService initialised (AES-256-GCM)");
    }

    public static EncryptionService instance() { return INSTANCE; }

    public String encrypt(String plaintext) {
        if (plaintext == null) return null;
        try {
            byte[] iv = new byte[GCM_IV_LENGTH];
            new SecureRandom().nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
            byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
            byte[] combined   = new byte[GCM_IV_LENGTH + ciphertext.length];
            System.arraycopy(iv,         0, combined, 0,             GCM_IV_LENGTH);
            System.arraycopy(ciphertext, 0, combined, GCM_IV_LENGTH, ciphertext.length);
            return Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            throw new RuntimeException("PII encryption failed", e);
        }
    }

    public String decrypt(String encoded) {
        if (encoded == null) return null;
        try {
            byte[] combined    = Base64.getDecoder().decode(encoded);
            byte[] iv          = Arrays.copyOfRange(combined, 0,             GCM_IV_LENGTH);
            byte[] ciphertext  = Arrays.copyOfRange(combined, GCM_IV_LENGTH, combined.length);
            Cipher cipher      = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, secretKey, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
            return new String(cipher.doFinal(ciphertext), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("PII decryption failed", e);
        }
    }
}
