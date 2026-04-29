---
title: "The Ortec Integration: 4 Sync Runners, 1 SignalR Live Store, 0 Cron Jobs"
seriesId: fsp-horizon
episode: 3
draft: true
summary: "Integrating with Ortec's scheduling optimizer across hundreds of tenants without a single cron job — using BackgroundService runners, OAuth pre-warming, per-tenant gates, and a SignalR live store that bridges to the UI via Zustand."
---

> *Draft.*

Ortec is a scheduling optimization vendor. We push them work; they push back optimized timeslots. Easy on paper. The actual integration spans **four background runners, two webhook listeners, a per-tenant feature gate, an OAuth token pre-warmer, and a SignalR live store** — with zero cron jobs.

This is the architecture, not the marketing version.

## The shape

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Worker    │◀────▶│    Core     │◀────▶│   Client    │
│             │ msg  │             │ http │             │
│  4 runners  │      │  routing    │      │  Zustand    │
│  2 webhooks │      │  + SignalR  │      │  live store │
└─────────────┘      └─────────────┘      └─────────────┘
       │                                          ▲
       ▼                                          │
   Ortec API                                      │
       │                                          │
       └────── webhook callbacks ─────────────────┘
```

## The four runners

Per tenant, every five minutes, a `BackgroundService` runs:

| Runner | Responsibility | Why a runner instead of a cron |
|---|---|---|
| `ResourceSyncRunner` | Three-phase tenant sync | Failure classification, retries, per-tenant isolation |
| `ActivitySyncRunner` | Two-pass tenant sync (Task PUT + ShiftActivities PUT) | Order matters; cron can't express that cleanly |
| `RealizationSyncRunner` | Per-tenant sweep + PUT + 409 idempotent | Need fine-grained backoff per tenant |
| `TokenRefreshPeriodicJob` | OAuth pre-warm every 1 minute | API failures from token expiry are unrecoverable mid-batch |

Each runner extracts an `IRunner` interface so it's unit-testable without spinning the host. Don't skip this.

## Two-pass tenant sync

The pattern that made the most difference: **classify failures explicitly, retry within a pass, surface unrecoverable failures upstream.**

```csharp
public enum SyncFailureClass
{
    Transient,      // retry next pass
    Permanent,      // alert, don't retry
    DataConflict,   // 409 — already processed, ignore
    Unauthorized    // refresh token, retry
}
```

[TODO: snippet from `ResourceSyncRunner.ClassifyFailure`]

## The token pre-warmer

We hit Ortec's OAuth endpoint **proactively, every minute** instead of reactively when a token expires. This sounds wasteful. It isn't:

- Reactive expiry = mid-batch failure = retry storm
- Pre-warm = always have a fresh token = batches always finish

The cost is one trivial HTTP call per minute per tenant. The benefit is **predictable batch behavior**.

## SignalR live store

When a webhook reports `TimeslotsCalculated`, the worker:

1. Writes to DB
2. Publishes a Core-bound integration message
3. Core routes to a `BookTimeslotCompletedConsumer`
4. Consumer publishes via SignalR to the right tenant's clients
5. The React client's `useTimeslotsLiveStore` (Zustand) merges the update

The Zustand bridge keeps prop-drilling out of it: components that need timeslots subscribe to the store, not to SignalR directly.

[TODO: code snippet for `useTimeslotsLiveStore`]

## Per-tenant gating

Not every tenant has Ortec. We added `IOrtecSchedulingGate` so the runners no-op for tenants that don't:

```csharp
public interface IOrtecSchedulingGate
{
    bool IsEnabledFor(Guid tenantId);
}
```

This is feature-flag plumbing, but at the right granularity: **per-tenant**, not per-build.

## What I'd do differently

- [TODO]

## What's next

A spinoff post on `SingleShiftResolver` — a worker-side validator that catches a class of integration mistakes before they ever leave our system.
