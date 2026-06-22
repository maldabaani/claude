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
JobRegistry.register()  -- resolves output dir + concurrency, returns ExtractionJob
        |
        v
JsRepositoryProcessingOrchestrator.run(job)        <- dispatched off the HTTP thread
        |
        +-- RepositoryScannerService.scan(root)    -- walks the tree once, filters by extension/
        |                                              excluded dirs/max size, reads file content
        |
        +-- fixed thread pool sized to job.maxConcurrency() -- the pool size IS the throttle
        |       for each SourceFile (one CompletableFuture per file):
        |           AgentSelector.next()           -- round-robins across LogicExtractionAgent beans
        |           agent.extract(file)               -- builds the prompt, calls Claude, parses usage
        |           ExtractionResultWriter.write(...)  -- one JSON file per source file
        |
        +-- CompletableFuture.allOf(...).join()
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
  round-robins across every `LogicExtractionAgent` bean in the Spring context. Today there is one
  (`ClaudeLogicExtractionAgent`). Registering a second bean — e.g. backed by a different API key,
  account, or model — doubles aggregate throughput with no change to the orchestrator. This is the
  seam for "multiple collaborating agents" without speculative complexity today.
- **Resilience**: transient failures (HTTP 429/5xx) are retried with exponential backoff inside
  Spring AI itself (`spring.ai.retry.*`). A failure that survives retries is recorded against that
  one file only — the orchestrator isolates failures per file via `CompletableFuture` + try/catch,
  so one bad file never aborts the batch.
- **Idempotent re-runs**: if `jsprocessor.skip-existing-results=true` (default), a file whose
  output JSON already exists is skipped without calling Claude again — safe to re-run a job against
  the same output directory after a partial failure or restart.

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

Poll it:

```bash
curl localhost:8085/api/v1/extraction-jobs/<jobId>
```

Results land under `jsprocessor.default-output-directory` (default `./output`), one
`<relative-path>.json` per source file plus a `_summary.json` for the run.

## Configuration (`application.yml` / env vars)

| Property | Default | Purpose |
|---|---|---|
| `spring.ai.anthropic.api-key` | `${ANTHROPIC_API_KEY}` | Claude API key |
| `spring.ai.anthropic.chat.options.model` | `${ANTHROPIC_MODEL}` | Claude model id |
| `spring.ai.retry.max-attempts` | `5` | Retries for 429/5xx before a file is marked failed |
| `jsprocessor.included-extensions` | `.js,.jsx,.mjs,.cjs,.ts,.tsx` | Files eligible for extraction |
| `jsprocessor.excluded-directory-names` | `node_modules,.git,dist,build,...` | Directories never walked into |
| `jsprocessor.max-file-size-bytes` | `300000` | Files above this size are skipped (e.g. bundles) |
| `jsprocessor.max-concurrent-requests` | `8` | Default Claude concurrency cap per job |
| `jsprocessor.skip-existing-results` | `true` | Skip files that already have an output JSON |

## Tests

```bash
./mvnw test
```

Covers repository scanning rules, prompt-template rendering (including the `<`/`>` delimiter
choice against JS content containing literal `<`/`>`/`{`/`}`), round-robin agent dispatch, the
orchestrator's concurrency bound and per-file fault isolation, and the job-control REST endpoints.
No network calls are made in tests — `ChatClient`/`LogicExtractionAgent` are stubbed.
