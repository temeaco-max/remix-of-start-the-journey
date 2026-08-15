(() => {
  const APP_START = '/chat/';
  let deferredInstallPrompt = null;

  function isAppSurface() {
    return window.location.pathname === '/chat/' || window.location.pathname === '/chat' || window.location.pathname.startsWith('/dashboard');
  }

  function ensureStatusRegion() {
    if (!isAppSurface() || document.querySelector('[data-pwa-status]')) return null;
    const region = document.createElement('div');
    region.className = 'pwa-status-region';
    region.dataset.pwaStatus = 'true';
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    document.body.appendChild(region);
    return region;
  }

  function showAction(label, action) {
    const region = ensureStatusRegion();
    if (!region) return;
    region.replaceChildren();
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'k-btn k-btn-secondary pwa-status-action';
    button.textContent = label;
    button.addEventListener('click', action, { once: true });
    region.appendChild(button);
  }

  function routeLegacyStart() {
    if (window.location.pathname !== '/dashboard.html') return;
    const target = `${APP_START}${window.location.search || ''}${window.location.hash || ''}`;
    window.location.replace(target);
  }

  async function registerWorker() {
    if (!('serviceWorker' in navigator)) return;
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            showAction('Update Kurukoo', () => {
              worker.postMessage({ type: 'SKIP_WAITING' });
              window.location.reload();
            });
          }
        });
      });
      navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true });
      await registration.update();
    } catch (error) {
      // The application remains usable online; do not render a false offline state.
      console.warn('Kurukoo PWA update registration unavailable', error);
    }
  }

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    showAction('Install Kurukoo', async () => {
      if (!deferredInstallPrompt) return;
      const prompt = deferredInstallPrompt;
      deferredInstallPrompt = null;
      await prompt.prompt();
      await prompt.userChoice;
    });
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    const region = document.querySelector('[data-pwa-status]');
    if (region) region.replaceChildren();
  });

  window.addEventListener('load', () => {
    routeLegacyStart();
    registerWorker();
  });
})();
