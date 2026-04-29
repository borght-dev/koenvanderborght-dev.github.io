---
title: "Why a Sidebar — and Not Yet Another Browser Tab"
seriesId: borgdock
episode: 1
draft: true
summary: "The pain that justified building a desktop app instead of using GitHub.com. The Tauri choice and what it costs."
---

> *Draft.*

## The pain

- Every PR review = open browser → find tab → wait for GitHub to load → click into checks
- CI failures arrive as email/Slack, then disappear into history
- Nothing tells me "this PR has been red for 30 minutes"

## The shape of the answer

A docked sidebar window:

- Always visible on a second monitor edge
- One row per open PR
- CI status as the loudest visual element
- Click → root-cause + auto-fix

## Why Tauri

- Small binary
- Native window controls (always-on-top, docking, transparent)
- Rust for the noisy work (polling, parsing, git)
- Web tech for the UI (I already speak React)

## Why not Electron

...
