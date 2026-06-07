package com.helpdesk.domain.cannedresponse.service;

import com.helpdesk.domain.cannedresponse.dto.CannedResponseRequest;
import com.helpdesk.domain.cannedresponse.dto.CannedResponseResponse;
import com.helpdesk.domain.cannedresponse.entity.CannedResponse;
import com.helpdesk.domain.cannedresponse.repository.CannedResponseRepository;
import com.helpdesk.domain.user.entity.User;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CannedResponseService {

    private final CannedResponseRepository repository;

    public List<CannedResponseResponse> findAll() {
        return repository.findByDeletedAtIsNullOrderByTitleAsc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<CannedResponseResponse> findByCategory(String category) {
        return repository.findByCategoryAndDeletedAtIsNullOrderByTitleAsc(category)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public CannedResponseResponse create(CannedResponseRequest request, User currentUser) {
        CannedResponse entity = CannedResponse.builder()
                .title(request.title())
                .body(request.body())
                .category(request.category())
                .createdById(currentUser.getId())
                .build();
        return toResponse(repository.save(entity));
    }

    @Transactional
    public CannedResponseResponse update(UUID id, CannedResponseRequest request) {
        CannedResponse entity = repository.findById(id)
                .filter(r -> r.getDeletedAt() == null)
                .orElseThrow(() -> new EntityNotFoundException("Canned response not found: " + id));
        entity.setTitle(request.title());
        entity.setBody(request.body());
        entity.setCategory(request.category());
        return toResponse(repository.save(entity));
    }

    @Transactional
    public void delete(UUID id) {
        CannedResponse entity = repository.findById(id)
                .filter(r -> r.getDeletedAt() == null)
                .orElseThrow(() -> new EntityNotFoundException("Canned response not found: " + id));
        entity.softDelete();
        repository.save(entity);
    }

    private CannedResponseResponse toResponse(CannedResponse entity) {
        return new CannedResponseResponse(
                entity.getId(),
                entity.getTitle(),
                entity.getBody(),
                entity.getCategory(),
                entity.getCreatedAt()
        );
    }
}
