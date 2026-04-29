---
title: "The PowerShell Helper That Runs 5 Aspire Apps Side-by-Side"
seriesId: multi-worktree-dotnet
episode: 1
draft: true
summary: "Run-FSPHorizon: port allocation per worktree, env injection, and the .worktrees/ convention."
---

> *Draft.*

## The convention

```
~/Dev/fsp-horizon/.worktrees/
  feature-quotes/
  feature-ortec/
  e2e-nightly-fixer/
```

Each worktree = one branch = one running instance.

## The helper

`Run-FSPHorizon` (PowerShell):

```powershell
function Run-FSPHorizon {
  param([string]$Worktree)
  # ... port allocation, env vars, dotnet run
}
```

## Port allocation strategy

- Hash the worktree name → base port
- Aspire dashboards on `base + 0`, Core.Api on `base + 1`, etc.

## What gets shared, what gets scoped

- Shared: SQL Server (one local instance, many DBs)
- Scoped: every HTTP port, every queue name, every cache key prefix
