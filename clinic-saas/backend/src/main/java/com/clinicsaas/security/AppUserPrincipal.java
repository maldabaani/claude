package com.clinicsaas.security;

import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Getter
public class AppUserPrincipal implements UserDetails {

    private final UUID id;
    private final String email;
    private final String role;
    private final String tenantId;   // null for PLATFORM_ADMIN
    private final String userType;   // "TENANT" or "PLATFORM"

    public AppUserPrincipal(UUID id, String email, String role, String tenantId, String userType) {
        this.id = id;
        this.email = email;
        this.role = role;
        this.tenantId = tenantId;
        this.userType = userType;
    }

    public boolean isPlatformAdmin() {
        return "PLATFORM".equals(userType);
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role));
    }

    @Override public String getPassword()              { return null; }
    @Override public String getUsername()              { return email; }
    @Override public boolean isAccountNonExpired()     { return true; }
    @Override public boolean isAccountNonLocked()      { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled()               { return true; }
}
