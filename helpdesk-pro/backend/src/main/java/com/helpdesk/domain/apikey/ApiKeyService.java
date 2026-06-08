package com.helpdesk.domain.apikey;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ApiKeyService {

    private final ApiKeyRepository apiKeyRepository;
    private final PasswordEncoder passwordEncoder;

    public record GeneratedKey(ApiKey apiKey, String plainKey) {}

    @Transactional
    public GeneratedKey generate(String name, UUID createdBy, Instant expiresAt) {
        // Generate random key: hd_ + 24 random chars
        byte[] random = new byte[18];
        new SecureRandom().nextBytes(random);
        String suffix = Base64.getUrlEncoder().withoutPadding().encodeToString(random);
        String plainKey = "hd_" + suffix;
        String prefix = plainKey.substring(0, Math.min(10, plainKey.length()));
        String hash = passwordEncoder.encode(plainKey);

        ApiKey key = ApiKey.builder()
            .name(name)
            .keyHash(hash)
            .keyPrefix(prefix)
            .createdBy(createdBy)
            .expiresAt(expiresAt)
            .active(true)
            .build();

        return new GeneratedKey(apiKeyRepository.save(key), plainKey);
    }

    @Transactional
    public void revoke(UUID id) {
        apiKeyRepository.findById(id).ifPresent(k -> {
            k.setActive(false);
            apiKeyRepository.save(k);
        });
    }

    public List<ApiKey> findByUser(UUID userId) {
        return apiKeyRepository.findByCreatedBy(userId);
    }

    @Transactional
    public boolean validate(String rawKey) {
        List<ApiKey> active = apiKeyRepository.findAll().stream()
            .filter(k -> k.isActive() && rawKey.startsWith(k.getKeyPrefix()))
            .toList();
        for (ApiKey k : active) {
            if (passwordEncoder.matches(rawKey, k.getKeyHash())) {
                k.setLastUsedAt(Instant.now());
                apiKeyRepository.save(k);
                return true;
            }
        }
        return false;
    }
}
