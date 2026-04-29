---
title: "Auto-Cancelling Stale Claude Reviews on Merge"
seriesId: ai-native-engineering
episode: 6
draft: true
summary: "A small workflow, a big quality-of-life win. And what it taught me about event-driven AI plumbing."
---

> *Draft.*

## The small problem

Claude reviews open PRs. PR gets merged. The review is now stale — but Claude is still working on it, burning budget and producing irrelevant feedback.

## The fix

A GitHub Actions workflow on `pull_request` `closed`: if the PR was merged, send a cancel signal to any in-flight Claude review for that PR.

## The lesson: event-driven AI

Most AI tooling assumes pull (you ask, it answers). Production engineering needs push: events trigger AI runs, events cancel them.

## Other plumbing in the same shape

- Cancel `/fix-e2e-nightly` if a manual fix landed first
- Cancel `/migrate-ranorex` for a scenario if the source was deleted
- Cancel anything if the budget cap hits

## The architecture

```
GitHub event → webhook → cancel-token store → Claude SDK respects cancel
```
