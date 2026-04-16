# GitHub Actions Step Highlighter

A Chrome extension that shows the currently running step for each job on a GitHub Actions workflow run page — without opening logs.

![Panel showing jobs and highlighted active step](docs/screenshot-placeholder.png)
<!-- Replace with an actual screenshot once the extension is running -->

## The problem

GitHub's workflow run UI highlights the current **job** but not the current **step**. To see real progress you have to open each job's log. This extension surfaces step-level progress directly on the run page.

## What it does

- Injects a compact sidebar panel on any `github.com/{owner}/{repo}/actions/runs/{id}` page
- Lists all jobs and their steps with status indicators (running, completed, failed, queued, skipped)
- Highlights the currently active step per job with a blue left border and pulsing indicator
- Auto-refreshes every 7 seconds while the run is active
- Works on **public repos without a token**; supports **private repos** via a stored personal access token

## Install from source

**Requirements:** Node.js 18+, npm, Google Chrome

```bash
git clone https://github.com/your-username/github-actions-progress-viewer.git
cd github-actions-progress-viewer
npm install
npm run build
```

1. Open `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked** and select the `dist/` folder

The extension icon appears in your toolbar. Navigate to any GitHub Actions run URL and the panel appears on the right side of the page.

## Private repository setup

For private repos the GitHub API requires authentication:

1. Go to [github.com/settings/tokens](https://github.com/settings/tokens) → **Generate new token (classic)**
2. Select the `repo` scope
3. Copy the token (starts with `ghp_`)
4. Click the extension icon in Chrome and paste the token → **Save**

The token is stored only in your browser's extension storage (`chrome.storage.local`) and is sent exclusively to `api.github.com`. It is never logged or exposed in the page DOM.

## Permissions

| Permission | Reason |
|-----------|--------|
| `storage` | Persist your personal access token locally |
| `https://github.com/*` | Inject the panel on GitHub run pages |
| `https://api.github.com/*` | Fetch job and step data from the GitHub REST API |

## Development

```bash
npm run dev        # watch mode with source maps
npm run type-check # TypeScript check without building
```

After any change, reload the extension on `chrome://extensions` (click the refresh icon on the extension card), then hard-refresh the GitHub tab.

## Tech stack

- **Manifest V3** Chrome extension
- **TypeScript 5** compiled with webpack 5 + ts-loader
- No runtime dependencies — pure DOM, no framework
