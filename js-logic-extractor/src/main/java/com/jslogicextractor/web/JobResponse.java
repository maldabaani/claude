package com.jslogicextractor.web;

import com.jslogicextractor.orchestration.ExtractionJob;

import java.time.Instant;

public record JobResponse(
        String jobId,
        String phase,
        String repositoryRoot,
        String outputDirectory,
        int totalFiles,
        int processedFiles,
        int succeededFiles,
        int failedFiles,
        String failureReason,
        Instant createdAt,
        Instant finishedAt
) {

    public static JobResponse from(ExtractionJob job) {
        return new JobResponse(
                job.id().toString(),
                job.phase().name(),
                job.repositoryRoot().toString(),
                job.outputDirectory().toString(),
                job.totalCount(),
                job.processedCount(),
                job.succeededCount(),
                job.failedCount(),
                job.failureReason(),
                job.createdAt(),
                job.finishedAt()
        );
    }
}
