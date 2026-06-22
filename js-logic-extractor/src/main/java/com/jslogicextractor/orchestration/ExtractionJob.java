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
    private final Instant createdAt = Instant.now();

    private volatile JobPhase phase = JobPhase.PENDING;
    private volatile Instant finishedAt;
    private volatile String failureReason;

    private final AtomicInteger totalFiles = new AtomicInteger();
    private final AtomicInteger processedFiles = new AtomicInteger();
    private final AtomicInteger succeededFiles = new AtomicInteger();
    private final AtomicInteger failedFiles = new AtomicInteger();

    public ExtractionJob(UUID id, Path repositoryRoot, Path outputDirectory, int maxConcurrency) {
        this.id = id;
        this.repositoryRoot = repositoryRoot;
        this.outputDirectory = outputDirectory;
        this.maxConcurrency = maxConcurrency;
    }

    public void markScanning() {
        this.phase = JobPhase.SCANNING;
    }

    public void markProcessing(int total) {
        this.totalFiles.set(total);
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
}
