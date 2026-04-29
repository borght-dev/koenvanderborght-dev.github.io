---
title: "Four perf wins in four days"
subtitle: "When you stop chasing the latest framework and start staring at flame graphs again."
date: 2025-12-26
draft: true
tags: [perf, dotnet]
description: "A focused four-day sprint on a critical scheduling surface: parallel filters, smarter resource hierarchy, an early-return scheduler load, and one stored procedure rewritten to C#. What each fix actually did, and why."
---

> *Draft. Commentary needs your voice.*

## Setup

<!-- TODO: why this surface specifically. Was it user complaints, telemetry spikes, an internal demo? Set the stage. -->

Four days, four wins:

| Day | Surface | Move |
|-----|---------|------|
| Day 1 | Asset management page | Parallel queries + early return |
| Day 2 | Filter dropdowns | Parallel async loads |
| Day 2 | Scheduling index page + resource hierarchy | Hot path optimisation |
| Day 2 | Scheduler data load | Early return + parallel fetches |
| Day 10 | A critical stored procedure | Stored proc → C# behind feature flag |

## What each one actually did

### Asset management page

<!-- TODO: what was the symptom? What was the actual fix? -->

### Filter dropdowns

<!-- TODO: classic N sequential queries → Task.WhenAll story. Mention what the dropdown was loading and why it took so long. -->

### Scheduling index + resource hierarchy

<!-- TODO: probably the meatiest. Why was the resource hierarchy slow? What did the fix change? -->

### Scheduler data load

<!-- TODO: early return + parallel fetches. The "fast path for the common case" pattern. -->

### Stored proc → C#

<!-- TODO: brief — full story is its own post. -->

## What the sprint taught me

<!-- TODO: -->
- *Perf bugs cluster.* Once one is found, the others are usually adjacent.
- *Sequential await is the most common .NET perf bug.* Still, in 2025.
- *Feature flags pay for themselves on the perf path too.* Roll back without rolling back.
- *A focused week beats a year of intermittent fixes.* Stack the wins so the user feels them.

## Telemetry

<!-- TODO: numbers. Even rough ones. p95 before/after, throughput, satisfaction signals if you have them. -->
