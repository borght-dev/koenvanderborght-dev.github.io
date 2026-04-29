---
title: "Migrating Ranorex to Playwright with Claude as Interpreter"
seriesId: ai-native-engineering
episode: 5
draft: true
summary: "Belmin's pattern: ask Claude to build a Ranorex parser, then port the scenarios. Why this beats writing tests by hand."
---

> *Draft.*

## The legacy

Ranorex tests in proprietary `.rxrec` / `.tcs` files. ~hundreds of scenarios. Manual port = months.

## The pattern

1. Ask Claude to write a Ranorex *interpreter* — code that reads the binary/XML and emits a structured scenario tree
2. Use that interpreter to extract every scenario into a JSON
3. Use a `/migrate-ranorex` slash command to port one scenario at a time

## Why this beats hand-porting

The interpreter has to be written *once*. The migration is then deterministic and reviewable per scenario.

## The interpreter, in outline

```python
# pseudo
def parse_rxrec(path) -> Scenario:
    ...
```

## What the migration command does

- Reads one Scenario JSON
- Produces a Playwright spec
- Runs it
- If it fails, reports the gap (often: a Ranorex-specific timing assumption)
