package com.clinicsaas.security;

import com.clinicsaas.entities.enums.Permission;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Getter
public class AppUserPrincipal implements UserDetails {

    private final UUID id;
    private final String email;
    private final String role;
    private final String tenantId;
    private final String userType;
    private final Set<Permission> permissions;

    public AppUserPrincipal(UUID id, String email, String role, String tenantId, String userType) {
        this.id = id;
        this.email = email;
        this.role = role;
        this.tenantId = tenantId;
        this.userType = userType;
        this.permissions = isPlatformUser(userType)
                ? EnumSet.allOf(Permission.class)
                : RolePermissions.forRole(role);
    }

    public boolean isPlatformAdmin() {
        return isPlatformUser(userType);
    }

    public boolean hasPermission(Permission permission) {
        return permissions.contains(permission);
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        Stream<SimpleGrantedAuthority> roleAuthority =
                Stream.of(new SimpleGrantedAuthority("ROLE_" + role));
        Stream<SimpleGrantedAuthority> permissionAuthorities =
                permissions.stream().map(p -> new SimpleGrantedAuthority(p.name()));
        return Stream.concat(roleAuthority, permissionAuthorities)
                .collect(Collectors.toList());
    }

    @Override public String getPassword()              { return null; }
    @Override public String getUsername()              { return email; }
    @Override public boolean isAccountNonExpired()     { return true; }
    @Override public boolean isAccountNonLocked()      { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled()               { return true; }

    private static boolean isPlatformUser(String userType) {
        return "PLATFORM".equals(userType);
    }
}
