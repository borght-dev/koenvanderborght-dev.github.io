---
title: "Ctrl+F8 — peeking at what the agents did while I wasn't looking"
subtitle: "A file palette for BorgDock, born from the moment I realised four agents had each been busy in a different worktree and I had no fast way to see what had changed."
date: 2026-04-22
tags: [log, borgdock, workflow]
description: "How a keystroke turned into BorgDock's File Palette: ripgrep search across worktrees, changed-files-first, Tree-sitter previews, and a dual diff view that handles stacked PRs."
---

The thing I didn't expect about running multiple agents in parallel is how
much of my day disappears into the gap between *"I started Claude on
something"* and *"let me actually look at what it did."* Four worktrees,
four agents, four different feature branches. I'd come back from making
coffee and there were eighty changed files spread across a tree I no
longer remembered the shape of.

This post is about the keystroke I added to fix that.

## The small problem behind the big problem

Reviewing AI-assisted work isn't really about reading diffs. It's about
**cheap orientation** — getting from *"what even happened?"* to *"oh
right, the auth middleware"* in less than a second.

What I was actually doing, before, was one of three things: looking the
file up on GitHub when I just needed a reference, opening it in
VS Code or Rider when I wanted to read it properly, or — embarrassingly
often — falling back to plain Windows Explorer to find the path. All
three pulled me out of the terminal, out of Claude Code, and out of
flow. The annoyance was less about clicks and more about the context
switch: every lookup cost me my own state.

I wanted one keystroke that wouldn't make me leave the terminal. So I
built one.

## Ctrl+F8 — the file palette

It's a global OS shortcut. Hit it from your editor, from the terminal,
from a browser, from anywhere — the palette pops up centred over
whatever you were doing. It's scoped to your active worktree by default,
but you can switch worktrees with arrow keys and pin custom roots if you
work outside git as well.

The whole thing is built around one constraint: **lightweight and fast.**
If it's not instant, you go back to Cmd-Tabbing into Explorer and the
tool has failed. So it pre-indexes every worktree on startup, persists
the index in a SQLite cache between sessions, and dedupes in-flight
scans so two open palettes never re-walk the same tree. First open of
the day takes whatever your disk can do; every subsequent open is
effectively free.

Search is **ripgrep**, because of course it is. Three modes:

- **filename search** by default — fuzzy, fast, opens instantly
- `> foo` — full-text content search across the worktree (regex)
- `@bar` — jump straight to a symbol (function, class, method) via
  Tree-sitter, not just files. The grammars are compiled from source
  per language, so you get accurate symbol resolution in TypeScript,
  Rust, C#, SQL, the lot — not just whatever a regex happens to match.

Arrow keys navigate. The preview pane on the right renders the file
underneath the cursor with full syntax highlighting, so you can usually
tell whether a hit is the right one without leaving the palette.

## Changes-first

Here's what unlocked the workflow for me.

Open the palette and the **first thing you see is the diff list** —
modified, added, and deleted files in the current worktree, grouped at
the top of the results before you've typed anything. So the first
keystroke after the agent stops working is `Ctrl+F8`, and the first
thing visible is *the entire change set.*

When you start typing a query, the search filters across both the
changes section and the rest of the worktree, so you can narrow into a
file you knew you wanted to look at without losing the diff context.

That single change — putting changes first, before search — is what made
the palette become muscle memory. It went from *"a thing I open when I'm
looking for a file"* to *"the thing I open every time I come back to
BorgDock to see what just happened."*

## Click for preview, Enter for the viewer

The right-hand preview is for triage. When you actually want to read the
file, hit `Enter` (or click) and the **code viewer** pops out as its own
window:

- **Syntax highlighting** powered by Tree-sitter — every grammar
  (TypeScript, Rust, C#, SQL, YAML, the usual suspects) compiled from
  source. Stays fast on large files.
- **Diff vs HEAD** — your local uncommitted changes, side-by-side.
  This is the *"what did the agent just do?"* view.
- **Diff vs base branch** — the cumulative change of your branch
  against `main` (or whatever branch you're stacked on). This is the
  *"is this PR getting too big?"* view.

The dual diff matters more than I expected. Half the time I'm not
asking *"what changed in the last commit?"* — I'm asking *"what does
this whole branch look like to a reviewer?"* Especially for stacked PRs,
where the base branch isn't `main` and a default diff against the
trunk would be misleading.

> The palette didn't ship with all of this on day one. The Changes
> section came a day later, after I noticed I was always typing the
> same fuzzy query for "the thing the agent just touched." If the
> answer is in the data, the keystroke shouldn't ask you to type it.

## What I'd add next

Most days the palette does exactly what I want. The few times it
doesn't:

- I want **per-agent attribution** in the diff list — which agent
  produced which change, so I can route review attention.
- I want a **"since last opened"** filter — show me only what's new
  since I last looked at this worktree, even if the worktree itself
  hasn't changed branch.
- I want the preview pane to **render commit messages** as well as file
  contents, so I can read intent before I read code.

None of this is exotic. It's just the natural pull of *make orientation
cheaper*, applied recursively.
