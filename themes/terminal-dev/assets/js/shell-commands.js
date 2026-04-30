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
    run(ctx) { ctx.print(ctx.pwd || '~'); },
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
      const path = target || ctx.pwd || '~';
      const trimmed = path.replace(/\/$/, '').replace(/^~\/?/, '');
      // Root: list sections with trailing slash
      if (trimmed === '' || trimmed === '~') {
        for (const s of ctx.site.sections) ctx.print(`${s}/`);
        return;
      }
      // A known section (posts, series, ...): list its files
      const list = ctx.site[trimmed];
      if (Array.isArray(list)) {
        for (const item of list) ctx.print(item);
        return;
      }
      // Explicit unknown target → error. No-arg on a leaf dir → silent (real ls).
      if (target) ctx.print(`ls: ${target}: no such file or directory`);
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
      const raw = args[0];
      if (!raw || raw === '~' || raw === '~/' || raw === '/') return ctx.navigate('/');
      // Accept any of: posts, posts/, ~/posts, ~/posts/
      const key = raw.replace(/\/$/, '').replace(/^~\//, '');
      const map = {
        about: '/about/',
        posts: '/posts/',
        series: '/series/',
        borgdock: 'https://borgdock.pages.dev/',
      };
      if (Object.prototype.hasOwnProperty.call(map, key)) {
        return ctx.navigate(map[key]);
      }
      ctx.print(`cd: ${raw}: no such file or directory`);
    },
  },
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
