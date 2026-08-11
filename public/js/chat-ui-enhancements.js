/* Kurukoo chat UX layer: shared across web/PWA/embedded chat surfaces. */
(function () {
  'use strict';

  const STORAGE_KEY = 'kurukoo_chat_ui_v1';

  function getState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch (_) { return {}; }
  }
  function setState(state) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
  }

  function ensureStylesheet() {
    if (document.querySelector('link[data-kurukoo-chat-ui]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/css/chat-ui.css?v=1.0.1';
    link.dataset.kurukooChatUi = 'true';
    document.head.appendChild(link);
  }

  function announce(message) {
    let el = document.getElementById('kurukoo-chat-live-region');
    if (!el) {
      el = document.createElement('div');
      el.id = 'kurukoo-chat-live-region';
      el.setAttribute('aria-live', 'polite');
      el.className = 'sr-only';
      document.body.appendChild(el);
    }
    el.textContent = message;
  }

  function persistVisibleMessages() {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    const state = getState();
    state.messages = Array.from(container.querySelectorAll('.chat-bubble')).slice(-80).map((node) => ({
      sender: node.classList.contains('user') ? 'user' : 'assistant',
      html: node.innerHTML,
      at: Date.now()
    }));
    state.updatedAt = Date.now();
    setState(state);
  }

  function restoreMessages() {
    const container = document.getElementById('chat-messages');
    if (!container || container.children.length) return;
    const state = getState();
    if (!Array.isArray(state.messages)) return;
    state.messages.slice(-40).forEach((item) => {
      const bubble = document.createElement('div');
      bubble.className = `chat-bubble ${item.sender}`;
      bubble.innerHTML = item.html;
      container.appendChild(bubble);
    });
    if (container.lastElementChild) container.scrollTop = container.scrollHeight;
  }

  function wireChatPersistence() {
    const container = document.getElementById('chat-messages');
    if (!container || container.dataset.persistenceWired) return;
    container.dataset.persistenceWired = 'true';
    restoreMessages();
    const observer = new MutationObserver(() => {
      window.clearTimeout(container.__persistTimer);
      container.__persistTimer = window.setTimeout(persistVisibleMessages, 250);
    });
    observer.observe(container, { childList: true, subtree: true });
  }

  function improveForm() {
    const input = document.getElementById('chat-input');
    const form = document.getElementById('chat-form');
    if (!input || !form) return;
    input.setAttribute('aria-label', 'Message Kurukoo');
    input.setAttribute('enterkeyhint', 'send');
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        if (input.value.trim() && !input.disabled) form.requestSubmit();
      }
    });
    form.addEventListener('submit', () => announce('Message sent. Kurukoo is responding.'));
  }

  function addHistoryControls() {
    const list = document.getElementById('history-list');
    if (!list || list.dataset.kurukooHistory) return;
    list.dataset.kurukooHistory = 'true';
    const state = getState();
    const item = list.querySelector('.history-item');
    if (item && state.updatedAt) {
      const label = item.querySelector('.history-item-title');
      if (label) label.textContent = state.title || 'Current Conversation';
    }
  }

  function exposeUtilities() {
    window.KurukooChatUI = {
      clearLocalHistory: function () {
        const state = getState();
        delete state.messages;
        delete state.updatedAt;
        setState(state);
        const container = document.getElementById('chat-messages');
        if (container) container.innerHTML = '';
        announce('Local chat history cleared.');
      },
      saveTitle: function (title) {
        const state = getState();
        state.title = String(title || '').slice(0, 80);
        setState(state);
      }
    };
  }

  function boot() {
    ensureStylesheet();
    exposeUtilities();
    wireChatPersistence();
    improveForm();
    addHistoryControls();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  const observer = new MutationObserver(boot);
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
