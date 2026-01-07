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

    // Register Service Worker for PWA
    // Register Service Worker for PWA with update notification
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then((registration) => {
                console.log('Service Worker registered with scope:', registration.scope);

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

                // Check if there's already a waiting worker (SW updated in background but page not reloaded)
                if (registration.waiting) {
                    showUpdateToast(registration.waiting);
                }

                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        // Has network.state changed?
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New content is available and current page is controlled by older SW
                            showUpdateToast(newWorker);
                        }
                    });
                });
            })
            .catch((error) => {
                console.log('Service Worker registration failed:', error);
            });

        // Ensure the page reloads when the new SW takes control
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload();
        });
    }

    // --- Settings / Personal UUID Logic ---
    const uuidInput = document.getElementById('personal-uuid');
    const saveBtn = document.getElementById('save-uuid');
    const saveStatus = document.getElementById('save-status');

    /**
     * Extracts 32 hex characters and returns normalized UUID format.
     * @param {string} str 
     * @returns {string|null}
     */
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

        // Visual feedback logic
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

            span.textContent = content;

            // Color logic: 
            // - GREEN if the segment is fully filled
            // - LIGHTER/ACCENT if partially filled
            // - DARK if empty
            if (content.indexOf('#') === -1) {
                span.style.color = '#27c93f'; // Complete
            } else if (isPartiallyFilled) {
                span.style.color = '#58a6ff'; // Partially filled (blueish to stand out)
            } else {
                span.style.color = '#333';    // Empty
            }
        });

        // Handle hyphens in UI (simplified: green if previous part is done)
        if (feedbackContainer) {
            const texts = feedbackContainer.childNodes;
            // Hyphens are at index 1, 3, 5, 7 in the childNodes if structured correctly
            // But we can just use the spans states.
        }

        if (normalized) {
            saveBtn.disabled = false;
            saveBtn.style.opacity = '1';
        } else {
            saveBtn.disabled = true;
            saveBtn.style.opacity = '0.5';
        }
    }

    // Load UUID from localStorage
    const savedUUID = localStorage.getItem('personal_uuid');
    if (savedUUID) {
        uuidInput.value = savedUUID;
        validate();
    }

    // Validate on every input
    uuidInput.addEventListener('input', validate);

    // Save UUID
    saveBtn.addEventListener('click', () => {
        const normalized = normalizeUUID(uuidInput.value);
        if (normalized) {
            localStorage.setItem('personal_uuid', normalized);
            uuidInput.value = normalized; // Reflect normalized version in UI

            // Show saved status
            saveStatus.style.opacity = '1';
            setTimeout(() => {
                saveStatus.style.opacity = '0';
            }, 2000);

            validate();
        }
    });
});