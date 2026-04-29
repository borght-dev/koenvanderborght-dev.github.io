---
title: "Retrofitting multi-tenancy into a long-lived platform"
subtitle: "Audit logs, non-tenanted tables, identity boundaries, and the long tail of `organisation_id`."
date: 2025-11-19
draft: true
tags: [architecture, multi-tenancy, dotnet]
description: "What it actually takes to retrofit organisation-scoped data into a platform that wasn't designed for it — and why the next-generation platform is multi-tenant from commit one."
---

> *Draft. The architecture story is yours to write.*

## The premise

<!-- TODO: short framing — the platform started effectively single-tenant. Multi-tenancy is being retrofitted. The shape of "tenancy" turns out to be more nuanced than `organisation_id` everywhere. Each fix surfaces another assumption. -->

## The classes of work

Three distinct retrofits, each its own pattern:

### 1. Tenant-scoped queries with non-tenanted exceptions

The audit logger had to learn that not every table has an `organisation_id`. The fix: an explicit allow-list of non-tenanted tables, instead of a global filter.

<!-- TODO: name the table classes that broke this — at the conceptual level. Reference data? Cross-tenant infrastructure tables? -->

### 2. Identity boundary work

A new internal identity API for **promote/demote** in the customer portal. Tenancy isn't just about *which* records belong to whom — it's about *who can change role assignments* without crossing boundaries.

<!-- TODO: explain the promote/demote case. What was the security risk before? -->

### 3. Custom field & layout isolation

Custom fields and layout visibility flags leaking across organizations during import/export. The kind of bug you only find by acting like a multi-tenant user.

<!-- TODO: short anecdote. Was this caught by a customer or by automated tests? -->

## Why "multi-tenant from commit one" matters for the next platform

<!-- TODO: this is the natural ending. The retrofits are receipts for why the next platform is built differently. Specifics: -->
- A single `TenantContext` injected at the API boundary.
- All repositories are tenant-scoped by default; opt-out is explicit.
- Audit + identity treat tenancy as a first-class type, not a column.

## What I'd warn anyone retrofitting

<!-- TODO: lessons. Candidates: -->
- *The audit log is where tenancy bugs go to hide.*
- *Import/export is a multi-tenancy stress test.* Round-trip a layout from tenant A to tenant B and watch the leaks light up.
- *"Just add `organisation_id`" is the easy 80%. The other 20% is reference data, identity, and cross-cutting infra.*
- *Test users have to be cheap to spawn.* Otherwise no one tests across boundaries.
