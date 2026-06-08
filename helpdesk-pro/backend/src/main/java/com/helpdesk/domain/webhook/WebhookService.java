package com.helpdesk.domain.webhook;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebhookService {

    private final WebhookRepository webhookRepository;
    private final ObjectMapper objectMapper;

    @Async
    public void fireEvent(String eventType, Object payload) {
        List<Webhook> hooks = webhookRepository.findByActiveTrue();
        for (Webhook hook : hooks) {
            List<String> events = List.of(hook.getEvents().split(","));
            if (events.stream().anyMatch(e -> e.trim().equals(eventType))) {
                sendWebhook(hook, eventType, payload);
            }
        }
    }

    private void sendWebhook(Webhook hook, String eventType, Object payload) {
        try {
            Map<String, Object> body = Map.of(
                "event", eventType,
                "data", payload,
                "timestamp", Instant.now().toString()
            );
            String json = objectMapper.writeValueAsString(body);

            HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(hook.getUrl()))
                .header("Content-Type", "application/json")
                .header("X-Webhook-Event", eventType)
                .POST(HttpRequest.BodyPublishers.ofString(json));

            if (hook.getSecret() != null && !hook.getSecret().isBlank()) {
                String sig = hmacSha256(hook.getSecret(), json);
                builder.header("X-Webhook-Signature", "sha256=" + sig);
            }

            HttpClient.newHttpClient().send(builder.build(), HttpResponse.BodyHandlers.ofString());
        } catch (Exception e) {
            log.warn("Webhook delivery failed for {} to {}: {}", eventType, hook.getUrl(), e.getMessage());
        }
    }

    private String hmacSha256(String secret, String data) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] raw = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return HexFormat.of().formatHex(raw);
    }

    public List<Webhook> findAll() {
        return webhookRepository.findAll();
    }

    public Webhook create(Webhook webhook) {
        return webhookRepository.save(webhook);
    }

    public Webhook update(UUID id, Webhook update) {
        Webhook existing = webhookRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Webhook not found"));
        existing.setName(update.getName());
        existing.setUrl(update.getUrl());
        existing.setSecret(update.getSecret());
        existing.setEvents(update.getEvents());
        existing.setActive(update.isActive());
        return webhookRepository.save(existing);
    }

    public void delete(UUID id) {
        webhookRepository.deleteById(id);
    }

    public void testWebhook(UUID id) {
        Webhook hook = webhookRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Webhook not found"));
        sendWebhook(hook, "test", Map.of("message", "This is a test event from HelpDesk Pro"));
    }
}
