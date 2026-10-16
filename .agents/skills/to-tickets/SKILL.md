---
name: to-tickets
description: "Break a plan, spec (docs/specs/<slug>.md), or conversation into tracer-bullet vertical slice tickets with blocking edges and acceptance criteria, saved locally in docs/tickets/<slug>/<NN>-<ticket>.md."
---

# To Tickets (Local Documentation)

Break a specification (`docs/specs/<slug>.md`), plan (`docs/plans/<slug>.md`), or conversation into a set of **tracer-bullet tickets**: vertical slices that cut end-to-end through every layer, each declaring the tickets that **block** it.

Never create external GitHub/Linear issues. All tickets are saved locally as Markdown files in **`docs/tickets/<slug>/<NN>-<ticket>.md`**.

## Process

### 1. Gather context

Work from the current conversation context and read `docs/specs/<slug>.md` (and `docs/plans/<slug>.md` if already drafted).

### 2. Explore the codebase & domain vocabulary

Ensure ticket titles and descriptions use the project's ubiquitous language from `GLOSSARY.md` and respect `AGENTS.md` and `docs/adr/`.
Look for opportunities to prefactor the code to make the implementation easier ("Make the change easy, then make the easy change").

### 3. Draft vertical slices (Tracer Bullets)

Break the work into **tracer bullet** tickets:

<vertical-slice-rules>

- Each slice cuts a narrow but COMPLETE path through every layer (schema, backend module/RPC, UI, tests): vertical, NOT a horizontal slice of one layer.
- A completed slice is demoable or verifiable on its own.
- Each slice is sized to fit cleanly in a single builder execution turn.
- Any prefactoring or foundational schema/seam setup goes first (`01-...`).

</vertical-slice-rules>

Give each ticket its **blocking edges**: the other tickets that must complete before it can start. A ticket with no blockers can start immediately.

**Wide refactors are the exception to vertical slicing.** A **wide refactor** is one mechanical change (rename a column, retype a shared symbol) whose **blast radius** fans across the whole codebase. Sequence it as **expand–contract**:
1. **Expand**: add the new form beside the old so nothing breaks.
2. **Migrate**: migrate call sites in batches sized by blast radius, each batch its own ticket blocked by the expand, keeping CI green.
3. **Contract**: delete the old form once no caller remains, in a ticket blocked by every migrate batch.

### 4. Quiz the user (if not already aligned)

When running interactively, present or confirm the proposed breakdown with the user via `ask_question` or in the spec review:
- **Title**: short descriptive name
- **Blocked by**: which other tickets (if any) must complete first
- **What it delivers**: the end-to-end behaviour this ticket makes work

Verify whether the granularity and blocking edges feel right.

### 5. Save the tickets locally in `docs/tickets/<slug>/<NN>-<ticket>.md`

Write **one file per ticket** under **`docs/tickets/<slug>/<NN>-<ticket>.md`**, numbered from `01` in dependency order (blockers first), for example:
- `docs/tickets/01-checkout-flow/01-order-schema-and-checkout-service.md`
- `docs/tickets/01-checkout-flow/02-checkout-ui-and-webhook-verification.md`

Each file's `Blocked by:` lists the relative links or numbers/titles of the tickets it depends on. Use the template below:

<local-ticket-template>

# <NN>: <Ticket title>

**Spec:** [`docs/specs/<slug>.md`](../../specs/<slug>.md)

**What to build:** the end-to-end behaviour this ticket makes work, from the user's perspective, not a layer-by-layer implementation list.

**Blocked by:** the numbers/titles of the tickets that gate this one, or `None (can start immediately)`.

**Status:** `ready-for-agent`

## Acceptance Criteria (BDD)

- [ ] Criterion 1 (Given / When / Then or verifiable behavior)
- [ ] Criterion 2
- [ ] Edge case / security / mobile-first criterion

</local-ticket-template>

Work the **frontier**: any ticket whose blockers are all done can be executed immediately by the orchestrator and builders.
Avoid fragile line numbers or boilerplate snippets; inline only decision-rich contracts (such as a state machine or Zod schema shape) when necessary.
