package com.jslogicextractor.orchestration;

import com.jslogicextractor.agent.AgentSelector;
import com.jslogicextractor.agent.ExtractionResult;
import com.jslogicextractor.agent.LogicExtractionAgent;
import com.jslogicextractor.config.ExtractionProperties;
import com.jslogicextractor.output.ExtractionResultWriter;
import com.jslogicextractor.scanner.RepositoryScannerService;
import com.jslogicextractor.scanner.SourceFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Semaphore;

@Service
public class JsRepositoryProcessingOrchestrator {

    private static final Logger log = LoggerFactory.getLogger(JsRepositoryProcessingOrchestrator.class);

    private final RepositoryScannerService scanner;
    private final AgentSelector agentSelector;
    private final ExtractionResultWriter resultWriter;
    private final ExecutorService extractionExecutor;
    private final boolean skipExistingResults;

    public JsRepositoryProcessingOrchestrator(RepositoryScannerService scanner,
                                               AgentSelector agentSelector,
                                               ExtractionResultWriter resultWriter,
                                               ExecutorService extractionExecutor,
                                               ExtractionProperties properties) {
        this.scanner = scanner;
        this.agentSelector = agentSelector;
        this.resultWriter = resultWriter;
        this.extractionExecutor = extractionExecutor;
        this.skipExistingResults = properties.skipExistingResults();
    }

    public void run(ExtractionJob job) {
        job.markScanning();
        List<SourceFile> files;
        try {
            files = scanner.scan(job.repositoryRoot());
        } catch (Exception e) {
            log.error("Repository scan failed for job {}: {}", job.id(), e.getMessage());
            job.markFailed("Repository scan failed: " + e.getMessage());
            resultWriter.writeSummary(job);
            return;
        }

        job.markProcessing(files.size());
        log.info("Job {}: scanned {} files from {}, maxConcurrency={}, agents={}",
                job.id(), files.size(), job.repositoryRoot(), job.maxConcurrency(), agentSelector.agentCount());

        if (!files.isEmpty()) {
            Semaphore throttle = new Semaphore(job.maxConcurrency());
            List<CompletableFuture<Void>> futures = files.stream()
                    .map(file -> CompletableFuture.runAsync(() -> processFile(job, file, throttle), extractionExecutor))
                    .toList();
            CompletableFuture.allOf(futures.toArray(CompletableFuture[]::new)).join();
        }

        job.markCompleted();
        resultWriter.writeSummary(job);
        log.info("Job {} finished: {} succeeded, {} failed, of {} files",
                job.id(), job.succeededCount(), job.failedCount(), job.totalCount());
    }

    private void processFile(ExtractionJob job, SourceFile file, Semaphore throttle) {
        if (skipExistingResults && resultWriter.exists(job, file.relativePath())) {
            job.recordResult(true);
            return;
        }
        try {
            throttle.acquire();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return;
        }
        try {
            LogicExtractionAgent agent = agentSelector.next();
            ExtractionResult result = agent.extract(file);
            resultWriter.write(job, result);
            job.recordResult(result.success());
        } catch (Exception e) {
            log.error("Unexpected error processing {}: {}", file.relativePath(), e.getMessage(), e);
            job.recordResult(false);
        } finally {
            throttle.release();
        }
    }
}
