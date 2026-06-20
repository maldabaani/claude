package com.helpdesk.domain.ticket.service;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

/**
 * Talks to a locally running Ollama instance instead of the Anthropic API.
 * Default provider; set {@code ai.provider=anthropic} to use Anthropic instead.
 */
@Service
@ConditionalOnProperty(name = "ai.provider", havingValue = "ollama", matchIfMissing = true)
public class OllamaLlmClient implements AiLlmClient {

    private final RestClient restClient;
    private final String model;

    public OllamaLlmClient(
            @Value("${ollama.base-url:http://localhost:11434}") String baseUrl,
            @Value("${ollama.model:llama3.2}") String model) {
        this.model = model;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5_000);
        factory.setReadTimeout(60_000);
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory)
                .build();
    }

    @Override
    public String complete(String prompt, int maxTokens) {
        Map<String, Object> body = Map.of(
                "model", model,
                "stream", false,
                "messages", List.of(Map.of("role", "user", "content", prompt)),
                "options", Map.of("num_predict", maxTokens)
        );

        JsonNode response = restClient.post()
                .uri("/api/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(JsonNode.class);

        return response.at("/message/content").asText();
    }
}
