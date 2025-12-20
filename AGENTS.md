# Agent Decisions

## Service Worker Cache Naming

**Decision:** The service worker cache name (`CACHE_NAME` in `sw.js`) will be updated to match the current Git commit hash.

**Reasoning:** This approach ensures that a new cache is created with every new deployment, preventing issues with stale content and ensuring users always receive the latest version of the application. This is a manual step that needs to be performed when a new deployment is intended to update the service worker cache.