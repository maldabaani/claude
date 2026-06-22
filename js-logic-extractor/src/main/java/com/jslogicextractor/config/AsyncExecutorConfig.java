package com.jslogicextractor.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Configuration
public class AsyncExecutorConfig {

    // Virtual threads make fan-out cheap; real Claude concurrency is throttled per-job via a Semaphore instead.
    @Bean(destroyMethod = "shutdown")
    public ExecutorService extractionExecutor() {
        return Executors.newVirtualThreadPerTaskExecutor();
    }
}
