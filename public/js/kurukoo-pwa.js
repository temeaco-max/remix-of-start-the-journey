(() => {
  let deferredPrompt;
  const install = document.getElementById('install-pwa');
  window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); deferredPrompt = event; if (install) install.hidden = false; });
  install?.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    install.hidden = true;
  });
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
})();