# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # install devDependencies
npm run dev          # webpack in watch mode (development, with source maps)
npm run build        # webpack production build → dist/
npm run type-check   # tsc --noEmit (no emit, just type errors)
```

After `npm run build` (or `npm run dev`), load the `dist/` directory as an unpacked extension in Chrome via `chrome://extensions → Load unpacked`.

## Architecture

Three isolated compilation units, each a webpack entry point:

| Entry | File | Role |
|-------|------|------|
| `background` | `src/background/background.ts` | MV3 service worker — owns all GitHub API calls and `chrome.storage` access |
| `content` | `src/content/content.ts` | Runs on GitHub run pages — mounts the panel, drives polling, watches for SPA navigation |
| `popup` | `src/popup/popup.ts` | Extension popup — minimal PAT save/clear form |

Communication flow:
```
content.ts  ──sendMessage──►  background.ts  ──fetch──►  api.github.com
    │                              │
    ▼                              ▼
panel.ts (DOM)            chrome.storage.local (token)
```

The background service worker is the only layer that ever reads the stored token. The token is never passed to the panel or injected into the page DOM.

## Key files

- `src/types.ts` — all shared data models (`WorkflowRunContext`, `JobState`, `StepState`) and message union types
- `src/api/github.ts` — typed GitHub API client; all status/conclusion string→union mapping is in `toStepStatus`, `toJobStatus` etc. here — extend there first when GitHub adds new values
- `src/ui/panel.ts` — entire injected panel (CSS inlined as template literal scoped to `#ghash-panel`, DOM built with `createElement`; no framework)
- `src/utils/polling.ts` — `Poller` class; calls callback immediately on `start()`, then on interval; call `setIntervalMs()` to switch to slow-poll once run completes

## SPA navigation

GitHub is a Turbo-driven SPA. `content.ts` intercepts `history.pushState` / `history.replaceState` and listens for `turbo:load`. The panel is appended to `document.body`; if Turbo replaces the body, `panel.isInDocument()` returns `false` and `panel.mount()` is called again before the next render. Collapsed/expanded state persists across remounts via class properties.

## Static assets

Files under `public/` are copied verbatim to `dist/` by `copy-webpack-plugin`. The manifest references compiled JS files at the root of `dist/` (no subdirectory).

## Adding a new API field

1. Add the field to the relevant interface in `src/types.ts`
2. Map it in `src/api/github.ts` (`normalizeJob` / step mapping)
3. Consume it in `src/ui/panel.ts`
