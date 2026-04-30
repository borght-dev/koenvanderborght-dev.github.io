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
  const ctx = makeCtx();
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
