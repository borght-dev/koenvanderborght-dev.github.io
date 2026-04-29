---
title: "SOAP → Internal API: The Migration Plan"
subtitle: "Writing a comprehensive migration plan for replacing a 47-endpoint SOAP layer with an internal API, before writing a single line of code"
date: 2026-01-03
draft: true
tags: [migration, planning, dotnet, api]
description: "Why I spent two weeks writing a migration plan instead of starting the migration — and what went into the plan that mattered most."
---

> *Draft.*

Before we wrote a single line of replacement code for our SOAP layer, I spent two weeks writing the migration plan. That sounds like procrastination. It wasn't. The migration is too big to start without one.

This is what's in the plan and why.

## The starting point

- 47 SOAP endpoints
- Hundreds of internal callers across mobile, mid-office, portals
- A handful of *external* callers we don't fully control
- Decades of accumulated quirks ("this endpoint returns an empty string instead of null because Customer X parses XML weirdly")

## The plan in shape

- **Inventory.** Every endpoint, every caller, every quirk.
- **Replacement contract.** What the internal API looks like. Versioned. Typed. No surprises.
- **Compatibility shim.** A SOAP→Internal proxy so we can flip callers one at a time, not all at once.
- **Cutover sequence.** Which callers move first, which last, why.
- **Rollback story.** What we do when caller N starts misbehaving in prod.
- **Sunset window.** When the SOAP layer dies. With a date.

## The compatibility shim is the linchpin

Without a shim, this is a flag day. With a shim, it's a slow migration:

```
[ SOAP caller ] ──▶ [ SOAP endpoint ] ──▶ [ Internal API ] ──▶ [ Logic ]
                              ▲                    ▲
                              │                    │
                              shim               new code
```

Old callers see SOAP. New callers see the internal API. They both end up calling the same logic. No flag day.

## Why two weeks of planning, not one

Endpoint #34 has a quirk. If you don't know about it before you write the replacement, the replacement is wrong. The plan is where you find #34 — and #5, and #21.

## The acceptance criteria for "done"

- All 47 endpoints have an internal API equivalent
- Every internal caller is on the internal API
- Every external caller has been notified, given a date, and migrated where possible
- The SOAP layer has been *deleted* (not "deprecated", deleted) by the sunset date

## What I'd warn other teams about

- **Inventory is not optional.** Skipping it makes the plan a wish list.
- **The shim is not optional either.** A flag-day migration of 47 endpoints across hundreds of callers is a near-guaranteed outage.
- **Sunset dates are not optional either.** Without one, the SOAP layer lives forever.
- **External callers are the slow path.** Plan for them like a separate project.

[TODO: link to follow-up post when the migration actually ships]
