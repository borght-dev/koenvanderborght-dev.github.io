---
title: "One-Click Auto-Fix: Wiring BorgDock into Claude Code"
seriesId: borgdock
episode: 4
draft: true
summary: "How BorgDock spawns Claude Code in the right worktree with the right prompt — and what I deliberately don't automate."
---

> *Draft.*

## The flow

Failing PR → click "auto-fix" → BorgDock:

1. Detects which worktree corresponds to the branch
2. Drops a prompt file with the failing log + the relevant test
3. Spawns `claude --print` in that worktree
4. Streams output into a panel

## The prompt template

```
The CI step `{step}` failed with:

{log_excerpt}

Fix the failing test in {file_path}. Do not skip the test. Do not change the assertion.
```

## What I don't automate

- Merging
- Force-pushing
- Anything in `main`

## The trust boundary

...
