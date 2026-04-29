---
title: "Aspire Gotchas at Scale: The Pile of Papercuts"
seriesId: multi-worktree-dotnet
episode: 2
draft: true
summary: "WithHttpEndpoint, ASPNETCORE_URLS overrides, RabbitMQ wiring, JWT issuer + service discovery — every Aspire papercut I hit running multi-worktree."
---

> *Draft.*

## Gotcha 1: Missing WithHttpEndpoint

If you don't call `.WithHttpEndpoint()` on a project resource, Aspire never overrides `ASPNETCORE_URLS` on the child. Result: the child binds to its own default port and the orchestrator can't reach it.

## Gotcha 2: Connection strings injected under the resource name

```csharp
builder.AddSqlServerDatabase("horizon"); // NOT "Database"
```

Then in code: `builder.Configuration.GetConnectionString("horizon")`.

## Gotcha 3: RabbitMQ via Aspire

```csharp
var rabbit = builder.AddRabbitMQ("messaging").WithManagementPlugin();
api.WithReference(rabbit);
worker.WithReference(rabbit);
```

The management plugin is essential for debugging in dev — don't skip it.

## Gotcha 4: JWT issuer validation through service discovery

Auth.Api orchestrated under Aspire? Then `JwtBearerOptions.Authority` should resolve via service discovery, not be hard-coded.

## Gotcha 5: Port collisions between worktrees

Even with port allocation, Aspire's dashboard port is sticky. Solution: ...
