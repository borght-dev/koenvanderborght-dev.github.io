# Terminal WOW Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the homepage terminal aesthetic *behave* like a terminal — the `ps -ef --running` table reflects real, live state, and a hidden interactive shell opens when visitors click the blinking cursor.

**Architecture:** Two independent JS modules loaded via Hugo's asset pipeline. `ps-live.js` hydrates a static, build-time `data/ps_running.yaml` table with a live uptime ticker and a cached GitHub release lookup. `shell.js` wires a bottom-drawer overlay to a pure command registry in `shell-commands.js`. The two modules communicate only through one `CustomEvent('shell:top')` for the `top` easter egg.

**Tech Stack:** Hugo 0.161 (extended), Node 22 (built-in `node --test` runner), vanilla ES modules, SCSS via `css.Sass`, JS bundled via `js.Build` (esbuild under the hood).

**Spec:** `docs/superpowers/specs/2026-04-30-terminal-wow-design.md`

---

## File Structure

**New files:**

| Path | Responsibility |
|---|---|
| `themes/terminal-dev/package.json` | `"type": "module"` so Node treats `.js` as ESM, `test` script for `node --test` |
| `data/ps_running.yaml` | Single source of truth for the four `ps -ef` rows (replaces hardcoded HTML) |
| `themes/terminal-dev/assets/js/ps-live.js` | Pure helpers (`formatUptime`, `parseLatestRelease`, `pickCachedRelease`) + `bootPsLive()` DOM runtime |
| `themes/terminal-dev/assets/js/shell-commands.js` | Pure command registry: `commands` array + `dispatch(input, ctx)` + `tokenize` |
| `themes/terminal-dev/assets/js/shell.js` | DOM glue: drawer markup, input handling, history, output rendering, trigger wiring |
| `themes/terminal-dev/tests/ps-live.test.js` | Tests for uptime formatting, release parsing, cache logic |
| `themes/terminal-dev/tests/shell-commands.test.js` | Tests for tokenizer, dispatcher, individual command outputs |

**Modified files:**

| Path | Change |
|---|---|
| `themes/terminal-dev/layouts/index.html` | Replace hardcoded `ps-row` block with a `range` over `site.Data.ps_running.rows`; emit `data-live-*` attributes; bake draft count for `writing/ai-native` row |
| `themes/terminal-dev/layouts/partials/footer.html` | Add muted line: `// click the cursor to open a shell` |
| `themes/terminal-dev/layouts/partials/head.html` | Wire `ps-live.js` and `shell.js` via `js.Build` + `resources.Fingerprint` |
| `themes/terminal-dev/assets/sass/main.scss` | Add `// shell drawer` and `// shell hint` sections |

**Boundaries:**
- `ps-live.js` knows nothing about `shell.js`. It only listens for `CustomEvent('shell:top')` to drive the `top` animation.
- `shell-commands.js` is pure — no DOM access. Receives a `ctx` with side-effect callbacks (`print`, `navigate`, `setTheme`, `clear`, `close`).
- `shell.js` owns the DOM and supplies the `ctx` to `dispatch()`.

---

## Task 1: Set up Node test runner for the theme

**Files:**
- Create: `themes/terminal-dev/package.json`
- Create: `themes/terminal-dev/tests/smoke.test.js`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "terminal-dev",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test tests/*.test.js"
  }
}
```

(Note: Node 22.22 does not accept a bare directory argument for `--test`; we use a glob.)

- [ ] **Step 2: Create smoke test**

`themes/terminal-dev/tests/smoke.test.js`:

```javascript
import { test } from 'node:test';
import { strict as assert } from 'node:assert';

test('node --test runs', () => {
  assert.equal(1 + 1, 2);
});
```

- [ ] **Step 3: Run the smoke test**

```bash
cd themes/terminal-dev && npm test
```

Expected: `# tests 1` and `# pass 1` in the output, exit code 0.

- [ ] **Step 4: Commit**

```bash
git add themes/terminal-dev/package.json themes/terminal-dev/tests/smoke.test.js
git commit -m "test: add node --test runner to terminal-dev theme"
```

---

## Task 2: Move ps-block content into a data file (no behavior change)

This is a refactor. The rendered HTML must be **byte-identical** to today so we can confirm zero visual regression before adding live behavior.

**Files:**
- Create: `data/ps_running.yaml`
- Modify: `themes/terminal-dev/layouts/index.html` (lines 38–69, the `<div class="ps-table">` block)

- [ ] **Step 1: Capture current ps-table HTML for diff comparison**

```bash
hugo --quiet && grep -A 40 'ps-table' public/index.html > /tmp/ps-table-before.html
wc -l /tmp/ps-table-before.html
```

Expected: file with the existing 4 hardcoded rows. Save this for Step 5.

- [ ] **Step 2: Create the data file**

`data/ps_running.yaml`:

```yaml
rows:
  - pid: 8421
    name: borgdock
    state_text: "running v1.1.0"
    state_class: ps-state-running
    uptime: shipping
    live:
      kind: github-release
      repo: borght-dev/BorgDock
      target: state
      template: "running %s"

  - pid: 8422
    name: writing/ai-native
    state_text: "3 posts queued"
    state_class: ps-state-active
    uptime: weekly
    live:
      kind: build-draft-count
      target: state
      template: "%d posts queued"

  - pid: 8423
    name: gomocha/field-svc
    state_text: "leading team of 6"
    state_class: ps-state-active
    uptime: day job

  - pid: 8424
    name: dad-mode
    state_text: "always on"
    state_class: ps-state-warm
    uptime: "since 2023"
    live:
      kind: uptime
      since: "2023-07-23"
      target: uptime
```

- [ ] **Step 3: Replace the hardcoded rows in `index.html`**

In `themes/terminal-dev/layouts/index.html`, replace lines 45–68 (the four hardcoded `<div class="ps-row">` blocks, keep the `ps-head` row at lines 39–44 unchanged) with:

```go-html-template
        {{- $draftCount := len (where (where .Site.RegularPages "Section" "posts") ".Params.draft" "ne" true) -}}
        {{ range site.Data.ps_running.rows }}
          {{- $stateText := .state_text -}}
          {{- if and .live (eq .live.kind "build-draft-count") -}}
            {{- $stateText = printf .live.template $draftCount -}}
          {{- end -}}
          <div class="ps-row" role="row"
            {{ with .live }}
              data-live-kind="{{ .kind }}"
              {{ with .repo }}data-live-repo="{{ . }}"{{ end }}
              {{ with .since }}data-live-since="{{ . }}"{{ end }}
              {{ with .target }}data-live-target="{{ . }}"{{ end }}
              {{ with .template }}data-live-template="{{ . }}"{{ end }}
            {{ end }}>
            <span class="ps-pid" role="cell">{{ .pid }}</span>
            <span class="ps-name" role="cell">{{ .name }}</span>
            <span class="ps-state {{ .state_class }}" role="cell">{{ $stateText }}</span>
            <span class="ps-uptime" role="cell">{{ .uptime }}</span>
          </div>
        {{ end }}
```

Note: the draft-count row will still read `3 posts queued` for now (same value), because the data file's `state_text` carries the literal text **and** the `live.kind: build-draft-count` block re-renders it with the live count. We do this so both paths produce identical output for byte-equality verification in Step 5.

Wait — that's actually wrong. The build-time count will overwrite the literal. We want the literal `3 posts queued` to render now (Task 2) and the build-time count to take over in Task 5.

Revise: in Task 2, do NOT include the `live: { kind: build-draft-count }` block on the writing/ai-native row yet. Add it in Task 5. Keep only the borgdock and dad-mode `live` blocks for now (they don't change build output — JS hydrates them at runtime).

Final corrected YAML for Task 2:

```yaml
rows:
  - pid: 8421
    name: borgdock
    state_text: "running v1.1.0"
    state_class: ps-state-running
    uptime: shipping
    live:
      kind: github-release
      repo: borght-dev/BorgDock
      target: state
      template: "running %s"

  - pid: 8422
    name: writing/ai-native
    state_text: "3 posts queued"
    state_class: ps-state-active
    uptime: weekly

  - pid: 8423
    name: gomocha/field-svc
    state_text: "leading team of 6"
    state_class: ps-state-active
    uptime: "day job"

  - pid: 8424
    name: dad-mode
    state_text: "always on"
    state_class: ps-state-warm
    uptime: "since 2023"
    live:
      kind: uptime
      since: "2023-07-23"
      target: uptime
```

And the template stays simple (drop the `$draftCount` lines — those go in Task 5):

```go-html-template
        {{ range site.Data.ps_running.rows }}
          <div class="ps-row" role="row"
            {{ with .live }}
              data-live-kind="{{ .kind }}"
              {{ with .repo }}data-live-repo="{{ . }}"{{ end }}
              {{ with .since }}data-live-since="{{ . }}"{{ end }}
              {{ with .target }}data-live-target="{{ . }}"{{ end }}
              {{ with .template }}data-live-template="{{ . }}"{{ end }}
            {{ end }}>
            <span class="ps-pid" role="cell">{{ .pid }}</span>
            <span class="ps-name" role="cell">{{ .name }}</span>
            <span class="ps-state {{ .state_class }}" role="cell">{{ .state_text }}</span>
            <span class="ps-uptime" role="cell">{{ .uptime }}</span>
          </div>
        {{ end }}
```

- [ ] **Step 4: Build the site**

```bash
hugo --quiet
```

Expected: succeeds, no template errors.

- [ ] **Step 5: Verify byte-identical ps-table output**

```bash
grep -A 40 'ps-table' public/index.html > /tmp/ps-table-after.html
diff /tmp/ps-table-before.html /tmp/ps-table-after.html
```

Expected: only differences are the new `data-live-*` attributes on rows that have `live` blocks (rows 8421 and 8424). The visible cell content (PID, NAME, STATE, UPTIME) must match exactly. If anything else differs, fix the template before continuing.

- [ ] **Step 6: Commit**

```bash
git add data/ps_running.yaml themes/terminal-dev/layouts/index.html
git commit -m "refactor: source ps-block rows from data/ps_running.yaml"
```

---

## Task 3: Add `formatUptime` (pure helper, TDD)

This is the function used by the dad-mode ticker and the `uptime` shell command.

**Files:**
- Create: `themes/terminal-dev/assets/js/ps-live.js`
- Create: `themes/terminal-dev/tests/ps-live.test.js`

- [ ] **Step 1: Write the failing test**

`themes/terminal-dev/tests/ps-live.test.js`:

```javascript
import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { formatUptime } from '../assets/js/ps-live.js';

test('formatUptime: same day', () => {
  const since = '2026-04-30';
  const now = new Date('2026-04-30T15:00:00Z');
  assert.equal(formatUptime(since, now), '0d 15h');
});

test('formatUptime: years and days', () => {
  const since = '2023-07-23';
  const now = new Date('2026-04-30T08:00:00Z');
  // 2023-07-23 → 2026-07-23 = 3 years; minus ~84 days = 2y 281d 8h
  const out = formatUptime(since, now);
  assert.match(out, /^2y \d+d \d+h$/);
});

test('formatUptime: future date returns 0d 0h', () => {
  const since = '2099-01-01';
  const now = new Date('2026-04-30T00:00:00Z');
  assert.equal(formatUptime(since, now), '0d 0h');
});

test('formatUptime: exactly one year', () => {
  const since = '2025-04-30';
  const now = new Date('2026-04-30T00:00:00Z');
  assert.equal(formatUptime(since, now), '1y 0d 0h');
});

test('formatUptime: under one year skips year segment', () => {
  const since = '2026-01-01';
  const now = new Date('2026-04-30T12:00:00Z');
  assert.equal(formatUptime(since, now), '119d 12h');
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd themes/terminal-dev && npm test
```

Expected: FAIL with `Cannot find module '../assets/js/ps-live.js'` or similar.

- [ ] **Step 3: Implement `formatUptime`**

Create `themes/terminal-dev/assets/js/ps-live.js`:

```javascript
// Pure helpers — tested directly. DOM runtime at the bottom.

export function formatUptime(sinceISO, now = new Date()) {
  const since = new Date(sinceISO + 'T00:00:00Z');
  let diffMs = now.getTime() - since.getTime();
  if (diffMs <= 0) return '0d 0h';

  const HOUR = 3600 * 1000;
  const DAY = 24 * HOUR;
  const YEAR = 365 * DAY;

  const years = Math.floor(diffMs / YEAR);
  diffMs -= years * YEAR;
  const days = Math.floor(diffMs / DAY);
  diffMs -= days * DAY;
  const hours = Math.floor(diffMs / HOUR);

  return years > 0
    ? `${years}y ${days}d ${hours}h`
    : `${days}d ${hours}h`;
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd themes/terminal-dev && npm test
```

Expected: all 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add themes/terminal-dev/assets/js/ps-live.js themes/terminal-dev/tests/ps-live.test.js
git commit -m "feat(ps-live): add formatUptime helper"
```

---

## Task 4: Add GitHub release parsing + caching (pure helpers, TDD)

**Files:**
- Modify: `themes/terminal-dev/assets/js/ps-live.js`
- Modify: `themes/terminal-dev/tests/ps-live.test.js`

- [ ] **Step 1: Write the failing tests**

Append to `tests/ps-live.test.js`:

```javascript
import { parseLatestRelease, readCache, writeCache } from '../assets/js/ps-live.js';

test('parseLatestRelease: extracts tag_name without leading v', () => {
  const json = { tag_name: 'v1.2.3', name: 'Release 1.2.3' };
  assert.equal(parseLatestRelease(json), '1.2.3');
});

test('parseLatestRelease: leaves non-v tags unchanged', () => {
  const json = { tag_name: '2026.04.30' };
  assert.equal(parseLatestRelease(json), '2026.04.30');
});

test('parseLatestRelease: returns null on malformed payload', () => {
  assert.equal(parseLatestRelease({}), null);
  assert.equal(parseLatestRelease(null), null);
});

test('readCache / writeCache: roundtrip within TTL', () => {
  const store = new Map();
  const fakeStorage = {
    getItem: (k) => store.has(k) ? store.get(k) : null,
    setItem: (k, v) => store.set(k, v),
  };
  const now = 1_000_000;
  writeCache(fakeStorage, 'borgdock', '1.2.3', now);
  assert.equal(readCache(fakeStorage, 'borgdock', now + 30 * 60_000), '1.2.3');
});

test('readCache: returns null past TTL', () => {
  const store = new Map();
  const fakeStorage = {
    getItem: (k) => store.has(k) ? store.get(k) : null,
    setItem: (k, v) => store.set(k, v),
  };
  const now = 1_000_000;
  writeCache(fakeStorage, 'borgdock', '1.2.3', now);
  // 70 minutes later — past 1h TTL
  assert.equal(readCache(fakeStorage, 'borgdock', now + 70 * 60_000), null);
});

test('readCache: tolerates missing keys', () => {
  const fakeStorage = { getItem: () => null, setItem: () => {} };
  assert.equal(readCache(fakeStorage, 'nope', Date.now()), null);
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd themes/terminal-dev && npm test
```

Expected: 6 new tests fail with `parseLatestRelease is not a function` or similar.

- [ ] **Step 3: Implement `parseLatestRelease`, `readCache`, `writeCache`**

Append to `themes/terminal-dev/assets/js/ps-live.js`:

```javascript
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const CACHE_PREFIX = 'ps:cache:';

export function parseLatestRelease(json) {
  if (!json || typeof json.tag_name !== 'string') return null;
  return json.tag_name.replace(/^v/, '');
}

export function readCache(storage, key, now = Date.now()) {
  try {
    const raw = storage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { v, t } = JSON.parse(raw);
    if (typeof v !== 'string' || typeof t !== 'number') return null;
    if (now - t > CACHE_TTL_MS) return null;
    return v;
  } catch {
    return null;
  }
}

export function writeCache(storage, key, value, now = Date.now()) {
  try {
    storage.setItem(CACHE_PREFIX + key, JSON.stringify({ v: value, t: now }));
  } catch {
    // localStorage disabled / quota — silently skip
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
cd themes/terminal-dev && npm test
```

Expected: all tests (Task 3 + Task 4) pass.

- [ ] **Step 5: Commit**

```bash
git add themes/terminal-dev/assets/js/ps-live.js themes/terminal-dev/tests/ps-live.test.js
git commit -m "feat(ps-live): add release parsing + localStorage cache"
```

---

## Task 5: Build-time post count for `writing/ai-native` row

The spec calls for "count of draft posts". Counting *only* drafts in Hugo without `--buildDrafts` is awkward (drafts are excluded from `site.RegularPages` in production builds), and parsing every file's frontmatter via `transform.Unmarshal` is heavy for a single counter.

**Decision for v1:** count every `.md` file under `content/posts/` (drafts + published) via `os.ReadDir`. This matches the user-visible meaning of "posts queued" — anything in flight, drafts or recently shipped. The displayed text stays `<N> posts queued`. If we ever want strictly drafts-only later, we can switch to frontmatter parsing without changing the data file shape.

**Files:**
- Modify: `themes/terminal-dev/layouts/index.html`
- Modify: `data/ps_running.yaml`

- [ ] **Step 1: Update the YAML row**

Add a `live` block to the `writing/ai-native` row in `data/ps_running.yaml`:

```yaml
  - pid: 8422
    name: writing/ai-native
    state_text: "3 posts queued"
    state_class: ps-state-active
    uptime: weekly
    live:
      kind: build-post-count
      target: state
      template: "%d posts queued"
```

- [ ] **Step 2: Update `index.html` to override `state_text` at build time**

In `themes/terminal-dev/layouts/index.html`, the `{{ range site.Data.ps_running.rows }}` block from Task 2 currently looks like:

```go-html-template
        {{ range site.Data.ps_running.rows }}
          <div class="ps-row" role="row"
            ...
```

Insert a build-time count right inside the `range`, before the `<div>`:

```go-html-template
        {{- $postFiles := os.ReadDir "content/posts" -}}
        {{- $postCount := 0 -}}
        {{- range $postFiles -}}
          {{- if and (not .IsDir) (hasSuffix .Name ".md") (ne .Name "_index.md") -}}
            {{- $postCount = add $postCount 1 -}}
          {{- end -}}
        {{- end -}}
        {{ range site.Data.ps_running.rows }}
          {{- $stateText := .state_text -}}
          {{- if and .live (eq .live.kind "build-post-count") -}}
            {{- $stateText = printf .live.template $postCount -}}
          {{- end -}}
          <div class="ps-row" role="row"
```

And change the state cell to use `$stateText`:

```go-html-template
            <span class="ps-state {{ .state_class }}" role="cell">{{ $stateText }}</span>
```

- [ ] **Step 3: Build and verify**

```bash
hugo --quiet
grep -A 2 'writing/ai-native' public/index.html
```

Expected: state cell shows the real count, e.g. `5 posts queued`, matching `find content/posts -name '*.md' -not -name '_index.md' | wc -l`.

- [ ] **Step 4: Commit**

```bash
git add data/ps_running.yaml themes/terminal-dev/layouts/index.html
git commit -m "feat(ps-block): bake real post count into writing/ai-native row"
```

---

## Task 6: ps-live runtime — wire the live behaviors

Hydrate the rows at page load: borgdock fetches GitHub release (cached 1h), dad-mode runs the uptime ticker every 60s while visible.

**Files:**
- Modify: `themes/terminal-dev/assets/js/ps-live.js`
- Modify: `themes/terminal-dev/layouts/partials/head.html`

- [ ] **Step 1: Append the DOM runtime to `ps-live.js`**

Append to `themes/terminal-dev/assets/js/ps-live.js`:

```javascript
// ─── DOM runtime ──────────────────────────────────────────────

const TICK_MS = 60_000;

function rowStateEl(row) {
  return row.querySelector('.ps-state');
}

function rowUptimeEl(row) {
  return row.querySelector('.ps-uptime');
}

function applyToTarget(row, target, text) {
  const el = target === 'uptime' ? rowUptimeEl(row) : rowStateEl(row);
  if (el) el.textContent = text;
}

async function hydrateGithubRelease(row, repo, template, target) {
  const cacheKey = `release:${repo}`;
  const cached = readCache(localStorage, cacheKey);
  if (cached) {
    applyToTarget(row, target, template.replace('%s', cached));
    return;
  }
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`);
    if (!res.ok) return;
    const json = await res.json();
    const version = parseLatestRelease(json);
    if (!version) return;
    writeCache(localStorage, cacheKey, version);
    applyToTarget(row, target, template.replace('%s', version));
  } catch (err) {
    console.debug('[ps-live] release fetch failed', err);
  }
}

function startUptimeTicker(row, since, target) {
  const tick = () => applyToTarget(row, target, formatUptime(since));
  tick();
  let interval = setInterval(tick, TICK_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearInterval(interval);
      interval = null;
    } else if (interval === null) {
      tick();
      interval = setInterval(tick, TICK_MS);
    }
  });
}

export function bootPsLive(root = document) {
  const rows = root.querySelectorAll('.ps-row[data-live-kind]');
  rows.forEach((row) => {
    const kind = row.getAttribute('data-live-kind');
    const target = row.getAttribute('data-live-target') || 'state';
    if (kind === 'github-release') {
      const repo = row.getAttribute('data-live-repo');
      const template = row.getAttribute('data-live-template') || '%s';
      if (repo) hydrateGithubRelease(row, repo, template, target);
    } else if (kind === 'uptime') {
      const since = row.getAttribute('data-live-since');
      if (since) startUptimeTicker(row, since, target);
    }
    // build-draft-count is handled at Hugo build time — nothing to do client-side.
  });
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => bootPsLive());
  } else {
    bootPsLive();
  }
}
```

- [ ] **Step 2: Wire `ps-live.js` into `head.html`**

In `themes/terminal-dev/layouts/partials/head.html`, after the existing SCSS block (after line 37, the `<link rel="stylesheet" ...>`), add:

```go-html-template
{{ $jsOpts := dict "minify" true "format" "esm" "targetPath" "js/ps-live.js" }}
{{ $psLive := resources.Get "js/ps-live.js" | js.Build $jsOpts | resources.Fingerprint }}
<script type="module" src="{{ $psLive.RelPermalink }}" integrity="{{ $psLive.Data.Integrity }}" defer></script>
```

- [ ] **Step 3: Build and serve locally**

```bash
hugo server -D --quiet &
sleep 2
curl -s http://localhost:1313/ | grep -o 'ps-live\.[a-f0-9]\+\.js' | head -1
```

Expected: a fingerprinted filename like `ps-live.abc123.js` is referenced. If `js.Build` fails, check Hugo extended is installed (it is — confirmed `hugo v0.161.0+extended`). Stop the server with `kill %1` after.

- [ ] **Step 4: Manual visual verification**

Open `http://localhost:1313/` in a browser:

- ✅ The `dad-mode` row's UPTIME cell now reads `2y NNNd MMh` (live computed from 2023-07-23), not `since 2023`. Wait 60s and refresh DevTools — value should re-compute on tick.
- ✅ The `borgdock` row's STATE cell reads `running v<latest tag>` after a brief delay (network fetch). Reload — should be instant on second load (cache hit).
- ✅ DevTools Network tab shows exactly one call to `api.github.com/repos/borght-dev/BorgDock/releases/latest` on first load, none on cached reload (within 1h).
- ✅ Disable JS in DevTools, reload — page renders with build-time fallbacks (`running v1.1.0`, `since 2023`). No console errors.

If any check fails, fix before committing. Stop the server: `kill %1`.

- [ ] **Step 5: Commit**

```bash
git add themes/terminal-dev/assets/js/ps-live.js themes/terminal-dev/layouts/partials/head.html
git commit -m "feat(ps-live): hydrate ps-block with live uptime + github release"
```

---

## Task 7: Shell command registry — tokenizer + dispatcher (TDD)

`shell-commands.js` is pure: no DOM. The `dispatch` function accepts an input string and a `ctx` object whose methods are called by individual commands. Tests use a fake `ctx` that records calls.

**Files:**
- Create: `themes/terminal-dev/assets/js/shell-commands.js`
- Create: `themes/terminal-dev/tests/shell-commands.test.js`

- [ ] **Step 1: Write the failing tokenizer + dispatcher tests**

`themes/terminal-dev/tests/shell-commands.test.js`:

```javascript
import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { tokenize, dispatch, commands } from '../assets/js/shell-commands.js';

function makeCtx() {
  const calls = { print: [], navigate: [], setTheme: [], clear: 0, close: 0 };
  return {
    calls,
    print: (line) => calls.print.push(line),
    navigate: (url) => calls.navigate.push(url),
    setTheme: (mode) => calls.setTheme.push(mode),
    clear: () => { calls.clear++; },
    close: () => { calls.close++; },
    site: {
      sections: ['posts', 'series', 'about', 'borgdock'],
      posts: ['hello-world.md', 'ai-native-dev.md'],
      series: ['terminal-redesign'],
    },
    history: [],
    dadModeSince: '2023-07-23',
  };
}

test('tokenize: simple words', () => {
  assert.deepEqual(tokenize('ls posts/'), ['ls', 'posts/']);
});

test('tokenize: collapses whitespace and trims', () => {
  assert.deepEqual(tokenize('   ls    posts/   '), ['ls', 'posts/']);
});

test('tokenize: empty input returns []', () => {
  assert.deepEqual(tokenize(''), []);
  assert.deepEqual(tokenize('   '), []);
});

test('dispatch: empty input is a no-op', () => {
  const ctx = makeCtx();
  dispatch('', ctx);
  assert.equal(ctx.calls.print.length, 0);
});

test('dispatch: unknown command prints zsh-style error', () => {
  const ctx = makeCtx();
  dispatch('frobnicate', ctx);
  assert.equal(ctx.calls.print.length, 1);
  assert.match(ctx.calls.print[0], /^zsh: command not found: frobnicate$/);
});

test('commands array: every entry has name + run', () => {
  for (const c of commands) {
    assert.equal(typeof c.name, 'string');
    assert.equal(typeof c.run, 'function');
  }
});

test('commands array: names are unique', () => {
  const names = commands.map((c) => c.name);
  assert.equal(new Set(names).size, names.length);
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd themes/terminal-dev && npm test
```

Expected: 7 tests fail with module-not-found.

- [ ] **Step 3: Implement tokenizer + dispatcher + empty registry**

`themes/terminal-dev/assets/js/shell-commands.js`:

```javascript
export function tokenize(input) {
  return input.trim().split(/\s+/).filter(Boolean);
}

export const commands = [];

export function dispatch(input, ctx) {
  const tokens = tokenize(input);
  if (tokens.length === 0) return;
  const [name, ...args] = tokens;
  const cmd = commands.find((c) => c.name === name);
  if (!cmd) {
    ctx.print(`zsh: command not found: ${name}`);
    return;
  }
  cmd.run(ctx, args);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Expected: all 7 tests pass (the registry is empty but valid).

- [ ] **Step 5: Commit**

```bash
git add themes/terminal-dev/assets/js/shell-commands.js themes/terminal-dev/tests/shell-commands.test.js
git commit -m "feat(shell): tokenizer + dispatcher with empty registry"
```

---

## Task 8: Core commands — help, whoami, pwd, clear, date, uptime, history, exit (TDD)

**Files:**
- Modify: `themes/terminal-dev/assets/js/shell-commands.js`
- Modify: `themes/terminal-dev/tests/shell-commands.test.js`

- [ ] **Step 1: Write tests for each command**

Append to `tests/shell-commands.test.js`:

```javascript
test('help: lists every registered command', () => {
  const ctx = makeCtx();
  dispatch('help', ctx);
  const output = ctx.calls.print.join('\n');
  for (const c of commands) {
    assert.ok(output.includes(c.name), `help should mention "${c.name}"`);
  }
});

test('whoami: prints the senior-dev tagline', () => {
  const ctx = makeCtx();
  dispatch('whoami', ctx);
  assert.ok(ctx.calls.print.some((l) => /koen/i.test(l)));
});

test('pwd: prints ~', () => {
  const ctx = makeCtx();
  dispatch('pwd', ctx);
  assert.deepEqual(ctx.calls.print, ['~']);
});

test('clear: invokes ctx.clear()', () => {
  const ctx = makeCtx();
  dispatch('clear', ctx);
  assert.equal(ctx.calls.clear, 1);
});

test('date: prints an ISO-ish current date string', () => {
  const ctx = makeCtx();
  dispatch('date', ctx);
  assert.equal(ctx.calls.print.length, 1);
  assert.match(ctx.calls.print[0], /\d{4}-\d{2}-\d{2}/);
});

test('uptime: prints formatted uptime from ctx.dadModeSince', () => {
  const ctx = { ...makeCtx(), dadModeSince: '2023-07-23' };
  ctx.print = (l) => ctx.calls.print.push(l);
  dispatch('uptime', ctx);
  assert.equal(ctx.calls.print.length, 1);
  assert.match(ctx.calls.print[0], /\d+y \d+d \d+h|\d+d \d+h/);
});

test('history: prints history list with numbers', () => {
  const ctx = makeCtx();
  ctx.history.push('ls', 'pwd', 'whoami');
  dispatch('history', ctx);
  assert.equal(ctx.calls.print.length, 3);
  assert.match(ctx.calls.print[0], /1\s+ls/);
  assert.match(ctx.calls.print[2], /3\s+whoami/);
});

test('exit: invokes ctx.close()', () => {
  const ctx = makeCtx();
  dispatch('exit', ctx);
  assert.equal(ctx.calls.close, 1);
});

test(':q!: invokes ctx.close()', () => {
  const ctx = makeCtx();
  dispatch(':q!', ctx);
  assert.equal(ctx.calls.close, 1);
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd themes/terminal-dev && npm test
```

Expected: 8 new tests fail.

- [ ] **Step 3: Register the commands**

In `themes/terminal-dev/assets/js/shell-commands.js`, add an import at the very top of the file, before the existing `tokenize` export (`formatUptime` is a pure helper, not DOM code, so importing it does not violate the runtime-isolation boundary):

```javascript
import { formatUptime } from './ps-live.js';
```

Then replace `export const commands = [];` with:

```javascript
export const commands = [
  {
    name: 'help',
    summary: 'show available commands',
    run(ctx) {
      ctx.print('available commands:');
      for (const c of commands) {
        ctx.print(`  ${c.name.padEnd(10)} ${c.summary || ''}`);
      }
    },
  },
  {
    name: 'whoami',
    summary: 're-print the hero tagline',
    run(ctx) {
      ctx.print('koen — senior dev shipping tools, not slides');
      ctx.print('full-stack engineer at Gomocha · building developer tools by night');
    },
  },
  {
    name: 'pwd',
    summary: 'print working directory',
    run(ctx) { ctx.print('~'); },
  },
  {
    name: 'clear',
    summary: 'clear the terminal',
    run(ctx) { ctx.clear(); },
  },
  {
    name: 'date',
    summary: 'print current date/time',
    run(ctx) { ctx.print(new Date().toISOString().replace('T', ' ').slice(0, 19)); },
  },
  {
    name: 'uptime',
    summary: 'show dad-mode uptime',
    run(ctx) {
      const since = ctx.dadModeSince || '2023-07-23';
      ctx.print(formatUptime(since));
    },
  },
  {
    name: 'history',
    summary: 'show command history',
    run(ctx) {
      const h = ctx.history || [];
      h.forEach((cmd, i) => ctx.print(`${String(i + 1).padStart(4)}  ${cmd}`));
    },
  },
  {
    name: 'exit',
    summary: 'close the shell',
    run(ctx) { ctx.close(); },
  },
  {
    name: ':q!',
    summary: 'close the shell (vim-style)',
    run(ctx) { ctx.close(); },
  },
];
```

- [ ] **Step 4: Run tests to verify they pass**

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add themes/terminal-dev/assets/js/shell-commands.js themes/terminal-dev/tests/shell-commands.test.js
git commit -m "feat(shell): core commands (help, whoami, pwd, clear, date, history, exit, :q!)"
```

---

## Task 9: Navigation commands — ls, cat, cd (TDD)

**Files:**
- Modify: `themes/terminal-dev/assets/js/shell-commands.js`
- Modify: `themes/terminal-dev/tests/shell-commands.test.js`

- [ ] **Step 1: Write tests**

Append to `tests/shell-commands.test.js`:

```javascript
test('ls: no args lists top-level sections', () => {
  const ctx = makeCtx();
  dispatch('ls', ctx);
  const out = ctx.calls.print.join(' ');
  for (const s of ctx.site.sections) assert.ok(out.includes(s));
});

test('ls posts/: lists posts from ctx.site.posts', () => {
  const ctx = makeCtx();
  dispatch('ls posts/', ctx);
  const out = ctx.calls.print.join('\n');
  assert.ok(out.includes('hello-world.md'));
  assert.ok(out.includes('ai-native-dev.md'));
});

test('ls unknown/: prints not-found error', () => {
  const ctx = makeCtx();
  dispatch('ls nonsense/', ctx);
  assert.match(ctx.calls.print.join(' '), /no such file or directory/i);
});

test('cat ~/.identity: navigates to /about/', () => {
  const ctx = makeCtx();
  dispatch('cat ~/.identity', ctx);
  assert.deepEqual(ctx.calls.navigate, ['/about/']);
});

test('cat now_shipping.md: navigates to home anchor', () => {
  const ctx = makeCtx();
  dispatch('cat now_shipping.md', ctx);
  assert.deepEqual(ctx.calls.navigate, ['/#now-shipping']);
});

test('cat <post>.md: navigates to /posts/<slug>/', () => {
  const ctx = makeCtx();
  dispatch('cat hello-world.md', ctx);
  assert.deepEqual(ctx.calls.navigate, ['/posts/hello-world/']);
});

test('cat unknown: prints error', () => {
  const ctx = makeCtx();
  dispatch('cat nope.md', ctx);
  assert.match(ctx.calls.print.join(' '), /no such file/i);
});

test('cd ~/about: navigates', () => {
  const ctx = makeCtx();
  dispatch('cd ~/about', ctx);
  assert.deepEqual(ctx.calls.navigate, ['/about/']);
});

test('cd ~/borgdock: navigates to external', () => {
  const ctx = makeCtx();
  dispatch('cd ~/borgdock', ctx);
  assert.deepEqual(ctx.calls.navigate, ['https://borgdock.pages.dev/']);
});

test('cd unknown: prints error', () => {
  const ctx = makeCtx();
  dispatch('cd ~/nowhere', ctx);
  assert.match(ctx.calls.print.join(' '), /no such file or directory/i);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Expected: 10 tests fail.

- [ ] **Step 3: Implement the commands**

Add these entries to the `commands` array in `shell-commands.js` (insert before the `exit` entry):

```javascript
  {
    name: 'ls',
    summary: 'list directory',
    run(ctx, args) {
      const target = args[0];
      if (!target || target === '~' || target === '~/') {
        for (const s of ctx.site.sections) ctx.print(`${s}/`);
        return;
      }
      const sub = target.replace(/\/$/, '').replace(/^~\//, '');
      const list = ctx.site[sub];
      if (!Array.isArray(list)) {
        ctx.print(`ls: ${target}: no such file or directory`);
        return;
      }
      for (const item of list) ctx.print(item);
    },
  },
  {
    name: 'cat',
    summary: 'navigate to a file',
    run(ctx, args) {
      const target = args[0];
      if (!target) { ctx.print('cat: missing operand'); return; }
      if (target === '~/.identity') return ctx.navigate('/about/');
      if (target === 'now_shipping.md') return ctx.navigate('/#now-shipping');
      if (target.endsWith('.md')) {
        const slug = target.replace(/\.md$/, '');
        if (ctx.site.posts && ctx.site.posts.includes(target)) {
          return ctx.navigate(`/posts/${slug}/`);
        }
        if (ctx.site.series && ctx.site.series.includes(slug)) {
          return ctx.navigate(`/series/${slug}/`);
        }
      }
      ctx.print(`cat: ${target}: no such file or directory`);
    },
  },
  {
    name: 'cd',
    summary: 'change directory',
    run(ctx, args) {
      const target = args[0];
      const map = {
        '~': '/',
        '~/': '/',
        '~/about': '/about/',
        '~/posts': '/posts/',
        '~/series': '/series/',
        '~/borgdock': 'https://borgdock.pages.dev/',
      };
      if (target && Object.prototype.hasOwnProperty.call(map, target)) {
        return ctx.navigate(map[target]);
      }
      ctx.print(`cd: ${target || ''}: no such file or directory`);
    },
  },
```

- [ ] **Step 4: Run tests to verify they pass**

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add themes/terminal-dev/assets/js/shell-commands.js themes/terminal-dev/tests/shell-commands.test.js
git commit -m "feat(shell): ls, cat, cd navigation commands"
```

---

## Task 10: Theme command + easter eggs (TDD)

**Files:**
- Modify: `themes/terminal-dev/assets/js/shell-commands.js`
- Modify: `themes/terminal-dev/tests/shell-commands.test.js`

- [ ] **Step 1: Write tests**

Append to `tests/shell-commands.test.js`:

```javascript
test('theme dark: invokes ctx.setTheme("dark")', () => {
  const ctx = makeCtx();
  dispatch('theme dark', ctx);
  assert.deepEqual(ctx.calls.setTheme, ['dark']);
});

test('theme: with no arg cycles via ctx.setTheme("toggle")', () => {
  const ctx = makeCtx();
  dispatch('theme', ctx);
  assert.deepEqual(ctx.calls.setTheme, ['toggle']);
});

test('theme bogus: prints error', () => {
  const ctx = makeCtx();
  dispatch('theme bogus', ctx);
  assert.match(ctx.calls.print.join(' '), /unknown theme/i);
});

test('sudo: prints sudoers refusal', () => {
  const ctx = makeCtx();
  dispatch('sudo rm', ctx);
  assert.match(ctx.calls.print.join(' '), /sudoers/i);
});

test('vim: prints vim joke', () => {
  const ctx = makeCtx();
  dispatch('vim', ctx);
  assert.match(ctx.calls.print.join(' '), /:q!|escape/i);
});

test('rm -rf /: prints "nice try"', () => {
  const ctx = makeCtx();
  dispatch('rm -rf /', ctx);
  assert.match(ctx.calls.print.join(' '), /nice try/i);
});

test('cowsay hello: produces cow + message', () => {
  const ctx = makeCtx();
  dispatch('cowsay hello world', ctx);
  const out = ctx.calls.print.join('\n');
  assert.ok(out.includes('hello world'));
  assert.ok(out.includes('^__^') || out.includes('moo') || out.includes('(oo)'));
});

test('fortune: prints one of the known fortunes', () => {
  const ctx = makeCtx();
  dispatch('fortune', ctx);
  assert.equal(ctx.calls.print.length, 1);
  assert.ok(ctx.calls.print[0].length > 0);
});

test('top: dispatches shell:top via ctx.dispatchEvent', () => {
  const events = [];
  const ctx = { ...makeCtx(), dispatchEvent: (e) => events.push(e) };
  // re-bind print to use the new ctx
  ctx.print = (l) => ctx.calls.print.push(l);
  dispatch('top', ctx);
  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'shell:top');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Expected: 9 tests fail.

- [ ] **Step 3: Implement the commands**

Add to the `commands` array (insert before the `exit` entry):

```javascript
  {
    name: 'theme',
    summary: 'cycle or set theme [dark|light|auto|toggle]',
    run(ctx, args) {
      const mode = args[0];
      if (!mode) return ctx.setTheme('toggle');
      if (['dark', 'light', 'auto', 'toggle'].includes(mode)) return ctx.setTheme(mode);
      ctx.print(`theme: unknown theme '${mode}' (try dark|light|auto|toggle)`);
    },
  },
  {
    name: 'sudo',
    summary: 'try and see',
    run(ctx) {
      ctx.print(`Sorry, koen is not in the sudoers file. This incident will be reported.`);
    },
  },
  {
    name: 'vim',
    summary: 'open vim',
    run(ctx) {
      ctx.print(`Use :q! to escape vim. Just kidding — press ESC.`);
    },
  },
  {
    name: 'nano',
    summary: 'open nano',
    run(ctx) { ctx.print(`real ones use vim. (press ESC to close)`); },
  },
  {
    name: 'rm',
    summary: 'remove (you cannot)',
    run(ctx, args) {
      if (args.includes('-rf') && args.includes('/')) return ctx.print('nice try.');
      ctx.print(`rm: read-only file system`);
    },
  },
  {
    name: 'cowsay',
    summary: 'an opinionated cow',
    run(ctx, args) {
      const msg = args.join(' ') || 'moo';
      const top = ' ' + '_'.repeat(msg.length + 2);
      const mid = `< ${msg} >`;
      const bot = ' ' + '-'.repeat(msg.length + 2);
      ctx.print(top);
      ctx.print(mid);
      ctx.print(bot);
      ctx.print('        \\   ^__^');
      ctx.print('         \\  (oo)\\_______');
      ctx.print('            (__)\\       )\\/\\');
      ctx.print('                ||----w |');
      ctx.print('                ||     ||');
    },
  },
  {
    name: 'fortune',
    summary: 'a random truth',
    run(ctx) {
      const pool = [
        'ship beats perfect.',
        'the best code is the code you do not need to write.',
        'comments lie. tests do not.',
        'cmd+s is for cowards. real engineers fear nothing.',
        'three similar lines beats a premature abstraction.',
      ];
      ctx.print(pool[Math.floor(Math.random() * pool.length)]);
    },
  },
  {
    name: 'top',
    summary: 'animate the ps -ef table',
    run(ctx) {
      ctx.print('refreshing process table...');
      if (ctx.dispatchEvent) {
        ctx.dispatchEvent(new CustomEvent('shell:top'));
      }
    },
  },
```

- [ ] **Step 4: Run tests to verify they pass**

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add themes/terminal-dev/assets/js/shell-commands.js themes/terminal-dev/tests/shell-commands.test.js
git commit -m "feat(shell): theme command and easter eggs (sudo, vim, rm, cowsay, fortune, top)"
```

---

## Task 11: Shell drawer DOM glue + input handling

This task is mostly DOM code that we verify manually. The pure logic is already covered.

**Files:**
- Create: `themes/terminal-dev/assets/js/shell.js`

- [ ] **Step 1: Implement the drawer**

Create `themes/terminal-dev/assets/js/shell.js`:

```javascript
import { dispatch, commands } from './shell-commands.js';

const HISTORY_KEY = 'shell:history';
const HISTORY_MAX = 50;

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(-HISTORY_MAX) : [];
  } catch { return []; }
}

function saveHistory(history) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-HISTORY_MAX)));
  } catch { /* ignore */ }
}

function buildDrawer() {
  const drawer = document.createElement('div');
  drawer.className = 'shell-drawer';
  drawer.setAttribute('aria-hidden', 'true');
  drawer.innerHTML = `
    <div class="shell-titlebar">
      <span class="lights"><span></span><span></span><span></span></span>
      <span class="name">koen@web — bash</span>
      <button class="shell-close" type="button" aria-label="close shell">×</button>
    </div>
    <div class="shell-output" role="log" aria-live="polite"></div>
    <form class="shell-form" autocomplete="off">
      <span class="shell-prompt">$</span>
      <input type="text" class="shell-input" autocapitalize="off" autocorrect="off" spellcheck="false" />
    </form>
  `;
  return drawer;
}

function buildSiteData() {
  // Read sections from the document; for posts/series we use a small static list
  // baked into the page via window.__SHELL_SITE__ (set by index.html in Task 13).
  const baked = (typeof window !== 'undefined' && window.__SHELL_SITE__) || {};
  return {
    sections: ['posts', 'series', 'about', 'borgdock'],
    posts: baked.posts || [],
    series: baked.series || [],
  };
}

export function bootShell() {
  const drawer = buildDrawer();
  document.body.appendChild(drawer);

  const output = drawer.querySelector('.shell-output');
  const form = drawer.querySelector('.shell-form');
  const input = drawer.querySelector('.shell-input');
  const closeBtn = drawer.querySelector('.shell-close');

  // history is mutated in place so ctx.history (passed by reference below)
  // always reflects the current state for the `history` shell command.
  const history = loadHistory();
  let historyIdx = history.length;
  const site = buildSiteData();
  const dadModeSince = '2023-07-23';

  const print = (line) => {
    const el = document.createElement('div');
    el.className = 'shell-line';
    el.textContent = line;
    output.appendChild(el);
    output.scrollTop = output.scrollHeight;
  };

  const printPrompt = (cmd) => {
    const el = document.createElement('div');
    el.className = 'shell-line shell-line-cmd';
    el.textContent = `$ ${cmd}`;
    output.appendChild(el);
  };

  const open = () => {
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    setTimeout(() => input.focus(), 50);
  };
  const close = () => {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
  };

  const ctx = {
    print,
    navigate: (url) => {
      if (url.startsWith('http')) {
        window.open(url, '_blank', 'noopener');
      } else {
        window.location.href = url;
      }
    },
    setTheme: (mode) => {
      const toggleBtn = document.getElementById('theme-toggle');
      const label = document.getElementById('theme-label');
      if (!toggleBtn) { print('theme: toggle unavailable'); return; }
      if (mode === 'toggle' || !mode) {
        toggleBtn.click();
      } else {
        // Cycle up to 3 times to reach the requested mode
        for (let i = 0; i < 3; i++) {
          const current = label?.textContent?.trim();
          if (current === mode) break;
          toggleBtn.click();
        }
      }
      print(`theme: ${label?.textContent?.trim() || mode}`);
    },
    clear: () => { output.innerHTML = ''; },
    close,
    dispatchEvent: (e) => document.dispatchEvent(e),
    site,
    history,
    dadModeSince,
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const value = input.value;
    input.value = '';
    if (!value.trim()) return;
    printPrompt(value);
    // mutate in place so ctx.history (same reference) stays current
    history.push(value);
    while (history.length > HISTORY_MAX) history.shift();
    saveHistory(history);
    historyIdx = history.length;
    dispatch(value, ctx);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIdx > 0) historyIdx--;
      input.value = history[historyIdx] || '';
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx < history.length) historyIdx++;
      input.value = history[historyIdx] || '';
    } else if (e.key === 'Escape') {
      close();
    }
  });

  closeBtn.addEventListener('click', close);
  drawer.addEventListener('click', (e) => {
    if (e.target === drawer) close();
  });

  // Trigger: click the cursor in the hero whoami line
  const cursor = document.querySelector('.hero .prompt .cursor');
  if (cursor) {
    cursor.style.cursor = 'pointer';
    cursor.setAttribute('role', 'button');
    cursor.setAttribute('aria-label', 'open shell');
    cursor.setAttribute('tabindex', '0');
    cursor.addEventListener('click', open);
    cursor.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
  }

  // Welcome line
  print(`koen@web — type 'help' for commands. ESC or 'exit' to close.`);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => bootShell());
  } else {
    bootShell();
  }
}
```

- [ ] **Step 2: Bake the site data the shell needs**

In `themes/terminal-dev/layouts/index.html`, after the closing `</section>` of the `now-shipping` block (around line 136 in the current file, just before `{{ end }}`), add an inline `<script>` that exposes a small JSON to `window.__SHELL_SITE__`:

```go-html-template
{{- $publishedPosts := where (where site.RegularPages "Section" "posts") ".Params.draft" "ne" true -}}
{{- $allSeries      := where site.RegularPages "Section" "series" -}}
<script>
window.__SHELL_SITE__ = {
  posts: [
    {{- range $i, $p := $publishedPosts -}}
      {{- if $i }}, {{ end -}}
      "{{ $p.File.ContentBaseName }}.md"
    {{- end -}}
  ],
  series: [
    {{- range $i, $s := $allSeries -}}
      {{- if $i }}, {{ end -}}
      "{{ $s.File.ContentBaseName }}"
    {{- end -}}
  ]
};
</script>
```

- [ ] **Step 3: Wire `shell.js` into `head.html`**

In `themes/terminal-dev/layouts/partials/head.html`, after the `ps-live.js` block added in Task 6, append:

```go-html-template
{{ $shellOpts := dict "minify" true "format" "esm" "targetPath" "js/shell.js" }}
{{ $shell := resources.Get "js/shell.js" | js.Build $shellOpts | resources.Fingerprint }}
<script type="module" src="{{ $shell.RelPermalink }}" integrity="{{ $shell.Data.Integrity }}" defer></script>
```

- [ ] **Step 4: Build and run the site**

```bash
hugo server -D --quiet &
sleep 2
```

- [ ] **Step 5: Manual verification**

Open `http://localhost:1313/`:

- ✅ Click the blinking cursor in the hero `whoami` line — drawer slides up. (Note: until Task 12 adds CSS, the drawer may render unstyled at the bottom of the page. That's expected at this step — we're verifying *behavior*, not *style*.)
- ✅ Drawer shows welcome line. Input is focused.
- ✅ Type `help` + Enter — prints command list.
- ✅ Type `whoami` — tagline.
- ✅ Type `ls posts/` — shows real post filenames from `content/posts/`.
- ✅ Up arrow recalls previous command. Down arrow forwards.
- ✅ ESC closes.
- ✅ Reload the page — history persists. Up arrow recalls last commands.
- ✅ Type `theme` — main theme toggle in footer cycles. Output prints `theme: toggle`.
- ✅ Type `top` — output line appears. (`shell:top` event fires; ps-live will hook it in Task 13.)
- ✅ Type `cd ~/about` — page navigates to `/about/`.

If any check fails, fix before continuing. Stop server: `kill %1`.

- [ ] **Step 6: Commit**

```bash
git add themes/terminal-dev/assets/js/shell.js themes/terminal-dev/layouts/index.html themes/terminal-dev/layouts/partials/head.html
git commit -m "feat(shell): drawer + input handling + cursor trigger + site data"
```

---

## Task 12: Shell drawer SCSS

The drawer needs styling that matches the site's existing terminal vars (`--bg-deep`, `--ink`, `--accent`, `--font-mono`, etc. from the SCSS tokens block).

**Files:**
- Modify: `themes/terminal-dev/assets/sass/main.scss`

- [ ] **Step 1: Append shell styles to `main.scss`**

Append to the bottom of `themes/terminal-dev/assets/sass/main.scss`:

```scss
/* ─── shell drawer ──────────────────────────────────────────── */
.shell-drawer {
  position: fixed;
  left: 0; right: 0; bottom: 0;
  height: 35vh;
  min-height: 280px;
  max-height: 480px;
  background: var(--bg-deep);
  border-top: 1px solid var(--rule-hard);
  font-family: var(--font-mono);
  font-size: 0.875rem;
  color: var(--ink);
  display: flex;
  flex-direction: column;
  transform: translateY(100%);
  transition: transform 220ms ease;
  z-index: 1000;
  box-shadow: 0 -8px 24px rgba(0,0,0,0.08);
}

.shell-drawer.open { transform: translateY(0); }

.shell-titlebar {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  padding: var(--s-2) var(--s-3);
  background: var(--bg-elev);
  border-bottom: 1px solid var(--rule);
  font-size: 0.75rem;
  color: var(--ink-soft);
}
.shell-titlebar .lights { display: inline-flex; gap: 4px; }
.shell-titlebar .lights span {
  width: 10px; height: 10px; border-radius: 50%;
  background: var(--rule-hard);
}
.shell-titlebar .name { flex: 1; }
.shell-close {
  background: none; border: none; cursor: pointer;
  font-size: 1rem; color: var(--ink-mute); padding: 0 var(--s-2);
}
.shell-close:hover { color: var(--ink); }

.shell-output {
  flex: 1;
  overflow-y: auto;
  padding: var(--s-3);
  white-space: pre-wrap;
  word-break: break-word;
}
.shell-line { line-height: 1.5; }
.shell-line-cmd { color: var(--accent); }

.shell-form {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  padding: var(--s-2) var(--s-3);
  border-top: 1px solid var(--rule);
  background: var(--bg);
}
.shell-prompt { color: var(--accent); }
.shell-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: inherit;
}

/* shell hint line in footer */
.foot-shell-hint {
  display: block;
  color: var(--ink-mute);
  font-size: 0.75rem;
  margin-top: var(--s-2);
}

/* clickable cursor cue */
.hero .prompt .cursor { cursor: pointer; }
.hero .prompt .cursor:hover { opacity: 0.7; }
```

- [ ] **Step 2: Build and visually verify**

```bash
hugo server -D --quiet &
sleep 2
```

Open `http://localhost:1313/`:

- ✅ Drawer is hidden by default (off-screen).
- ✅ Click the cursor — drawer slides up smoothly from the bottom.
- ✅ Drawer styling matches: monospace, dim background, prompt in accent color, three lights in titlebar, close button in top right.
- ✅ Output area scrolls. Long output (run `help`) doesn't break layout.
- ✅ ESC and clicking outside the drawer close it.
- ✅ Toggle theme to dark — drawer colors update.
- ✅ On mobile width (375px), drawer fills the viewport width and is usable.

Stop server: `kill %1`.

- [ ] **Step 3: Commit**

```bash
git add themes/terminal-dev/assets/sass/main.scss
git commit -m "style(shell): drawer styling + clickable cursor cue"
```

---

## Task 13: Footer hint + ps-live `top` event listener

Two small wires that finish the spec.

**Files:**
- Modify: `themes/terminal-dev/layouts/partials/footer.html`
- Modify: `themes/terminal-dev/assets/js/ps-live.js`

- [ ] **Step 1: Add the footer hint**

In `themes/terminal-dev/layouts/partials/footer.html`, find the `<div class="foot-system">` block. The current content (lines 19–23) ends with:

```html
      <span class="k">last build</span> {{ $build }}
```

Append the hint immediately after, still inside the same `<div class="foot-system">`:

```go-html-template
      <span class="k">last build</span> {{ $build }}<br>
      <span class="foot-shell-hint">// click the cursor to open a shell</span>
```

- [ ] **Step 2: Wire the `top` listener in `ps-live.js`**

Append to `themes/terminal-dev/assets/js/ps-live.js`, after the existing `if (typeof window !== 'undefined' ...)` block:

```javascript
if (typeof document !== 'undefined') {
  document.addEventListener('shell:top', () => {
    const rows = document.querySelectorAll('.ps-row:not(.ps-head)');
    rows.forEach((row, i) => {
      setTimeout(() => {
        row.classList.add('ps-row-pulse');
        setTimeout(() => row.classList.remove('ps-row-pulse'), 400);
      }, i * 120);
    });
  });
}
```

- [ ] **Step 3: Add the pulse animation in SCSS**

Append to `themes/terminal-dev/assets/sass/main.scss`:

```scss
.ps-row-pulse {
  animation: ps-pulse 400ms ease;
}
@keyframes ps-pulse {
  0%   { background: var(--accent-soft); }
  100% { background: transparent; }
}
```

- [ ] **Step 4: Build and verify**

```bash
hugo server -D --quiet &
sleep 2
```

Open `http://localhost:1313/`:

- ✅ Footer shows the muted line `// click the cursor to open a shell` directly below `last build`.
- ✅ Open the shell, type `top` — each ps row pulses with a brief accent-color highlight, staggered.

Stop server: `kill %1`.

- [ ] **Step 5: Commit**

```bash
git add themes/terminal-dev/layouts/partials/footer.html themes/terminal-dev/assets/js/ps-live.js themes/terminal-dev/assets/sass/main.scss
git commit -m "feat: footer shell hint + top easter egg pulses ps rows"
```

---

## Task 14: Final verification pass + npm test

- [ ] **Step 1: Run the full test suite**

```bash
cd themes/terminal-dev && npm test
```

Expected: all tests across `ps-live.test.js`, `shell-commands.test.js`, and `smoke.test.js` pass. Total ≥ ~30 tests.

- [ ] **Step 2: Production-mode build + visual smoke**

```bash
cd /Users/koenvdb/projects/koenvanderborght-dev.github.io
hugo --quiet
hugo server --renderToDisk --quiet &
sleep 2
```

Walk through every behavior from the spec one more time:
- ✅ Page renders identically to before for non-technical visitors (no visible button, banner, or new chrome — only the muted footer hint).
- ✅ `ps -ef` rows: `borgdock` shows live version (or cached). `writing/ai-native` shows current post count from build. `dad-mode` ticks live uptime in years/days/hours.
- ✅ With JS disabled: page still works; rows show build-time fallbacks; footer hint is just text (clicking the cursor does nothing).
- ✅ Click cursor → shell opens. All commands behave as in their tests. ESC closes. History persists across reload.
- ✅ Mobile (375px): drawer usable, table doesn't break, footer hint readable.
- ✅ Dark mode: drawer + ps-row-pulse colors look right.
- ✅ Lighthouse run on the homepage in DevTools: no new accessibility violations introduced.

- [ ] **Step 3: Stop server, no commit needed (tests-only step)**

```bash
kill %1
```

If any verification fails, return to the relevant task to fix.

---

## Out of scope (documented for follow-up)

These are deliberately deferred to v2 and are NOT part of this plan:

- Boot sequence on first visit
- Spotify / last.fm / Discord "now playing" row
- Shell parity on `/about`, `/posts`, `/series` pages (homepage only for v1)
- `tab` autocompletion in the shell
- Shareable shell session URLs (e.g. `?cmd=ls+posts/`)

---

## Sub-skill handoff

This plan is ready for execution.
