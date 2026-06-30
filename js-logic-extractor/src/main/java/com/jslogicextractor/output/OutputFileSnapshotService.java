package com.jslogicextractor.output;

import com.jslogicextractor.orchestration.ExtractionJob;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Stream;

/**
 * Lists files that have landed under a job's output directory, newest first. Backs the progress
 * UI's "files appearing as they're written" feed, polled rather than watched via {@code WatchService}.
 */
@Component
public class OutputFileSnapshotService {

    private static final Logger log = LoggerFactory.getLogger(OutputFileSnapshotService.class);
    private static final String SUMMARY_FILE_NAME = "_summary.json";

    public List<OutputFile> recentFiles(ExtractionJob job, int limit) {
        Path outputDirectory = job.outputDirectory();
        if (!Files.isDirectory(outputDirectory)) {
            // Output dir is created lazily on first write; a job still scanning/filtering has none yet.
            return List.of();
        }
        try (Stream<Path> paths = Files.walk(outputDirectory)) {
            return paths.filter(Files::isRegularFile)
                    .filter(path -> path.getFileName().toString().endsWith(".json"))
                    .filter(path -> !path.getFileName().toString().equals(SUMMARY_FILE_NAME))
                    .map(path -> toOutputFile(outputDirectory, path))
                    .filter(java.util.Objects::nonNull)
                    .sorted(Comparator.comparing(OutputFile::modifiedAt).reversed())
                    .limit(limit)
                    .toList();
        } catch (IOException e) {
            log.warn("Failed to list output files for job {}: {}", job.id(), e.getMessage());
            return List.of();
        }
    }

    private OutputFile toOutputFile(Path outputDirectory, Path path) {
        try {
            String relativePath = outputDirectory.relativize(path).toString().replace('\\', '/');
            Instant modifiedAt = Files.getLastModifiedTime(path).toInstant();
            long sizeBytes = Files.size(path);
            return new OutputFile(relativePath, sizeBytes, modifiedAt);
        } catch (IOException e) {
            // The writer may still be mid-write or the file may have been replaced; skip it this poll.
            return null;
        }
    }

    public record OutputFile(String relativePath, long sizeBytes, Instant modifiedAt) {
    }
}
