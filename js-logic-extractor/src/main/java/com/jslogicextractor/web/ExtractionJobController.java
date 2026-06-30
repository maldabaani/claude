package com.jslogicextractor.web;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jslogicextractor.orchestration.ExtractionJob;
import com.jslogicextractor.orchestration.JobRegistry;
import com.jslogicextractor.orchestration.JobStarter;
import com.jslogicextractor.output.OutputFileSnapshotService;
import com.jslogicextractor.qa.ExtractionQaService;
import com.jslogicextractor.qa.QaAnswer;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/extraction-jobs")
public class ExtractionJobController {

    private static final int OUTPUT_FILES_LIMIT = 50;

    private final JobRegistry jobRegistry;
    private final JobStarter jobStarter;
    private final OutputFileSnapshotService outputFileSnapshotService;
    private final ExtractionQaService qaService;
    private final ObjectMapper objectMapper;

    public ExtractionJobController(JobRegistry jobRegistry,
                                    JobStarter jobStarter,
                                    OutputFileSnapshotService outputFileSnapshotService,
                                    ExtractionQaService qaService,
                                    ObjectMapper objectMapper) {
        this.jobRegistry = jobRegistry;
        this.jobStarter = jobStarter;
        this.outputFileSnapshotService = outputFileSnapshotService;
        this.qaService = qaService;
        this.objectMapper = objectMapper;
    }

    @PostMapping
    public ResponseEntity<JobResponse> startJob(@Valid @RequestBody StartJobRequest request) {
        ExtractionJob job = jobStarter.start(request.repositoryPath(), request.outputDirectory(),
                request.maxConcurrency(), request.executionMode());
        return ResponseEntity.accepted().body(JobResponse.from(job));
    }

    @GetMapping("/{jobId}")
    public ResponseEntity<JobResponse> getJob(@PathVariable UUID jobId) {
        return jobRegistry.find(jobId)
                .map(job -> ResponseEntity.ok(JobResponse.from(job)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping
    public ResponseEntity<List<JobResponse>> listJobs() {
        List<JobResponse> jobs = jobRegistry.findAll().stream()
                .map(JobResponse::from)
                .toList();
        return ResponseEntity.ok(jobs);
    }

    @GetMapping("/{jobId}/output-files")
    public ResponseEntity<List<OutputFileResponse>> listOutputFiles(@PathVariable UUID jobId) {
        ExtractionJob job = requireJob(jobId);
        List<OutputFileResponse> files = outputFileSnapshotService.recentFiles(job, OUTPUT_FILES_LIMIT).stream()
                .map(OutputFileResponse::from)
                .toList();
        return ResponseEntity.ok(files);
    }

    @PostMapping("/{jobId}/qa")
    public ResponseEntity<QaResponse> ask(@PathVariable UUID jobId, @Valid @RequestBody QaRequest request) {
        ExtractionJob job = requireJob(jobId);
        QaAnswer answer = qaService.ask(job, request.question());
        return ResponseEntity.ok(QaResponse.from(answer));
    }

    @PostMapping("/{jobId}/qa/stream")
    public SseEmitter askStream(@PathVariable UUID jobId, @Valid @RequestBody QaRequest request) {
        ExtractionJob job = requireJob(jobId);
        SseEmitter emitter = new SseEmitter(120_000L);
        new Thread(() -> {
            try {
                ExtractionQaService.QaStreamResult stream = qaService.askForStream(job, request.question());
                emitter.send(SseEmitter.event()
                        .name("sources")
                        .data(objectMapper.writeValueAsString(stream.sourceFiles())));
                stream.textFlux()
                        .doOnNext(chunk -> {
                            try {
                                emitter.send(SseEmitter.event().name("chunk").data(objectMapper.writeValueAsString(chunk)));
                            } catch (IOException ex) {
                                throw new RuntimeException(ex);
                            }
                        })
                        .blockLast();
                emitter.complete();
            } catch (Exception e) {
                emitter.completeWithError(e);
            }
        }, "qa-sse-stream").start();
        return emitter;
    }

    private ExtractionJob requireJob(UUID jobId) {
        return jobRegistry.find(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No such job: " + jobId));
    }
}
