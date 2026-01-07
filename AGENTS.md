# Agent Decisions

## Versioning & Deployment Workflow

**Decision:** Automated Cache & UI Versioning via `npm version`.

**Workflow:**
1.  **System of Record:** `package.json`'s `version` field is the single source of truth for the project version (Semantic Versioning).
2.  **Trigger:** Developers use `npm version [patch|minor|major]` to increment the version.
3.  **Automation (`update-version.js`):**
    *   This script runs automatically as a `version` npm script hook.
    *   **Cache Name:** Updates `CACHE_NAME` in `sw.js` to format: `moukaeritai-v{version}-{YYYYMMDDHHmmss}`.
    *   **UI Display:** Updates the version display in `index.html` (footer) to format: `v{version} ({YYYY/MM/DD HH:mm})`.
    *   **Git:** Automatically stages (`git add`) modified files so they are included in the version commit and tag created by npm.

**Reasoning:**
*   Ensures strict synchronization between the project version, the Service Worker cache, and the visible version on the site.
*   "Cache Name = Site Version" simplifies debugging and user support.
*   Automating the process eliminates human error (forgetting to update cache name).

## Service Worker Update Strategy (PWA)

**Decision:** Active User Prompt for Updates.

**Implementation:**
1.  **No Auto-Skip:** `sw.js` does NOT automatically `skipWaiting()` on install. It waits for user confirmation.
2.  **UI Notification:** `script.js` detects `updatefound` (new SW waiting) and displays a Toast notification in the bottom right: "A new version is available. [Update] [Dismiss]".
3.  **User Action:** Clicking [Update] sends a `SKIP_WAITING` message to the Service Worker.
4.  **Reload:** Upon `controllerchange`, the page automatically reloads to serve the fresh content.

**Reasoning:**
*   Prevents "stale content" issues common in PWAs.
*   Avoids disrupting the user's current session by reloading without permission.
*   Provides a clear, app-like update experience.

## Deployment Platform

*   **Target:** Fly.io
*   **Identification:** Presence of `fly.toml` and `Dockerfile`.
*   **Trigger:** Pushing to the `main` branch of the GitHub repository triggers the deployment (as per `README.md`).


# その他

このリポジトリは fly.io で https://moukaeritai.work/ として公開される。
https://github.com/TakashiSasaki/moukaeritai.work
の main リポジトリにプッシュすると自動的にデプロイされる。

