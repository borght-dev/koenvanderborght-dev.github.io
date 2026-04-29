---
title: "Rewriting a hot-path stored procedure to C# behind a feature flag"
subtitle: "Replacing a load-bearing T-SQL procedure with a typed, testable, profilable .NET implementation. Quietly."
date: 2026-01-02
draft: true
tags: [perf, dotnet, sql-server]
description: "Why we moved a hot-path stored procedure into application code, how the feature flag kept the rollback path open, and what the perf delta looked like in production."
---

> *Draft. The war story is yours to write.*

## The starting point

<!-- TODO: paint the situation. A hot path, hand-tuned over years, opaque to most of the team, hard to profile, harder to test. The kind of stored proc that gets blamed in every perf incident. -->

## Why move it to C#

<!-- TODO: argue the move. -->
- *Profilability* — application-side traces beat SQL Profiler for cause-and-effect.
- *Testability* — a stored proc has no unit tests, only integration ones.
- *Composition* — once it's C#, it can call into other services, cache, batch, parallelise.
- *Refactorability* — strong types catch what `varchar`s let through.

## How I shipped it without scaring anyone

The cardinal rule: **rollback in one switch flip**.

- Feature flag controls whether the request goes to T-SQL or C#.
- Both implementations target the same input/output contract.
- Side-by-side comparison harness in dev: same input, both paths, diff the result.
- Roll out internal first. Then a single tenant. Then opt-in. Then default-on.

<!-- TODO: anecdote — the diff harness catching a behavioural drift the test suite missed. -->

## The numbers

<!-- TODO: latency before/after, p95, throughput. Memory footprint. Database CPU saved. -->

## What surprised me

<!-- TODO: candidates: -->
- The C# version isn't trivially faster — but it's *predictably* fast. Variance dropped.
- Reading the T-SQL line by line *in order to port it* was the actual perf win. Found dead branches.
- The feature flag stayed on for longer than expected — the comfort it bought made the next decision lighter.

## What I'd do differently

<!-- TODO: lessons learned. -->
