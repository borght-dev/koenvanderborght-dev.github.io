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
    // build-post-count is handled at Hugo build time — nothing to do client-side.
  });
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => bootPsLive());
  } else {
    bootPsLive();
  }
}

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
