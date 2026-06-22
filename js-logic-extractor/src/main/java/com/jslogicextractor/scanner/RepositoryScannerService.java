package com.jslogicextractor.scanner;

import com.jslogicextractor.config.ExtractionProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Stream;

@Service
public class RepositoryScannerService {

    private static final Logger log = LoggerFactory.getLogger(RepositoryScannerService.class);

    private final ExtractionProperties properties;

    public RepositoryScannerService(ExtractionProperties properties) {
        this.properties = properties;
    }

    public List<SourceFile> scan(Path repositoryRoot) {
        if (!Files.isDirectory(repositoryRoot)) {
            throw new IllegalArgumentException("Not a directory: " + repositoryRoot);
        }
        try (Stream<Path> walk = Files.walk(repositoryRoot)) {
            return walk
                    .filter(Files::isRegularFile)
                    .filter(path -> !isExcluded(repositoryRoot, path))
                    .filter(this::hasIncludedExtension)
                    .map(path -> readSourceFile(repositoryRoot, path))
                    .flatMap(Optional::stream)
                    .toList();
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to scan repository: " + repositoryRoot, e);
        }
    }

    private boolean isExcluded(Path root, Path file) {
        Path relative = root.relativize(file);
        for (Path segment : relative) {
            if (properties.excludedDirectoryNames().contains(segment.toString())) {
                return true;
            }
        }
        return false;
    }

    private boolean hasIncludedExtension(Path file) {
        String name = file.getFileName().toString().toLowerCase(Locale.ROOT);
        return properties.includedExtensions().stream().anyMatch(name::endsWith);
    }

    private Optional<SourceFile> readSourceFile(Path root, Path file) {
        try {
            long size = Files.size(file);
            if (size > properties.maxFileSizeBytes()) {
                log.warn("Skipping {} ({} bytes exceeds max-file-size-bytes={})", file, size, properties.maxFileSizeBytes());
                return Optional.empty();
            }
            String content = Files.readString(file, StandardCharsets.UTF_8);
            return Optional.of(new SourceFile(file, root.relativize(file).toString(), content, size));
        } catch (IOException e) {
            log.warn("Skipping unreadable file {}: {}", file, e.getMessage());
            return Optional.empty();
        }
    }
}
