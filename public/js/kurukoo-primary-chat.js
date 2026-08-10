(() => {
  const state = {
    phone: localStorage.getItem('kurukoo_user_phone') || '',
    token: '',
    conversationId: localStorage.getItem('kurukoo_conversation_id') || '',
    messages: [], busy: false, attached: null,
    theme: localStorage.getItem('kurukoo_theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  };
  const $ = id => document.getElementById(id);
  const chatContent = $('chat-content'), scroll = $('chat-scroll'), input = $('message-input'), send = $('send-message');
  const setConnection = (ok, text = ok ? 'Connected' : 'Offline') => { const el = $('connection-status'); if (el) { el.innerHTML = `<span class="status-dot"></span> ${text}`; el.classList.toggle('offline', !ok); } };
  const authHeaders = () => ({});
  const applyTheme = () => { document.body.classList.toggle('dark', state.theme === 'dark'); localStorage.setItem('kurukoo_theme', state.theme); };
  function sanitizeHtml(html) { const doc = new DOMParser().parseFromString(html, 'text/html'); doc.querySelectorAll('script,iframe,object,embed,style,link,form').forEach(n => n.remove()); doc.querySelectorAll('*').forEach(n => [...n.attributes].forEach(a => { if (/^on/i.test(a.name) || /^(javascript|data):/i.test(a.value)) n.removeAttribute(a.name); })); return doc.body.innerHTML; }
  function renderMarkdown(text) { if (!window.marked) return String(text || '').replace(/[&<>]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[c])).replace(/\n/g, '<br>'); marked.setOptions({ breaks: true, gfm: true }); return sanitizeHtml(marked.parse(text || '')); }
  function enhanceCode(root) { root.querySelectorAll('pre code').forEach(block => { if (window.hljs && !block.dataset.highlighted) hljs.highlightElement(block); }); }
  function escapeAttr(value) { return String(value || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  async function ensureIdentity() {
    const sessionCheck = await fetch('/api/chat/history?limit=1').catch(() => null);
    if (sessionCheck?.ok) { setConnection(true); return true; }
    const entered = window.prompt('Enter your phone number to continue with Kurukoo:');
    if (!entered) return false;
    state.phone = entered.trim();
    if (!/^\+?[1-9]\d{7,14}$/.test(state.phone.replace(/[\s().-]/g, ''))) { setConnection(false, 'Invalid phone'); return false; }
    state.phone = state.phone.replace(/[\s().-]/g, '');
    try {
      const request = await fetch('/api/chat/auth/request-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: state.phone }) });
      const requestData = await request.json().catch(() => ({}));
      if (!request.ok) { alert(requestData.error || 'Unable to send verification code.'); return false; }
      let code = window.prompt('Enter the 6-digit Kurukoo verification code sent to your phone:');
      if (!code) return false;
      const verify = await fetch('/api/chat/auth/verify-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: state.phone, code: code.trim() }) });
      const verifyData = await verify.json().catch(() => ({}));
      if (!verify.ok) { alert(verifyData.error || 'Invalid verification code.'); return false; }
      localStorage.setItem('kurukoo_user_phone', state.phone);
      localStorage.removeItem('kurukoo_auth_token');
      setConnection(true);
      return true;
    } catch { setConnection(false, 'Connection issue'); return false; }
  }

  function addHistoryItem(conversation, active = false) {
    const list = $('history-list'); if (!list || !conversation?.id) return;
    let item = list.querySelector(`[data-conversation-id="${CSS.escape(conversation.id)}"]`);
    if (!item) { item = document.createElement('button'); item.type = 'button'; item.className = 'history-item'; item.dataset.conversationId = conversation.id; item.textContent = conversation.title || 'New conversation'; item.addEventListener('click', () => loadConversation(conversation.id)); list.appendChild(item); }
    item.classList.toggle('active', active);
  }

  function createMessage(role, text = '', id = null, cardData = null) {
    const wrap = document.createElement('article'); wrap.className = `message ${role}`; if (id) wrap.dataset.messageId = id;
    const avatar = role === 'assistant' ? '<div class="avatar" aria-hidden="true">K</div>' : '';
    wrap.innerHTML = `${avatar}<div class="message-body"><div class="bubble"><div class="markdown-body"></div></div><div class="message-actions"></div></div>`;
    const bubble = wrap.querySelector('.markdown-body'); bubble.innerHTML = renderMarkdown(text); enhanceCode(wrap);
    const actions = wrap.querySelector('.message-actions');
    actions.innerHTML = role === 'assistant' ? '<button data-action="copy">Copy</button><button data-action="regenerate">Regenerate</button><button data-action="delete">Delete</button>' : '<button data-action="copy">Copy</button><button data-action="delete">Delete</button>';
    actions.addEventListener('click', async event => {
      const button = event.target.closest('button'); if (!button) return; const action = button.dataset.action;
      if (action === 'copy') await navigator.clipboard?.writeText(wrap.querySelector('.bubble').innerText);
      if (action === 'delete') { if (wrap.dataset.messageId) await deleteMessage(Number(wrap.dataset.messageId)); wrap.remove(); }
      if (action === 'regenerate') { const lastUser = [...state.messages].reverse().find(m => m.role === 'user'); if (lastUser) await sendMessage(lastUser.text); }
    });
    chatContent.appendChild(wrap); if (cardData) renderCard(cardData, wrap); scroll.scrollTop = scroll.scrollHeight; return wrap;
  }

  function appendStreamBubble() {
    $('welcome')?.remove(); const wrap = document.createElement('article'); wrap.className = 'message assistant';
    wrap.innerHTML = '<div class="avatar" aria-hidden="true">K</div><div class="message-body"><div class="bubble"><div class="markdown-body"></div><div class="thinking" hidden><details><summary>Reasoning completed</summary><div>Kurukoo selected the appropriate response path. Private model reasoning is not exposed.</div></details></div></div><div class="message-actions"><button data-action="copy">Copy</button><button data-action="regenerate">Regenerate</button><button data-action="delete">Delete</button></div></div>';
    chatContent.appendChild(wrap); return wrap;
  }

  function addUserMessage(text, id = null) { $('welcome')?.remove(); state.messages.push({ role: 'user', text, id }); return createMessage('user', text, id); }
  function setDeferredStatus(card) { const status = $('deferred-status'); if (!status) return; if (!card || !['worker_match','service_search','nearby_radar'].includes(card.type)) { status.hidden = true; return; } status.hidden = false; status.textContent = card.type === 'nearby_radar' ? '📡 Searching your shared Nearby Pulse for active providers…' : '🔎 Searching for a verified match. If none is available now, Kurukoo will keep the request open and notify you when a match appears.'; }

  async function uploadAttachment(file) {
    const reader = new FileReader(); const data = await new Promise((resolve, reject) => { reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
    const response = await fetch('/api/chat/attachments', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify({ name: file.name, type: file.type || 'application/octet-stream', data }) });
    if (!response.ok) { const err = await response.json().catch(() => ({})); throw new Error(err.error || 'Attachment upload failed'); }
    return (await response.json()).attachment;
  }

  async function sendMessage(raw) {
    const text = String(raw || input.value || '').trim(); if (!text || state.busy || !(await ensureIdentity())) return;
    state.busy = true; send.disabled = true; setConnection(true); input.value = ''; input.style.height = 'auto';
    let attachment = state.attached;
    try {
      if (attachment instanceof File) { input.placeholder = 'Uploading attachment…'; attachment = await uploadAttachment(attachment); }
      state.attached = null; $('attachment-preview').hidden = true; $('attachment-preview').textContent = '';
      const finalText = attachment ? `${text}\n\n[Attachment: ${attachment.name} — ${attachment.type} — ${attachment.url}]` : text;
      const user = addUserMessage(finalText); const assistant = appendStreamBubble(); const output = assistant.querySelector('.markdown-body'); const thinking = assistant.querySelector('.thinking'); let full = '';
      const response = await fetch('/api/chat/stream', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify({ message: finalText, channel: 'web', conversationId: state.conversationId || undefined, attachment: attachment || undefined }) });
      if (!response.ok || !response.body) throw new Error(`Chat request failed (${response.status})`);
      const reader = response.body.getReader(), decoder = new TextDecoder(); let buffer = '';
      while (true) {
        const { value, done } = await reader.read(); if (done) break; buffer += decoder.decode(value, { stream: true }); const events = buffer.split('\n\n'); buffer = events.pop() || '';
        for (const event of events) {
          const line = event.split('\n').find(x => x.startsWith('data: ')); if (!line) continue; const payload = line.slice(6); if (payload === '[DONE]') continue;
          let data; try { data = JSON.parse(payload); } catch { continue; }
          if (data.type === 'conversation') { state.conversationId = data.conversationId; localStorage.setItem('kurukoo_conversation_id', state.conversationId); user.dataset.messageId = data.messageId || ''; }
          if (data.type === 'metadata') updateModelStatus(data);
          if (data.type === 'thought' && thinking) thinking.hidden = false;
          if (data.type === 'text') { full += data.content || ''; output.innerHTML = renderMarkdown(full); enhanceCode(assistant); scroll.scrollTop = scroll.scrollHeight; }
          if (data.type === 'done') { assistant.dataset.messageId = data.messageId || ''; setDeferredStatus(data.cardData); if (data.cardData) renderCard(data.cardData, assistant); }
          if (data.type === 'error') throw new Error(data.error || 'Stream error');
        }
      }
      state.messages.push({ role: 'user', text: finalText, id: Number(user.dataset.messageId) || null }); state.messages.push({ role: 'assistant', text: full, id: Number(assistant.dataset.messageId) || null });
      if (!full) output.textContent = 'I could not complete that request. Please try again.';
      await refreshHistory();
    } catch (error) { setConnection(false, 'Connection issue'); const bubble = chatContent.querySelector('.message.assistant:last-child .markdown-body'); if (bubble) bubble.innerHTML = renderMarkdown(`I’m having trouble completing that right now. **Please try again.**\n\n_${error.message}_`); }
    finally { state.busy = false; send.disabled = false; input.placeholder = 'Message Kurukoo'; input.focus(); loadPoints(); }
  }

  function renderCard(card, messageEl) {
    if (!card || !messageEl) return; const holder = document.createElement('div'); holder.className = 'provider-card';
    if (card.type === 'ride_picker') holder.innerHTML = '<strong>Choose a ride</strong><div class="quick-actions"><button>🚗 Okada</button><button>🛺 Keke</button><button>🚕 Taxi</button></div><span class="escrow-badge">🔒 Escrow Protected</span>';
    else if (card.type === 'worker_match' || card.type === 'service_search') holder.innerHTML = `<strong>${card.category === 'food' ? 'Local food vendors' : 'Verified providers'}</strong><div class="deferred">Searching with your shared Memory Profile and real-time presence.</div><span class="escrow-badge">🔒 Escrow Protected</span>`;
    else if (card.type === 'nearby_radar') holder.innerHTML = '<strong>Nearby Pulse</strong><div class="deferred">Active providers will surface here as Kurukoo matches your request.</div>';
    else if (card.type === 'sports_search') holder.innerHTML = '<strong>Sports network</strong><div class="deferred">Searching leagues, teams, matches and nearby play.</div>';
    else if (card.type === 'event_coverage') holder.innerHTML = '<strong>Event Coverage</strong><div class="deferred">Contributor workflow ready: offer → accept → check-in → capture → moderation → payout.</div>';
    else if (card.type === 'security_booking') holder.innerHTML = '<strong>Vetted security</strong><span class="escrow-badge">🔒 Escrow Protected</span>';
    else holder.innerHTML = `<strong>${escapeAttr(card.category || card.type || 'Kurukoo action')}</strong>`;
    holder.querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => sendMessage(`${btn.textContent.trim()} ride`))); messageEl.querySelector('.bubble').appendChild(holder);
  }
  function updateModelStatus(data) { const label = $('model-badge'); if (label && data.model) label.textContent = data.model; }

  async function loadPoints() { if (!state.phone) return; try { const res = await fetch(`/api/points/balance?phone=${encodeURIComponent(state.phone)}`, { headers: authHeaders() }); if (!res.ok) return; const data = await res.json(); const points = Number(data.points || 0); $('points-balance').querySelector('span').textContent = points; $('inspector-points').textContent = points; } catch {} }
  async function loadMemory() { if (!state.phone) return; try { const res = await fetch(`/api/profile?phone=${encodeURIComponent(state.phone)}`, { headers: authHeaders() }); if (!res.ok) return; const data = await res.json(); const profile = data.profile || {}; const text = `Kurukoo remembers ${profile.location || 'your area'}${profile.primary_lga ? `, ${profile.primary_lga}` : ''}. Your Memory Profile is shared across channels.`; $('memory-context').textContent = text; $('inspector-memory').textContent = text; } catch {} }

  async function refreshHistory() {
    if (!state.phone) return; try {
      const url = new URL('/api/chat/history', location.origin); if (state.conversationId) url.searchParams.set('conversationId', state.conversationId); url.searchParams.set('limit', '60');
      const res = await fetch(url, { headers: authHeaders() }); if (!res.ok) return; const data = await res.json(); const list = $('history-list'); list.innerHTML = '';
      data.conversations.forEach(c => addHistoryItem(c, c.id === state.conversationId));
      if (data.messages?.length && chatContent.querySelectorAll('.message').length === 0) renderMessages(data.messages);
    } catch { setConnection(false, 'Offline'); }
  }
  function renderMessages(messages) { $('welcome')?.remove(); chatContent.querySelectorAll('.message').forEach(n => n.remove()); state.messages = []; messages.forEach(m => { state.messages.push({ role: m.sender, text: m.content, id: m.id }); createMessage(m.sender === 'user' ? 'user' : 'assistant', m.content || '', m.id, m.card_data ? safeJson(m.card_data) : null); }); scroll.scrollTop = scroll.scrollHeight; }
  function safeJson(value) { try { return typeof value === 'string' ? JSON.parse(value) : value; } catch { return null; } }
  async function loadConversation(id) { state.conversationId = id; localStorage.setItem('kurukoo_conversation_id', id); const url = new URL('/api/chat/history', location.origin); url.searchParams.set('conversationId', id); url.searchParams.set('limit', '100'); const res = await fetch(url, { headers: authHeaders() }); if (!res.ok) return; const data = await res.json(); renderMessages(data.messages || []); await refreshHistory(); $('chat-sidebar').classList.remove('open'); }
  async function deleteMessage(id) { if (!id) return; try { await fetch(`/api/chat/message/${id}`, { method: 'DELETE', headers: authHeaders() }); } catch {} }

  function wireQuickActions(root) { if (!root || root.dataset.wired) return; root.dataset.wired = 'true'; root.addEventListener('click', e => { const button = e.target.closest('button[data-prompt]'); if (button) sendMessage(button.dataset.prompt); }); }
  wireQuickActions($('quick-actions')); wireQuickActions($('composer-quick-actions'));

  send.addEventListener('click', () => sendMessage()); input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }); input.addEventListener('input', () => { input.style.height = 'auto'; input.style.height = `${Math.min(input.scrollHeight, 180)}px`; });
  $('attach-file').addEventListener('click', () => $('file-input').click()); $('file-input').addEventListener('change', e => { const file = e.target.files?.[0] || null; state.attached = file; const preview = $('attachment-preview'); if (file) { preview.hidden = false; preview.textContent = `📎 ${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB`; } });
  $('theme-toggle').addEventListener('click', () => { state.theme = state.theme === 'dark' ? 'light' : 'dark'; applyTheme(); });
  $('open-sidebar').addEventListener('click', () => $('chat-sidebar').classList.add('open')); $('close-sidebar').addEventListener('click', () => $('chat-sidebar').classList.remove('open')); $('memory-toggle').addEventListener('click', () => $('chat-inspector').classList.toggle('open')); $('close-inspector').addEventListener('click', () => $('chat-inspector').classList.remove('open'));
  $('new-chat').addEventListener('click', async () => { if (!await ensureIdentity()) return; try { const res = await fetch('/api/chat/conversation', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify({ channel: 'web', title: 'New conversation' }) }); const data = await res.json(); if (data.conversationId) { state.conversationId = data.conversationId; localStorage.setItem('kurukoo_conversation_id', data.conversationId); } } catch {} state.messages = []; chatContent.innerHTML = ''; $('deferred-status').hidden = true; renderWelcome(); refreshHistory(); });
  $('topup-points').addEventListener('click', () => sendMessage('I want to top up my Points')); $('points-balance').addEventListener('click', () => sendMessage('Show my Points balance and ways to top up'));
  $('voice-input').addEventListener('click', () => { const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition; if (!Recognition) return input.focus(); const recognition = new Recognition(); recognition.lang = 'en-NG'; recognition.onresult = e => { input.value = e.results[0][0].transcript; input.dispatchEvent(new Event('input')); }; recognition.start(); });
  function renderWelcome() { chatContent.innerHTML = '<div class="welcome" id="welcome"><div class="welcome-mark">K</div><h1>What can I help you get done?</h1><p>One conversation for finding work, buying, earning, coordinating services, and everyday questions.</p><div class="quick-actions" id="quick-actions"><button data-prompt="Book a ride for me">🚗 Ride</button><button data-prompt="Order food near me">🍔 Food</button><button data-prompt="Find a verified repair worker">🔧 Repair</button><button data-prompt="I need emergency help">🏥 Emergency</button><button data-prompt="Help me find a way to earn">⚡ Earn</button></div></div>'; wireQuickActions($('quick-actions')); }
  applyTheme();
  ensureIdentity().then(ok => { if (ok) Promise.all([loadPoints(), loadMemory(), refreshHistory()]); });
})();
