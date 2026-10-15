---
name: golang
description: "Master index and guide for Golang engineering best practices, linking 46 specialized Go skills (testing, concurrency, error handling, project layout, performance, and libraries)."
user-invocable: true
---

# Golang Master Cheatsheet & Skills Index

This skill serves as the central router for Go development, curating the specialized Go skills from `samber/cc-skills-golang` available in `.agents/skills/`.

## Core Categories & Specialized Skills

### 1. Architecture & Project Structure
- **`golang-project-layout`**: Standard Go package organization (`cmd/`, `internal/`, `pkg/`, Clean Arch / Hexagonal).
- **`golang-structs-interfaces`**: Idiomatic interface segregation, small interfaces, struct embedding, and composition.
- **`golang-dependency-injection`**: Wire, Uber FX, Dig, and manual constructor injection.
- **`golang-design-patterns`**: Idiomatic Go implementations of behavioral, creational, and structural patterns.

### 2. Testing & Quality Assurance
- **`golang-testing`**: Table-driven tests, `t.Parallel()`, fixtures, goleak, subtests.
- **`golang-stretchr-testify`**: Assertions, suites, and mocks with `testify`.
- **`golang-benchmark`**: Benchmark tests (`testing.B`), allocations, throughput measurement.
- **`golang-lint`**: `golangci-lint`, staticcheck, and CI configuration.

### 3. Reliability, Concurrency & Errors
- **`golang-error-handling`**: Wrapping errors with `%w`, `errors.Is`/`errors.As`, sentinel errors, custom domain errors.
- **`golang-concurrency`**: Safe goroutines, channels, worker pools, mutexes, `sync.WaitGroup`, errgroup.
- **`golang-context`**: Context propagation, cancellation, timeouts, and value keys.
- **`golang-safety`**: Race condition detection (`-race`), memory leaks, nil checks, and recovery.

### 4. Code Style & Modern Go
- **`golang-code-style`** & **`golang-naming`**: Effective Go formatting, naming conventions, and package names.
- **`golang-modernize`**: Adopting modern Go features (generics, slices, maps packages, loopvar).
- **`golang-refactoring`**: Safe refactoring patterns in Go codebases.

### 5. Data & Networking
- **`golang-database`**: `database/sql`, connection pooling, transactions, migrations.
- **`golang-grpc`** & **`golang-graphql`**: Building RPC and GraphQL services.
- **`golang-popular-libraries`**: Popular Go ecosystem libraries (samber/lo, samber/oops, slog, etc.).

## How to Consult Skills
When working on Go tasks, the agent should invoke `view_file` on the relevant skill's `SKILL.md` (e.g., `<workspace_root>/.agents/skills/<skill_name>/SKILL.md` or via `Available skills`).
