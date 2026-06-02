package com.clinicsaas.services;

import com.clinicsaas.dtos.request.CreateUserRequest;
import com.clinicsaas.dtos.response.UserResponse;
import com.clinicsaas.entities.tenant.User;
import com.clinicsaas.exceptions.BadRequestException;
import com.clinicsaas.exceptions.ResourceNotFoundException;
import com.clinicsaas.repositories.tenant.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserManagementService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(value = "tenantTransactionManager", readOnly = true)
    public List<UserResponse> listAll() {
        return userRepository.findAll().stream()
                .map(UserResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional("tenantTransactionManager")
    public UserResponse createUser(CreateUserRequest req) {
        if (userRepository.findByEmail(req.email()).isPresent()) {
            throw new BadRequestException("Email already in use");
        }
        User user = User.builder()
                .email(req.email())
                .passwordHash(passwordEncoder.encode(req.password()))
                .firstName(req.firstName())
                .lastName(req.lastName())
                .role(req.role())
                .active(true)
                .build();
        UserResponse response = UserResponse.from(userRepository.save(user));
        log.debug("Created user email={} role={}", req.email(), req.role());
        return response;
    }

    @Transactional("tenantTransactionManager")
    public UserResponse toggleStatus(UUID id) {
        User u = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        u.setActive(!u.isActive());
        return UserResponse.from(userRepository.save(u));
    }

    @Transactional("tenantTransactionManager")
    public void changePassword(UUID id, String newPassword) {
        User u = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        u.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(u);
        log.debug("Password changed for user id={}", id);
    }

    @Transactional(value = "tenantTransactionManager", readOnly = true)
    public UserResponse getById(UUID id) {
        return userRepository.findById(id)
                .map(UserResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
    }
}
