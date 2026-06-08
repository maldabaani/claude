package com.helpdesk.domain.twofa;

import com.helpdesk.domain.user.dto.AuthResponse;
import com.helpdesk.domain.user.entity.User;
import com.helpdesk.domain.user.service.AuthService;
import com.helpdesk.shared.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth/2fa")
@RequiredArgsConstructor
public class TwoFactorController {

    private final TwoFactorService twoFactorService;
    private final AuthService authService;

    @PostMapping("/setup")
    public ResponseEntity<ApiResponse<Map<String, String>>> setup(
            @AuthenticationPrincipal User currentUser) {
        String secret = twoFactorService.setupSecret(currentUser.getId());
        String qrUrl = twoFactorService.getQrCodeUrl(secret, currentUser.getEmail());
        return ResponseEntity.ok(ApiResponse.ok(Map.of("secret", secret, "qrUrl", qrUrl)));
    }

    @PostMapping("/enable")
    public ResponseEntity<ApiResponse<Void>> enable(
            @AuthenticationPrincipal User currentUser,
            @RequestBody Map<String, String> body) {
        twoFactorService.enable(currentUser.getId(), body.get("code"));
        return ResponseEntity.ok(ApiResponse.ok("2FA enabled", null));
    }

    @PostMapping("/disable")
    public ResponseEntity<ApiResponse<Void>> disable(
            @AuthenticationPrincipal User currentUser,
            @RequestBody Map<String, String> body) {
        twoFactorService.disable(currentUser.getId(), body.get("code"));
        return ResponseEntity.ok(ApiResponse.ok("2FA disabled", null));
    }

    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<AuthResponse>> verify(
            @RequestBody Map<String, String> body,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String tempToken = body.get("tempToken");
        String code = body.get("code");
        if (tempToken == null && authHeader != null && authHeader.startsWith("Bearer ")) {
            tempToken = authHeader.substring(7);
        }
        AuthResponse response = authService.verify2fa(tempToken, code);
        return ResponseEntity.ok(ApiResponse.ok("2FA verified", response));
    }
}
