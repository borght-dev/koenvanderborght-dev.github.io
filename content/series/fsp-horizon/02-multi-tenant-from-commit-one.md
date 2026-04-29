---
title: "Multi-Tenant from Commit One"
seriesId: fsp-horizon
episode: 2
draft: true
summary: "How we made tenant scoping a type-system concern instead of a runtime one — across the message bus, the DbContext, and the cache layer — so it's impossible to forget."
---

> *Draft.*

Multi-tenancy retrofit horror stories are real. The way you avoid them is to make tenant scoping a *compile-time* problem, not a runtime one.

Five months in, we have **35 tenant-themed commits** and zero tenant-bleed bugs. Here's the shape that got us there.

## The non-negotiables

- Every persisted row knows its tenant
- Every cache key includes its tenant
- Every integration message carries its tenant
- It is a **compile error** to write code that forgets

## The contracts

```csharp
public interface ITenantScopedIntegrationMessage
{
    Guid TenantId { get; }
}
```

Every Core→Worker and Worker→Core record implements this. Routing code is generic over `T : ITenantScopedIntegrationMessage` — you literally can't enqueue a message without a tenant.

[TODO: snippet from contracts/ — 4 records pattern]

## The DbContext layer

We register tenant filters at `OnModelCreating` for every entity that has a `TenantId`. The filter pulls from an `ITenantContext` resolved per-request (or per-message in worker land).

```csharp
modelBuilder.Entity<Order>()
    .HasQueryFilter(o => o.TenantId == _tenantContext.CurrentTenantId);
```

A single `IsActive` + `TenantId` filter on `RecurringSchedulerRequest` — the kind of thing you forget once and regret for a year.

## The worker side

Worker handlers receive `ITenantScopedIntegrationMessage`. We bind a per-message tenant scope **before** any handler runs:

[TODO: snippet from worker DI / scope binding]

## The cache layer

We migrated from LazyCache to HybridCache mid-stream (separate post). The tenant goes in the cache key, always. Helper methods make it impossible to construct one without:

[TODO: snippet]

## What we don't do

- We don't trust the request. Tenant id comes from the **token**, not a header or a route.
- We don't share caches across tenants. Sharing is the whole class of bugs.
- We don't have a "system" tenant for jobs. Background jobs sweep tenants explicitly (see Episode 3).

## What this cost us

- ~2 weeks of upfront design before any feature work
- A handful of refactors when assumptions shifted
- A junior dev's "but it'd be faster to just…" conversation, twice

## What it bought us

- Zero tenant-bleed incidents in five months
- A new feature defaulting to the right scope without me reviewing for it
- Sleep
