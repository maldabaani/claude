package com.jslogicextractor.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "jsprocessor.ollama")
public record OllamaProperties(
        boolean enabled,
        String baseUrl,
        String model,
        int maxTokens,
        double temperature
) {

    public OllamaProperties {
        if (baseUrl == null || baseUrl.isBlank()) {
            baseUrl = "http://localhost:11434";
        }
        if (model == null || model.isBlank()) {
            model = "qwen2.5-coder";
        }
        if (maxTokens <= 0) {
            maxTokens = 4096;
        }
    }
}
