---
title: "Multi-Worktree .NET: Running 5 Aspire Apps in Parallel"
seriesId: multi-worktree-dotnet
tagline: "How a small PowerShell helper lets a tiny team work on 5 feature branches simultaneously without containerizing anything."
description: "A 3-part series on the multi-worktree workflow we run on FSP-Horizon: a PowerShell helper that allocates ports per worktree, the Aspire gotchas you hit at scale, and how the same setup feeds straight into deployment."
status: active
cadence: "weekly"
---

Most .NET teams I know test feature branches by stopping their main app, switching branches, restarting. We don't.

This series is the practical recipe for parallel feature-branch development with Aspire — and the gotchas you'll hit when you try.
