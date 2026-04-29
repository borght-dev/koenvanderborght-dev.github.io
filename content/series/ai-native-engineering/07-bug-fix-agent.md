---
title: "The Bug Fix Agent: Autonomous Bug Fixing While You Sleep"
seriesId: ai-native-engineering
episode: 7
draft: true
summary: "We built a Bug Fix Agent that runs against the platform overnight: triage open bug reports, propose fixes, write tests, push branches. Here's what it actually does — and what's still my job."
---

> *Draft.*

Last December I committed a directory called `.agent/` with about 1,400 files. That's the Bug Fix Agent: an autonomous AI loop that picks up bug reports overnight, proposes fixes, writes regression tests, and pushes branches by morning standup.

This is the post-mortem on why I built it, what it actually does well, and where the human is still load-bearing.

## What it does

```
1. Pull open bug tickets (priority filter)
2. For each: read the description + linked logs + recent related commits
3. Reproduce locally if possible (uses an instrumented test harness)
4. Propose a fix
5. Write the regression test that would have caught it
6. Run the suite
7. If green: push a branch, link to the ticket
8. If red: stop, write a "blocked" comment with what it tried
```

Step 7 is the magic. Step 8 is the saving grace.

## What it's good at

- **Symptom-level fixes.** Null reference exceptions, off-by-one, missing tenant filters, wrong default values.
- **Writing the regression test.** Almost always better than what I'd write — it knows exactly what triggered the bug.
- **Saying "I can't reproduce."** It refuses gracefully. Most agents oversell.

## What it's bad at

- **Architectural bugs.** "This whole subsystem races under load" — it'll fix the symptom you asked about and leave the root cause.
- **Bugs whose fix is in a different repo.** Cross-repo blast radius isn't its strength.
- **Politics.** Some bugs aren't bugs; they're disagreements about behavior. The agent will happily "fix" them.

## The control surface

I review every PR it opens. The agent doesn't merge. **The human in the loop is the merge button.**

When I see a Bug Fix Agent PR, my mental review is:

1. Is this actually the bug, or a symptom?
2. Is the regression test the *right* regression test?
3. Did it edit anything outside its lane?
4. Would I have written this differently — and does that matter?

If all four are clean, it's a single-click merge.

## What changed about my Monday morning

Before: triage queue → pick three → spend the day → ship one.
After: triage queue → most have a draft PR → review → ship most → spend the day on the hard ones.

**The hard ones get my full day.** That's the win.

## What I'm watching for

- **Regression-test quality drift.** If the agent's tests start passing without exercising the bug, the loop breaks silently.
- **PR sprawl.** Auto-PRs without auto-cleanup is a mess in two weeks.
- **Confidence calibration.** When it's wrong, it should *say* it's wrong. So far so good — but this is the failure mode I watch hardest.

## The receipts

- Folder: `.agent/` in the repo
- Logs: `.auto-claude/` per-session traces
- Output: PR labels `auto:bug-fix` so you can audit the rate

## What's next

[TODO]: A spinoff post on the regression-test-first style — that loop genuinely changed how I think about bug fixing.
