package com.helpdesk.domain.user.service;

import com.helpdesk.domain.user.dto.UpdateUserRequest;
import com.helpdesk.domain.user.dto.UserResponse;
import com.helpdesk.domain.user.entity.Role;
import com.helpdesk.domain.user.entity.User;
import com.helpdesk.domain.user.repository.UserRepository;
import com.helpdesk.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public Page<UserResponse> findAll(Role role, Pageable pageable) {
        return userRepository.findAllActive(role, pageable).map(this::toResponse);
    }

    public UserResponse findById(UUID id) {
        return toResponse(getUser(id));
    }

    @Transactional
    public UserResponse update(UUID id, UpdateUserRequest request) {
        User user = getUser(id);
        user.setFullName(request.fullName());
        if (request.departmentId() != null) user.setDepartmentId(request.departmentId());
        if (request.avatarUrl() != null) user.setAvatarUrl(request.avatarUrl());
        if (request.active() != null) user.setActive(request.active());
        if (request.role() != null) user.setRole(request.role());
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public void delete(UUID id) {
        User user = getUser(id);
        user.softDelete();
        userRepository.save(user);
    }

    private User getUser(UUID id) {
        return userRepository.findById(id)
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
    }

    public UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(), user.getFullName(), user.getEmail(),
                user.getRole(), user.getDepartmentId(), user.getAvatarUrl(),
                user.isActive(), user.getCreatedAt()
        );
    }
}
