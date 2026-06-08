package com.helpdesk.domain.user.service;

import com.helpdesk.domain.user.dto.AuthResponse;
import com.helpdesk.domain.user.dto.LoginRequest;
import com.helpdesk.domain.user.dto.RegisterRequest;
import com.helpdesk.domain.user.dto.TwoFactorLoginResponse;
import com.helpdesk.domain.user.entity.Role;
import com.helpdesk.domain.user.entity.User;
import com.helpdesk.domain.user.repository.UserRepository;
import com.helpdesk.domain.twofa.TwoFactorService;
import com.helpdesk.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final TwoFactorService twoFactorService;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email already registered");
        }
        User user = User.builder()
                .fullName(request.fullName())
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .role(Role.CUSTOMER)
                .build();
        userRepository.save(user);
        return buildAuthResponse(user);
    }

    public Object login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password()));
        User user = userRepository.findByEmailAndDeletedAtIsNull(request.email())
                .orElseThrow();
        if (user.isTotpEnabled()) {
            String tempToken = jwtTokenProvider.generateTempToken(user);
            return new TwoFactorLoginResponse(true, tempToken);
        }
        return buildAuthResponse(user);
    }

    public AuthResponse verify2fa(String tempToken, String code) {
        if (!jwtTokenProvider.isTempToken(tempToken)) {
            throw new IllegalArgumentException("Invalid temp token");
        }
        String email = jwtTokenProvider.extractUsername(tempToken);
        User user = userRepository.findByEmailAndDeletedAtIsNull(email).orElseThrow();
        if (!twoFactorService.verifyCode(user.getTotpSecret(), code)) {
            throw new IllegalArgumentException("Invalid 2FA code");
        }
        return buildAuthResponse(user);
    }

    public AuthResponse refresh(String refreshToken) {
        if (!jwtTokenProvider.isRefreshToken(refreshToken)) {
            throw new IllegalArgumentException("Invalid refresh token");
        }
        String email = jwtTokenProvider.extractUsername(refreshToken);
        User user = userRepository.findByEmailAndDeletedAtIsNull(email).orElseThrow();
        return buildAuthResponse(user);
    }

    private AuthResponse buildAuthResponse(User user) {
        return new AuthResponse(
                jwtTokenProvider.generateAccessToken(user),
                jwtTokenProvider.generateRefreshToken(user),
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole()
        );
    }
}
