---
title: "An AI test generator that runs unattended"
subtitle: "Designing a coverage-driven unit-test factory for an aging .NET codebase."
date: 2025-10-22
draft: true
tags: [ai-native, testing, dotnet, claude-code]
description: "How a fully unattended test-generation system can chip away at coverage gaps overnight — and the queue/state machine that keeps it producing on its own."
---

> *Draft. Skeleton + facts; voice + war stories TBD.*

## The problem

<!-- TODO: set the stage. Years of code, weak unit-test coverage in places, manual generation per class is slow + boring + low-yield. AI assistance helps for individual tests but the bottleneck moves from typing to *deciding what to test next*. -->

## The shape of the solution

A small system that turns AI test generation into a **producer/consumer pipeline**:

- A **coverage report** that ranks the gaps.
- A **work queue** populated from those gaps.
- A **cursor** that points at the next target so the run is resumable.
- A **worker** that picks the next class, generates tests, runs them, advances the cursor only on green.
- **Durable state on disk** so a crash or context exhaustion never loses progress.
- A **runsettings contract** the generator targets — a single source of truth for "what counts."

<!-- TODO: explain why each piece exists. Especially the cursor/state — why durable state matters when an LLM session can blow up halfway through. -->

## The numbers

<!-- TODO: rough scale instead of exact counts if you want to stay generic. Things to consider mentioning: -->
- Run mode: queue → claim → generate → verify → commit → next.
- Throughput: hundreds of tests per overnight run, no human in the loop.
- Failure handling: red runs roll back automatically; the cursor doesn't advance.

## What it taught me

<!-- TODO: keep this as the section that justifies the post. Candidates: -->
- *The bottleneck isn't generation, it's selection.* Picking the next class is the hard part.
- *Durable state beats clever prompts.* Cursor + queue beat any "just keep going" instruction.
- *Verify-then-commit is non-negotiable.* If tests aren't green when committed, the loop poisons itself.
- *Generated tests are scaffolding, not bedrock.* Useful for refactor safety; less useful for behavior reasoning.

## Anti-patterns I avoided

<!-- TODO: things I deliberately didn't do — e.g. "don't ask the model to assess its own test quality", "don't generate tests for code about to be deleted", "don't skip the run step". -->

## What's next

<!-- TODO: where this evolves. Mutation testing? Coverage-aware refactor proposals? -->
