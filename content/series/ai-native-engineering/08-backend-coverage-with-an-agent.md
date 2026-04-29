---
title: "100% Backend Coverage With an Agent"
seriesId: ai-native-engineering
episode: 8
draft: true
summary: "We hit 100% backend coverage on the legacy platform's BusinessLogic layer in three weeks of agent-driven test generation. Here's the queue-based pipeline that got us there — and the four traps that almost broke it."
---

> *Draft.*

The legacy platform had ~25% backend test coverage. Three weeks later it had 100% on the BusinessLogic layer. Not by hiring, not by mandating, not by sprint goals. By an **agent-driven test-generation queue** running mostly overnight.

This is what the queue looks like, what it generated, and what it got wrong.

## The pipeline

```
init-test-queue.ps1
    │
    ▼
next-class-to-test.json   ← single-source-of-truth queue
    │
    ▼
[ Claude pulls one class ]
    │
    ├── reads the class + its dependencies
    ├── reads existing tests in the same suite
    ├── reads coverage report for the class
    ▼
[ generates tests targeting uncovered branches ]
    │
    ▼
[ runs suite ]
    │
    ▼
test-generation-log-YYYY-MM-DD.txt
    │
    ▼
test-generation-state.json   ← updated, queue advances
```

Per-class. Per-session. Resumable. Inspectable.

## The four traps

**Trap 1: Coverage chasing meaningless code.** Trivial DTO accessors. Auto-properties. Generated code. The agent will happily test them. The fix: explicit ignore globs in `coverage.runsettings` *before* you start.

**Trap 2: Tests that test the implementation, not the behavior.** "When I call this method with these args, it sets this private field to 7." Useless. You catch it by reviewing — and by giving the agent a "behavior, not implementation" rule in the CLAUDE.md.

**Trap 3: Mocking everything until the test proves nothing.** A test that mocks the database, the cache, the message bus, and the logger asserts that your code calls things in an order. That's fine for some classes. For most, it's worse than no test.

**Trap 4: The agent gets stuck on hard classes.** ~10% of classes have weird DI shapes or hidden state. The agent will spin. We added a "skip after N attempts, log the reason, move on" rule. The hard ones became my todo list.

## What worked

- **One class per session.** The agent's context fits comfortably. No spillover.
- **The queue as the contract.** No "what should I test next?" conversations. Pull from the queue.
- **Coverage as the oracle.** The previous run's coverage report is the next run's input. Self-correcting.
- **Reviewing in batches.** Don't review per-class. Review per-day. Faster, less context-thrashing.

## What I'd do differently

- Add a "test quality" linter to the loop. Coverage alone is not enough.
- Track *which generated test caught a real regression*. That's the actual metric I care about.
- [TODO]

## The receipts

- `init-test-queue.ps1` — queue bootstrap
- `test-generation-state.json` — durable progress
- `test-generation-log-2025-10-21.txt` (and friends) — per-day logs
- `next-class-to-test.json` — current queue head

## When this approach is right

When you have:
- A large untested codebase
- Reasonably-shaped classes (not God objects)
- A working build + coverage report
- Patience to review

When it's wrong:
- Test debt is symptomatic of design debt — fix the design first
- The codebase is small enough to test by hand
- You can't review the output

## Numbers

- [TODO]: classes processed
- [TODO]: classes skipped
- [TODO]: false-positive (bad-test) rate
- [TODO]: real regressions caught post-merge
