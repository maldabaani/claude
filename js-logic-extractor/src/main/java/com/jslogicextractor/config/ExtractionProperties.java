package com.jslogicextractor.config;

import com.jslogicextractor.orchestration.ExecutionMode;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.nio.file.Path;
import java.util.Set;

@ConfigurationProperties(prefix = "jsprocessor")
public record ExtractionProperties(
        Path defaultOutputDirectory,
        Set<String> includedExtensions,
        Set<String> excludedDirectoryNames,
        long maxFileSizeBytes,
        int maxConcurrentRequests,
        boolean skipExistingResults,
        ExecutionMode executionMode
) {

    public ExtractionProperties {
        if (defaultOutputDirectory == null) {
            defaultOutputDirectory = Path.of("./output");
        }
        if (includedExtensions == null || includedExtensions.isEmpty()) {
            includedExtensions = Set.of(".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx");
        }
        if (excludedDirectoryNames == null || excludedDirectoryNames.isEmpty()) {
            excludedDirectoryNames = Set.of("node_modules", ".git", "dist", "build", "coverage");
        }
        if (maxFileSizeBytes <= 0) {
            maxFileSizeBytes = 300_000;
        }
        if (maxConcurrentRequests <= 0) {
            maxConcurrentRequests = 8;
        }
        if (executionMode == null) {
            executionMode = ExecutionMode.SYNC;
        }
    }
}
