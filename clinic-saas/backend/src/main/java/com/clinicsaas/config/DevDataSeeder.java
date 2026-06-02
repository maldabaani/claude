package com.clinicsaas.config;

import com.clinicsaas.entities.enums.PlatformRole;
import com.clinicsaas.entities.platform.PlatformUser;
import com.clinicsaas.repositories.platform.PlatformUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Profile("dev")
@RequiredArgsConstructor
public class DevDataSeeder implements ApplicationRunner {

    private final PlatformUserRepository platformUserRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        seedPlatformAdmin();
    }

    private void seedPlatformAdmin() {
        String email = "admin@clinicsaas.dev";
        if (platformUserRepository.findByEmail(email).isPresent()) {
            log.info("Dev seed: platform admin already exists — skipping");
            return;
        }
        PlatformUser admin = new PlatformUser();
        admin.setEmail(email);
        admin.setPasswordHash(passwordEncoder.encode("Admin@123"));
        admin.setRole(PlatformRole.PLATFORM_ADMIN);
        platformUserRepository.save(admin);
        log.info("Dev seed: created platform admin  email={}", email);
    }
}
