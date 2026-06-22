package com.jslogicextractor.prompt;

import com.jslogicextractor.scanner.SourceFile;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.core.io.ClassPathResource;

import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

class LogicExtractionPromptTemplatesTest {

    private LogicExtractionPromptTemplates templates;

    @BeforeEach
    void setUp() {
        templates = new LogicExtractionPromptTemplates(new ClassPathResource("prompts/logic-extraction-prompt.st"));
    }

    @Test
    void substitutesFileMetadataAndContent() {
        SourceFile file = new SourceFile(Path.of("/repo/src/index.js"), "src/index.js",
                "function add(a, b) { return a + b; }", 42);

        Prompt prompt = templates.buildExtractionPrompt(file);
        String rendered = prompt.getContents();

        assertThat(rendered).contains("src/index.js");
        assertThat(rendered).contains("function add(a, b) { return a + b; }");
    }

    @Test
    void survivesJsContentContainingAngleBracketsAndBraces() {
        SourceFile file = new SourceFile(Path.of("/repo/a.tsx"), "a.tsx",
                "const ok = (x: Array<string>) => x.length > 0 && <div>{x}</div>;", 10);

        Prompt prompt = templates.buildExtractionPrompt(file);

        assertThat(prompt.getContents()).contains("Array<string>").contains("<div>{x}</div>");
    }
}
