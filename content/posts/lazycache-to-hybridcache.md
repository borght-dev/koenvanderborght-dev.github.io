---
title: "From LazyCache to HybridCache, the Diff That Wasn't"
subtitle: "Migrating a hot-path cache layer to .NET's new HybridCache primitive without rewriting the call sites"
date: 2025-12-29
draft: true
tags: [dotnet, caching, refactor]
description: "Why HybridCache replaced LazyCache for our GanttConfigCacheService — and how we did it without touching a single caller."
---

> *Draft.*

`GanttConfigCacheService` is one of the hottest cache paths in the platform. Every planboard render hits it. So when .NET 9 shipped `HybridCache`, the question wasn't *whether* to migrate — it was *how cheap* the migration could be.

Answer: cheap enough that no caller knew.

## What LazyCache gave us

- Simple `GetOrAdd` semantics
- Memory-only
- Battle-tested

## What HybridCache adds

- Two-tier (L1 in-memory, L2 distributed) without rewriting
- Stampede protection at the primitive
- Tag-based invalidation
- First-class cancellation

## The migration

The cache service exposed:

```csharp
public Task<GanttConfig> GetForTenantAsync(Guid tenantId);
public Task InvalidateForTenantAsync(Guid tenantId);
```

Internally it called LazyCache. We swapped LazyCache for HybridCache **without touching the public methods** — which means no caller had to change.

```csharp
// Before
public Task<GanttConfig> GetForTenantAsync(Guid tenantId)
    => _appCache.GetOrAddAsync($"gantt:{tenantId}", () => Load(tenantId));

// After
public Task<GanttConfig> GetForTenantAsync(Guid tenantId)
    => _hybrid.GetOrCreateAsync(
        $"gantt:{tenantId}",
        async ct => await Load(tenantId),
        tags: new[] { $"tenant:{tenantId}" });
```

## The bonus we didn't ask for

`HybridCache`'s tag-based invalidation lets us blow away every tenant-scoped cache entry with one call:

```csharp
await _hybrid.RemoveByTagAsync($"tenant:{tenantId}");
```

We were carrying a custom tag-tracker for this. Deleted.

## What I'd watch for

- HybridCache is sensitive to serializer config when L2 is enabled. Double-check your default JSON contract.
- Don't use it for things you wouldn't put in a distributed cache, even if you only configure L1 today.

## Takeaway

When a primitive in your runtime gets better, sometimes the best diff is the one no caller sees.
