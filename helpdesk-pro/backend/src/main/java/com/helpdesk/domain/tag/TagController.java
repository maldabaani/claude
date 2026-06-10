package com.helpdesk.domain.tag;

import com.helpdesk.shared.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tags")
@RequiredArgsConstructor
public class TagController {

    private final TagService tagService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TagResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(tagService.getAllTags()));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<TagResponse>>> search(@RequestParam(defaultValue = "") String q) {
        return ResponseEntity.ok(ApiResponse.ok(tagService.searchTags(q)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TagResponse>> create(@Valid @RequestBody TagRequest request) {
        TagResponse tag = tagService.createTag(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(tag));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TagResponse>> update(@PathVariable UUID id,
                                                            @Valid @RequestBody TagRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(tagService.updateTag(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        tagService.deleteTag(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/merge")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TagResponse>> merge(@PathVariable UUID id,
                                                           @Valid @RequestBody MergeTagRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(tagService.mergeTags(id, request.targetTagId())));
    }
}
