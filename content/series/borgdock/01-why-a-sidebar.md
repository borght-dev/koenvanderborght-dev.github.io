---
title: How it all began
seriesId: borgdock
episode: 1
draft: true
summary: The pain that justified building a desktop app instead of using GitHub.com. The Tauri choice and what it costs.
---

> *Draft.*

It all started when I started working on a new internal project at Gomocha which without getting into too much detail was essentially a complete rewrite of the 30 year old software platform I have been working on for the past 9 years.

I set this repository up so that whenever you create a PR, we would create a build, run the unit tests and integration tests and then deploy it to staging and execute E2E tests against it. While that was running Claude would review the PR and give feedback. After everything was green, the PR could be approved. 
## The pain
Especially in the beginning, I was going _fast_. This means I had multiple PRs open at all times and it was getting to a point where I had to constantly check on the status of the PRs. Especially because - in my experience - the world of E2E tests is a flaky one. I also didn’t have my [git hooks](article-about-git-hooks-goes-here) setup yet and thus, I had a lot of CI checks failing on me because of failing (at the time) eslint/typescript checks which for some reason are a lot stricter when running a build compared to just “running” during a local app run. 

The thing is, I am not great at keeping track of things/remembering things, so I have to find ways to help myself in a way so I do not forget or, better yet, cannot forget. That’s where BorgDock (initially called PRDock) came in. 

## The shape of the answer
I always have been a Windows user, I’ve dabbled in some Linux in the past, but because I played PC games (read: League of Legends) I always came back to Windows. This has changed a little since I started using my Mac Mini M1 to help me be [more productive from my phone](link-to-termius-setup-goes-here).

I have always liked the idea of a dock, a long, long time ago I was a big fan of Stardock ObjectDock. I am also one of the few that do like the idea of a widget bar/sidebar in Windows, but sadly Microsoft doesn't really make it possible to add your own widgets to it so I decided to ask Claude Code for some alternatives. 

A docked sidebar window would always be visible on the edge of the screen, it can show a row per PR, show the CI status and with a single click it could spawn a Claude Code session with a system prompt to attempt to automatically fix any failing test. 

# WPF
Initially I thought, I’m a Windows user, what could be a better feel than native Windows technologies right?! Well, I was wrong. Implementing anything took much longer than I wanted and it never felt great. I also used Claude Code exclusively to write the code, and it turns out that Claude is much better at writing React code compared to writing WPF code, especially on the frontend. This also made it a lot harder to iterate on the UI, because whenever I would throw a mock which I created with claude.ai at Claude Code, it was always a much more “meh” experience compared to the “wow this looks pretty good”-mockups I would get at first. So after another awful outcome of a beautiful mockup, I decided to re-implementing PRDock in Tauri. Problem was, I already had some colleagues using this tool so I couldn’t ship a broken/half working version.

## Why Tauri

- Small binary
- Native window controls (always-on-top, docking, transparent)
- Rust for the noisy work (polling, parsing, git)
- Web tech for the UI (I already speak React)

## Why not Electron

...
