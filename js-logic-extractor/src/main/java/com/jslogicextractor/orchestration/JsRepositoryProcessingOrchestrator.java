package com.jslogicextractor.orchestration;

import com.jslogicextractor.agent.AgentSelector;
import com.jslogicextractor.agent.ExtractionResult;
import com.jslogicextractor.agent.LogicExtractionAgent;
import com.jslogicextractor.batch.BatchExtractionService;
import com.jslogicextractor.config.ExtractionProperties;
import com.jslogicextractor.filter.NonSubstantiveFileFilter;
import com.jslogicextractor.output.ExtractionResultWriter;
import com.jslogicextractor.scanner.RepositoryScannerService;
import com.jslogicextractor.scanner.SourceFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
public class JsRepositoryProcessingOrchestrator {

    private static final Logger log = LoggerFactory.getLogger(JsRepositoryProcessingOrchestrator.class);
    private static final String PREFILTER_AGENT_NAME = "non-substantive-pre-filter";

    private final RepositoryScannerService scanner;
    private final AgentSelector agentSelector;
    private final ExtractionResultWriter resultWriter;
    private final NonSubstantiveFileFilter nonSubstantiveFileFilter;
    private final BatchExtractionService batchExtractionService;
    private final boolean skipExistingResults;

    public JsRepositoryProcessingOrchestrator(RepositoryScannerService scanner,
                                               AgentSelector agentSelector,
                                               ExtractionResultWriter resultWriter,
                                               NonSubstantiveFileFilter nonSubstantiveFileFilter,
                                               BatchExtractionService batchExtractionService,
                                               ExtractionProperties properties) {
        this.scanner = scanner;
        this.agentSelector = agentSelector;
        this.resultWriter = resultWriter;
        this.nonSubstantiveFileFilter = nonSubstantiveFileFilter;
        this.batchExtractionService = batchExtractionService;
        this.skipExistingResults = properties.skipExistingResults();
    }

    public void run(ExtractionJob job) {
        job.markScanning();
        List<SourceFile> files;
        try {
            files = Files.isRegularFile(job.repositoryRoot())
                    ? scanner.scanFile(job.repositoryRoot())
                    : scanner.scan(job.repositoryRoot());
        } catch (Exception e) {
            log.error("Repository scan failed for job {}: {}", job.id(), e.getMessage());
            job.markFailed("Repository scan failed: " + e.getMessage());
            resultWriter.writeSummary(job);
            return;
        }

        job.markFiltering(files.size());
        log.info("Job {}: scanned {} files from {}, mode={}, maxConcurrency={}, agents={}",
                job.id(), files.size(), job.repositoryRoot(), job.executionMode(), job.maxConcurrency(),
                agentSelector.agentCount());

        List<SourceFile> eligibleFiles = partitionEligibleFiles(job, files);

        if (!eligibleFiles.isEmpty()) {
            job.markProcessing();
            if (job.executionMode() == ExecutionMode.BATCH) {
                runBatchMode(job, eligibleFiles);
            } else {
                runSyncFanOut(job, eligibleFiles);
            }
        }

        // Batch mode may have already moved the job to FAILED on a non-recoverable error (e.g. the
        // shared prompt skeleton failed to render before any file was submitted) — don't clobber that.
        if (job.phase() != JobPhase.FAILED) {
            job.markCompleted();
        }
        resultWriter.writeSummary(job);
        log.info("Job {} finished: {} succeeded, {} failed, {} skipped, of {} files",
                job.id(), job.succeededCount(), job.failedCount(), job.skippedCount(), job.totalCount());
    }

    /**
     * Applies the unconditional non-substantive pre-filter and (for sync mode's resumable re-run
     * support) the existing-result skip, regardless of which execution mode handles the remainder.
     */
    private List<SourceFile> partitionEligibleFiles(ExtractionJob job, List<SourceFile> files) {
        List<SourceFile> eligibleFiles = new ArrayList<>();
        for (SourceFile file : files) {
            Optional<String> skipReason = nonSubstantiveFileFilter.skipReason(file);
            if (skipReason.isPresent()) {
                resultWriter.write(job, ExtractionResult.skipped(file, PREFILTER_AGENT_NAME, skipReason.get()));
                job.recordSkipped();
                continue;
            }
            if (skipExistingResults && resultWriter.exists(job, file.relativePath())) {
                job.recordResult(true);
                continue;
            }
            eligibleFiles.add(file);
        }
        return eligibleFiles;
    }

    private void runSyncFanOut(ExtractionJob job, List<SourceFile> files) {
        // Platform threads (no virtual threads pre-JDK21): pool size itself is the concurrency throttle.
        ExecutorService fileExecutor = Executors.newFixedThreadPool(job.maxConcurrency());
        try {
            List<CompletableFuture<Void>> futures = files.stream()
                    .map(file -> CompletableFuture.runAsync(() -> processFile(job, file), fileExecutor))
                    .toList();
            CompletableFuture.allOf(futures.toArray(CompletableFuture[]::new)).join();
        } finally {
            fileExecutor.shutdown();
        }
    }

    private void processFile(ExtractionJob job, SourceFile file) {
        try {
            LogicExtractionAgent agent = agentSelector.next();
            ExtractionResult result = agent.extract(file);
            resultWriter.write(job, result);
            job.recordResult(result.success());
        } catch (Exception e) {
            log.error("Unexpected error processing {}: {}", file.relativePath(), e.getMessage(), e);
            job.recordResult(false);
        }
    }

    private void runBatchMode(ExtractionJob job, List<SourceFile> files) {
        try {
            batchExtractionService.runBatch(job, files);
        } catch (Exception e) {
            log.error("Job {}: batch execution failed: {}", job.id(), e.getMessage(), e);
            job.markFailed("Batch execution failed: " + e.getMessage());
        }
    }
}
