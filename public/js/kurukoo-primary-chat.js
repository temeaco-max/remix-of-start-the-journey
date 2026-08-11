(() => {
  const state = {
    conversationId: localStorage.getItem('kurukoo_conversation_id') || '',
    messages: [], busy: false, attached: null,
    theme: localStorage.getItem('kurukoo_theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
    activeStorefrontId: null
  };
  const $ = id => document.getElementById(id);
  const chatContent = $('chat-content'), scroll = $('chat-scroll'), input = $('message-input'), send = $('send-message');
  const isEmbed = (() => {
    try {
      const params = new URLSearchParams(location.search);
      if (params.get('embed') === '1' || params.get('embed') === 'true') return true;
      if (window.self !== window.top) return true;
    } catch (_) { return true; }
    return false;
  })();
  const setConnection = (ok, text = ok ? 'Connected' : 'Offline') => { const el = $('connection-status'); if (el) { el.innerHTML = `<span class=\"status-dot\"></span> ${text}`; el.classList.toggle('offline', !ok); } };
  const applyTheme = () => { document.body.classList.toggle('dark', state.theme === 'dark'); localStorage.setItem('kurukoo_theme', state.theme); };
  function sanitizeHtml(html) { const doc = new DOMParser().parseFromString(html, 'text/html'); doc.querySelectorAll('script,iframe,object,embed,style,link,form').forEach(n => n.remove()); doc.querySelectorAll('*').forEach(n => [...n.attributes].forEach(a => { if (/^on/i.test(a.name) || /^(javascript|data):/i.test(a.value)) n.removeAttribute(a.name); })); return doc.body.innerHTML; }
  function renderMarkdown(text) { if (!window.marked) return String(text || '').replace(/[&<>]/g, c => ({ '&':'&', '<':'<', '>':'>' }[c])).replace(/\n/g, '<br>'); marked.setOptions({ breaks: true, gfm: true }); return sanitizeHtml(marked.parse(text || '')); }
  function enhanceCode(root) { root.querySelectorAll('pre code').forEach(block => { if (window.hljs && !block.dataset.highlighted) hljs.highlightElement(block); }); }
  function escapeAttr(value) { return String(value || '').replace(/&/g,'&').replace(/\"/g,'"').replace(/</g,'<').replace(/>/g,'>'); }
  function escapeText(value) { return String(value || '').replace(/&/g,'&').replace(/</g,'<').replace(/>/g,'>'); }

  function showEmbedSignInGate() {
    if (!chatContent || chatContent.querySelector('[data-embed-signin-gate]')) return;
    const gate = document.createElement('div');
    gate.dataset.embedSigninGate = '1';
    gate.className = 'message assistant';
    gate.innerHTML = `<div class=\"avatar\" aria-hidden=\"true\">K</div><div class=\"message-body\"><div class=\"bubble\"><div class=\"markdown-body\"><p><strong>Sign in to chat with Kurukoo</strong></p><p>Your Memory Profile stays private until you sign in.</p><p><a class=\"primary-btn\" href=\"/login?return=${encodeURIComponent('/chat')}\" target=\"_top\" rel=\"noopener\">Sign in</a> <a class=\"secondary-btn\" href=\"/chat\" target=\"_top\" rel=\"noopener\">Open full chat</a></p></div></div></div>`;
    chatContent.appendChild(gate);
    if (scroll) scroll.scrollTop = scroll.scrollHeight;
  }

  async function ensureIdentity() {
    const sessionCheck = await fetch('/api/chat/history?limit=1', { credentials: 'same-origin' }).catch(() => null);
    if (sessionCheck?.ok) { setConnection(true); return true; }
    setConnection(false, sessionCheck?.status === 401 ? 'Sign in required' : 'Offline');
    if (sessionCheck?.status === 401) {
      const returnTo = `${location.pathname}${location.search}`;
      if (isEmbed) { showEmbedSignInGate(); return false; }
      window.location.href = `/login?return=${encodeURIComponent(returnTo)}`;
    }
    return false;
  }

  function addHistoryItem(conversation, active = false) {
    const list = $('history-list'); if (!list || !conversation?.id) return;
    let item = list.querySelector(`[data-conversation-id="${CSS.escape(conversation.id)}"]`);
    if (!item) { item = document.createElement('button'); item.type = 'button'; item.className = 'history-item'; item.dataset.conversationId = conversation.id; item.textContent = conversation.title || 'New conversation'; item.addEventListener('click', () => loadConversation(conversation.id)); list.appendChild(item); }
    item.classList.toggle('active', active);
  }

  function createMessage(role, text = '', id = null) {
    const wrap = document.createElement('article'); wrap.className = `message ${role}`; if (id) wrap.dataset.messageId = id;
    const avatar = role === 'assistant' ? '<div class=\"avatar\" aria-hidden=\"true\">K</div>' : '';
    wrap.innerHTML = `${avatar}<div class=\"message-body\"><div class=\"bubble\"><div class=\"markdown-body\"></div></div><div class=\"message-actions\"></div></div>`;
    const bubble = wrap.querySelector('.markdown-body'); bubble.innerHTML = renderMarkdown(text); enhanceCode(wrap);
    const actions = wrap.querySelector('.message-actions');
    actions.innerHTML = role === 'assistant' ? '<button data-action=\"copy\">Copy</button><button data-action=\"regenerate\">Regenerate</button><button data-action=\"delete\">Delete</button>' : '<button data-action=\"copy\">Copy</button><button data-action=\"edit\">Edit</button><button data-action=\"delete\">Delete</button>';
    actions.addEventListener('click', async event => {
      const button = event.target.closest('button'); if (!button) return; const action = button.dataset.action;
      if (action === 'copy') await navigator.clipboard?.writeText(wrap.querySelector('.bubble').innerText);
      if (action === 'edit') { input.value = text; input.focus(); input.dispatchEvent(new Event('input')); }
      if (action === 'delete') { if (wrap.dataset.messageId) await deleteMessage(Number(wrap.dataset.messageId)); wrap.remove(); }
      if (action === 'regenerate') { const lastUser = [...state.messages].reverse().find(m => m.role === 'user'); if (lastUser) await sendMessage(lastUser.text); }
    });
    chatContent.appendChild(wrap); scroll.scrollTop = scroll.scrollHeight; return wrap;
  }

  async function loadPoints() { try { const res = await fetch('/api/points/balance', { credentials: 'same-origin' }); if (!res.ok) return; const data = await res.json(); const points = Number(data.points || 0); const pb = $('points-balance'); if (pb) pb.querySelector('span').textContent = points; const ip = $('inspector-points'); if (ip) ip.textContent = points; } catch {} }
  async function loadMemory() { try { const res = await fetch('/api/profile', { credentials: 'same-origin' }); if (!res.ok) return; const data = await res.json(); const profile = data.profile || {}; const text = `Kurukoo remembers ${profile.location || 'your area'}${profile.primary_lga ? `, ${profile.primary_lga}` : ''}.`; const mc = $('memory-context'); if (mc) mc.textContent = text; } catch {} }
  async function refreshHistory() {
    try {
      const url = new URL('/api/chat/history', location.origin); if (state.conversationId) url.searchParams.set('conversationId', state.conversationId); url.searchParams.set('limit', '60');
      const res = await fetch(url, { credentials: 'same-origin' }); if (!res.ok) return; const data = await res.json(); const list = $('history-list'); if (list) { list.innerHTML = ''; (data.conversations || []).forEach(c => addHistoryItem(c, c.id === state.conversationId)); }
    } catch { setConnection(false, 'Offline'); }
  }
  async function loadConversation(id) { state.conversationId = id; localStorage.setItem('kurukoo_conversation_id', id); }
  async function deleteMessage(id) { if (!id) return; try { await fetch(`/api/chat/message/${id}`, { method: 'DELETE', credentials: 'same-origin' }); } catch {} }
  async function sendMessage(raw) {
    const text = String(raw || input?.value || '').trim(); if (!text || state.busy || !(await ensureIdentity())) return;
    state.busy = true; if (send) send.disabled = true;
    try {
      if (input) input.value = '';
      createMessage('user', text);
      const assistant = createMessage('assistant', '…');
      const response = await fetch('/api/chat/stream', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ message: text, channel: 'web', conversationId: state.conversationId || undefined }) });
      if (response.status === 401) { await ensureIdentity(); throw new Error('Session expired'); }
      if (!response.ok || !response.body) throw new Error(`Chat failed (${response.status})`);
      const reader = response.body.getReader(), decoder = new TextDecoder(); let buffer = '', full = '';
      const bubble = assistant.querySelector('.markdown-body');
      while (true) {
        const { value, done } = await reader.read(); if (done) break;
        buffer += decoder.decode(value, { stream: true }); const events = buffer.split('\n\n'); buffer = events.pop() || '';
        for (const event of events) {
          const line = event.split('\n').find(x => x.startsWith('data: ')); if (!line) continue;
          const payload = line.slice(6); if (payload === '[DONE]') continue;
          let data; try { data = JSON.parse(payload); } catch { continue; }
          if (data.type === 'conversation') { state.conversationId = data.conversationId; localStorage.setItem('kurukoo_conversation_id', state.conversationId); }
          if (data.type === 'text') { full += data.content || ''; if (bubble) bubble.innerHTML = renderMarkdown(full); scroll.scrollTop = scroll.scrollHeight; }
          if (data.type === 'error') throw new Error(data.error || 'Stream error');
        }
      }
      if (!full && bubble) bubble.textContent = 'I could not complete that request. Please try again.';
      await refreshHistory(); await loadPoints();
    } catch (error) {
      setConnection(false, 'Connection issue');
      createMessage('assistant', `I'm having trouble completing that right now. **Please try again.**\n\n_${escapeText(error.message)}_`);
    } finally {
      state.busy = false; if (send) send.disabled = false; input?.focus();
    }
  }

  function wireQuickActions(root) { if (!root || root.dataset.wired) return; root.dataset.wired = 'true'; root.addEventListener('click', e => { const button = e.target.closest('button[data-prompt]'); if (button) sendMessage(button.dataset.prompt); }); }
  wireQuickActions($('quick-actions')); wireQuickActions($('composer-quick-actions'));
  send?.addEventListener('click', () => sendMessage());
  input?.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } });
  $('theme-toggle')?.addEventListener('click', () => { state.theme = state.theme === 'dark' ? 'light' : 'dark'; applyTheme(); });
  $('open-sidebar')?.addEventListener('click', () => $('chat-sidebar')?.classList.add('open'));
  $('close-sidebar')?.addEventListener('click', () => $('chat-sidebar')?.classList.remove('open'));
  $('memory-toggle')?.addEventListener('click', () => $('chat-inspector')?.classList.toggle('open'));
  $('close-inspector')?.addEventListener('click', () => $('chat-inspector')?.classList.remove('open'));
  $('new-chat')?.addEventListener('click', async () => {
    if (!await ensureIdentity()) return;
    try {
      const res = await fetch('/api/chat/conversation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ channel: 'web', title: 'New conversation' }) });
      const data = await res.json(); if (data.conversationId) { state.conversationId = data.conversationId; localStorage.setItem('kurukoo_conversation_id', data.conversationId); }
    } catch {}
    state.messages = []; if (chatContent) chatContent.innerHTML = '';
    refreshHistory();
  });
  $('topup-points')?.addEventListener('click', () => sendMessage('I want to top up my Points'));
  $('points-balance')?.addEventListener('click', () => sendMessage('Show my Points balance and ways to top up'));
  applyTheme();
  ensureIdentity().then(ok => { if (ok) Promise.all([loadPoints(), loadMemory(), refreshHistory()]); });
})();
