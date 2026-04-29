---
title: "Auto-Fixing Security Findings Overnight"
seriesId: ai-native-engineering
episode: 4
draft: true
summary: "Same pattern as the E2E loop, different worktree (security-nightly-fixer). What can be automated — and what should never be."
---

> *Draft.*

## The setup

`.worktrees/security-nightly-fixer` + `/fix-security-nightly`. Reads the latest security scan, opens a PR per finding.

## Auto-fixable

- Dependabot alerts with a clear upgrade path
- Hardcoded secrets in test fixtures (replace with env)
- Missing security headers in known middleware

## Never auto-fix

- Anything in auth code
- Anything that changes a public API surface
- Anything in production-deployment scripts

## The sandbox

The fixer runs with read-only access to production secrets, can only open PRs against feature branches, never directly to `main`.

## What I'd change

...
