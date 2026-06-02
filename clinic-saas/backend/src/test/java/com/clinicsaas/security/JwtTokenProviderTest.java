package com.clinicsaas.security;

import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtTokenProviderTest {

    private static final String SECRET =
        "Y2xpbmljU2Fhc0p3dFNlY3JldEtleUZvckRldmVsb3BtZW50T25seVVzZQ==";

    private JwtTokenProvider provider;

    @BeforeEach
    void setUp() {
        provider = new JwtTokenProvider();
        ReflectionTestUtils.setField(provider, "secret", SECRET);
        ReflectionTestUtils.setField(provider, "expirationMs", 3_600_000L);
    }

    @Test
    void tenantToken_roundTrip() {
        UUID userId = UUID.randomUUID();
        String token = provider.generateTenantToken(userId, "doc@clinic.test", "DOCTOR", "tenant-1");

        assertThat(provider.isValid(token)).isTrue();
        Claims claims = provider.validateAndExtract(token);
        assertThat(claims.getSubject()).isEqualTo(userId.toString());
        assertThat(claims.get("email", String.class)).isEqualTo("doc@clinic.test");
        assertThat(claims.get("role",  String.class)).isEqualTo("DOCTOR");
        assertThat(claims.get("tenantId", String.class)).isEqualTo("tenant-1");
        assertThat(claims.get("type",  String.class)).isEqualTo("TENANT");
    }

    @Test
    void platformToken_roundTrip() {
        UUID userId = UUID.randomUUID();
        String token = provider.generatePlatformToken(userId, "admin@clinicsaas.dev");

        assertThat(provider.isValid(token)).isTrue();
        Claims claims = provider.validateAndExtract(token);
        assertThat(claims.getSubject()).isEqualTo(userId.toString());
        assertThat(claims.get("email", String.class)).isEqualTo("admin@clinicsaas.dev");
        assertThat(claims.get("role",  String.class)).isEqualTo("PLATFORM_ADMIN");
        assertThat(claims.get("type",  String.class)).isEqualTo("PLATFORM");
    }

    @Test
    void isValid_returnsFalse_forTamperedToken() {
        String token = provider.generateTenantToken(UUID.randomUUID(), "x@x.test", "NURSE", "t1");
        String tampered = token.substring(0, token.length() - 4) + "XXXX";
        assertThat(provider.isValid(tampered)).isFalse();
    }

    @Test
    void isValid_returnsFalse_forGarbage() {
        assertThat(provider.isValid("not.a.jwt")).isFalse();
    }

    @Test
    void validateAndExtract_throws_forExpiredToken() {
        ReflectionTestUtils.setField(provider, "expirationMs", -1L);
        String token = provider.generateTenantToken(UUID.randomUUID(), "x@x.test", "NURSE", "t1");
        assertThatThrownBy(() -> provider.validateAndExtract(token))
            .isInstanceOf(io.jsonwebtoken.JwtException.class);
    }
}
