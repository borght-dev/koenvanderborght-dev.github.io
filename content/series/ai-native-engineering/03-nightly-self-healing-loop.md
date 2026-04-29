---
title: "The Nightly Self-Healing CI Loop"
seriesId: ai-native-engineering
episode: 3
draft: true
summary: "launchd + a dedicated worktree + /fix-e2e-nightly = a Claude agent that wakes up at 09:30, fixes the previous night's failures, opens a PR, and goes back to sleep."
---

> *Draft. This is the flagship piece — write this one with care.*

## The setup

- A dedicated git worktree: `.worktrees/e2e-nightly-fixer`
- A "home" branch pinned to `origin/main`: `e2e-nightly-fixer-home`
- A launchd plist: `~/Library/LaunchAgents/com.user.fsp-e2e-nightly-fixer.plist`
- Fires at 09:30 every weekday
- Runs: `/bin/zsh -lc 'claude -p "/fix-e2e-nightly"'`

## The slash command

`/fix-e2e-nightly`:

1. Pulls latest `main` into the worktree
2. Reads the previous night's E2E run results
3. For each failing spec, applies `/fix-e2e --once`
4. Opens a PR per fix, with the failing log embedded in the description

## What can go wrong

- The AI fixes the test by weakening the assertion → caught by review
- The AI fixes a flaky test that wasn't actually broken → caught by re-run
- The AI runs out of budget → caught by daily cost cap

## The numbers

- Cost per night: ~$X
- PRs opened per week: ~Y
- Merge rate: ~Z%
- Mean time to merge: ~hours

## What this means

Nightly maintenance work that used to take a developer an hour every morning is now done before they sit down.
