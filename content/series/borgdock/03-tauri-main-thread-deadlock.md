---
title: "The Tauri Main-Thread Deadlock That Took a Week to Find"
seriesId: borgdock
episode: 3
draft: true
summary: "A Windows-only deadlock when calling window APIs from a Tokio task. The investigation, the fix, and the lesson about thread affinity."
---

> *Draft.*

## The symptom

App froze on Windows after ~30 minutes. Process alive, UI dead. macOS fine.

## The wrong hypotheses

1. WebView2 update issue — wasn't.
2. Polling thread starving the runtime — wasn't.
3. Event loop overflow — wasn't.

## The actual cause

Calling `window.set_position()` from a Tokio worker thread. On Windows, window APIs require the main thread. The call deadlocked silently waiting to be marshalled.

## The fix

Marshal all window calls through a channel that drains on the main thread.

## The lesson

Tauri docs mention this — once, in passing. Now I check thread affinity *first* on any platform-specific bug.
