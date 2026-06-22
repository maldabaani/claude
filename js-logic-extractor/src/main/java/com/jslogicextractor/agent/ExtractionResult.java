package com.jslogicextractor.agent;

import com.jslogicextractor.scanner.SourceFile;
import org.springframework.ai.chat.metadata.Usage;

public record ExtractionResult(
        String relativePath,
        String agentName,
        boolean success,
        String content,
        String errorMessage,
        long durationMillis,
        Integer promptTokens,
        Integer completionTokens
) {

    public static ExtractionResult success(SourceFile file, String agentName, String content,
                                            long durationMillis, Usage usage) {
        Integer promptTokens = usage != null ? usage.getPromptTokens() : null;
        Integer completionTokens = usage != null ? usage.getCompletionTokens() : null;
        return new ExtractionResult(file.relativePath(), agentName, true, content, null,
                durationMillis, promptTokens, completionTokens);
    }

    public static ExtractionResult failure(SourceFile file, String agentName, String errorMessage,
                                            long durationMillis) {
        return new ExtractionResult(file.relativePath(), agentName, false, null, errorMessage,
                durationMillis, null, null);
    }
}
