# Phone Authoring Setup — Obsidian + Git

The goal: open Obsidian on your phone, edit a markdown file, tap one button, the site rebuilds and goes live in ~60 seconds.

---

## One-time setup (10 minutes, on phone)

### 1. Install Obsidian

- iOS: [App Store](https://apps.apple.com/us/app/obsidian-connected-notes/id1557175442)
- Android: [Play Store](https://play.google.com/store/apps/details?id=md.obsidian)

### 2. Install Working Copy (iOS) or MGit (Android) for Git

You need a git client on the phone that Obsidian can integrate with.

**iOS:** [Working Copy](https://workingcopy.app/) — free for read; one-time purchase to push. The reliable choice.
**Android:** Obsidian's own [Git plugin](https://github.com/Vinzent03/obsidian-git) works directly. Skip the next step on Android.

### 3. Clone the repo to the phone

**On iOS (Working Copy):**

1. Open Working Copy → "+ Clone repository"
2. URL: `https://github.com/borght-dev/borght-dev.github.io.git`
3. Authenticate with GitHub (Working Copy walks you through it)
4. Once cloned, tap the repo → "Setup External Editor" → choose Obsidian → point at the **whole repo folder** (not just `content/`)

**On Android (Obsidian Git plugin):**

1. Create a new vault in Obsidian → set its location to a fresh folder
2. Settings → Community plugins → Browse → install **Obsidian Git**
3. In the plugin settings: paste the repo URL, authenticate, and clone

### 4. Tell Obsidian which folders matter

In Obsidian → Settings → Files & Links → Default location for new notes:
- Set to `content/posts`

Optional but recommended — install these community plugins:
- **Templater** — auto-fill frontmatter for new files
- **Image Auto Upload** (or Working Copy handles this on iOS) — saves camera photos into `public/images/`
- **Linter** — keeps frontmatter tidy

---

## The daily writing flow

1. Open Obsidian → navigate to `content/series/<series-name>/<episode>.md`
2. Write
3. When ready to publish:
   - Change `draft: true` → `draft: false`
   - Add `date: 2026-04-25` (today)
4. Tap **Working Copy → Push** (iOS) or **Obsidian Git → Push** (Android)
5. GitHub Action rebuilds → live in ~60s at [koenvdborght.nl](https://koenvdborght.nl)

That's it.

---

## Voice-to-text drafts

iOS dictation handles markdown surprisingly well. To dictate a section:

1. Tap into the editor where you want to write
2. Tap the microphone on the keyboard
3. Speak. Say "new paragraph" for line breaks, "comma," "period," "question mark."

Polish on the laptop later. Voice gets you 80% there in 5 minutes.

---

## Adding images

1. Take a photo (or screenshot) on your phone
2. In Obsidian, paste it into a note — it'll be saved into `public/images/<filename>.png` (configure via plugin)
3. Reference in markdown: `![alt text](/images/filename.png)`

---

## What's pre-staged for you

Open Obsidian and you'll find these draft files ready to edit:

### Series 1 — Building an Enterprise Platform with Zero Hand-Written Code (5 episodes)

| # | File | Title |
|---|------|-------|
| 1 | `content/series/ai-generated-platform/01-the-claim-and-the-setup.md` | The Claim and the Setup |
| 2 | `content/series/ai-generated-platform/02-the-reference-code-pattern.md` | The Reference-Code Pattern: How AI Reads a 15-Year Legacy |
| 3 | `content/series/ai-generated-platform/03-hallucinated-columns.md` | When Claude Made Up a Database Schema (and How We Caught It) |
| 4 | `content/series/ai-generated-platform/04-vertical-slices-generated.md` | Vertical Slices Are the Best Architecture for AI Codegen |
| 5 | `content/series/ai-generated-platform/05-ortec-15-plans-one-worker.md` | The Ortec Integration: 15 Plans, One Worker, Zero Manual Code |

### Series 2 — BorgDock: A Desktop Sidebar for GitHub PRs (4 episodes)

| # | File | Title |
|---|------|-------|
| 1 | `content/series/borgdock/01-why-a-sidebar.md` | Why a Sidebar — and Not Yet Another Browser Tab |
| 2 | `content/series/borgdock/02-parsing-actions-logs.md` | Parsing GitHub Actions Logs to Surface Root Causes |
| 3 | `content/series/borgdock/03-tauri-main-thread-deadlock.md` | The Tauri Main-Thread Deadlock That Took a Week to Find |
| 4 | `content/series/borgdock/04-one-click-auto-fix.md` | One-Click Auto-Fix: Wiring BorgDock into Claude Code |

### Series 3 — Multi-Worktree .NET (3 episodes)

| # | File | Title |
|---|------|-------|
| 1 | `content/series/multi-worktree-dotnet/01-run-fsphorizon-explained.md` | The PowerShell Helper That Runs 5 Aspire Apps Side-by-Side |
| 2 | `content/series/multi-worktree-dotnet/02-aspire-gotchas.md` | Aspire Gotchas at Scale: The Pile of Papercuts |
| 3 | `content/series/multi-worktree-dotnet/03-worktree-to-deployment.md` | From Worktree to Deployment in One Command |

### Series 4 — AI-Native Engineering: A Workflow Series (6 episodes)

| # | File | Title |
|---|------|-------|
| 1 | `content/series/ai-native-engineering/01-slash-commands-as-vocabulary.md` | Slash Commands as Team Vocabulary |
| 2 | `content/series/ai-native-engineering/02-rules-as-guardrails.md` | Rules as Guardrails: Codifying Tribal Knowledge into Prompt Fragments |
| 3 | `content/series/ai-native-engineering/03-nightly-self-healing-loop.md` | The Nightly Self-Healing CI Loop |
| 4 | `content/series/ai-native-engineering/04-security-auto-fix.md` | Auto-Fixing Security Findings Overnight |
| 5 | `content/series/ai-native-engineering/05-ranorex-to-playwright.md` | Migrating Ranorex to Playwright with Claude as Interpreter |
| 6 | `content/series/ai-native-engineering/06-event-driven-ai-plumbing.md` | Auto-Cancelling Stale Claude Reviews on Merge |

Each file has:
- A working title (you can change it)
- An H2/H3 outline matching the series plan
- `> *Draft.*` blocks where the prose should go

Just delete the `> *Draft.*` lines and start writing.

---

## Suggested first post

**`content/series/ai-native-engineering/03-nightly-self-healing-loop.md`** — the nightly self-healing CI loop. The hook is concrete (launchd at 09:30, Claude fixing tests in your sleep), and you have all the material to write it well.

---

## Troubleshooting

**Push fails on phone**
- Check that Working Copy / Obsidian Git is authenticated as `borght-dev` (not your work account).

**Site doesn't update after push**
- Check Actions tab on GitHub. The deploy workflow takes ~60s.
- If it failed, the workflow logs will show why — usually a frontmatter typo (missing `date`, wrong `seriesId`).

**Episode doesn't show up**
- Check `draft: false` in the frontmatter.
- Check that `seriesId:` matches the parent folder name and the `index.md` of that folder.

**Obsidian shows scary git errors**
- Don't panic. Open Working Copy directly and resolve there. Worst case: pull, then push.
