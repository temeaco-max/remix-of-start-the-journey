(() => {
  const APP_START = '/chat/';
  let deferredInstallPrompt = null;

  function setPwaState(state) {
    document.documentElement.dataset.pwaState = state;
    document.documentElement.dataset.pwaOnline = navigator.onLine ? 'true' : 'false';
  }

  setPwaState('loading');

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

  let statusTimer = null;

  function showNotice(message, { tone = 'neutral', actionLabel, action, timeout = 0 } = {}) {
    const region = ensureStatusRegion();
    if (!region) return;
    if (statusTimer) window.clearTimeout(statusTimer);
    region.replaceChildren();
    region.dataset.tone = tone;
    const copy = document.createElement('span');
    copy.className = 'pwa-status-copy';
    copy.textContent = message;
    region.appendChild(copy);
    if (actionLabel && action) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'k-btn k-btn-secondary pwa-status-action';
      button.textContent = actionLabel;
      button.addEventListener('click', action, { once: true });
      region.appendChild(button);
    }
    if (timeout > 0) {
      statusTimer = window.setTimeout(() => {
        region.replaceChildren();
        region.removeAttribute('data-tone');
      }, timeout);
    }
  }

  function showAction(label, action) {
    showNotice('A new Kurukoo version is ready.', { tone: 'update', actionLabel: label, action });
  }

  function updateConnectivityState() {
    const online = navigator.onLine;
    setPwaState(online ? 'online' : 'offline');
    if (!isAppSurface()) return;
    if (online) {
      showNotice('Back online. Kurukoo can continue your conversation.', { tone: 'online', timeout: 4200 });
    } else {
      showNotice('You’re offline. Cached Kurukoo pages remain available; new messages will need a connection.', { tone: 'offline' });
    }
  }

  function routeLegacyStart() {
    if (window.location.pathname !== '/dashboard.html') return;
    const target = `${APP_START}${window.location.search || ''}${window.location.hash || ''}`;
    window.location.replace(target);
  }

  async function registerWorker() {
    if (!('serviceWorker' in navigator)) {
      setPwaState('unsupported');
      return;
    }
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
      setPwaState(navigator.onLine ? 'registered' : 'offline');
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            setPwaState('update-available');
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
      setPwaState('registration-error');
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
    setPwaState('installed');
    deferredInstallPrompt = null;
    showNotice('Kurukoo is installed and ready from your home screen.', { tone: 'installed', timeout: 4200 });
  });

  window.addEventListener('online', updateConnectivityState);
  window.addEventListener('offline', updateConnectivityState);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && navigator.serviceWorker?.ready) {
      navigator.serviceWorker.ready.then(registration => registration.update()).catch(() => {});
    }
  });

  window.addEventListener('load', () => {
    routeLegacyStart();
    updateConnectivityState();
    registerWorker();
  });
})();
