package com.jslogicextractor;

import com.jslogicextractor.config.BatchExtractionProperties;
import com.jslogicextractor.config.ChunkingProperties;
import com.jslogicextractor.config.ExtractionProperties;
import com.jslogicextractor.config.OllamaProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties({ExtractionProperties.class, BatchExtractionProperties.class, OllamaProperties.class,
        ChunkingProperties.class})
public class JsLogicExtractorApplication {

    public static void main(String[] args) {
        SpringApplication.run(JsLogicExtractorApplication.class, args);
    }
}
