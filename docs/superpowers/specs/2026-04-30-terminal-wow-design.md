# Terminal "WOW" — Live `ps -ef` + Optional Interactive Shell

**Status:** Approved design, ready for implementation plan
**Date:** 2026-04-30
**Branch:** `followup-og-and-toggle`
**Site:** Hugo, theme `terminal-dev`

## Problem

The site commits hard to a UNIX/terminal aesthetic but it's a costume, not a behavior:

- The `ps -ef --running` table on the home page lists fake PIDs and static state.
- The blinking cursor in the `whoami` line is decorative.
- Visitors who "get the joke" have nothing to play with.

The wow factor isn't another visual flourish — it's making the metaphor real, without alienating non-technical visitors (recruiters, clients) who land on the site expecting a normal portfolio.

## Goals

1. Turn the `ps -ef --running` block into actually-live data.
2. Add an optional interactive shell that's *invisible* to non-technical visitors and *discoverable* to curious ones.
3. Zero regression to the current homepage's first-paint look and reading experience.

## Non-goals (v1)

- Boot sequence on first visit.
- Spotify / last.fm / Discord "now playing" integration. (Designed for, deferred to v2.)
- Shell parity on `/about`, `/posts`, or `/series` pages — homepage only.
- Server-side anything. Site is a static GitHub Pages build; everything runs client-side or at Hugo build time.

## Architecture overview

Two independent features, shipped together but separable:

```
Home page
├── ps-block (always on, no opt-in)
│   ├── static rows (rendered by Hugo from data file)
│   ├── ticker.js     → live uptime counter for "dad-mode"
│   └── github.js     → fetches latest borgdock release on load, mutates row
│
└── shell (opt-in, hidden by default)
    ├── trigger: click handler on .cursor in hero `whoami` line
    ├── discoverability: muted hint in footer ("click the cursor to open a shell")
    ├── overlay drawer (bottom sheet)
    └── command dispatcher → built-ins + easter eggs
```

Both features ship as plain JS modules in `themes/terminal-dev/assets/js/`, loaded from `head.html` with `defer`. No build step beyond Hugo's existing pipeline.

## Feature 1 — Live `ps -ef --running`

The current table lives in `themes/terminal-dev/layouts/index.html` lines 38–69 with hardcoded `<div class="ps-row">` entries. We'll keep the markup shape (so CSS doesn't change) but source data and add live behaviors.

### Row sources

| Row | Source | Update cadence |
|---|---|---|
| `borgdock` | `GET https://api.github.com/repos/borght-dev/BorgDock/releases/latest` | On page load, cache 1h in localStorage |
| `writing/ai-native` | Hugo build: count of `content/posts/*.md` with `draft: true` | Build time (baked into HTML) |
| `gomocha/field-svc` | Static (text from data file) | n/a |
| `dad-mode` | Live ticker counting up from `2023-07-23` | Every 60s |

### Data file

Move row content into `data/ps_running.yaml` so Hugo can render it server-side and JS can hydrate dynamic fields:

```yaml
rows:
  - pid: 8421
    name: borgdock
    state: { text: "running v1.1.0", class: ps-state-running }
    uptime: shipping
    live:
      kind: github-release
      repo: borght-dev/BorgDock
      versionField: state.text
      template: "running %s"

  - pid: 8422
    name: writing/ai-native
    state: { text: "{{ build.draftCount }} posts queued", class: ps-state-active }
    uptime: weekly

  - pid: 8423
    name: gomocha/field-svc
    state: { text: "leading team of 6", class: ps-state-active }
    uptime: day job

  - pid: 8424
    name: dad-mode
    state: { text: "always on", class: ps-state-warm }
    uptime: since 2023
    live:
      kind: uptime
      since: "2023-07-23"
      target: uptime
      template: "%s"
```

The `live` block tells the JS hydrator how to mutate the rendered row.

### Hydration script (`assets/js/ps-live.js`)

- On `DOMContentLoaded`, find each `[data-live]` element on the table and dispatch by `kind`.
- `kind: github-release`: read from localStorage (`ps:borgdock:v`, `ps:borgdock:t`); if cached < 1h, use it; otherwise fetch, store, render. On any fetch failure, leave the build-time text in place — never blank the row.
- `kind: uptime`: compute `now - since`, format as `Xy Yd Zh`, render once, then `setInterval(60_000)` to re-render. Pause via `visibilitychange` when tab is hidden.

### Graceful degradation

- No JS / JS error: page is identical to today's static version (build-time-rendered text wins).
- GitHub API rate limit / offline: cached value if available, else build-time fallback.
- localStorage disabled: skip cache, just fetch on every load.

## Feature 2 — Optional interactive shell

### Trigger and discoverability

- **Trigger:** click handler on `.cursor` in the hero `whoami` prompt. The cursor is already on screen and looks like part of the design; clicking it is the discoverable cue. This is the *only* way to open the shell.
- **Discoverability hint:** a muted line in `footer.html` (existing dim-text style) reading exactly `// click the cursor to open a shell`. The hint is plain copy — not itself clickable.
- **Close:** ESC, clicking outside the drawer, or the `:q!` / `exit` command.

No keyboard shortcut, no visible button, no banner. A first-time non-technical visitor sees the page exactly as today.

No visible button, badge, or banner. A first-time non-technical visitor sees the page exactly as today.

### UI

A bottom-anchored drawer (~30vh tall) that slides up. Contents:

- Title bar: same `lights` + `name` styling as the existing `term-box` titlebar (`koen@web — bash`).
- Scrollable output area with monospace text.
- Single input line at the bottom with `$ ` prompt and a real `<input>` (autofocus on open).
- Up/Down arrows cycle command history (last 50, persisted in localStorage as `shell:history`).

### Commands (v1)

Built-ins:
- `help` — list commands.
- `whoami` — re-prints the hero tagline.
- `pwd` — prints `~`.
- `ls` — lists top-level sections; `ls posts/` and `ls series/` list those collections (data baked at build time into a JS const).
- `cat <file>` — for `~/.identity`, `now_shipping.md`, post slugs; navigates to the matching page.
- `cd <section>` — navigates (`cd ~/about`, `cd ~/posts`, `cd ~/borgdock` opens external).
- `theme [dark|light|toggle]` — toggles the existing theme.
- `clear` — clears the output area.
- `date` — current date/time.
- `uptime` — same value as the `dad-mode` ticker.
- `history` — print recent commands.

Easter eggs:
- `sudo <anything>` → `Sorry, koen is not in the sudoers file. This incident will be reported.`
- `vim` / `nano` → `Use :q! to escape vim. Just kidding — press ESC.`
- `:q!` → close shell.
- `exit` → close shell.
- `rm -rf /` → fake progress bar then `nice try.`
- `cowsay <msg>` → ASCII cow with the message.
- `fortune` → random line from a small built-in pool.
- `top` → animates the `ps -ef` table on the page (rows blink/refresh) for ~5s.

Unknown command:
- `zsh: command not found: <cmd>`

### State

- History: localStorage `shell:history`, capped at 50.
- Open/closed state: not persisted — always closed on load.
- No analytics / no remote logging.

## Files to add or change

| Path | Change |
|---|---|
| `data/ps_running.yaml` | new — row data |
| `themes/terminal-dev/layouts/index.html` | replace hardcoded `<div class="ps-row">` block with a `range` over the data file; add `data-live` attributes |
| `themes/terminal-dev/layouts/partials/footer.html` | add muted shell-hint line |
| `themes/terminal-dev/assets/js/ps-live.js` | new — hydration |
| `themes/terminal-dev/assets/js/shell.js` | new — drawer + dispatcher |
| `themes/terminal-dev/assets/js/shell-commands.js` | new — built-ins + easter eggs (kept separate so adding commands doesn't bloat the dispatcher) |
| `themes/terminal-dev/assets/css/shell.css` | new — drawer styling, reuses existing terminal vars |
| `themes/terminal-dev/layouts/partials/head.html` | wire up the new JS/CSS via Hugo asset pipeline (`resources.Get` + `fingerprint`) |

## Boundaries (so each piece is testable on its own)

- `ps-live.js` knows nothing about the shell.
- `shell.js` knows nothing about `ps-live`. The only coupling is the `top` easter egg, which dispatches a `CustomEvent('shell:top')` that `ps-live.js` listens for.
- Command implementations live in `shell-commands.js` as `{ name, run(ctx, args) }` records. The dispatcher is a 20-line lookup; adding a command is a one-record edit.

## Error handling

- Network errors are silent: write to `console.debug`, never to the user-visible UI. The static fallback is the user-visible behavior.
- Shell command errors print as terminal output, not as JS exceptions.
- Unknown commands look like real `zsh: command not found:` output — that *is* the behavior, not an error.

## Testing

Hugo theme has no existing test harness, so tests will be added in `themes/terminal-dev/tests/` using `node --test` (Node's built-in runner — zero dependencies). Targets:

- `ps-live` cache logic (mock localStorage + fetch).
- `ps-live` uptime formatting (1y 2d 3h boundary cases, future-date safety).
- Shell command dispatcher (registration, lookup, unknown).
- A handful of command outputs (`help`, `ls`, `cat`, easter eggs).
- DOM smoke test: open shell, type command, see output.

Manual: visual check on light + dark theme, mobile width, with JS disabled.

## Decisions locked

- `dad-mode` since date: **2023-07-23**.
- Test runner: **`node --test`** (Node built-in, zero dependencies).
- Footer hint copy: **`// click the cursor to open a shell`**.
