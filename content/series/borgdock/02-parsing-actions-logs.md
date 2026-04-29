---
title: "Parsing GitHub Actions Logs to Surface Root Causes"
seriesId: borgdock
episode: 2
draft: true
summary: "GitHub gives you logs. BorgDock gives you the failing line. The pattern matching, the tree-sitter grammars, and the heuristics that work."
---

> *Draft.*

## The naive approach

`grep -i "error"` on the raw log. Useless — too many false positives.

## What actually works

1. Strip ANSI + GitHub Actions framing
2. Detect language per step (`dotnet`, `npm`, `pytest`, …)
3. Apply a language-specific extractor (regex or tree-sitter grammar)
4. Surface the *first* real error, not the last (the last is usually the runner's exit message)

## Tree-sitter for stack frames

Why I use WASM tree-sitter for parsing C# stack traces and JS error frames.

## Heuristics

- Demote "warning" lines unless `-W error`
- Promote any line containing a file path that exists in the worktree
- Collapse repeated frames

## What doesn't work

...
