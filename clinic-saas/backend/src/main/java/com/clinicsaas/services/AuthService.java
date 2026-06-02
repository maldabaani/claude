package com.clinicsaas.services;

import com.clinicsaas.dtos.request.LoginRequest;
import com.clinicsaas.dtos.response.AuthResponse;
import com.clinicsaas.entities.platform.PlatformUser;
import com.clinicsaas.entities.tenant.User;
import com.clinicsaas.exceptions.BadRequestException;
import com.clinicsaas.multitenancy.TenantContext;
import com.clinicsaas.repositories.platform.PlatformUserRepository;
import com.clinicsaas.repositories.tenant.UserRepository;
import com.clinicsaas.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final PlatformUserRepository platformUserRepository;
    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.jwt.expiration-ms}")
    private long expirationMs;

    public AuthResponse loginPlatform(LoginRequest req) {
        PlatformUser user = platformUserRepository.findByEmail(req.email())
                .orElseThrow(() -> new BadRequestException("Invalid credentials"));
        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new BadRequestException("Invalid credentials");
        }
        String token = jwtTokenProvider.generatePlatformToken(user.getId(), user.getEmail());
        return AuthResponse.of(token, expirationMs, user.getRole().name(), null);
    }

    public AuthResponse loginTenant(LoginRequest req) {
        if (req.tenantId() == null || req.tenantId().isBlank()) {
            throw new BadRequestException("tenantId is required for clinic login");
        }
        TenantContext.setCurrentTenant(req.tenantId());
        try {
            User user = userRepository.findByEmail(req.email())
                    .orElseThrow(() -> new BadRequestException("Invalid credentials"));
            if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
                throw new BadRequestException("Invalid credentials");
            }
            if (!user.isActive()) {
                throw new BadRequestException("Account is disabled");
            }
            String token = jwtTokenProvider.generateTenantToken(
                    user.getId(), user.getEmail(), user.getRole().name(), req.tenantId());
            return AuthResponse.of(token, expirationMs, user.getRole().name(), req.tenantId());
        } finally {
            TenantContext.clear();
        }
    }
}
