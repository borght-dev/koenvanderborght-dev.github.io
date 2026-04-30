import { formatUptime } from './ps-live.js';

export function tokenize(input) {
  return input.trim().split(/\s+/).filter(Boolean);
}

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
