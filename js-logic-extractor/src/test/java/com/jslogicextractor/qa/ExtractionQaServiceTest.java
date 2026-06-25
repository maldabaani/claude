package com.jslogicextractor.qa;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jslogicextractor.agent.ExtractionResult;
import com.jslogicextractor.orchestration.ExtractionJob;
import com.jslogicextractor.scanner.SourceFile;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.ArgumentMatchers;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.document.Document;
import org.springframework.ai.embedding.EmbeddingModel;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ExtractionQaServiceTest {

    @TempDir
    Path outputDirectory;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void answersUsingTopScoringFilesAsContextViaKeywordFallback() throws IOException {
        writeResult("auth.js.json", "auth.js", "Checks password and creates session for login users.");
        writeResult("payments.js.json", "payments.js", "Charges a credit card via the Stripe API.");
        writeResult("_summary.json", null, null);

        ChatClient.Builder builder = chatClientBuilderReturning("It checks the password and creates a session.");

        ExtractionQaService service = new ExtractionQaService(objectMapper, builder, Optional.empty());
        ExtractionJob job = new ExtractionJob(UUID.randomUUID(), outputDirectory, outputDirectory, 4);

        QaAnswer answer = service.ask(job, "how does login check the password and session work?");

        assertThat(answer.answer()).isEqualTo("It checks the password and creates a session.");
        assertThat(answer.sourceFiles()).containsExactly("auth.js");
    }

    @Test
    void answersUsingVectorSearchWhenEmbeddingModelIsPresent() throws IOException {
        writeResult("auth.js.json", "auth.js", "Checks password and creates session for login users.");
        writeResult("payments.js.json", "payments.js", "Charges a credit card via the Stripe API.");

        ChatClient.Builder builder = chatClientBuilderReturning("Vector-grounded answer.");
        EmbeddingModel embeddingModel = mock(EmbeddingModel.class);
        when(embeddingModel.embed(ArgumentMatchers.<Document>argThat(
                doc -> doc != null && "auth.js".equals(doc.getMetadata().get("relativePath")))))
                .thenReturn(new float[]{1f, 0f});
        when(embeddingModel.embed(ArgumentMatchers.<Document>argThat(
                doc -> doc != null && "payments.js".equals(doc.getMetadata().get("relativePath")))))
                .thenReturn(new float[]{0f, 1f});
        when(embeddingModel.embed(any(String.class))).thenReturn(new float[]{1f, 0f});

        ExtractionQaService service = new ExtractionQaService(objectMapper, builder, Optional.of(embeddingModel));
        ExtractionJob job = new ExtractionJob(UUID.randomUUID(), outputDirectory, outputDirectory, 4);

        QaAnswer answer = service.ask(job, "how does login work?");

        assertThat(answer.answer()).isEqualTo("Vector-grounded answer.");
        assertThat(answer.sourceFiles()).startsWith("auth.js");
        verify(embeddingModel, atLeastOnce()).embed(any(Document.class));
        verify(embeddingModel).embed(any(String.class));
    }

    @Test
    void fallsBackToKeywordSearchWhenEmbeddingCallFails() throws IOException {
        writeResult("auth.js.json", "auth.js", "Checks password and creates session for login users.");
        writeResult("payments.js.json", "payments.js", "Charges a credit card via the Stripe API.");

        ChatClient.Builder builder = chatClientBuilderReturning("It checks the password and creates a session.");
        EmbeddingModel embeddingModel = mock(EmbeddingModel.class);
        when(embeddingModel.embed(any(Document.class))).thenThrow(new RuntimeException("ollama unreachable"));

        ExtractionQaService service = new ExtractionQaService(objectMapper, builder, Optional.of(embeddingModel));
        ExtractionJob job = new ExtractionJob(UUID.randomUUID(), outputDirectory, outputDirectory, 4);

        QaAnswer answer = service.ask(job, "how does login check the password and session work?");

        assertThat(answer.answer()).isEqualTo("It checks the password and creates a session.");
        assertThat(answer.sourceFiles()).containsExactly("auth.js");
    }

    @Test
    void returnsPlaceholderWhenNoResultsExistYet() {
        ChatClient.Builder builder = mock(ChatClient.Builder.class);
        when(builder.build()).thenReturn(mock(ChatClient.class));

        ExtractionQaService service = new ExtractionQaService(objectMapper, builder, Optional.empty());
        ExtractionJob job = new ExtractionJob(UUID.randomUUID(), outputDirectory, outputDirectory.resolve("missing"), 4);

        QaAnswer answer = service.ask(job, "anything?");

        assertThat(answer.sourceFiles()).isEmpty();
        assertThat(answer.answer()).contains("No extraction results");
    }

    @Test
    void returnsPlaceholderWhenNothingMatchesTheQuestion() throws IOException {
        writeResult("payments.js.json", "payments.js", "Charges a credit card via the Stripe API.");

        ChatClient.Builder builder = mock(ChatClient.Builder.class);
        when(builder.build()).thenReturn(mock(ChatClient.class));

        ExtractionQaService service = new ExtractionQaService(objectMapper, builder, Optional.empty());
        ExtractionJob job = new ExtractionJob(UUID.randomUUID(), outputDirectory, outputDirectory, 4);

        QaAnswer answer = service.ask(job, "xyzxyz nonsense qqq");

        assertThat(answer.sourceFiles()).isEmpty();
        assertThat(answer.answer()).contains("None of the");
    }

    private ChatClient.Builder chatClientBuilderReturning(String content) {
        ChatClient.Builder builder = mock(ChatClient.Builder.class);
        ChatClient chatClient = mock(ChatClient.class);
        ChatClient.ChatClientRequestSpec requestSpec = mock(ChatClient.ChatClientRequestSpec.class);
        ChatClient.CallResponseSpec callResponseSpec = mock(ChatClient.CallResponseSpec.class);
        when(builder.build()).thenReturn(chatClient);
        when(chatClient.prompt()).thenReturn(requestSpec);
        when(requestSpec.system(any(String.class))).thenReturn(requestSpec);
        when(requestSpec.user(any(String.class))).thenReturn(requestSpec);
        when(requestSpec.call()).thenReturn(callResponseSpec);
        when(callResponseSpec.content()).thenReturn(content);
        return builder;
    }

    private void writeResult(String fileName, String relativePath, String content) throws IOException {
        Object payload = relativePath == null
                ? new java.util.LinkedHashMap<String, Object>()
                : ExtractionResult.success(sourceFile(relativePath), "test-agent", content, 1, null, null);
        Files.writeString(outputDirectory.resolve(fileName), objectMapper.writeValueAsString(payload),
                StandardCharsets.UTF_8);
    }

    private SourceFile sourceFile(String relativePath) {
        return new SourceFile(outputDirectory.resolve(relativePath), relativePath, "", 0);
    }
}
