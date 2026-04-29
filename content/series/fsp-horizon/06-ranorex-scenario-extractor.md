---
title: "The Ranorex Scenario Extractor: Turning Legacy Test Scripts into Playwright"
seriesId: fsp-horizon
episode: 6
draft: true
summary: "We had hundreds of Ranorex test scenarios. The new platform doesn't run Ranorex. Rather than rewrite by hand or dump them, I built an extractor: parse the Ranorex repository structure into structured scenarios, then let Claude regenerate them in Playwright."
---

> *Draft.*

Migrating from Ranorex to Playwright is mostly *not* a tooling problem. It's a **scenario problem**: hundreds of recorded interactions, each with their own selectors, waits, and oracle conditions, none of which translate cleanly.

Hand-rewriting was a multi-month estimate. Dumping them was a multi-year regression risk. The third option turned out to work: extract them into a normalized format, then have Claude regenerate them in Playwright with full context.

## What the extractor does

```
.rxrec / .rxtst files
        │
        ▼
[ structural parse ]   ← the part you can't fudge
        │
        ▼
scenario.json
{ id, name, steps: [ { kind, selector, value, expected } ] }
        │
        ▼
[ Claude prompt with scenario + Playwright conventions ]
        │
        ▼
playwright.spec.ts
```

The extractor itself is pure parsing — no AI involved. That's deliberate. **If the extractor is wrong, every regenerated test is wrong.** Determinism matters here.

## The structured-scenario format

Why a normalized intermediate?

- Ranorex's selectors don't survive the migration. We normalize to logical step kinds: `click`, `type`, `wait`, `assert`, `navigate`
- Selectors get re-resolved against the new UI's conventions (data-testid)
- The intermediate format is **reviewable** — I can read a scenario.json before Claude touches it

## What Claude does

For each scenario, Claude receives:

- The structured scenario
- A snippet of the new UI's testing conventions (`data-testid` patterns, fixture structure)
- A handful of "good" handwritten Playwright tests as examples

It produces a Playwright test that's 90% right. I review and ship.

## Where Claude struggles

- **Implicit timing.** Ranorex tests often have hidden waits we never noticed. Playwright is unforgiving here.
- **Multi-window flows.** Cross-frame / cross-window scenarios need explicit handling.
- **Data setup.** "Click order #4321" assumes a seed. We had to add seed orchestration to make tests reproducible.

## The seed problem deserves its own post

Ranorex tests ran against a manually-maintained test environment. Playwright + CI requires deterministic seeding. We built a seed fixture system that's halfway between an integration test fixture and a content snapshot.

[TODO: link to seed-system post when written]

## Numbers

- [TODO]: scenarios extracted
- [TODO]: scenarios regenerated
- [TODO]: scenarios manually-fixed-up rate

## What I'd tell another team starting this

- **Build the extractor first.** Don't generate before you can see the structured input.
- **Keep the LLM out of parsing.** Determinism beats cleverness.
- **The intermediate format is the contract.** Treat it as a real artifact you'd commit and review.
- **Don't migrate flaky tests. Drop them.** Migration is a chance to leave bad tests behind.

## What I'm still figuring out

[TODO]
