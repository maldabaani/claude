package com.jslogicextractor.orchestration;

import com.jslogicextractor.config.ExtractionProperties;
import org.springframework.stereotype.Component;

import java.nio.file.Path;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class JobRegistry {

    private final Map<UUID, ExtractionJob> jobs = new ConcurrentHashMap<>();
    private final ExtractionProperties defaults;

    public JobRegistry(ExtractionProperties defaults) {
        this.defaults = defaults;
    }

    public ExtractionJob register(Path repositoryRoot, Path outputDirectoryOverride, Integer maxConcurrencyOverride,
                                   ExecutionMode executionModeOverride) {
        return register(repositoryRoot, outputDirectoryOverride, maxConcurrencyOverride, executionModeOverride, false);
    }

    public ExtractionJob register(Path repositoryRoot, Path outputDirectoryOverride, Integer maxConcurrencyOverride,
                                   ExecutionMode executionModeOverride, boolean incremental) {
        UUID id = UUID.randomUUID();
        // Default output dir is namespaced per job id so concurrent jobs never clobber each other's files;
        // callers that want resumable re-runs can pass the same outputDirectory explicitly.
        Path outputDirectory = outputDirectoryOverride != null
                ? outputDirectoryOverride
                : defaults.defaultOutputDirectory().resolve(id.toString());
        int maxConcurrency = maxConcurrencyOverride != null ? maxConcurrencyOverride : defaults.maxConcurrentRequests();
        ExecutionMode executionMode = executionModeOverride != null ? executionModeOverride : defaults.executionMode();

        ExtractionJob job = new ExtractionJob(id, repositoryRoot, outputDirectory, maxConcurrency, executionMode, incremental);
        jobs.put(id, job);
        return job;
    }

    public Optional<ExtractionJob> find(UUID id) {
        return Optional.ofNullable(jobs.get(id));
    }

    public List<ExtractionJob> findAll() {
        return jobs.values().stream()
                .sorted(Comparator.comparing(ExtractionJob::createdAt).reversed())
                .toList();
    }
}
