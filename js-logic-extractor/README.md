# js-logic-extractor

A standalone Spring Boot service that traverses a JavaScript/TypeScript repository and runs each
source file through a Claude-backed "logic extraction" agent, asynchronously and at scale
(thousands of files per run).

It is intentionally decoupled from `clinic-saas`: a different repo, a different concern, a
different deploy lifecycle.

## How it works

```
POST /api/v1/extraction-jobs  --(202, jobId)-->  caller
        |
        v
JobRegistry.register()  -- resolves output dir + concurrency + execution mode, returns ExtractionJob
        |
        v
JsRepositoryProcessingOrchestrator.run(job)        <- dispatched off the HTTP thread
        |
        +-- RepositoryScannerService.scan(root)    -- walks the tree once, filters by extension/
        |                                              excluded dirs/max size, reads file content
        |
        +-- NonSubstantiveFileFilter.skipReason(file) -- unconditional cheap pre-pass (both modes):
        |       .d.ts / test-spec / barrel files are recorded as skipped, never sent to Claude
        |
        +-- job.executionMode() branches here:
        |
        |   SYNC (default) -- fixed thread pool sized to job.maxConcurrency(), pool size IS the
        |   |   throttle, for each remaining SourceFile (one CompletableFuture per file):
        |   |       AgentSelector.next()             -- round-robins across LogicExtractionAgent beans
        |   |       agent.extract(file)               -- builds the prompt, calls Claude, parses usage
        |   |       ExtractionResultWriter.write(...)  -- one JSON file per source file
        |   |   CompletableFuture.allOf(...).join()
        |   |
        |   BATCH -- BatchExtractionService.runBatch(job, files): chunks files to respect the
        |       Anthropic Batches API's 100k-request/256MB-per-batch caps, submits each chunk with
        |       the shared extraction instructions cached via cache_control (flat 50% discount on
        |       all token usage vs. SYNC), polls until ENDED, streams results back per custom_id
        |
        v
ExtractionResultWriter.writeSummary(job)            -- _summary.json: counts, timings, failure reason

GET /api/v1/extraction-jobs/{jobId}                 -- poll progress at any point
```

### Scaling: single agent today, multiple collaborating agents tomorrow

- **Within a run**: each job gets its own fixed-size thread pool, sized to
  `jsprocessor.max-concurrent-requests` (or the per-request `maxConcurrency` override) — the pool
  size is itself the concurrency throttle against the Anthropic API, no virtual threads required
  (JDK 17 target). Raising that one number is the scaling knob for a single run.
- **Across agents**: `JsRepositoryProcessingOrchestrator` depends on `AgentSelector`, which
  round-robins across every `LogicExtractionAgent` bean in the Spring context. By default there is
  one (`ClaudeLogicExtractionAgent`). Registering a second bean — e.g. backed by a different API
  key, account, or model — doubles aggregate throughput with no change to the orchestrator. This is
  the seam for "multiple collaborating agents" without speculative complexity today. An optional
  `OllamaLogicExtractionAgent` (see [Testing against local Ollama](#testing-against-local-ollama-sync-mode-only))
  plugs into this same seam; enabling it alongside the default Claude agent makes the two
  round-robin roughly 50/50 over the file list — leave it disabled (the default) to send every file
  to Claude.
- **Resilience**: transient failures (HTTP 429/5xx) are retried with exponential backoff inside
  Spring AI itself (`spring.ai.retry.*`). A failure that survives retries is recorded against that
  one file only — the orchestrator isolates failures per file via `CompletableFuture` + try/catch,
  so one bad file never aborts the batch.
- **Idempotent re-runs**: if `jsprocessor.skip-existing-results=true` (default), a file whose
  output JSON already exists is skipped without calling Claude again — safe to re-run a job against
  the same output directory after a partial failure or restart.

## Execution modes: SYNC vs BATCH

Set `jsprocessor.execution-mode` (or `executionMode` on the start-job request) to `SYNC` or `BATCH`.

- **SYNC** (default) — per-file Spring AI `ChatClient` calls through the bounded thread pool
  described above. Lower latency per file, normal token pricing. Best for small/interactive runs.
- **BATCH** — every eligible file is submitted as one request inside an Anthropic Message Batch
  (`BatchExtractionService`), with the shared extraction instructions cached via a single
  `cache_control` breakpoint on the system block. This gets a flat 50% discount on all token usage
  versus SYNC, at the cost of asynchronous turnaround (Anthropic's batches typically complete
  within minutes to hours, polled via `jsprocessor.batch.poll-interval` up to
  `jsprocessor.batch.poll-timeout`). Built for large runs — up to ~100,000 files in a single job.
  Spring AI 1.1.7 has no Batches API support, so this mode bypasses Spring AI / `ChatClient`
  entirely and talks to Anthropic via the raw `anthropic-java-client-okhttp` SDK. Chunks (each
  capped at `jsprocessor.batch.max-requests-per-batch` requests or
  `jsprocessor.batch.max-batch-bytes` bytes) run sequentially, one batch at a time.

Both modes apply the same unconditional pre-filter (`NonSubstantiveFileFilter`): `.d.ts` files,
test/spec files, and barrel files (re-exports only) are skipped before any Claude call, recorded in
the output as `ExtractionResult.skipped(...)` with a reason, and counted separately from
succeeded/failed in `_summary.json`.

## Testing against local Ollama (SYNC mode only)

For local testing without an Anthropic API key, an optional `OllamaLogicExtractionAgent` can run
SYNC-mode extraction against a model served by a local [Ollama](https://ollama.com) instance (e.g.
a quantized Qwen coder model). It is off by default and gated entirely behind
`jsprocessor.ollama.enabled` — leaving it disabled means the app behaves exactly as before, with no
extra beans or dependencies activated.

```bash
ollama pull qwen2.5-coder   # or any model you have pulled locally
ollama serve                # default: http://localhost:11434

export JSPROCESSOR_OLLAMA_ENABLED=true
export OLLAMA_MODEL=qwen2.5-coder
./mvnw spring-boot:run
```

Notes:

- BATCH mode is unaffected and unavailable here — it talks to the Anthropic Batches API directly
  and has no Ollama equivalent.
- If `ANTHROPIC_API_KEY` is unset while `jsprocessor.ollama.enabled=true`, the Claude agent bean
  still starts (Spring AI doesn't validate the key at startup) but every Claude-routed file will
  fail at call time. To send every file to Ollama instead, set `jsprocessor.max-concurrent-requests`
  as usual and expect ~50% of files to land on the Claude agent unless you also unset/invalidate it
  — there's currently no config to disable the Claude agent itself.
- `jsprocessor.ollama.base-url`, `-model`, `-max-tokens`, and `-temperature` mirror the Anthropic
  equivalents; see the configuration table below.

## Plugging in the real prompt

`src/main/resources/prompts/logic-extraction-prompt.st` currently holds a placeholder extraction
prompt. Replace its contents with the team's existing, validated prompt — see
`src/main/resources/prompts/README.md` for the placeholder syntax (`<fileName>`, `<filePath>`,
`<fileContent>`) and why this template uses `<`/`>` instead of `{`/`}` as delimiters (so a JSON
response schema in the prompt doesn't need escaping). No Java changes are required for that swap.

## Running it

```bash
export ANTHROPIC_API_KEY=sk-ant-...
./mvnw spring-boot:run
```

Start a job:

```bash
curl -X POST localhost:8085/api/v1/extraction-jobs \
  -H 'Content-Type: application/json' \
  -d '{"repositoryPath": "/path/to/js-repo", "maxConcurrency": 10}'
```

Or, for a large repository, run it through the Batches API instead:

```bash
curl -X POST localhost:8085/api/v1/extraction-jobs \
  -H 'Content-Type: application/json' \
  -d '{"repositoryPath": "/path/to/js-repo", "executionMode": "BATCH"}'
```

Poll it:

```bash
curl localhost:8085/api/v1/extraction-jobs/<jobId>
```

Results land under `jsprocessor.default-output-directory` (default `./output`), one
`<relative-path>.json` per source file plus a `_summary.json` for the run.

## Configuration (`application.yml` / env vars)

| Property | Default | Purpose |
|---|---|---|
| `spring.ai.model.chat` | `anthropic` | Pins the active Spring AI `ChatModel`; required once the Ollama starter is on the classpath, otherwise both autoconfigurations activate and the context fails to start |
| `spring.ai.anthropic.api-key` | `${ANTHROPIC_API_KEY}` | Claude API key |
| `spring.ai.anthropic.chat.options.model` | `${ANTHROPIC_MODEL}` | Claude model id |
| `spring.ai.retry.max-attempts` | `5` | Retries for 429/5xx before a file is marked failed |
| `jsprocessor.included-extensions` | `.js,.jsx,.mjs,.cjs,.ts,.tsx` | Files eligible for extraction |
| `jsprocessor.excluded-directory-names` | `node_modules,.git,dist,build,...` | Directories never walked into |
| `jsprocessor.max-file-size-bytes` | `300000` | Files above this size are skipped (e.g. bundles) |
| `jsprocessor.max-concurrent-requests` | `8` | Default Claude concurrency cap per job (SYNC mode) |
| `jsprocessor.skip-existing-results` | `true` | Skip files that already have an output JSON |
| `jsprocessor.execution-mode` | `SYNC` | `SYNC` or `BATCH` — see [Execution modes](#execution-modes-sync-vs-batch) |
| `jsprocessor.batch.model` | `${ANTHROPIC_MODEL}` | Claude model id for BATCH mode |
| `jsprocessor.batch.max-tokens` | `4096` | Max output tokens per request in BATCH mode |
| `jsprocessor.batch.poll-interval` | `30s` | How often to poll batch status |
| `jsprocessor.batch.poll-timeout` | `26h` | Time to wait for a batch to reach `ENDED` before marking its files failed |
| `jsprocessor.batch.max-requests-per-batch` | `10000` | Requests per batch chunk (Anthropic hard cap: 100,000) |
| `jsprocessor.batch.max-batch-bytes` | `200000000` | Bytes per batch chunk (Anthropic hard cap: 256MB) |
| `jsprocessor.ollama.enabled` | `false` | Registers `OllamaLogicExtractionAgent` (SYNC mode only) — see [Testing against local Ollama](#testing-against-local-ollama-sync-mode-only) |
| `jsprocessor.ollama.base-url` | `http://localhost:11434` | Ollama server URL |
| `jsprocessor.ollama.model` | `qwen2.5-coder` | Ollama model name (must already be pulled) |
| `jsprocessor.ollama.max-tokens` | `4096` | Maps to Ollama's `num_predict` |
| `jsprocessor.ollama.temperature` | `0.0` | Sampling temperature |

## Tests

```bash
./mvnw test
```

Covers repository scanning rules, the non-substantive pre-filter (type-declaration/test/barrel
detection), prompt-template rendering (including the `<`/`>` delimiter choice against JS content
containing literal `<`/`>`/`{`/`}`), round-robin agent dispatch, the orchestrator's concurrency
bound and per-file fault isolation (SYNC mode), `BatchExtractionService`'s result mapping and
chunk-level fault isolation (BATCH mode, against a mocked `AnthropicClient`), `OllamaLogicExtractionAgent`'s
extraction/usage parsing and failure handling, and the job-control REST endpoints. No network calls
are made in tests — `ChatClient`/`LogicExtractionAgent` and the raw Anthropic SDK client are stubbed
or mocked in every test.
