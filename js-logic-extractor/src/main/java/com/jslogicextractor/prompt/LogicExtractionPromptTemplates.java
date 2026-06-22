package com.jslogicextractor.prompt;

import com.jslogicextractor.scanner.SourceFile;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.chat.prompt.PromptTemplate;
import org.springframework.ai.template.st.StTemplateRenderer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class LogicExtractionPromptTemplates {

    private final PromptTemplate extractionTemplate;

    public LogicExtractionPromptTemplates(
            @Value("classpath:prompts/logic-extraction-prompt.st") Resource extractionPromptResource) {
        // '<' / '>' delimiters instead of the default '{' '}' so the prompt resource can contain
        // a literal JSON response schema without escaping every brace.
        this.extractionTemplate = PromptTemplate.builder()
                .resource(extractionPromptResource)
                .renderer(StTemplateRenderer.builder()
                        .startDelimiterToken('<')
                        .endDelimiterToken('>')
                        .build())
                .build();
    }

    public Prompt buildExtractionPrompt(SourceFile file) {
        return extractionTemplate.create(Map.of(
                "fileName", fileName(file),
                "filePath", file.relativePath(),
                "fileContent", file.content()
        ));
    }

    /**
     * Renders the template with blank per-file fields. Identical, byte-for-byte, on every call for
     * the lifetime of the resource — required so it can serve as a cache_control breakpoint shared
     * across every request in a batch. The real per-file values are supplied via
     * {@link #renderUserContent(SourceFile)} instead.
     */
    public String renderStaticSystemSkeleton() {
        return extractionTemplate.render(Map.of(
                "fileName", "",
                "filePath", "",
                "fileContent", ""
        ));
    }

    public String renderUserContent(SourceFile file) {
        return "File name: " + fileName(file) + "\n"
                + "File path: " + file.relativePath() + "\n\n"
                + "Source:\n```javascript\n" + file.content() + "\n```";
    }

    private String fileName(SourceFile file) {
        int idx = file.relativePath().lastIndexOf('/');
        return idx >= 0 ? file.relativePath().substring(idx + 1) : file.relativePath();
    }
}
