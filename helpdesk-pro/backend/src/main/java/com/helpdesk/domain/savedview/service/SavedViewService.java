package com.helpdesk.domain.savedview.service;

import com.helpdesk.domain.savedview.dto.SavedViewRequest;
import com.helpdesk.domain.savedview.dto.SavedViewResponse;
import com.helpdesk.domain.savedview.entity.SavedView;
import com.helpdesk.domain.savedview.repository.SavedViewRepository;
import com.helpdesk.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SavedViewService {

    private final SavedViewRepository savedViewRepository;

    public List<SavedViewResponse> findAll(UUID userId) {
        return savedViewRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::toResponse).toList();
    }

    public SavedViewResponse create(SavedViewRequest request, UUID userId) {
        SavedView view = SavedView.builder()
                .userId(userId)
                .name(request.name())
                .filterJson(request.filterJson())
                .build();
        return toResponse(savedViewRepository.save(view));
    }

    public void delete(UUID id, UUID userId) {
        SavedView view = savedViewRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("SavedView", id));
        savedViewRepository.delete(view);
    }

    private SavedViewResponse toResponse(SavedView view) {
        return new SavedViewResponse(view.getId(), view.getName(), view.getFilterJson(), view.getCreatedAt());
    }
}
