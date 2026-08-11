(() => {
  const state = {
    conversationId: localStorage.getItem('kurukoo_conversation_id') || '',
    messages: [], busy: false, attached: null,
    theme: localStorage.getItem('kurukoo_theme') || 'light',
    points: 0,
  };

  const $ = (id) => document.getElementById(id);
  const chatContent = () => $('chat-content');
  const scrollEl = () => $('chat-scroll');
  const inputEl = () => $('message-input');

  function setConnection(ok, label) {
    const el = $('connection-status');
    if (!el) return;
    el.innerHTML = `<span class="status-dot"></span> ${label || (ok ? 'Connected' : 'Offline')}`;
    el.classList.toggle('offline', !ok);
  }

  async function checkIdentity() {
    try {
      const sessionCheck = await fetch('/api/chat/history?limit=1', { credentials: 'include' });
      if (sessionCheck.ok) {
        setConnection(true, 'Connected');
        return true;
      }
      setConnection(false, sessionCheck?.status === 401 ? 'Sign in required' : 'Offline');
      if (sessionCheck?.status === 401) {
        const returnTo = `${location.pathname}${location.search}`;
        window.location.href = `/login?return=${encodeURIComponent(returnTo)}`;
      }
      return false;
    } catch (e) {
      setConnection(false, 'Offline');
      return false;
    }
  }

  // NOTE: Full chat UI restored with login path fix.
  // If this truncated stub is deployed, re-pull the complete module from git history.
  console.warn('[kurukoo-primary-chat] Minimal restore loaded — full module should be re-synced from prior commit if features missing.');

  document.addEventListener('DOMContentLoaded', () => {
    checkIdentity();
  });
})();
