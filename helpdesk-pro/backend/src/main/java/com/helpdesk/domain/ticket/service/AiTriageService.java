package com.helpdesk.domain.ticket.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.helpdesk.domain.ticket.dto.TicketSummary;
import com.helpdesk.domain.ticket.dto.TriageSuggestion;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
public class AiTriageService {

    private static final Logger log = LoggerFactory.getLogger(AiTriageService.class);

    private static final TriageSuggestion FALLBACK = new TriageSuggestion(
            "other", "medium", "Unable to generate suggestion automatically.");

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public AiTriageService(
            @Value("${anthropic.api.key:}") String apiKey,
            ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.restClient = RestClient.builder()
                .baseUrl("https://api.anthropic.com")
                .defaultHeader("x-api-key", apiKey)
                .defaultHeader("anthropic-version", "2023-06-01")
                .build();
    }

    public TriageSuggestion suggest(String title, String description) {
        try {
            String prompt = buildPrompt(title, description);

            Map<String, Object> body = Map.of(
                    "model", "claude-haiku-4-5-20251001",
                    "max_tokens", 512,
                    "messages", List.of(Map.of("role", "user", "content", prompt))
            );

            JsonNode response = restClient.post()
                    .uri("/v1/messages")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);

            return parseResponse(response);
        } catch (Exception e) {
            log.warn("AI triage failed for ticket '{}': {}", title, e.getMessage());
            return FALLBACK;
        }
    }

    private String buildPrompt(String title, String description) {
        return """
                You are a helpdesk triage assistant. Analyze the following support ticket and respond \
                with ONLY valid JSON — no markdown, no explanation, no code fences.

                Required JSON format:
                {"category":"<one of: technical, billing, account, feature_request, other>",\
                "priority":"<one of: low, medium, high, urgent>",\
                "suggested_response":"<2-3 sentence professional draft reply to the customer>"}

                Ticket title: %s
                Ticket description: %s
                """.formatted(
                title != null ? title : "(no title)",
                description != null ? description : "(no description)"
        );
    }

    private TriageSuggestion parseResponse(JsonNode response) throws Exception {
        String text = response.at("/content/0/text").asText().strip();
        if (text.startsWith("```")) {
            text = text.replaceFirst("^```[a-zA-Z]*\\n?", "").replaceFirst("```$", "").strip();
        }
        JsonNode s = objectMapper.readTree(text);
        return new TriageSuggestion(
                s.path("category").asText("other"),
                s.path("priority").asText("medium"),
                s.path("suggested_response").asText(FALLBACK.suggestedResponse())
        );
    }

    public TicketSummary summarize(String title, String description, List<String> commentBodies) {
        try {
            StringBuilder commentsSection = new StringBuilder();
            if (commentBodies != null && !commentBodies.isEmpty()) {
                commentsSection.append("\nComments:\n");
                for (int i = 0; i < commentBodies.size(); i++) {
                    commentsSection.append("- ").append(commentBodies.get(i)).append("\n");
                }
            }

            String prompt = """
                    You are a helpdesk assistant. Summarize the following support ticket in 3-4 concise sentences.                     Respond with ONLY valid JSON \u2014 no markdown, no explanation, no code fences.

                    Required JSON format:
                    {"summary":"<3-4 sentence concise summary of the ticket and its current status>"}

                    Ticket title: %s
                    Ticket description: %s%s
                    """.formatted(
                    title != null ? title : "(no title)",
                    description != null ? description : "(no description)",
                    commentsSection
            );

            Map<String, Object> body = Map.of(
                    "model", "claude-haiku-4-5-20251001",
                    "max_tokens", 512,
                    "messages", List.of(Map.of("role", "user", "content", prompt))
            );

            JsonNode response = restClient.post()
                    .uri("/v1/messages")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);

            return parseSummaryResponse(response);
        } catch (Exception e) {
            log.warn("AI summarization failed for ticket \'{}\': {}", title, e.getMessage());
            return new TicketSummary("Unable to generate summary.");
        }
    }

    private TicketSummary parseSummaryResponse(JsonNode response) throws Exception {
        String text = response.at("/content/0/text").asText().strip();
        if (text.startsWith("```")) {
            text = text.replaceFirst("^```[a-zA-Z]*\\n?", "").replaceFirst("```$", "").strip();
        }
        JsonNode s = objectMapper.readTree(text);
        return new TicketSummary(s.path("summary").asText("Unable to generate summary."));
    }

}
