---
name: to-spec
description: "Synthesize product requirements, user stories, decisions, and testing seams into a structured specification saved locally in docs/specs/<slug>.md."
---

# To Spec (Local Documentation)

This skill takes the aligned product context, user interview answers (`/grill-me`), and codebase understanding, and synthesizes them into a comprehensive specification saved locally in **`docs/specs/<slug>.md`**.

Never publish issues to external trackers (GitHub Issues, Linear, etc.). All specifications in this repository are persisted as versioned Markdown documents under `docs/specs/`.

## Process

1. **Explore Domain & Codebase Context**:
   - Inspect `PRD.md`, `GLOSSARY.md`, `AGENTS.md`, and `docs/adr/` if you haven't already.
   - Use the project's ubiquitous domain glossary vocabulary throughout the spec, and respect any ADRs in the area you're touching.

2. **Define High-Level Testing Seams**:
   - Sketch out the public seams at which the feature will be tested.
   - Existing seams should be preferred to new ones. Use the highest seam possible (the public interface of the deep module or Server Function). The fewer seams across the codebase, the better — the ideal number is one per deep module.

3. **Save Local Spec (`docs/specs/<slug>.md`)**:
   - Write the specification using the template below and save it to `docs/specs/<slug>.md` (creating the `docs/specs/` directory if it does not exist).
   - Mark the spec status as `ready-for-agent` in the header metadata.

<spec-template>

# Spec: <Feature Title>

- **Slug**: `<slug>`
- **Status**: `ready-for-agent`

## Problem Statement

The problem that the user is facing, from the user's perspective.

## Solution

The solution to the problem, from the user's perspective (including mobile-first UX flow and edge-case behaviors).

## User Stories

A comprehensive, numbered list of user stories covering happy paths, edge cases, and failure states. Each user story must follow the format:

1. As an `<actor>`, I want a `<feature>`, so that `<benefit>`

<user-story-example>
1. As a local business owner on a smartphone, I want to generate an AI promotional card in under 90 seconds without creating an account, so that I can quickly post daily offers on WhatsApp and Instagram.
</user-story-example>

This list of user stories should be extensive and cover all aspects of the feature.

## Implementation Decisions

A list of product and architectural decisions that were made. This can include:

- The deep modules that will be built or modified
- The public interfaces of those modules
- Business rules, quota limits, and state transitions
- Technical clarifications from the developer
- Schema impacts and API/RPC contracts
- Specific user interactions and error states

Do NOT hardcode fragile line numbers or implementation boilerplate that will go stale quickly.

Exception: if a prototype or domain model produced a snippet that encodes a decision more precisely than prose can (state machine, reducer, Zod schema, type shape), inline it within the relevant decision and trim to the decision-rich parts.

## Testing Decisions

A list of testing decisions that were made. Include:

- What makes a good test (only test external behavior at the public seam, not internal implementation details)
- Which module boundaries / Server Functions will be tested
- Prior art for the tests in the codebase

## Out of Scope

A clear description of what is explicitly out of scope (YAGNI) for this spec.

## Further Notes

Any further notes, references to `PRD.md`, `GLOSSARY.md`, or `docs/adr/`.

</spec-template>
