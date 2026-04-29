---
title: "Slash Commands as Team Vocabulary"
seriesId: ai-native-engineering
episode: 1
draft: true
summary: "/fix-e2e, /polish, /arewedone, /migrate-ranorex — the commands that became our shared language. Why we consolidated, what we deleted."
---

> *Draft.*

## The starting state

Everyone had their own prompts. Same task, different wording. Different results.

## The vocabulary

A small set of high-signal commands the whole team uses:

- `/fix-e2e` — fix the latest E2E failures (with `--once` for single-pass)
- `/polish` — clean up a generated PR before review
- `/arewedone` — ask: is this PR actually done, or is something hidden?
- `/migrate-ranorex` — port one Ranorex scenario to Playwright

## The consolidation

We had `fix-e2e.md` and `fix-e2e-once.md`. Merged into one with a flag. We had `rebase.md` (empty) and `review-architecture.md` (superseded). Deleted both.

Lesson: commands rot like code. Audit them.

## The naming convention

Verbs, not topics. `/fix-e2e` not `/e2e-fixer`.
