---
title: "Rules as Guardrails: Codifying Tribal Knowledge into Prompt Fragments"
seriesId: ai-native-engineering
episode: 2
draft: true
summary: ".claude/rules/frontend/no-networkidle.md and friends — turning 'we learned the hard way' into 'the AI knows.'"
---

> *Draft.*

## The pattern

Every time the AI generates code that violates a hard-won lesson, write it down as a rule:

```
.claude/rules/frontend/no-networkidle.md
.claude/rules/api/no-direct-controller-injection.md
```

## Example: no-networkidle

Playwright's `waitForLoadState('networkidle')` was causing flaky tests because background polling never goes idle. Rule: forbid it, point to the alternatives.

## How rules get loaded

Slash commands reference the rules they care about. The AI gets just the rules relevant to its current task — not 200KB of guidance.

## When a rule wins, when it loses

Rules are great for "don't do X." They're terrible for nuanced architectural choices.
