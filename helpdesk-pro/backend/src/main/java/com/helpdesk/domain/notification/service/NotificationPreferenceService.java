package com.helpdesk.domain.notification.service;

import com.helpdesk.domain.notification.entity.NotificationPreference;
import com.helpdesk.domain.notification.repository.NotificationPreferenceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationPreferenceService {

    private static final List<String> ALL_EVENTS = List.of(
            "TICKET_CREATED", "TICKET_ASSIGNED", "STATUS_CHANGED", "COMMENT_ADDED", "SLA_BREACHED"
    );

    private final NotificationPreferenceRepository repo;

    public List<NotificationPreference> getPreferences(UUID userId) {
        List<NotificationPreference> existing = repo.findByUserId(userId);
        // Fill in defaults for any missing event types
        for (String event : ALL_EVENTS) {
            boolean found = existing.stream().anyMatch(p -> p.getEventType().equals(event));
            if (!found) {
                NotificationPreference pref = NotificationPreference.builder()
                        .userId(userId)
                        .eventType(event)
                        .emailEnabled(true)
                        .inAppEnabled(true)
                        .build();
                existing = new java.util.ArrayList<>(existing);
                ((java.util.ArrayList<NotificationPreference>) existing).add(repo.save(pref));
            }
        }
        return existing;
    }

    @Transactional
    public NotificationPreference upsert(UUID userId, String eventType, boolean emailEnabled, boolean inAppEnabled) {
        NotificationPreference pref = repo.findByUserIdAndEventType(userId, eventType)
                .orElseGet(() -> NotificationPreference.builder().userId(userId).eventType(eventType).build());
        pref.setEmailEnabled(emailEnabled);
        pref.setInAppEnabled(inAppEnabled);
        return repo.save(pref);
    }

    public boolean isEmailEnabled(UUID userId, String eventType) {
        return repo.findByUserIdAndEventType(userId, eventType)
                .map(NotificationPreference::isEmailEnabled)
                .orElse(true);
    }

    public boolean isInAppEnabled(UUID userId, String eventType) {
        return repo.findByUserIdAndEventType(userId, eventType)
                .map(NotificationPreference::isInAppEnabled)
                .orElse(true);
    }
}
