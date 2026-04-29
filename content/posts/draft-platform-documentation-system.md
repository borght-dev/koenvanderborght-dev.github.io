---
title: "Scripting platform documentation"
subtitle: "How to document a 7-year-old codebase in three weeks — without sitting at a keyboard."
date: 2025-11-14
draft: true
tags: [ai-native, docs, claude-code]
description: "An automated documentation system that traverses a large .NET codebase and produces navigable, sidebar-organised reference docs for every component, repository function, and stored procedure."
---

> *Draft. Narrative TBD.*

## The problem

<!-- TODO: nobody has time to write platform docs by hand. Existing docs go stale faster than they're written. New hires onboard by reading source. The team had been quietly accepting this for years. -->

## The system

A "documentation factory" stitched together from:

- **A traversal layer** that walks the codebase and produces a worklist of components.
- **A generator** that produces docs per component with a fixed shape: purpose, surface, dependencies, edge cases.
- **A sidebar reorganiser** that keeps the navigation coherent as new docs land.
- **Playbooks** so the next person can extend the system without inventing a new pipeline.

<!-- TODO: emphasise that the *shape* of a doc was decided once, up front. Generation became boring after that. Boring is the goal. -->

## The numbers

In a focused three-week stretch, the system covered:

- Most user-facing components.
- Most server-side components, including services and APIs.
- Hundreds of repository functions and stored procedures.
- A reorganised sidebar split along *user-facing* vs *server-side* axes.
- A "how to add a doc" playbook so the system is self-perpetuating.

<!-- TODO: replace the qualitative blurbs with whatever level of specificity feels comfortable. Counts can stay vague. -->

## What worked

<!-- TODO: -->
- *Treat docs as a build artefact, not a side activity.*
- *Pin the shape of a doc before generating any.* Consistency > completeness.
- *Reorganise the sidebar in the same PRs as the docs land.* Otherwise discoverability rots before the docs do.
- *Playbooks beat prompts.* A teammate can extend the system without reading my mind.

## What didn't work the first time

<!-- TODO: pitfalls. Hallucinated behaviour the source didn't actually have? Missing edge cases that real readers caught? When did automation fail and need a human? -->

## What's left

<!-- TODO: stored procedure behaviour diffs, ADR-style decisions, runbook entries. -->
