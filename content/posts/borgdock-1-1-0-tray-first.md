---
title: "BorgDock 1.1.0 — tray-first, in-app toasts, the file palette goes faster"
subtitle: "Out of your way by default, with a global hotkey to summon the sidebar when you actually want it. Plus toasts, faster palette startup, and a worktree-aware checkout flow."
date: 2026-04-23
tags: [log, borgdock, release]
description: "Release notes for BorgDock 1.1.0 — a tray-first workflow, in-app notification toasts, a first-run setup wizard, and palette startup that's actually instant on repeat use."
---

`v1.1.0` ships with the biggest behavioural change since I started shipping
BorgDock: it stays out of your way by default. The sidebar no longer pops
open on launch — the tray icon is the new constant presence — and a
configurable global hotkey summons either the flyout or the full sidebar
on demand. This is the workflow I've been quietly running for two weeks.
It feels right.

## What's new

- **Tray-first workflow.** No more sidebar at startup. `Ctrl+Win+Shift+F`
  opens the tray flyout for a quick glance; `Ctrl+Win+Shift+G` summons the
  full sidebar when you want to dig in. Right-click the tray for
  *Show flyout / Show sidebar / Settings / What's new / Quit*. Both hotkeys
  are configurable in Settings.

- **In-app notification toasts.** Notifications are now styled BorgDock
  toasts near the tray instead of landing in Windows Action Center. Each
  toast shows title, severity, and inline action buttons (*Fix with Claude*,
  *Open*) so you can react without opening the sidebar. Auto-hides after
  7 seconds, pauses on hover, stacks up to three when multiple events fire
  close together.

- **First-run setup wizard as a modal.** New users see a centered modal
  wizard on first launch instead of the docked sidebar. Subsequent launches
  go straight into the tray-first experience.

- **Changes section in the file palette.** Press `Ctrl+F8` and modified /
  added / deleted files from the current worktree are grouped at the top
  of the results, before any search query. Jump from palette to diff
  without context-switching.

- **Worktree-aware PR checkout.** Checking out a PR honors the correct git
  worktree and preloads its baseline for the file viewer, so you see the
  exact change set instead of raw file contents.

- **Deep-linkable file viewer.** The file viewer can open with a specific
  baseline via URL query param, making viewer windows shareable across
  palette → viewer handoffs.

## Quietly faster

- **The product is now BorgDock** (renamed from PRDock). Tray icon,
  settings, logs, and AppData paths all follow the new name.
- **File palette startup is instant on repeat use.** The file index
  persists across sessions in a SQLite-backed cache with in-flight
  deduplication. No more rescanning your worktrees every time you open
  the palette.
- **DPI-correct flyout positioning.** The flyout sits cleanly above the
  taskbar at any display scale.
- **Tray icon shows a loading state.** While BorgDock fetches your PRs on
  startup, the tray icon gently breathes with a *BorgDock — loading…*
  tooltip.
- **Cross-platform tray positioning.** macOS and GNOME/Ubuntu now anchor
  the flyout to the top-right near the menu bar / indicator area. Windows
  keeps its bottom-right anchor.
- **Polling resilience.** When a poll fails, previously-fetched check
  statuses are preserved instead of cleared. Your PR list stays
  informative through transient network hiccups.

## Bugs that bit me

- Split view in the file viewer now remembers its choice across sessions
  and opens at a proper 50/50 layout instead of an unbalanced default.
- File palette search results scroll correctly when long.
- Corrupt file-palette cache is auto-quarantined and rebuilt instead of
  breaking palette load.
- Selected-index now correctly offsets when the *Changes* section is
  present, so arrow-key navigation lands on the right row.

> Tray-first was the right call. I haven't reached for the sidebar
> reflexively in days — only when I actually want a panel open. Less
> screen real estate, less ambient noise. The dock is finally what I
> wanted it to be: a thing that's there when I ask, invisible when I
> don't.

Full notes in `CHANGELOG.md` on the repo.
