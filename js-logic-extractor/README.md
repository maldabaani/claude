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
        |                                              excluded dirs/max size, reads file content.
        |                                              A file over max-file-size-bytes is split by
        |                                              LargeFileChunker into part-NNNN SourceFiles
        |                                              instead of being skipped (jsprocessor.chunking)
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

## Splitting oversized files (e.g. one giant bundled/generated file)

Some repositories ship logic as one huge generated or bundled file rather than many small source
files (e.g. a single 190k-line / 8.5MB `bundle.js`). A whole file that size is far beyond any
Claude model's context window, so rather than skip it, `RepositoryScannerService` hands any file
over `jsprocessor.max-file-size-bytes` to `LargeFileChunker`, which splits it into multiple
`SourceFile`s named `<originalRelativePath>/part-0001.<ext>`, `part-0002.<ext>`, etc. Each chunk
then flows through the rest of the pipeline (SYNC or BATCH, agent round-robin, per-file fault
isolation, `skip-existing-results`) exactly like any other file — its output lands at
`output/<originalRelativePath>/part-0001.<ext>.json` and so on.

Cuts are made at line boundaries, preferring "safe" boundaries where combined `{}/()/[]` bracket
depth is back to zero and the line isn't inside a string or block comment, so a chunk rarely splits
a function/class/block in half. If a block never returns to depth zero, an internal hard cap (2x
`jsprocessor.chunking.max-lines-per-chunk`) forces a cut anyway and logs a warning. Known,
deliberately accepted simplifications: template literals are treated as one opaque string region
(their `${}` interpolation internals aren't tracked), and regex literals aren't specially detected,
so bracket-like characters inside one are scanned at face value — both can only ever shift a cut to
a less-ideal line, never corrupt chunk content, since every cut lands exactly on a line boundary. A
file with no line breaks at all (e.g. a single minified line) can't be split this way; it's sent
through as one oversized chunk with a warning logged.

Set `jsprocessor.chunking.enabled=false` to restore the old behavior of skipping (with a warning)
any file over `jsprocessor.max-file-size-bytes` instead of chunking it.

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

## Asking questions about a job's extracted logic (RAG)

Once a job has written at least one result, `GET /ui/jobs/{jobId}/ask` (or `POST
/api/v1/extraction-jobs/{jobId}/ask`) lets you ask natural-language questions about the
repository's logic. `ExtractionQaService` retrieves the extracted-logic summaries most relevant
to the question and feeds them to Claude as grounded context, returning the answer plus the
source file(s) it drew from.

Retrieval has two tiers:

- **Vector search** (real embeddings + cosine similarity, via an ephemeral Spring AI
  `SimpleVectorStore`) when `jsprocessor.embedding.enabled=true` and an `EmbeddingModel` bean is
  available.
- **Keyword overlap** (path/content term matching, zero extra infrastructure) otherwise, or as an
  automatic fallback if any embedding call fails (e.g. the local Ollama daemon is unreachable) —
  the QA endpoint never hard-fails due to embedding infrastructure being unavailable.

Vector search is backed by a local [Ollama](https://ollama.com) embedding model, off by default:

```bash
ollama pull nomic-embed-text   # or any embedding model you have pulled locally
ollama serve                    # default: http://localhost:11434

export JSPROCESSOR_EMBEDDING_ENABLED=true
./mvnw spring-boot:run
```

`jsprocessor.embedding.base-url` and `-model` mirror the Ollama chat-agent equivalents; see the
configuration table below.

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
| `jsprocessor.chunking.enabled` | `true` | Split files over `max-file-size-bytes` into `part-NNNN` chunks instead of skipping them — see [Splitting oversized files](#splitting-oversized-files-eg-one-giant-bundledgenerated-file) |
| `jsprocessor.chunking.max-lines-per-chunk` | `1800` | Target line count per chunk (actual cut may run longer to land on a safe boundary) |
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
| `jsprocessor.embedding.enabled` | `false` | Enables real vector search for the QA endpoint — see [Asking questions about a job's extracted logic](#asking-questions-about-a-jobs-extracted-logic-rag) |
| `jsprocessor.embedding.base-url` | `http://localhost:11434` | Ollama server URL for embeddings |
| `jsprocessor.embedding.model` | `nomic-embed-text` | Ollama embedding model name (must already be pulled) |

## Tests

```bash
./mvnw test
```

Covers repository scanning rules, `LargeFileChunker`'s safe-boundary splitting (target line count,
waiting for a safe boundary past the target, the hard-cap forced cut, content round-trip fidelity,
and the no-line-breaks edge case), the non-substantive pre-filter (type-declaration/test/barrel
detection), prompt-template rendering (including the `<`/`>` delimiter choice against JS content
containing literal `<`/`>`/`{`/`}`), round-robin agent dispatch, the orchestrator's concurrency
bound and per-file fault isolation (SYNC mode), `BatchExtractionService`'s result mapping and
chunk-level fault isolation (BATCH mode, against a mocked `AnthropicClient`), `OllamaLogicExtractionAgent`'s
extraction/usage parsing and failure handling, and the job-control REST endpoints. No network calls
are made in tests — `ChatClient`/`LogicExtractionAgent` and the raw Anthropic SDK client are stubbed
or mocked in every test.
