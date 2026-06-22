package com.jslogicextractor.web;

import com.jslogicextractor.orchestration.ExtractionJob;
import com.jslogicextractor.orchestration.JobRegistry;
import com.jslogicextractor.orchestration.JsRepositoryProcessingOrchestrator;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.file.Path;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ExecutorService;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ExtractionJobController.class)
class ExtractionJobControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private JobRegistry jobRegistry;

    @MockitoBean
    private JsRepositoryProcessingOrchestrator orchestrator;

    @MockitoBean
    private ExecutorService extractionExecutor;

    @TempDir
    static Path repoRoot;

    @Test
    void startJobReturnsAcceptedWithJobId() throws Exception {
        ExtractionJob job = new ExtractionJob(UUID.randomUUID(), repoRoot, repoRoot.resolve("out"), 4);
        given(jobRegistry.register(any(), any(), any(), any())).willReturn(job);

        mockMvc.perform(post("/api/v1/extraction-jobs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"repositoryPath\":" + quoted(repoRoot.toString()) + "}"))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.jobId").value(job.id().toString()));

        verify(extractionExecutor).execute(any());
    }

    @Test
    void startJobRejectsNonDirectoryPath() throws Exception {
        Path missing = repoRoot.resolve("does-not-exist");

        mockMvc.perform(post("/api/v1/extraction-jobs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"repositoryPath\":" + quoted(missing.toString()) + "}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getJobReturnsNotFoundForUnknownId() throws Exception {
        given(jobRegistry.find(any())).willReturn(Optional.empty());

        mockMvc.perform(get("/api/v1/extraction-jobs/" + UUID.randomUUID()))
                .andExpect(status().isNotFound());
    }

    private String quoted(String value) {
        return "\"" + value.replace("\\", "\\\\") + "\"";
    }
}
