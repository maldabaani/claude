package com.helpdesk.domain.ticket.service;

/**
 * Abstraction over the LLM backend used for AI triage features, so the
 * provider (Anthropic, Ollama, ...) can be swapped via configuration
 * without touching {@link AiTriageService}.
 */
public interface AiLlmClient {

    /**
     * Sends a single user-turn prompt and returns the raw completion text.
     */
    String complete(String prompt, int maxTokens);
}
