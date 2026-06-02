package com.clinicsaas.security;

import com.clinicsaas.multitenancy.TenantContext;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.MDC;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        try {
            String token = extractBearerToken(request);
            if (token != null && jwtTokenProvider.isValid(token)) {
                authenticateFromToken(token, request);
            }
            chain.doFilter(request, response);
        } finally {
            TenantContext.clear();
            MDC.clear();
        }
    }

    private void authenticateFromToken(String token, HttpServletRequest request) {
        Claims claims = jwtTokenProvider.validateAndExtract(token);
        String type     = claims.get("type", String.class);
        String tenantId = claims.get("tenantId", String.class);
        String role     = claims.get("role", String.class);
        String email    = claims.get("email", String.class);
        UUID   userId   = UUID.fromString(claims.getSubject());

        if ("TENANT".equals(type) && tenantId != null) {
            TenantContext.setCurrentTenant(tenantId);
            MDC.put("tenantId", tenantId);
        }
        MDC.put("userId", userId.toString());

        AppUserPrincipal principal = new AppUserPrincipal(userId, email, role, tenantId, type);
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    private String extractBearerToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (StringUtils.hasText(header) && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }
}
