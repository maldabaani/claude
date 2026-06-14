package com.helpdesk.domain.ticket.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.helpdesk.domain.ticket.dto.SentimentResult;
import com.helpdesk.domain.ticket.dto.SmartReply;
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

    public SentimentResult analyzeSentiment(String title, String description, String latestComment) {
        try {
            StringBuilder prompt = new StringBuilder();
            prompt.append("You are a helpdesk sentiment analysis assistant. Analyze the customer tone/emotion from the following support ticket and respond with ONLY valid JSON — no markdown, no explanation, no code fences.\n\n");
            prompt.append("Required JSON format:\n");
            prompt.append("{\"sentiment\":\"<one of: positive, neutral, negative, frustrated, urgent>\",\"score\":<1-10>,\"action\":\"<short recommended action>\"}\n\n");
            prompt.append("Where score 1=very negative, 10=very positive.\n\n");
            prompt.append("Ticket title: ").append(title != null ? title : "(no title)").append("\n");
            prompt.append("Ticket description: ").append(description != null ? description : "(no description)").append("\n");
            if (latestComment != null && !latestComment.isBlank()) {
                prompt.append("Latest customer comment: ").append(latestComment).append("\n");
            }

            Map<String, Object> body = Map.of(
                    "model", "claude-haiku-4-5-20251001",
                    "max_tokens", 256,
                    "messages", List.of(Map.of("role", "user", "content", prompt.toString()))
            );

            JsonNode response = restClient.post()
                    .uri("/v1/messages")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);

            String text = response.at("/content/0/text").asText().strip();
            if (text.startsWith("```")) {
                text = text.replaceFirst("^```[a-zA-Z]*\\n?", "").replaceFirst("```$", "").strip();
            }
            JsonNode s = objectMapper.readTree(text);
            return new SentimentResult(
                    s.path("sentiment").asText("neutral"),
                    s.path("score").asInt(5),
                    s.path("action").asText("Review and respond to the customer.")
            );
        } catch (Exception e) {
            log.warn("AI sentiment analysis failed for ticket '{}': {}", title, e.getMessage());
            return new SentimentResult("neutral", 5, "Review and respond to the customer.");
        }
    }

    public SmartReply generateSmartReply(String title, String description, List<Map<String, String>> conversationHistory) {
        try {
            StringBuilder conv = new StringBuilder();
            if (conversationHistory != null && !conversationHistory.isEmpty()) {
                conv.append("\nConversation history:\n");
                for (Map<String, String> msg : conversationHistory) {
                    conv.append("[").append(msg.getOrDefault("role", "unknown")).append("]: ")
                        .append(msg.getOrDefault("body", "")).append("\n");
                }
            }

            String prompt = """
                    You are an expert helpdesk agent. Based on the following support ticket and conversation history, \
                    write a professional, empathetic, and helpful reply to the customer. \
                    Respond with ONLY valid JSON — no markdown, no explanation, no code fences.

                    Required JSON format:
                    {"reply":"<professional reply text, 2-4 sentences, addressing the customer's issue directly>","tone":"<one of: empathetic, professional, informative, apologetic>"}

                    Ticket title: %s
                    Ticket description: %s%s
                    """.formatted(
                    title != null ? title : "(no title)",
                    description != null ? description : "(no description)",
                    conv
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

            String text = response.at("/content/0/text").asText().strip();
            if (text.startsWith("```")) {
                text = text.replaceFirst("^```[a-zA-Z]*\\n?", "").replaceFirst("```$", "").strip();
            }
            JsonNode s = objectMapper.readTree(text);
            return new SmartReply(
                    s.path("reply").asText("Thank you for reaching out. We will look into this and get back to you shortly."),
                    s.path("tone").asText("professional")
            );
        } catch (Exception e) {
            log.warn("AI smart reply failed for ticket '{}': {}", title, e.getMessage());
            return new SmartReply("Thank you for reaching out. We will look into this and get back to you shortly.", "professional");
        }
    }

}
