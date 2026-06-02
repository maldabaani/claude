package com.clinicsaas.repositories.platform;

import com.clinicsaas.entities.platform.PlatformUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PlatformUserRepository extends JpaRepository<PlatformUser, UUID> {
    Optional<PlatformUser> findByEmail(String email);
}
