import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { firebaseConfig } from "./firebase/firebaseConfig.js";
import { loadCacheControlUI } from "./js/cache-control.js";

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

    // --- Load Bookmarks ---
    const bookmarksGrid = document.getElementById('bookmarks-grid');
    if (bookmarksGrid) {
        fetch('bookmarks.json')
            .then(response => response.json())
            .then(data => {
                bookmarksGrid.innerHTML = data.map(item => {
                    let targetVal = "_blank";
                    try {
                        const urlObj = new URL(item.url);
                        targetVal = urlObj.hostname;
                    } catch (e) {
                        // Fallback if URL parsing fails
                    }
                    
                    return `
                    <a href="${item.url}" target="${targetVal}" class="card">
                        <h3>${item.title}</h3>
                        <div style="display: flex; align-items: center; gap: 1rem; margin-top: 1rem; color: #8b949e;">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" width="48" height="48">
                                <path stroke-linecap="round" stroke-linejoin="round" d="${item.visuals.iconPath}" />
                            </svg>
                            <p>${item.description}</p>
                        </div>
                    </a>
                `}).join('');
            })
            .catch(err => console.error('Failed to load bookmarks:', err));
    }

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

    // --- Service Worker Logic & UI ---
    loadCacheControlUI('cache-control-ui-container');

    // --- Settings / Personal UUID Logic ---
    const uuidInput = document.getElementById('personal-uuid');
    const saveBtn = document.getElementById('save-uuid');
    const saveStatus = document.getElementById('save-status');

    // --- Maintenance: Reset Cache (Moved to cache-control.js) ---

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

    // (System status and version checks moved to cache-control.js)
});