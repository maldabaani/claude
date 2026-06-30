package com.jslogicextractor.orchestration;

import java.nio.file.Path;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

public final class ExtractionJob {

    private final UUID id;
    private final Path repositoryRoot;
    private final Path outputDirectory;
    private final int maxConcurrency;
    private final ExecutionMode executionMode;
    private final boolean incremental;
    private final Instant createdAt = Instant.now();

    private volatile JobPhase phase = JobPhase.PENDING;
    private volatile Instant finishedAt;
    private volatile String failureReason;

    private final AtomicInteger totalFiles = new AtomicInteger();
    private final AtomicInteger processedFiles = new AtomicInteger();
    private final AtomicInteger succeededFiles = new AtomicInteger();
    private final AtomicInteger failedFiles = new AtomicInteger();
    private final AtomicInteger skippedFiles = new AtomicInteger();

    public ExtractionJob(UUID id, Path repositoryRoot, Path outputDirectory, int maxConcurrency) {
        this(id, repositoryRoot, outputDirectory, maxConcurrency, null, false);
    }

    public ExtractionJob(UUID id, Path repositoryRoot, Path outputDirectory, int maxConcurrency,
                          ExecutionMode executionMode) {
        this(id, repositoryRoot, outputDirectory, maxConcurrency, executionMode, false);
    }

    public ExtractionJob(UUID id, Path repositoryRoot, Path outputDirectory, int maxConcurrency,
                          ExecutionMode executionMode, boolean incremental) {
        this.id = id;
        this.repositoryRoot = repositoryRoot;
        this.outputDirectory = outputDirectory;
        this.maxConcurrency = maxConcurrency;
        this.executionMode = executionMode != null ? executionMode : ExecutionMode.SYNC;
        this.incremental = incremental;
    }

    public void markScanning() {
        this.phase = JobPhase.SCANNING;
    }

    public void markFiltering(int total) {
        this.totalFiles.set(total);
        this.phase = JobPhase.FILTERING;
    }

    public void markProcessing() {
        this.phase = JobPhase.PROCESSING;
    }

    public void recordResult(boolean success) {
        processedFiles.incrementAndGet();
        if (success) {
            succeededFiles.incrementAndGet();
        } else {
            failedFiles.incrementAndGet();
        }
    }

    public void recordSkipped() {
        processedFiles.incrementAndGet();
        skippedFiles.incrementAndGet();
    }

    public void markCompleted() {
        this.phase = JobPhase.COMPLETED;
        this.finishedAt = Instant.now();
    }

    public void markFailed(String reason) {
        this.phase = JobPhase.FAILED;
        this.failureReason = reason;
        this.finishedAt = Instant.now();
    }

    public UUID id() {
        return id;
    }

    public Path repositoryRoot() {
        return repositoryRoot;
    }

    public Path outputDirectory() {
        return outputDirectory;
    }

    public int maxConcurrency() {
        return maxConcurrency;
    }

    public ExecutionMode executionMode() {
        return executionMode;
    }

    public boolean incremental() {
        return incremental;
    }

    public JobPhase phase() {
        return phase;
    }

    public Instant createdAt() {
        return createdAt;
    }

    public Instant finishedAt() {
        return finishedAt;
    }

    public String failureReason() {
        return failureReason;
    }

    public int totalCount() {
        return totalFiles.get();
    }

    public int processedCount() {
        return processedFiles.get();
    }

    public int succeededCount() {
        return succeededFiles.get();
    }

    public int failedCount() {
        return failedFiles.get();
    }

    public int skippedCount() {
        return skippedFiles.get();
    }
}
