# Agent Decisions

## Service Worker Cache Naming

**Decision:** The service worker cache name (`CACHE_NAME` in `sw.js`) will be updated to use a string based on the latest commit date and time (YYYYMMDDHHMMSS format).

**Reasoning:** This approach ensures that a new cache is created with every new deployment, preventing issues with stale content and ensuring users always receive the latest version of the application. **Crucially, when the website's content changes, the `CACHE_NAME` must be updated to ensure users receive the fresh content and avoid issues with an outdated application cache.** Using the date and time provides a clear chronological identifier for each cache version. This is a manual step that needs to be performed when a new deployment is intended to update the service worker cache.