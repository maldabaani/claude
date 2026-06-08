package com.helpdesk.domain.settings.service;

import com.helpdesk.domain.settings.dto.SettingsRequest;
import com.helpdesk.domain.settings.dto.SettingsResponse;
import com.helpdesk.domain.settings.entity.SystemSetting;
import com.helpdesk.domain.settings.repository.SystemSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SettingsService {

    private final SystemSettingRepository repo;

    public SettingsResponse getAll() {
        Map<String, String> map = repo.findAll().stream()
                .collect(Collectors.toMap(SystemSetting::getKey, s -> s.getValue() != null ? s.getValue() : ""));
        return new SettingsResponse(
                map.getOrDefault("company_name", "HelpDesk Pro"),
                map.getOrDefault("support_email", "support@helpdesk.com"),
                Boolean.parseBoolean(map.getOrDefault("notify_ticket_created", "true")),
                Boolean.parseBoolean(map.getOrDefault("notify_comment_added", "true")),
                Boolean.parseBoolean(map.getOrDefault("notify_status_changed", "true")),
                Boolean.parseBoolean(map.getOrDefault("notify_ticket_assigned", "true")),
                Boolean.parseBoolean(map.getOrDefault("notify_sla_breached", "true")),
                Boolean.parseBoolean(map.getOrDefault("autoAssignTickets", "false"))
        );
    }

    @Transactional
    public SettingsResponse update(SettingsRequest req) {
        if (req.companyName() != null)           set("company_name", req.companyName());
        if (req.supportEmail() != null)          set("support_email", req.supportEmail());
        if (req.notifyTicketCreated() != null)   set("notify_ticket_created", String.valueOf(req.notifyTicketCreated()));
        if (req.notifyCommentAdded() != null)    set("notify_comment_added", String.valueOf(req.notifyCommentAdded()));
        if (req.notifyStatusChanged() != null)   set("notify_status_changed", String.valueOf(req.notifyStatusChanged()));
        if (req.notifyTicketAssigned() != null)  set("notify_ticket_assigned", String.valueOf(req.notifyTicketAssigned()));
        if (req.notifySlaBreached() != null)     set("notify_sla_breached", String.valueOf(req.notifySlaBreached()));
        if (req.autoAssignTickets() != null)     set("autoAssignTickets", String.valueOf(req.autoAssignTickets()));
        return getAll();
    }

    private void set(String key, String value) {
        SystemSetting s = repo.findById(key).orElse(new SystemSetting(key, null, null));
        s.setValue(value);
        s.setUpdatedAt(Instant.now());
        repo.save(s);
    }
}
