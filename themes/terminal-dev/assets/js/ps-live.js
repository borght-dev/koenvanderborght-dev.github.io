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
