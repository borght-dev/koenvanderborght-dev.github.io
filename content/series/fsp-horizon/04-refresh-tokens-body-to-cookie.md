---
title: "Refresh Tokens from Body to Cookie: A 12-Commit BFF Migration"
seriesId: fsp-horizon
episode: 4
draft: true
summary: "Walking the diff: how we moved the refresh token from a request body field to an httpOnly cookie, kept zero downtime during the rolling deploy, and rotated on tenant switch — all in twelve commits."
---

> *Draft.*

Our refresh token used to live in the request body. As of last week, it lives in an httpOnly `fsp_refresh` cookie. The migration took twelve commits, no downtime, and one rolling-deploy compatibility shim.

This is a step-by-step walk-through, not a thinkpiece.

## Why move

- Refresh token in the body = lives in app state = recoverable from XSS = bad
- `httpOnly` cookie = browser holds it, JS can't touch it, much smaller blast radius
- Tenant switch should rotate it, not reuse it
- Logout should clear it server-side

## The twelve commits

In order:

1. **`feat(auth): session cookie helper (fsp_refresh)`** — pure helper, zero behavior change
2. **`feat(auth): exchange-code issues fsp_refresh cookie, strips refresh_token from body`** — first place a cookie is set
3. **`feat(auth): refresh reads fsp_refresh cookie; body fallback preserved for rolling deploy`** — the compat shim. **This is the one that lets you ship without a global cutover.**
4. **`refactor(auth): refresh via fsp_refresh cookie, drop body token`** — cookie-only path becomes the default
5. **`feat(auth): silent refresh on app boot via fsp_refresh cookie`** — client picks it up on load
6. **`feat(auth): switch-tenant rotates fsp_refresh cookie`** — tenant change = new token, full rotation
7. **`feat(auth): POST /api/bff/logout clears fsp_refresh cookie`** — server-side clear
8. **`feat(auth): logout clears fsp_refresh via POST /api/bff/logout`** — client wires the call
9. **`refactor(auth): drop refresh_token arg from setAuth callers`** — consumers updated
10. **`refactor(auth): remove refreshToken from authStore persist shape`** — frontend store cleaned
11. **`feat(auth): session cookie for refresh token`** — final wrap-up commit on the issue
12. **TODO**: the post-rollout cleanup commit (remove the body fallback once all clients are on the new path)

## The rolling-deploy compat shim

The trick that made this zero-downtime is commit #3:

```csharp
public string ResolveRefreshToken(HttpRequest req, RefreshRequestBody body)
{
    // Prefer cookie, fall back to body for clients on older builds
    return req.Cookies["fsp_refresh"]
        ?? body?.RefreshToken
        ?? throw new UnauthorizedAccessException();
}
```

This stays in the codebase until **every client** has been refreshed past commit #2. Then commit #12 removes it. **Resist the urge to remove it early.**

## The tenant-switch rotation

When a user switches tenants, we issue a brand-new refresh token bound to the new tenant context. Old token is invalidated. This is non-obvious — most BFF examples skip it.

[TODO: snippet from switch-tenant handler]

## The cookie itself

```
Set-Cookie: fsp_refresh=<jwt>;
            HttpOnly;
            Secure;
            SameSite=Strict;
            Path=/api/bff;
            Max-Age=2592000
```

`Path=/api/bff` is deliberate — the cookie isn't sent on any other route, including the SPA shell. Smaller surface = smaller risk.

## What this didn't fix

- CSRF — separate concern, separate token
- Session hijacking via stolen cookie — that's still possible; cookie theft is a different threat model

## What I'd watch for

- Cookie not being cleared on logout (test it)
- Cookie not being rotated on tenant switch (test it)
- Body fallback shim left in too long (delete it)

## Takeaway

Twelve focused commits, each reviewable in 30 seconds. The compat shim is the linchpin. If you're contemplating a similar migration: **find your shim first, then ship the rest.**
