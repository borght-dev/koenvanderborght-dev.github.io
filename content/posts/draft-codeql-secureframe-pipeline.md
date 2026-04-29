---
title: "Daily CodeQL on a hybrid .NET / portal monorepo"
subtitle: "Wiring up Secureframe-compliant security scanning that actually completes — and the iteration to scope it correctly."
date: 2026-04-02
draft: true
tags: [security, devops, ci]
description: "Building a daily CodeQL pipeline that finishes — including the iteration to carve out portals with embedded npm builds, and what 'compliance-ready' actually means."
---

> *Draft. Scoping rules and war stories TBD.*

## The driver

<!-- TODO: Secureframe compliance, customer expectations, audit timing. Why this is non-optional, not nice-to-have. -->

## What "daily CodeQL" actually means

It's not a checkbox. It's an automation contract:

- **Scheduled** — runs every day, regardless of PR activity.
- **Scoped correctly** — analyses what should be analysed, skips what shouldn't.
- **Always green-or-actioned** — a perpetually red scan is worse than no scan.
- **Audit-traceable** — output lands somewhere a compliance reviewer can see.

## The iteration

The path from "let's add CodeQL" to "it runs daily and finishes" took about a day of real iteration time but a *cluster* of small commits:

1. Initial pipeline against the platform build solutions.
2. Scope tightening, attempt 1.
3. Multiple in-flight scope fixes — embedded npm builds in portals were failing the whole job.
4. PR-trigger disabled (was retriggering the entire daily run on every PR).
5. Frontend builds explicitly skipped where they didn't add scan value.
6. Portals reintegrated once the scope rules were stable.
7. Final settle: platform-only on the daily, portals on a separate cadence.

<!-- TODO: distill this into 3-4 lessons. The right unit of "what to scan" is not the repo, it's the build solution. -->

## Lessons

<!-- TODO: candidates: -->
- *Scope before schedule.* Adding `cron:` before scope-ing turns a security tool into a pager.
- *PR triggers and scheduled runs are different jobs.* Don't combine them into one workflow.
- *Embedded build systems make CodeQL miserable.* Carve them out unless you need the coverage.
- *Compliance is a relationship, not a button.* Secureframe wants evidence, not just a passing badge.

## What's still on the list

<!-- TODO: future work — secret scanning, dependency review, SAST/DAST split. -->
