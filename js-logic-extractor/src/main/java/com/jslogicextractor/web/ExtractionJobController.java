package com.jslogicextractor.web;

import com.jslogicextractor.orchestration.ExtractionJob;
import com.jslogicextractor.orchestration.JobRegistry;
import com.jslogicextractor.orchestration.JsRepositoryProcessingOrchestrator;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;
import java.util.concurrent.ExecutorService;

@RestController
@RequestMapping("/api/v1/extraction-jobs")
public class ExtractionJobController {

    private final JobRegistry jobRegistry;
    private final JsRepositoryProcessingOrchestrator orchestrator;
    private final ExecutorService extractionExecutor;

    public ExtractionJobController(JobRegistry jobRegistry,
                                    JsRepositoryProcessingOrchestrator orchestrator,
                                    ExecutorService extractionExecutor) {
        this.jobRegistry = jobRegistry;
        this.orchestrator = orchestrator;
        this.extractionExecutor = extractionExecutor;
    }

    @PostMapping
    public ResponseEntity<JobResponse> startJob(@Valid @RequestBody StartJobRequest request) {
        Path repositoryRoot = Path.of(request.repositoryPath()).toAbsolutePath().normalize();
        if (!Files.isDirectory(repositoryRoot)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "repositoryPath is not a directory: " + repositoryRoot);
        }
        Path outputDirectory = request.outputDirectory() != null
                ? Path.of(request.outputDirectory()).toAbsolutePath().normalize()
                : null;

        ExtractionJob job = jobRegistry.register(repositoryRoot, outputDirectory, request.maxConcurrency());
        extractionExecutor.execute(() -> orchestrator.run(job));

        return ResponseEntity.accepted().body(JobResponse.from(job));
    }

    @GetMapping("/{jobId}")
    public ResponseEntity<JobResponse> getJob(@PathVariable UUID jobId) {
        return jobRegistry.find(jobId)
                .map(job -> ResponseEntity.ok(JobResponse.from(job)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
