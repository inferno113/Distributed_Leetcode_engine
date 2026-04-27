# Distributed Code Execution Engine

Production-grade distributed online judge backend (LeetCode/HackerRank style) with strict control-plane vs execution-plane separation.

## Core Goals

- Multi-language execution support (Python, C++)
- Asynchronous execution only (no sync execution in API)
- Queue-backed processing (BullMQ + Redis)
- Distributed worker execution nodes
- Docker sandbox with strict resource limits
- Persistent submission/result tracking in MongoDB

## Architecture Boundaries

### 1) API Server (Control Plane)
- Accept submission requests
- Validate payloads
- Persist submission with `QUEUED` status
- Push jobs to queue
- Never executes user code

### 2) Queue (BullMQ + Redis)
- Decouples API throughput from execution throughput
- Handles retries and failure delivery
- Enables horizontal scaling via multiple workers

### 3) Worker Nodes (Execution Plane)
- Pull jobs from queue
- Mark status `RUNNING`
- Execute code inside Docker sandbox only
- Capture stdout, stderr, exit code, execution time
- Update status to `COMPLETED` or `FAILED`

## Submission Lifecycle

`QUEUED -> RUNNING -> COMPLETED | FAILED`

## Sandboxing Rules (Mandatory)

Every execution container must enforce:
- `--memory=256m`
- `--cpus=0.5`
- `--network=none`
- Timeout kill policy
- Temp files only
- Container cleanup after run

## Tech Stack

- Node.js + Express
- BullMQ + Redis
- MongoDB + Mongoose
- Docker

## Project Structure

- `api-server/`
  - `controllers/`
  - `routes/`
  - `services/`
  - `models/`
  - `queue/`
- `worker/`
  - `executor/`
  - `docker/`
  - `queue-consumer/`
- `sandbox/`
  - `cpp/`
  - `python/`
  - `Dockerfiles/`
- `shared/`
  - `constants/`
  - `utils/`
- `scripts/`

## Development Phases

1. Phase 1: API + DB
2. Phase 2: Queue integration
3. Phase 3: Execution engine (Python then C++)
4. Phase 4: Resource constraints and robust output capture
5. Phase 5: Reliability (retries, crash handling)
6. Phase 6: Advanced features (e.g., priority queue, test-case evaluation)
