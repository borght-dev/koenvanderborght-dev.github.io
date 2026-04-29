---
title: "When Two Pipelines Are Better Than One"
subtitle: "Why we separated our mobile pipeline from the platform pipeline — and what that bought us in CI time and review attention"
date: 2026-01-07
draft: true
tags: [ci, devops, azure-pipelines]
description: "We had one pipeline for everything. Then we didn't. Here's why splitting mobile and platform was the right call."
---

> *Draft.*

For years our Azure DevOps pipeline built and tested everything in one shot: mobile client, web portals, mid-office, services. One YAML, one queue, one timeout.

In January we split it. Mobile got its own pipeline. The platform kept the rest.

## Why it was tempting to keep one pipeline

- One place to look
- Shared cache
- Shared variable groups
- "It already works"

## Why we split

- **Mobile changes shouldn't trigger platform builds.** Most of our PRs touch one or the other, not both.
- **Pipeline timeouts hurt mobile most.** Long platform tests were starving the mobile signal.
- **Coverage attribution was fuzzy.** Combined coverage reports made it hard to see if mobile coverage was *actually* improving.
- **Review attention.** Reviewers stopped looking at the mobile job because most failures were elsewhere.

## What broke when we split

- **Coverage merge** had to be redone. It used to be a single artifact; now it's two and we needed a merge step.
- **Shared variable groups** silently scoped wrong twice before we caught it.
- **The deploy pipeline** had to pull from two sources; the trigger graph got noisier.

## The fix order

1. Split the build pipelines (the easy part)
2. Re-do the coverage stitching (#377)
3. Update deploy pipeline to consume both artifacts
4. Update branch protections so the right pipeline gates the right path
5. Delete the dead code in the old combined pipeline

## What it bought us

- **Mobile signal is fast again.** A typo in a mobile test fails in minutes, not the wrong color of an hour.
- **Platform reviews focus on platform.** Mobile reviews focus on mobile.
- **Coverage attribution is honest.** We can say "mobile is at X%, platform is at Y%" and mean it.

## What I'd tell another team

If your pipeline file has more `condition:` blocks than steps, you're probably running two pipelines pretending to be one.
