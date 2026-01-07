# Agent Decision Log & Project Guidelines

This document tracks architectural decisions, workflows, and infrastructure details for the `moukaeritai.work` project.

---

## 1. Versioning & CI/CD Workflow

### Automated Versioning
**Decision:** Single source of truth versioning via `package.json`.

**Workflow:**
- **System of Record:** The `version` field in `package.json` follows Semantic Versioning (SemVer).
- **Trigger:** Use `npm version [patch|minor|major]` to increment.
- **Automation (`update-version.js`):**
    - Runs automatically via the `version` npm hook.
    - **Service Worker:** Updates `CACHE_NAME` in `sw.js` (Format: `moukaeritai-v{version}-{timestamp}`).
    - **UI:** Updates the footer version string in `index.html` (Format: `v{version} ({YYYY/MM/DD HH:mm})`).
    - **Git:** Automatically stages updated files for the version commit.

> [!IMPORTANT]
> **Agent Rule:** When modifying any site content (HTML, CSS, JS), you **MUST** run `npm version patch` (or minor/major) before pushing. This is critical because `sw.js` relies on the version string in `CACHE_NAME` to invalidate the old cache. If you skip this, users will simply see the old cached version forever.

### Deployment Pipeline
- **Target:** [fly.io](https://fly.io)
- **Production URL:** [https://moukaeritai.work/](https://moukaeritai.work/)
- **Repository:** [GitHub - TakashiSasaki/moukaeritai.work](https://github.com/TakashiSasaki/moukaeritai.work)
- **Trigger:** Automated deployment occurs on every push to the `main` branch.
- **Infrastructure:** Identified by `fly.toml` and `Dockerfile`.

---

## 2. PWA & Service Worker Strategy

### Update Protocol
**Decision:** User-controlled update activation (no automatic `skipWaiting`).

**Implementation:**
- **Controlled Activation:** The Service Worker waits in the `installed` state.
- **User Notification:** `script.js` listens for `updatefound`. When a new version is detected, a Toast notification appears: *"A new version is available. [Update] [Dismiss]"*.
- **Activation:** Clicking **[Update]** sends `SKIP_WAITING` to the SW.
- **Refresh:** The page reloads automatically upon `controllerchange`.

**Reasoning:**
- Eliminates "stale content" while avoiding session disruption.
- Provides a native app-like experience for updates.

---

## 3. Interaction & Experimental Features

### Unified Input Handling
**Decision:** Use Pointer Events for all draggable/interactive components.

**Guidelines:**
- Use `pointerdown`, `pointermove`, and `pointerup` to unify Mouse and Touch handling.
- Implement `setPointerCapture` for drag interactions to maintain control even when the pointer leaves the target element.
- Use `requestAnimationFrame` for UI updates to ensure performance and prevent input lag.

### Infinite "Ring" Carousels
- **Logic:** Fixed DOM element recycling. 
- **Behavior:** Items shifted off-canvas are moved to the opposite end of the track with persistent labels.
- **Coordination:** Use persistent `(Row, Index)` labels for unique identification of elements within experimental layouts.
