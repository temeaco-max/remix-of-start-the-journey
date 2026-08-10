(() => {
  const state = {
    phone: localStorage.getItem('kurukoo_user_phone') || '',
    token: localStorage.getItem('kurukoo_auth_token') || '',
    messages: [],
    busy: false,
    attached: null,
    theme: localStorage.getItem('kurukoo_theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  };

  const $ = id => document.getElementById(id);
  const chatContent = $('chat-content');
  const scroll = $('chat-scroll');
  const input = $('message-input');
  const send = $('send-message');

  async function ensureIdentity() {
    if (state.phone && state.token) return;
    const entered = window.prompt('Enter your phone number to continue with your Kurukoo Memory Profile:');
    if (!entered) return false;
    state.phone = entered.trim();
    localStorage.setItem('kurukoo_user_phone', state.phone);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: state.phone, name: 'Kurukoo User' })
      });
      const data = await response.json();
      if (data.token) {
        state.token = data.token;
        localStorage.setItem('kurukoo_auth_token', state.token);
      }
    } catch { /* chat endpoint remains usable on legacy deployments */ }
    return true;
  }

  function authHeaders() {
    return state.token ? { Authorization: `Bearer ${state.token}` } : {};
  }

  function applyTheme() {
    document.body.classList.toggle('dark', state.theme === 'dark');
    localStorage.setItem('kurukoo_theme', state.theme);
  }

  function addHistoryItem(title) {
    const list = $('history-list');
    const existing = [...list.children].find(el => el.dataset.title === title);
    if (existing) return;
    const item = document.createElement('div');
    item.className = 'history-item active';
    item.dataset.title = title;
    item.textContent = title.slice(0, 70);
    list.prepend(item);
  }

  function renderMarkdown(text) {
    if (window.marked) {
      marked.setOptions({ breaks: true, gfm: true });
      return marked.parse(text || '');
    }
    return String(text || '').replace(/[&<>]/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[ch])).replace(/\n/g, '<br>');
  }

  function enhanceCode(root) {
    root.querySelectorAll('pre code').forEach(block => {
      if (window.hljs) hljs.highlightElement(block);
    });
  }

  function createMessage(role, text = '') {
    const wrap = document.createElement('article');
    wrap.className = `message ${role}`;
    const avatar = role === 'assistant' ? '<div class="avatar">K</div>' : '';
    wrap.innerHTML = `${avatar}<div class="message-body"><div class="bubble"><div class="markdown-body"></div></div><div class="message-actions"></div></div>`;
    const bubble = wrap.querySelector('.markdown-body');
    bubble.innerHTML = renderMarkdown(text);
    enhanceCode(wrap);
    const actions = wrap.querySelector('.message-actions');
    if (role === 'assistant') {
      actions.innerHTML = '<button data-action="copy">Copy</button><button data-action="regenerate">Regenerate</button><button data-action="delete">Delete</button>';
    } else {
      actions.innerHTML = '<button data-action="copy">Copy</button><button data-action="delete">Delete</button>';
    }
    actions.addEventListener('click', e => handleMessageAction(e, wrap, role, text));
    chatContent.appendChild(wrap);
    scroll.scrollTop = scroll.scrollHeight;
    return wrap;
  }

  function addUserMessage(text) {
    $('welcome')?.remove();
    state.messages.push({ role: 'user', text });
    const el = createMessage('user', text);
    addHistoryItem(text);
    return el;
  }

  function addAssistantMessage(text) {
    state.messages.push({ role: 'assistant', text });
    return createMessage('assistant', text);
  }

  function handleMessageAction(event, wrap, role, original) {
    const button = event.target.closest('button');
    if (!button) return;
    const action = button.dataset.action;
    if (action === 'copy') navigator.clipboard?.writeText(wrap.querySelector('.bubble').innerText);
    if (action === 'delete') wrap.remove();
    if (action === 'regenerate' && role === 'assistant') {
      const lastUser = [...state.messages].reverse().find(item => item.role === 'user');
      if (lastUser) sendMessage(lastUser.text);
    }
  }

  function appendStreamBubble() {
    $('welcome')?.remove();
    const wrap = document.createElement('article');
    wrap.className = 'message assistant';
    wrap.innerHTML = '<div class="avatar">K</div><div class="message-body"><div class="bubble"><div class="markdown-body"></div><div class="thinking" hidden><details><summary>Reasoning completed</summary><div>Kurukoo selected the lowest-cost suitable response path.</div></details></div></div><div class="message-actions"><button data-action="copy">Copy</button><button data-action="regenerate">Regenerate</button><button data-action="delete">Delete</button></div></div>';
    chatContent.appendChild(wrap);
    return wrap;
  }

  async function sendMessage(raw) {
    const text = String(raw || input.value || '').trim();
    if (!text || state.busy) return;
    if (!(await ensureIdentity())) return;
    state.busy = true;
    send.disabled = true;
    input.value = '';
    input.style.height = 'auto';
    const attachmentPrefix = state.attached ? `[Attachment: ${state.attached.name}] ` : '';
    const finalText = attachmentPrefix + text;
    state.attached = null;
    addUserMessage(finalText);
    const assistant = appendStreamBubble();
    const output = assistant.querySelector('.markdown-body');
    const thinking = assistant.querySelector('.thinking');
    let full = '';

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ phone: state.phone, message: finalText, channel: 'web' })
      });
      if (!response.ok || !response.body) throw new Error(`Chat request failed (${response.status})`);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';
        for (const event of events) {
          const line = event.split('\n').find(x => x.startsWith('data: '));
          if (!line) continue;
          const payload = line.slice(6);
          if (payload === '[DONE]') continue;
          try {
            const data = JSON.parse(payload);
            if (data.type === 'text') {
              full += data.content || '';
              output.innerHTML = renderMarkdown(full);
              enhanceCode(assistant);
              scroll.scrollTop = scroll.scrollHeight;
            }
            if (data.type === 'thought' && thinking) thinking.hidden = false;
            if (data.type === 'metadata') updateModelStatus(data);
            if (data.type === 'done' && data.cardData) renderCard(data.cardData, assistant);
            if (data.type === 'error') throw new Error(data.error || 'Stream error');
          } catch (parseError) {
            if (parseError instanceof Error && parseError.message === 'Stream error') throw parseError;
          }
        }
      }
      state.messages.push({ role: 'assistant', text: full });
      if (!full) output.textContent = 'I could not complete that request. Please try again.';
    } catch (error) {
      output.innerHTML = renderMarkdown(`I’m having trouble completing that right now. **Please try again.**\n\n_${error.message}_`);
    } finally {
      state.busy = false;
      send.disabled = false;
      input.focus();
      loadPoints();
    }
  }

  function renderCard(card, messageEl) {
    if (!card || !messageEl) return;
    const holder = document.createElement('div');
    holder.className = 'provider-card';
    if (card.type === 'ride_picker') {
      holder.innerHTML = '<strong>Choose a ride</strong><div class="quick-actions"><button>🚗 Okada</button><button>🛺 Keke</button><button>🚕 Taxi</button></div><span class="escrow-badge">🔒 Escrow Protected</span>';
      holder.querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => sendMessage(`${btn.textContent.trim()} ride`)));
    } else {
      holder.innerHTML = `<strong>${card.category || 'Service'}</strong><div class="deferred">Searching with your shared Memory Profile and presence.</div><span class="escrow-badge">🔒 Escrow Protected</span>`;
    }
    messageEl.querySelector('.bubble').appendChild(holder);
  }

  function updateModelStatus(data) {
    const label = document.querySelector('.model-badge');
    if (label && data.model) label.textContent = data.model;
  }

  async function loadPoints() {
    if (!state.phone) return;
    try {
      const res = await fetch(`/api/points/balance?phone=${encodeURIComponent(state.phone)}`, { headers: authHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      const points = Number(data.points || 0);
      $('points-balance').querySelector('span').textContent = points;
      $('inspector-points').textContent = points;
    } catch {}
  }

  async function loadMemory() {
    if (!state.phone) return;
    try {
      const res = await fetch(`/api/profile/${encodeURIComponent(state.phone)}`, { headers: authHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      const profile = data.profile || {};
      $('memory-context').textContent = `Kurukoo remembers ${profile.location || 'your area'}${profile.primary_lga ? `, ${profile.primary_lga}` : ''}. Your Memory Profile is shared across channels.`;
    } catch {}
  }

  async function loadHistory() {
    if (!state.phone) return;
    try {
      const res = await fetch(`/api/messages?phone=${encodeURIComponent(state.phone)}`, { headers: authHeaders() });
      if (!res.ok) return;
      const messages = await res.json();
      const list = $('history-list');
      list.innerHTML = '';
      messages.filter(m => m.sender === 'user').slice(-30).forEach(m => addHistoryItem(m.content));
      if (messages.length && $('welcome')) $('welcome').remove();
      messages.slice(-40).forEach(m => createMessage(m.sender === 'user' ? 'user' : 'assistant', m.content || ''));
    } catch {}
  }

  $('quick-actions').addEventListener('click', event => {
    const button = event.target.closest('button[data-prompt]');
    if (button) sendMessage(button.dataset.prompt);
  });
  $('send-message').addEventListener('click', () => sendMessage());
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendMessage(); }
  });
  input.addEventListener('input', () => { input.style.height = 'auto'; input.style.height = `${Math.min(input.scrollHeight, 180)}px`; });
  $('attach-file').addEventListener('click', () => $('file-input').click());
  $('file-input').addEventListener('change', event => {
    state.attached = event.target.files?.[0] || null;
    if (state.attached) input.placeholder = `Attachment ready: ${state.attached.name}`;
  });
  $('theme-toggle').addEventListener('click', () => { state.theme = state.theme === 'dark' ? 'light' : 'dark'; applyTheme(); });
  $('open-sidebar').addEventListener('click', () => $('chat-sidebar').classList.add('open'));
  $('close-sidebar').addEventListener('click', () => $('chat-sidebar').classList.remove('open'));
  $('memory-toggle').addEventListener('click', () => $('chat-inspector').scrollTo({ top: 0, behavior: 'smooth' }));
  $('close-inspector').addEventListener('click', () => $('chat-inspector').classList.remove('open'));
  $('new-chat').addEventListener('click', () => { chatContent.innerHTML = ''; state.messages = []; location.hash = `chat-${Date.now()}`; renderWelcome(); });
  $('topup-points').addEventListener('click', () => sendMessage('I want to top up my Points'));
  $('voice-input').addEventListener('click', () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) { input.focus(); return; }
    const recognition = new Recognition();
    recognition.lang = 'en-NG';
    recognition.onresult = event => { input.value = event.results[0][0].transcript; input.dispatchEvent(new Event('input')); };
    recognition.start();
  });

  function renderWelcome() {
    chatContent.innerHTML = '<div class="welcome" id="welcome"><div class="welcome-mark">K</div><h1>What can I help you get done?</h1><p>One conversation for finding work, buying, earning, coordinating services, and everyday questions.</p><div class="quick-actions" id="quick-actions"><button data-prompt="Book a ride for me">🚗 Ride</button><button data-prompt="Order food near me">🍔 Food</button><button data-prompt="Find a verified repair worker">🔧 Repair</button><button data-prompt="I need emergency help">🏥 Emergency</button><button data-prompt="Help me find a way to earn">⚡ Earn</button></div></div>';
    $('quick-actions').addEventListener('click', event => { const btn = event.target.closest('[data-prompt]'); if (btn) sendMessage(btn.dataset.prompt); });
  }

  applyTheme();
  ensureIdentity().then(() => Promise.all([loadPoints(), loadMemory(), loadHistory()]));
})();
