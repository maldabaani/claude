package com.jslogicextractor.orchestration;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.concurrent.ExecutorService;

/**
 * Validates a start-job request, registers it, and dispatches it off-thread. Shared by the REST
 * API and the Thymeleaf job-creation form so both go through identical validation/dispatch.
 */
@Service
public class JobStarter {

    private final JobRegistry jobRegistry;
    private final JsRepositoryProcessingOrchestrator orchestrator;
    private final ExecutorService extractionExecutor;

    public JobStarter(JobRegistry jobRegistry, JsRepositoryProcessingOrchestrator orchestrator,
                       ExecutorService extractionExecutor) {
        this.jobRegistry = jobRegistry;
        this.orchestrator = orchestrator;
        this.extractionExecutor = extractionExecutor;
    }

    public ExtractionJob start(String repositoryPath, String outputDirectory, Integer maxConcurrency,
                                String executionModeRaw) {
        Path repositoryRoot = Path.of(repositoryPath).toAbsolutePath().normalize();
        if (!Files.isDirectory(repositoryRoot)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "repositoryPath is not a directory: " + repositoryRoot);
        }
        Path resolvedOutputDirectory = outputDirectory != null && !outputDirectory.isBlank()
                ? Path.of(outputDirectory).toAbsolutePath().normalize()
                : null;
        ExecutionMode executionMode = parseExecutionMode(executionModeRaw);

        ExtractionJob job = jobRegistry.register(repositoryRoot, resolvedOutputDirectory, maxConcurrency,
                executionMode);
        extractionExecutor.execute(() -> orchestrator.run(job));
        return job;
    }

    private ExecutionMode parseExecutionMode(String rawValue) {
        if (rawValue == null || rawValue.isBlank()) {
            return null;
        }
        try {
            return ExecutionMode.valueOf(rawValue.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "executionMode must be one of " + Arrays.toString(ExecutionMode.values()));
        }
    }
}
