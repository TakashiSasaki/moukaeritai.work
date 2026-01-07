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
});