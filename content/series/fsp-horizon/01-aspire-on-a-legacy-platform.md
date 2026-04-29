---
title: ".NET Aspire on a 25-Year-Old Field Service Platform"
seriesId: fsp-horizon
episode: 1
draft: true
summary: "Why we picked Aspire for the rebuild — and what it actually buys you when the constraint isn't a greenfield demo but a quarter-century of business logic, customers, and integrations."
---

> *Draft.*

There are a thousand "why we picked .NET Aspire" posts. Almost all of them are written from a greenfield. This one isn't.

## The starting point

- Twenty-five years of accreted business logic on .NET Framework, then .NET 8, then .NET 10
- A handful of WCF / SOAP services, a few BizTalk orchestrations, a SQL Server schema with hundreds of tables
- Mobile clients, web portals, mid-office, installer pipelines — six top-level subsystems
- Customers who care about correctness, not novelty

What I was looking for in the new platform: **a service topology that's obvious from the dashboard**, not buried in DI containers and YAML.

## What Aspire actually gave us

- **The dashboard is the architecture diagram.** I've stopped maintaining one separately.
- **Service discovery without bespoke config.** Worker → Core routing is a `WithReference()` away.
- **Local dev that actually mirrors prod topology.** No more "works in dev, breaks in staging" service-discovery surprises.
- **OTel out of the box.** Spans across the worker → core boundary just appear.

## What it didn't help with (and never claimed to)

- **Multi-tenancy.** Aspire has no opinion. We layered our own (next episode).
- **Message contracts.** We adopted `ITenantScopedIntegrationMessage` ourselves.
- **Real production deployment.** Aspire is dev-time. Prod is still bicep / AKS / your-thing-here.

## The shape we landed on

[TODO: ASCII diagram of Core / Worker / Client + the integration boundaries]

## What I'd do differently

- [TODO]
- [TODO]

## Coming up

The next episode goes deep on tenancy: how we make sure no message, no query, no cache key ever forgets its tenant — at the type level.
