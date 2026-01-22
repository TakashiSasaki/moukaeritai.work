export async function loadCacheControlUI(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
        const response = await fetch('components/cache-control.html');
        if (!response.ok) throw new Error('Failed to load cache control UI');
        const html = await response.text();
        container.innerHTML = html;
        
        // After injection, initialize the logic
        initCacheLogic();
    } catch (error) {
        console.error('Error loading cache control UI:', error);
    }
}

function initCacheLogic() {
    // --- Service Worker Logic ---

    async function manageServiceWorker(enable) {
        if (!('serviceWorker' in navigator)) return;

        try {
            const registration = await navigator.serviceWorker.register('./sw.js');
            // console.log('Service Worker registered with scope:', registration.scope);

            // Send State to SW
            const sendState = () => {
                const target = registration.active || navigator.serviceWorker.controller;
                if (target) {
                    target.postMessage({ type: 'SET_OFFLINE_MODE', value: enable });
                }
            };

            if (registration.active) sendState();
            navigator.serviceWorker.ready.then(reg => {
                if (reg.active) reg.active.postMessage({ type: 'SET_OFFLINE_MODE', value: enable });
            });

            // Helper to update the UI
            const updateLastCheckedUI = (dateString, isOffline = false) => {
                const display = document.getElementById('last-checked-display');
                if (display && dateString) {
                    display.style.display = 'inline';
                    display.textContent = `${dateString}${isOffline ? ' (Offline)' : ''}`;
                    if (!isOffline) {
                        display.style.color = '#27c93f';
                        setTimeout(() => { display.style.color = 'inherit'; }, 1000);
                    } else {
                         display.style.color = '#da3633';
                    }
                }
            };

            // 1. Restore last checked time from storage immediately
            const lastSaved = localStorage.getItem('last_update_check');
            if (lastSaved) {
                updateLastCheckedUI(lastSaved, true);
            }

            // Force an update check immediately
            registration.update().then(() => {
                const now = new Date();
                const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
                
                localStorage.setItem('last_update_check', timeString);
                updateLastCheckedUI(timeString, false);
            }).catch(() => {
                 const lastSaved = localStorage.getItem('last_update_check');
                 if (lastSaved) {
                    updateLastCheckedUI(lastSaved, true);
                 } else {
                     const display = document.getElementById('last-checked-display');
                     if (display) {
                         display.style.display = 'inline';
                         display.textContent = 'Offline';
                         display.style.color = '#da3633';
                     }
                 }
            });

            // Helper to show update toast
            const showUpdateToast = (worker) => {
                const toast = document.getElementById('update-toast');
                const updateBtn = document.getElementById('update-btn');
                const dismissBtn = document.getElementById('dismiss-btn');

                if (!toast) return;

                toast.classList.remove('hidden');

                updateBtn.onclick = () => {
                    worker.postMessage({ type: 'SKIP_WAITING' });
                    toast.classList.add('hidden');
                };

                dismissBtn.onclick = () => {
                    toast.classList.add('hidden');
                };
            };

            if (registration.waiting) {
                showUpdateToast(registration.waiting);
            }

            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        showUpdateToast(newWorker);
                    }
                });
            });
        } catch (error) {
             console.log('Service Worker registration failed:', error);
        }
    }

    // Always enable Service Worker
    manageServiceWorker(true);
    
    // Ensure the page reloads when the new SW takes control (global listener)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload();
        });
    }

    // --- Maintenance: Reset Cache ---
    const resetCacheBtn = document.getElementById('reset-cache-btn');
    if (resetCacheBtn) {
        resetCacheBtn.addEventListener('click', async () => {
            try {
                if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    for (const registration of registrations) {
                        await registration.unregister();
                    }
                }
                if ('caches' in window) {
                    const keys = await caches.keys();
                    for (const key of keys) {
                        await caches.delete(key);
                    }
                }
                window.location.reload(true);
            } catch (error) {
                console.error('Failed to reset cache:', error);
                alert('Failed to reset cache. Please try manually clearing your browser data.');
            }
        });
    }

    // --- Fetch package.json for Version ---
    fetch('package.json')
        .then(response => response.json())
        .then(pkg => {
            const versionDisplay = document.getElementById('app-version-display');
            if (versionDisplay && pkg.version) {
                const viaSW = navigator.serviceWorker && navigator.serviceWorker.controller ? ' (via SW)' : '';
                versionDisplay.textContent = `v${pkg.version}${viaSW}`;
            }
        })
        .catch(console.error);

    // --- Fetch Header Info (Last-Modified / ETag) for ALL resources in sitemap.xml ---
    fetch('sitemap.xml')
        .then(response => response.text())
        .then(xmlText => {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, "text/xml");
            const locs = xmlDoc.getElementsByTagName("loc");
            const urls = [];
            for (let i = 0; i < locs.length; i++) {
                urls.push(locs[i].textContent);
            }
            return urls;
        })
        .then(async (urls) => {
            const urlList = document.getElementById('sitemap-url-list');
            const checkBtn = document.getElementById('check-sitemap-server-btn');
            
            if (!urlList) return;
            urlList.innerHTML = '';

            const items = [];

            // Build List & Check Cache
            for (const url of urls) {
                const li = document.createElement('li');
                li.style.marginBottom = '0.8rem';
                li.style.borderBottom = '1px dashed #30363d';
                li.style.paddingBottom = '0.4rem';

                let displayPath = url;
                try { displayPath = new URL(url).pathname; } catch(e){}

                li.innerHTML = `
                    <div style="color: #58a6ff; font-weight: bold;">${displayPath}</div>
                    <div style="padding-left: 1rem; color: #8b949e;">
                        Cached: <span class="cache-date">Checking...</span>
                    </div>
                    <div style="padding-left: 1rem; color: #8b949e;">
                        Server: <span class="server-date">--</span>
                    </div>
                `;
                urlList.appendChild(li);

                const cacheSpan = li.querySelector('.cache-date');
                const serverSpan = li.querySelector('.server-date');
                items.push({ url, cacheSpan, serverSpan });

                // Check Cache Immediately
                if ('caches' in window) {
                    let cacheKey = url;
                    try {
                         const u = new URL(url);
                         cacheKey = new URL(u.pathname, window.location.origin).toString();
                    } catch(e) {}

                    caches.match(cacheKey).then(res => {
                        if (res && res.headers.get('last-modified')) {
                            const d = new Date(res.headers.get('last-modified'));
                            cacheSpan.textContent = d.toLocaleString();
                            cacheSpan.style.color = '#c9d1d9';
                        } else {
                            cacheSpan.textContent = 'Not in cache';
                        }
                    }).catch(() => {
                         cacheSpan.textContent = 'Error';
                    });
                } else {
                    cacheSpan.textContent = 'API Unavailable';
                }
            }

            // Setup Button Handler for Server Check
            if (checkBtn) {
                checkBtn.onclick = async () => {
                    checkBtn.disabled = true;
                    checkBtn.textContent = 'Checking...';

                    for (const item of items) {
                        item.serverSpan.textContent = 'Checking...';
                        try {
                            const sitemapUrl = new URL(item.url);
                            const serverUrl = new URL(sitemapUrl.pathname, window.location.origin);
                            serverUrl.searchParams.set('_nc', Date.now());
                            
                            const res = await fetch(serverUrl.toString(), { method: 'HEAD' });
                            const lm = res.headers.get('last-modified');
                            if (lm) {
                                item.serverSpan.textContent = new Date(lm).toLocaleString();
                                item.serverSpan.style.color = '#27c93f';
                            } else {
                                item.serverSpan.textContent = 'No Header';
                            }
                        } catch (e) {
                            item.serverSpan.textContent = 'Error / Offline';
                            item.serverSpan.style.color = '#da3633';
                        }
                    }
                    checkBtn.textContent = 'Check Server Status (HEAD)';
                    checkBtn.disabled = false;
                };
            }
        })
        .catch(console.error);
}
