---
title: "Plan-Driven Development with Claude: 11 Plans, 80+ Tasks, One Feature"
seriesId: fsp-horizon
episode: 5
draft: true
summary: "How we run major feature work as numbered plans against numbered tasks, with Claude as the executor — and how that structure makes a tech lead's job stop being about reading every diff and start being about writing every plan."
---

> *Draft.*

The Ortec integration shipped as **eleven numbered plans**. Each plan had between 5 and 30 numbered tasks. Each task became one or more commits with a label like `Plan 8 Task 13 — IOrtecSchedulingGate (per-tenant feature flag)`.

This isn't a methodology I read about. It's what fell out of trying to drive a full-stack feature with Claude in the loop and stay sane.

## Why numbered plans

Claude is great at executing well-specified work. It is bad at deciding what work to do. The plan is **the human's contribution**.

If I write the plan, every commit is on-rails. If I don't, every commit is a coin flip.

## Anatomy of a plan

A plan file lives in `plans/ortec-plan-N-shorthand.md`. It looks like:

```markdown
# Plan 8: Core ↔ Worker Routing for Ortec

## Why
Currently every Ortec event goes via [...]. This becomes a bottleneck at [...].

## Acceptance
- All 4 record types route through Worker → Core
- DLQ tested for each handler
- Per-tenant feature flag honored before any external call

## Tasks
1. Define ITenantScopedIntegrationMessage
2. Route OptimizationCancellationRequested (Core → Worker)
3. ...
13. IOrtecSchedulingGate (per-tenant feature flag)
14. ...
```

## What Claude does well

- Implements a single task end-to-end including tests
- Refactors a single task's diff after a review comment
- Writes the migration script for a task that needs schema changes

## What Claude doesn't do

- Decide whether a task should exist
- Decide the task's order
- Notice that two tasks are secretly the same task

That's still my job. **Plan-writing is the load-bearing skill now.**

## How long does a plan take to write

Twenty minutes to two hours, depending on novelty. The two-hour ones save days. The twenty-minute ones save the same week of confusion that an unspecified task would cost.

## How long does a task take to execute

Fifteen minutes to two hours of Claude time, plus my review. **My review is the slowest step.** That's the right ordering.

## What changed in my day-to-day

| Before | Now |
|---|---|
| Wrote code in the IDE all day | Write plans in markdown all day |
| Reviewed PRs after the fact | Review tasks as they ship |
| "What do you want me to do?" → meetings | "Read Plan 8" → done |
| Lost context across days | Plan file *is* the context |

## What changed for the team

Junior engineers can pick up a numbered task and ship it. The plan is the spec, the test list, and the review checklist. They're not parsing a Jira ticket from a half-remembered conversation.

## Things I'd warn other tech leads about

- **A bad plan is worse than no plan.** Claude will execute a wrong plan flawlessly. Take time to write the plan.
- **Tasks should be the size of one PR.** "Implement multi-tenancy" is not a task. "Add `TenantId` filter to `RecurringSchedulerRequest`" is.
- **Don't skip the "why" line.** Six months later you'll wonder, and so will the reviewer.

## What's next

[TODO: link to the Slash Commands as Team Vocabulary post once it's not a draft — `/interview-plan` is how I sanity-check plans before writing them]
