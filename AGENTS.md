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
    - **Git:** Automatically stages `sw.js` for the version commit.
- **UI Display:**
    - **Runtime:** `js/cache-control.js` fetches `package.json` at runtime to display the version string in the UI.

> [!IMPORTANT]
> **Agent Rule:** When modifying any site content that requires cache invalidation:
>
> **Protocol:**
> 1. **Preferred Method:** Run `npm version patch`. This ensures `sw.js` is modified (via `CACHE_NAME` update), forcing browsers to detect the new Service Worker.
> 2. **Manual Fallback:** If the script fails, you must MANUALLY update the `CACHE_NAME` variable in `sw.js` to a new unique string.
>
> **Why?** If `sw.js` remains byte-identical, the browser will ignore the update, and users will remain on the old cached version.

### Deployment Pipeline
- **Target:** [fly.io](https://fly.io)
- **Production URL:** [https://moukaeritai.work/](https://moukaeritai.work/)
- **Repository:** [GitHub - TakashiSasaki/moukaeritai.work](https://github.com/TakashiSasaki/moukaeritai.work)
- **Trigger:** Automated deployment occurs on every push to the `main` branch.

---

## 2. Core Architecture & Navigation

### Single Page Application (SPA)
**Decision:** Hash-based client-side routing.

**Implementation:**
- **Structure:** `index.html` contains all logical views (Home, Projects, Bookmarks, Personalize) as separate `<div id="view-name" class="spa-view">` elements.
- **Routing:** `script.js` listens to the `hashchange` event (and on load) to toggle visibility.
- **State:** Transient DOM state + `localStorage` (UUID).

### Data Management
**Decision:** Separation of content from presentation.
- **Static Data:** `bookmarks.json` (Fetched via JS).
- **Dynamic Data:** Firebase Firestore (Future implementation).
- **Sitemap Handling:** 
    - `sitemap.xml` contains absolute production URLs (e.g., `https://moukaeritai.work/...`).
    - **Agent Rule:** Any client-side logic utilizing `sitemap.xml` (e.g., `js/cache-control.js`) **MUST** dynamically replace the domain part of the URL with `window.location.origin`. This ensures functionality in development (localhost, Codespaces) and staging environments.

### Identity & Backend
**Decision:** Firebase Authentication (Google Provider).

**Implementation:**
- **SDK:** initialized in `script.js` using modular Firebase v9+ imports.
- **Auth Flow:** `signInWithPopup` for Google Login.
- **UI:** `onAuthStateChanged` listener updates the "Personalize" view and header icon state.

---

## 3. PWA & Service Worker Strategy

### Offline Mode Strategy
**Decision:** Explicit Offline Mode Control.

**Implementation:**
- **Default:** Service Worker starts in "Passthrough" mode (does not intercept fetches).
- **Activation:** `js/cache-control.js` sends a `SET_OFFLINE_MODE: true` message to the SW on startup.
- **Logic:** The SW only serves from cache if `isOfflineModeEnabled` is true.

### Update Protocol
**Decision:** User-controlled update activation.

**Implementation:**
- **Controlled Activation:** `script.js` listens for `updatefound`.
- **UI:** A Toast notification appears: *"A new version is available."*
- **Action:** Clicking **[Update]** sends `SKIP_WAITING` to the SW, triggering a page reload.

### Maintenance Rule
> [!IMPORTANT]
> **Agent Rule:** When adding NEW files (HTML, JS, CSS, JSON, Images) to the project:
> 1. **Update `ASSETS`:** You **MUST** manually add the relative path to the `ASSETS` array in `sw.js`.
> 2. **Verification:** Failure to do this will result in the new file being unavailable in Offline Mode.

---

## 4. Interaction & Experimental Features

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
