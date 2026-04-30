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
        // Persist a flag so the shell reopens on the destination page.
        try { sessionStorage.setItem('shell:reopen', '1'); } catch { /* ignore */ }
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
        // Theme button cycles auto → light → dark → auto. Click up to 3 times to
        // land on the requested mode. If the cycle is ever extended, raise this.
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

  print(`koen@web — type 'help' for commands. ESC or 'exit' to close.`);

  // Reopen the shell after a same-tab navigation triggered by `cd`/`cat`.
  try {
    if (sessionStorage.getItem('shell:reopen') === '1') {
      sessionStorage.removeItem('shell:reopen');
      open();
    }
  } catch { /* ignore */ }
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => bootShell());
  } else {
    bootShell();
  }
}
