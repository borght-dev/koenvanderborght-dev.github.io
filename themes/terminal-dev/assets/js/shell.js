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
  const pathToTilde = (p) => {
    if (!p || p === '/') return '~';
    return '~/' + p.replace(/^\//, '').replace(/\/$/, '');
  };
  const pwd = pathToTilde(window.location.pathname);
  const promptStr = `${pwd} $`;

  // Reflect cwd in the live input prompt.
  const promptEl = drawer.querySelector('.shell-prompt');
  if (promptEl) promptEl.textContent = promptStr;

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
    el.textContent = `${promptStr} ${cmd}`;
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
    // Blur the input so global hotkeys (e.g. `\`) work again without first
    // requiring a click elsewhere to lose focus.
    input.blur();
  };

  const ctx = {
    print,
    navigate: (url) => {
      if (url.startsWith('http')) {
        window.open(url, '_blank', 'noopener');
      } else {
        // Persist a flag and the output buffer so the shell reopens on the
        // destination page with the same scrollback as before navigation.
        try {
          sessionStorage.setItem('shell:reopen', '1');
          sessionStorage.setItem('shell:output', output.innerHTML);
        } catch { /* ignore */ }
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
    pwd,
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
    if (e.target === drawer) { close(); return; }
    // Don't steal focus while the user has selected text — focusing an input
    // collapses the document selection and breaks copy.
    const sel = window.getSelection();
    if (sel && sel.toString().length > 0) return;
    if (e.target !== input && !e.target.closest('.shell-close')) {
      input.focus();
    }
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

  // Global hotkey: backslash opens the shell from any page, except when
  // the user is already typing in an input/textarea/contenteditable.
  document.addEventListener('keydown', (e) => {
    if (e.key !== '\\') return;
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    e.preventDefault();
    open();
  });

  // Detect reopen-after-navigation before printing the welcome banner.
  let reopening = false;
  try {
    if (sessionStorage.getItem('shell:reopen') === '1') {
      reopening = true;
      sessionStorage.removeItem('shell:reopen');
      const saved = sessionStorage.getItem('shell:output');
      if (saved) {
        output.innerHTML = saved;
        sessionStorage.removeItem('shell:output');
      }
    }
  } catch { /* ignore */ }

  if (reopening) {
    open();
  } else {
    print(`koen@web — type 'help' for commands. ESC or 'exit' to close.`);
  }
}

function runTypewriters(root = document) {
  root.querySelectorAll('[data-typewriter]').forEach((el) => {
    const text = el.getAttribute('data-typewriter');
    el.removeAttribute('data-typewriter');
    el.textContent = '';
    let i = 0;
    const step = () => {
      el.textContent = text.slice(0, i);
      i++;
      if (i <= text.length) setTimeout(step, 28);
    };
    setTimeout(step, 1200);
  });
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { bootShell(); runTypewriters(); });
  } else {
    bootShell();
    runTypewriters();
  }
}
