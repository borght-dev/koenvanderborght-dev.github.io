---
title: "From Worktree to Deployment in One Command"
seriesId: multi-worktree-dotnet
episode: 3
draft: true
summary: "How a feature in .worktrees/feature-x becomes a deployment to Online TST without leaving the terminal."
---

> *Draft.*

## The pipeline

1. Branch on a worktree
2. PR via `gh pr create` (with the right account selected)
3. Azure DevOps build kicked by the merge to `main`
4. Auto-deploy to Online TST
5. Auto-deploy to Online Acceptance after smoke tests
6. Manual gate to Production

## The Workflows-bot signal loop

Teams channel posts every successful deploy. Subtle, but it's the heartbeat that tells you a worktree's work landed.

## What I'd change

- ...
