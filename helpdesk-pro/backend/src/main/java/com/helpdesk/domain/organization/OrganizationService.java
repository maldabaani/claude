package com.helpdesk.domain.organization;

import com.helpdesk.domain.user.dto.UserResponse;
import com.helpdesk.domain.user.repository.UserRepository;
import com.helpdesk.domain.user.service.UserService;
import com.helpdesk.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final UserService userService;

    public List<OrganizationDto> findAll(String search) {
        List<Organization> orgs = (search != null && !search.isBlank())
                ? organizationRepository.findByNameContainingIgnoreCase(search)
                : organizationRepository.findAll();
        return orgs.stream().map(this::toDto).toList();
    }

    public OrganizationDto findById(UUID id) {
        return toDto(getOrg(id));
    }

    @Transactional
    public OrganizationDto create(OrganizationRequest request) {
        Organization org = Organization.builder()
                .name(request.name())
                .domain(request.domain())
                .phone(request.phone())
                .address(request.address())
                .notes(request.notes())
                .build();
        return toDto(organizationRepository.save(org));
    }

    @Transactional
    public OrganizationDto update(UUID id, OrganizationRequest request) {
        Organization org = getOrg(id);
        if (request.name() != null) org.setName(request.name());
        if (request.domain() != null) org.setDomain(request.domain());
        if (request.phone() != null) org.setPhone(request.phone());
        if (request.address() != null) org.setAddress(request.address());
        if (request.notes() != null) org.setNotes(request.notes());
        return toDto(organizationRepository.save(org));
    }

    @Transactional
    public void delete(UUID id) {
        organizationRepository.deleteById(id);
    }

    public List<UserResponse> getMembers(UUID orgId) {
        getOrg(orgId); // ensure exists
        return userRepository.findByOrganizationId(orgId).stream()
                .map(userService::toResponse)
                .toList();
    }

    @Transactional
    public void addMember(UUID orgId, UUID userId) {
        getOrg(orgId);
        userRepository.findById(userId).ifPresent(user -> {
            user.setOrganizationId(orgId);
            userRepository.save(user);
        });
    }

    @Transactional
    public void removeMember(UUID orgId, UUID userId) {
        userRepository.findById(userId).ifPresent(user -> {
            if (orgId.equals(user.getOrganizationId())) {
                user.setOrganizationId(null);
                userRepository.save(user);
            }
        });
    }

    private Organization getOrg(UUID id) {
        return organizationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Organization", id));
    }

    private OrganizationDto toDto(Organization org) {
        long memberCount = userRepository.countByOrganizationId(org.getId());
        return new OrganizationDto(org.getId(), org.getName(), org.getDomain(),
                org.getPhone(), org.getAddress(), org.getNotes(), memberCount);
    }
}
