import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { firebaseConfig } from "./firebase/firebaseConfig.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

document.addEventListener('DOMContentLoaded', () => {
    const text = "echo 'Welcome to moukaeritai.work'";
    const element = document.getElementById('typewriter');
    let i = 0;

    function typeWriter() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(typeWriter, 100); // Speed of typing
        }
    }

    typeWriter();

    // --- SPA Router ---
    const routes = {
        '': 'home',
        '#projects': 'projects',
        '#bookmarks': 'bookmarks',
        '#personalize': 'personalize',
        '#misc': 'misc'
    };

    function router() {
        const hash = window.location.hash;
        const viewName = routes[hash] || 'home';

        // Hide all views
        document.querySelectorAll('.spa-view').forEach(view => {
            view.classList.add('hidden');
        });

        // Show active view
        const activeView = document.getElementById(`view-${viewName}`);
        if (activeView) {
            activeView.classList.remove('hidden');
            // Trigger animation reset if needed
            activeView.style.animation = 'none';
            activeView.offsetHeight; // trigger reflow
            activeView.style.animation = null;
        }

        // Update Nav links
        document.querySelectorAll('header nav a').forEach(link => {
            const linkHash = link.getAttribute('href');
            // Special case for logo or home link
            if (linkHash === hash || (hash === '' && (linkHash === '#' || linkHash === ''))) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Scroll to top on view change
        window.scrollTo(0, 0);
    }

    window.addEventListener('hashchange', router);
    router(); // Initial call

    // --- Firebase Auth Logic ---
    const loginStatusBtn = document.getElementById('login-status-btn');
    const authLoggedOut = document.getElementById('auth-logged-out');
    const authLoggedIn = document.getElementById('auth-logged-in');
    const userAvatar = document.getElementById('user-avatar');
    const userName = document.getElementById('user-name');
    const userEmail = document.getElementById('user-email');
    const btnGoogleLogin = document.getElementById('btn-google-login');
    const btnLogout = document.getElementById('btn-logout');

    const iconAnonymous = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="24" height="24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>`;
    const iconLoggedInSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path fill-rule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clip-rule="evenodd" /></svg>`;

    function updateAuthUI(user) {
        if (user) {
            // Logged In
            if (authLoggedOut) authLoggedOut.classList.add('hidden');
            if (authLoggedIn) authLoggedIn.classList.remove('hidden');

            // Update Profile View
            if (userAvatar) userAvatar.src = user.photoURL || '';
            if (userName) userName.textContent = user.displayName || 'User';
            if (userEmail) userEmail.textContent = user.email || '';

            // Update Top Icon
            if (loginStatusBtn) {
                if (user.photoURL) {
                    // Use Image Avatar
                    loginStatusBtn.innerHTML = `<img src="${user.photoURL}" alt="Avatar" style="width: 24px; height: 24px; border-radius: 50%; border: 1px solid #27c93f;">`;
                } else {
                    // Use SVG Avatar if no photo
                    loginStatusBtn.innerHTML = iconLoggedInSVG;
                }
                loginStatusBtn.style.color = '#27c93f';
                loginStatusBtn.style.borderColor = '#27c93f';
                loginStatusBtn.title = `Logged in as ${user.displayName || user.email}`;
            }
        } else {
            // Logged Out
            if (authLoggedOut) authLoggedOut.classList.remove('hidden');
            if (authLoggedIn) authLoggedIn.classList.add('hidden');

            // Update Top Icon
            if (loginStatusBtn) {
                loginStatusBtn.innerHTML = iconAnonymous;
                loginStatusBtn.style.color = '';
                loginStatusBtn.style.borderColor = '';
                loginStatusBtn.title = "Personalize / Login";
            }
        }
    }

    onAuthStateChanged(auth, (user) => {
        updateAuthUI(user);
    });

    if (btnGoogleLogin) {
        btnGoogleLogin.addEventListener('click', async () => {
            const provider = new GoogleAuthProvider();
            try {
                await signInWithPopup(auth, provider);
            } catch (error) {
                console.error("Login failed:", error);
                alert("Login failed: " + error.message);
            }
        });
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            try {
                await signOut(auth);
            } catch (error) {
                console.error("Logout failed:", error);
            }
        });
    }

    // --- Service Worker Logic ---
    const swToggle = document.getElementById('sw-toggle');
    const swStorageKey = 'sw_enabled';

    async function manageServiceWorker(enable) {
        if (!('serviceWorker' in navigator)) return;

        if (enable) {
            // Register
            try {
                const registration = await navigator.serviceWorker.register('./sw.js');
                console.log('Service Worker registered with scope:', registration.scope);

                // Helper to update the UI
                const updateLastCheckedUI = (dateString, isOffline = false) => {
                    const display = document.getElementById('last-checked-display');
                    if (display && dateString) {
                        display.style.display = 'inline';
                        display.textContent = `Checked: ${dateString}${isOffline ? ' (Offline)' : ''}`;
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
        } else {
            // Unregister
            try {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (const registration of registrations) {
                    await registration.unregister();
                }
                console.log('Service Worker unregistered');
                
                // Clear cache if desired, or leave it until explicit reset
                // For "disable offline mode", unregistering is the main step. 
                // We won't clear caches automatically here to avoid aggressive data loss unless requested via "Force Reset".
            } catch (error) {
                console.error('Service Worker unregistration failed:', error);
            }
        }
    }

    // Initialize Switch
    const savedSWState = localStorage.getItem(swStorageKey);
    // Default to false if not set
    const isSWEnabled = savedSWState === null ? false : (savedSWState === 'true');

    if (swToggle) {
        swToggle.checked = isSWEnabled;
        swToggle.addEventListener('change', () => {
            const newState = swToggle.checked;
            localStorage.setItem(swStorageKey, newState);
            manageServiceWorker(newState);
            
            if (!newState) {
                // If turning off, maybe give a hint? 
                // But unregistering is silent.
            }
        });
    }

    // Run initial logic
    if (isSWEnabled) {
        manageServiceWorker(true);
    } else {
        // Ensure it is off
        manageServiceWorker(false);
    }
    
    // Ensure the page reloads when the new SW takes control (global listener)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload();
        });
    }

    // --- Settings / Personal UUID Logic ---
    const uuidInput = document.getElementById('personal-uuid');
    const saveBtn = document.getElementById('save-uuid');
    const saveStatus = document.getElementById('save-status');

    // --- Maintenance: Reset Cache ---
    const resetCacheBtn = document.getElementById('reset-cache-btn');
    if (resetCacheBtn) {
        resetCacheBtn.addEventListener('click', async () => {
            if (!confirm('This will clear all offline data and reload the page. Continue?')) {
                return;
            }

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

    function normalizeUUID(str) {
        const hexOnly = str.replace(/[^0-9a-fA-F]/g, '').toLowerCase();
        if (hexOnly.length !== 32) return null;
        return [
            hexOnly.slice(0, 8),
            hexOnly.slice(8, 12),
            hexOnly.slice(12, 16),
            hexOnly.slice(16, 20),
            hexOnly.slice(20)
        ].join('-');
    }

    function validate() {
        const rawValue = uuidInput.value;
        const hexOnly = rawValue.replace(/[^0-9a-fA-F]/g, '');
        const normalized = normalizeUUID(rawValue);

        const segmentLengths = [8, 4, 4, 4, 12];
        const feedbackContainer = document.getElementById('uuid-feedback');
        let currentHexIdx = 0;

        segmentLengths.forEach((len, segIdx) => {
            const span = document.getElementById(`uuid-seg-${segIdx}`);
            let content = "";
            let isPartiallyFilled = false;

            for (let i = 0; i < len; i++) {
                if (currentHexIdx < hexOnly.length) {
                    content += hexOnly[currentHexIdx].toLowerCase();
                    currentHexIdx++;
                    isPartiallyFilled = true;
                } else {
                    content += "#";
                }
            }
            if (span) {
                span.textContent = content;
                if (content.indexOf('#') === -1) {
                    span.style.color = '#27c93f';
                } else if (isPartiallyFilled) {
                    span.style.color = '#58a6ff';
                } else {
                    span.style.color = '#333';
                }
            }
        });

        if (normalized) {
            saveBtn.disabled = false;
            saveBtn.style.opacity = '1';
        } else {
            saveBtn.disabled = true;
            saveBtn.style.opacity = '0.5';
        }
    }

    const savedUUID = localStorage.getItem('personal_uuid');
    if (savedUUID && uuidInput) {
        uuidInput.value = savedUUID;
        validate();
    }

    if (uuidInput) {
        uuidInput.addEventListener('input', validate);
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const normalized = normalizeUUID(uuidInput.value);
            if (normalized) {
                localStorage.setItem('personal_uuid', normalized);
                uuidInput.value = normalized;

                if (saveStatus) {
                    saveStatus.style.opacity = '1';
                    setTimeout(() => {
                        saveStatus.style.opacity = '0';
                    }, 2000);
                }
                validate();
            }
        });
    }
});