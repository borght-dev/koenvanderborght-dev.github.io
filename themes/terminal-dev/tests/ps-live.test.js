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
