(() => {
  const state = {
    conversationId: localStorage.getItem('kurukoo_conversation_id') || '',
    displayName: '', authStep: 'none', messages: [], busy: false, attached: null, controller: null,
    theme: localStorage.getItem('kurukoo_theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
    activeStorefrontId: null,
    nativeAssistance: { reminders: [], checkIns: [] },
    pinnedMessages: [], surfaceView: null, notifiedNotificationIds: new Set()
  };
  const $ = id => document.getElementById(id);
  const chatContent = $('chat-content'), scroll = $('chat-scroll'), input = $('message-input'), send = $('send-message'), stop = $('stop-generation');
  const activityStages = ['Reviewing your request', 'Checking the relevant context', 'Preparing a clear response'];
  let activityTimer = null;
  let activityStageIndex = 0;
  const pinStorageKey = () => `kurukoo_pins_${state.conversationId || 'draft'}`;
  function savePinnedMessages() { try { localStorage.setItem(pinStorageKey(), JSON.stringify(state.pinnedMessages)); } catch {} }
  function loadPinnedMessages() { try { const parsed = JSON.parse(localStorage.getItem(pinStorageKey()) || '[]'); state.pinnedMessages = Array.isArray(parsed) ? parsed.slice(0, 12) : []; } catch { state.pinnedMessages = []; } renderPinnedMessages(); }
  function renderPinnedMessages() { const card = $('pinned-card'), list = $('pinned-list'); if (!card || !list) return; card.hidden = false; list.replaceChildren(); if (!state.pinnedMessages.length) { list.appendChild(makeElement('p', 'empty-state', 'Long-press or right-click a message to pin it here.')); return; } state.pinnedMessages.forEach(pin => { const row = makeElement('div', 'pinned-message'); const reference = makeElement('button', 'pinned-message-reference', pin.text); reference.type = 'button'; reference.title = 'Jump to pinned message'; reference.addEventListener('click', () => { const target = chatContent.querySelector(`[data-pin-key="${CSS.escape(pin.key)}"]`); if (target) { target.scrollIntoView({ behavior: 'smooth', block: 'center' }); target.classList.add('message-pinned-focus'); setTimeout(() => target.classList.remove('message-pinned-focus'), 1200); } }); const remove = makeElement('button', 'text-btn', 'Unpin'); remove.type = 'button'; remove.addEventListener('click', () => togglePinnedMessage(pin.key)); row.append(reference, remove); list.appendChild(row); }); }
  function togglePinnedMessage(key, message = null) { const index = state.pinnedMessages.findIndex(pin => pin.key === key); if (index >= 0) state.pinnedMessages.splice(index, 1); else if (message) state.pinnedMessages.unshift({ key, role: message.role, text: String(message.text || '').slice(0, 280) }); else return; savePinnedMessages(); renderPinnedMessages(); }
  function wirePinGestures(wrap, role, text) { const key = wrap.dataset.pinKey || (wrap.dataset.messageId ? `message-${wrap.dataset.messageId}` : `local-${crypto.randomUUID()}`); wrap.dataset.pinKey = key; const toggle = () => togglePinnedMessage(key, { role, text }); let timer = null; wrap.addEventListener('contextmenu', event => { event.preventDefault(); toggle(); }); wrap.addEventListener('pointerdown', event => { if (event.pointerType !== 'touch' || event.target.closest('button,a,input,textarea')) return; timer = setTimeout(() => { timer = null; toggle(); }, 560); }); ['pointerup','pointercancel','pointerleave','pointermove'].forEach(type => wrap.addEventListener(type, () => { if (timer) { clearTimeout(timer); timer = null; } })); }


  const makeElement = (tag, className = '', text = '') => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
  };
  const makeIcon = (name, label = '') => {
    const icon = document.createElement('svg');
    icon.className = 'k-icon';
    icon.setAttribute('aria-hidden', 'true');
    const use = document.createElement('use');
    use.setAttribute('href', `/icons/kurukoo-icons.svg#${name}`);
    icon.appendChild(use);
    if (label) icon.setAttribute('data-icon-label', label);
    return icon;
  };
  const surfacePaths = { cart: '/cart', points: '/points', requests: '/requests', reminders: '/reminders', saved: '/saved', tasks: '/tasks', 'daily-picks': '/daily-picks', discover: '/discover', connect: '/channels', memory: '/memory', safety: '/safety', settings: '/settings', topics: '/topics' };
  const surfaceTitles = { cart: 'Cart', points: 'Points', requests: 'Requests', reminders: 'Reminders', saved: 'Saved & offers', tasks: 'Tasks', 'daily-picks': 'Daily Picks', discover: 'Discover', connect: 'Connect', memory: 'Memory', safety: 'Safety & check-ins', settings: 'Settings', topics: 'Topics' };
  function renderSurfaceFallback(view, message = 'This workspace view is not available yet.') {
    const body = makeElement('div', 'surface-empty'); body.append(makeIcon('info', 'Information'), makeElement('h3', surfaceTitles[view] || 'Workspace'), makeElement('p', message)); return body;
  }
  async function renderWorkspaceSurface(view) {
    if (!chatContent || !surfacePaths[view]) return;
    state.surfaceView = view;
    const surface = makeElement('section', 'workspace-surface'); surface.dataset.surfaceView = view;
    const bar = makeElement('div', 'surface-toolbar'); const back = makeElement('button', 'surface-back', 'Back to conversation'); back.type = 'button'; back.append(makeIcon('chevron-left', 'Back')); back.addEventListener('click', () => { state.surfaceView = null; chatContent.replaceChildren(); if (state.messages.length) renderMessages(state.messages); else renderWelcome(); });
    bar.append(back, makeElement('span', 'surface-kicker', 'Kurukoo workspace')); surface.append(bar);
    const heading = makeElement('div', 'surface-heading'); heading.append(makeElement('h1', '', surfaceTitles[view] || 'Workspace'), makeElement('p', '', 'This view stays inside your conversation workspace.'));
    surface.append(heading); const body = makeElement('div', 'surface-body'); body.append(makeElement('div', 'surface-loading', 'Loading…')); surface.append(body); chatContent.replaceChildren(surface); scroll.scrollTop = 0;
    try {
      if (view === 'points') { const res = await fetch('/api/points/balance', { credentials: 'same-origin' }); const data = await res.json().catch(() => ({})); body.replaceChildren(makeElement('div', 'surface-stat-card', `${Number(data.points || 0)} Points`), makeElement('p', '', 'Points balance is shown here without leaving the conversation workspace.')); return; }
      const res = await fetch(surfacePaths[view], { credentials: 'same-origin' }); if (!res.ok) throw new Error('Workspace view unavailable'); const html = await res.text(); const doc = new DOMParser().parseFromString(html, 'text/html'); const source = doc.querySelector('.workspace-content, main, .workspace-main'); if (!source) throw new Error('Workspace content unavailable');       body.innerHTML = source.innerHTML; body.querySelectorAll('script').forEach(script => script.remove()); body.querySelectorAll('a[href]').forEach(link => { const href = link.getAttribute('href') || ''; const mapped = Object.entries(surfacePaths).find(([, path]) => href === path || href.startsWith(`${path}?`)); if (mapped) { link.dataset.surfaceView = mapped[0]; link.removeAttribute('href'); } }); wireSurfaceActions(body);
    } catch (error) { body.replaceChildren(renderSurfaceFallback(view, error.message || undefined)); }
  }
  async function loadConversation(conversationId) { if (!conversationId) return; state.surfaceView = null; state.conversationId = conversationId; localStorage.setItem('kurukoo_conversation_id', conversationId); try { const url = new URL('/api/chat/history', location.origin); url.searchParams.set('conversationId', conversationId); url.searchParams.set('limit', '60'); const res = await fetch(url, { credentials: 'same-origin' }); const data = await res.json(); state.messages = (data.messages || []).map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', text: m.content, id: m.id })); renderMessages(data.messages || []); refreshHistory(); } catch { setConnection(false, 'Offline'); } }
  function wireSurfaceActions(root = document) { root.querySelectorAll('[data-surface-view]').forEach(action => { if (action.dataset.surfaceWired === '1') return; action.dataset.surfaceWired = '1'; action.addEventListener('click', event => { event.preventDefault(); renderWorkspaceSurface(action.dataset.surfaceView); }); }); }

  function setComposerBusy(busy) {
    state.busy = busy;
    if (send) { send.hidden = busy; send.disabled = busy; }
    if (stop) stop.hidden = !busy;
    if (input) input.setAttribute('aria-busy', String(busy));
  }

  const setConnection = (ok, text = ok ? 'Connected' : 'Offline') => {
    const el = $('connection-status');
    if (el) {
      el.replaceChildren(makeElement('span', 'status-dot'), document.createTextNode(` ${text}`));
      el.classList.toggle('offline', !ok);
    }
  };

  function setTypingStatus(status = 'complete', label = '') {
    const active = status === 'typing' || status === 'thinking';
    let indicator = chatContent?.querySelector('[data-kurukoo-typing]');
    if (!active) {
      if (activityTimer) { clearInterval(activityTimer); activityTimer = null; }
      indicator?.remove();
      return;
    }
    if (!indicator) {
      indicator = document.createElement('article');
      indicator.className = 'typing-indicator message assistant';
      indicator.dataset.kurukooTyping = 'true';
      indicator.setAttribute('role', 'status');
      indicator.setAttribute('aria-live', 'polite');
      indicator.setAttribute('aria-atomic', 'true');
      const avatar = makeElement('div', 'avatar'); avatar.setAttribute('aria-hidden', 'true');
      const image = document.createElement('img'); image.src = '/assets/brand/logo-icon.svg'; image.alt = ''; image.width = 20;
      avatar.appendChild(image);
      const bubble = makeElement('div', 'bubble typing-indicator-bubble');
      const text = makeElement('span', 'typing-indicator-label');
      const activity = makeElement('span', 'agent-activity-line');
      activity.setAttribute('aria-hidden', 'true');
      const orbit = makeElement('span', 'agent-activity-orbit');
      orbit.append(makeElement('i'), makeElement('i'), makeElement('i'));
      const stage = makeElement('span', 'agent-activity-stage', activityStages[activityStageIndex]);
      activity.append(orbit, stage);
      const dots = makeElement('span', 'typing-indicator-dots'); dots.setAttribute('aria-hidden', 'true');
      dots.append(makeElement('i'), makeElement('i'), makeElement('i'));
      bubble.append(text, activity, dots); indicator.append(avatar, bubble); chatContent?.appendChild(indicator);
      activityTimer = setInterval(() => {
        const current = chatContent?.querySelector('[data-kurukoo-typing] .agent-activity-stage');
        if (!current) return;
        activityStageIndex = (activityStageIndex + 1) % activityStages.length;
        current.textContent = activityStages[activityStageIndex];
      }, 2200);
    }
    indicator.dataset.status = status;
    const text = indicator.querySelector('.typing-indicator-label');
    if (text) text.textContent = label || (status === 'thinking' ? 'Kurukoo is considering the best next step…' : 'Kurukoo is typing…');
    if (scroll) scroll.scrollTop = scroll.scrollHeight;
  }

  const applyTheme = () => { document.body.classList.toggle('dark', state.theme === 'dark'); localStorage.setItem('kurukoo_theme', state.theme); };

  function sanitizeHtml(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    doc.querySelectorAll('script,iframe,object,embed,style,link,form').forEach(n => n.remove());
    doc.querySelectorAll('*').forEach(n => [...n.attributes].forEach(a => { if (/^on/i.test(a.name) || /^(javascript|data):/i.test(a.value)) n.removeAttribute(a.name); }));
    return doc.body.innerHTML;
  }

  function renderMarkdown(text) {
    if (!window.marked) return String(text || '').replace(/[&<>]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[c])).replace(/\n/g, '<br>');
    marked.setOptions({ breaks: true, gfm: true });
    return sanitizeHtml(marked.parse(text || ''));
  }

  function setMarkdown(el, text) {
    const html = renderMarkdown(text);
    el.replaceChildren(document.createRange().createContextualFragment(html));
  }

  function enhanceCode(root) { root.querySelectorAll('pre code').forEach(block => { if (window.hljs && !block.dataset.highlighted) hljs.highlightElement(block); }); }
  function escapeAttr(value) { return String(value || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function escapeText(value) { return String(value || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function updateNativeAssistanceStatus() {
    const banner = $('native-assistance-status'); if (!banner) return;
    const now = Date.now();
    const reminders = Array.isArray(state.nativeAssistance?.reminders) ? state.nativeAssistance.reminders : [];
    const checkIns = Array.isArray(state.nativeAssistance?.checkIns) ? state.nativeAssistance.checkIns : [];

    const activeCheckIns = checkIns.filter(item => item?.status === 'active' && item?.expires_at).map(item => ({ ...item, expiresAt: new Date(item.expires_at).getTime() })).filter(item => Number.isFinite(item.expiresAt)).sort((a, b) => a.expiresAt - b.expiresAt);
    const expiringCheckIn = activeCheckIns.find(item => item.expiresAt <= now + (2 * 60 * 60 * 1000));
    if (expiringCheckIn) {
      const when = expiringCheckIn.expiresAt <= now ? 'has reached its scheduled end' : `ends at ${new Date(expiringCheckIn.expiresAt).toLocaleString()}`;
      banner.textContent = `Personal safety check-in ${when}. Review it in the context inspector; no contact is notified automatically.`;
      banner.dataset.kind = 'safety'; banner.hidden = false; return;
    }

    const upcomingReminder = reminders.filter(item => item?.status === 'active' && item?.due_at).map(item => ({ ...item, dueAt: new Date(item.due_at).getTime() })).filter(item => Number.isFinite(item.dueAt) && item.dueAt <= now + (24 * 60 * 60 * 1000)).sort((a, b) => a.dueAt - b.dueAt)[0];
    if (upcomingReminder) {
      const title = String(upcomingReminder.title || 'Reminder');
      const due = upcomingReminder.dueAt <= now ? 'needs your attention now' : `is scheduled for ${new Date(upcomingReminder.dueAt).toLocaleString()}`;
      banner.textContent = `Reminder: ${title} ${due}. Review it in the context inspector.`;
      banner.dataset.kind = 'reminder'; banner.hidden = false; return;
    }
    banner.hidden = true; banner.textContent = '';
  }

  function showEmbedSignInGate() {
    if (!chatContent || chatContent.querySelector('[data-embed-signin-gate]')) return;
    const gate = document.createElement('div');
    gate.dataset.embedSigninGate = '1';
    gate.className = 'message assistant';

    const avatar = makeElement('div', 'avatar', 'K'); avatar.setAttribute('aria-hidden', 'true');
    const body = makeElement('div', 'message-body');
    const bubble = makeElement('div', 'bubble');
    const md = makeElement('div', 'markdown-body');
    const p1 = document.createElement('p'); p1.appendChild(makeElement('strong', '', 'Continue chatting with Kurukoo'));
    const p2 = document.createElement('p'); p2.textContent = 'Your Memory Profile and conversation history stay private until you complete the name, phone and verification conversation in full chat.';
    const p3 = document.createElement('p');
    const a1 = makeElement('a', 'primary-btn', 'Open full chat'); a1.href = '/chat'; a1.target = '_top'; a1.rel = 'noopener';
    p3.append(a1);
    md.append(p1, p2, p3);
    bubble.appendChild(md);
    body.appendChild(bubble);
    gate.append(avatar, body);

    chatContent.appendChild(gate);
    if (scroll) scroll.scrollTop = scroll.scrollHeight;
  }

  async function ensureIdentity() {
    const sessionCheck = await fetch('/api/auth/me', { credentials: 'same-origin' }).catch(() => null);
    if (sessionCheck?.ok) {
      const sessionData = await sessionCheck.json().catch(() => ({}));
      setConnection(true);
      state.isGuest = false;
      state.displayName = sessionData.name || sessionData.user?.name || sessionData.profile?.name || '';
      const testBanner = $('development-test-banner');
      if (testBanner) testBanner.hidden = sessionData.developmentTestAccount !== true;
      const contextBanner = $('session-context-banner');
      const context = sessionData.sessionContext || {};
      if (contextBanner && (context.operator || context.testActor)) {
        contextBanner.hidden = false;
        contextBanner.textContent = context.testActor
          ? `Controlled Test As: ${context.actorRole || context.actorContextId || 'actor'} · isolated state · no production user data`
          : 'Canonical User #1 operator Chat · normal authenticated platform state';
      }
      return true;
    }

    if (sessionCheck?.status === 401) {
      state.isGuest = true;
      setConnection(true, 'guest');
      return true;
    }

    setConnection(false, 'Offline');
    return false;
  }

  async function startGuestAuth() {
    if (!state.isGuest) return;
    try { await fetch('/api/chat/auth/start', { method: 'POST', credentials: 'same-origin' }); } catch {}
  }

  function setAuthComposerStep(step = 'none') {
    state.authStep = step;
    if (!input) return;
    const prompts = { name: 'Type your name…', phone: 'Type your phone number…', otp: 'Type the 6-digit code…' };
    input.placeholder = prompts[step] || (state.displayName ? 'Tell Kurukoo what you need…' : 'Tell Kurukoo what you need…');
    input.setAttribute('aria-label', step === 'name' ? 'Your name' : step === 'phone' ? 'Your phone number' : step === 'otp' ? 'Verification code' : 'Message Kurukoo');
  }

  function renderWelcomeAuth() {
    if (!state.isGuest) return;
    setAuthComposerStep('name');
    input?.focus();
  }

  function addHistoryItem(conversation, active = false) {
    const list = $('history-list'); if (!list || !conversation?.id) return;
    let item = list.querySelector(`[data-conversation-id="${CSS.escape(conversation.id)}"]`);
    if (!item) {
      item = document.createElement('button'); item.type = 'button'; item.className = 'history-item'; item.dataset.conversationId = conversation.id;
      item.addEventListener('click', () => loadConversation(conversation.id)); list.appendChild(item);
    }
    item.replaceChildren(); item.append(makeElement('span', 'history-title', conversation.title || 'New conversation'));
    try { const pins = JSON.parse(localStorage.getItem(`kurukoo_pins_${conversation.id}`) || '[]'); if (Array.isArray(pins) && pins.length) { const pin = makeIcon('saved', 'Pinned'); pin.classList.add('history-pin-indicator'); pin.setAttribute('aria-label', 'Pinned references'); item.appendChild(pin); } } catch {}
    item.classList.toggle('active', active);
  }

  function createMessage(role, text = '', id = null, cardData = null, animate = true) {
    const wrap = document.createElement('article'); wrap.className = `message ${role}`; wrap.dataset.messageState = animate ? 'incoming' : 'history'; if (animate) wrap.classList.add('message-enter'); if (id) wrap.dataset.messageId = id;

    const avatarDiv = makeElement('div', 'avatar'); avatarDiv.setAttribute('aria-hidden', 'true');
    if (role === 'assistant') {
      const img = document.createElement('img'); img.src = '/assets/brand/logo-icon.svg'; img.alt = 'K'; img.width = 20;
      avatarDiv.appendChild(img);
    }

    const body = makeElement('div', 'message-body');
    const bubble = makeElement('div', 'bubble');
    const md = makeElement('div', 'markdown-body');
    setMarkdown(md, text);
    bubble.appendChild(md);

    const actions = makeElement('div', 'message-actions');
    const buttons = role === 'assistant' ? [['pin', 'Pin', 'saved'], ['copy', 'Copy', 'copy'], ['regenerate', 'Retry', 'retry'], ['delete', 'Delete', 'trash']] : [['pin', 'Pin', 'saved'], ['copy', 'Copy', 'copy'], ['edit', 'Edit', 'edit'], ['delete', 'Delete', 'trash']];
    buttons.forEach(([act, lab, iconName]) => {
      const btn = makeElement('button', 'message-action-btn');
      btn.type = 'button'; btn.dataset.action = act; btn.setAttribute('aria-label', lab); btn.title = lab;
      btn.appendChild(makeIcon(iconName, lab));
      actions.appendChild(btn);
    });

    body.append(bubble, actions);
    if (role === 'assistant') wrap.appendChild(avatarDiv);
    wrap.appendChild(body);

    actions.addEventListener('click', async event => {
      const button = event.target.closest('button'); if (!button) return; const action = button.dataset.action;
      if (action === 'pin') togglePinnedMessage(wrap.dataset.pinKey, { role, text });
      if (action === 'copy') await navigator.clipboard?.writeText(wrap.querySelector('.bubble').innerText);
      if (action === 'edit') { input.value = text; input.focus(); input.dispatchEvent(new Event('input')); }
      if (action === 'delete') {
        if (state.isGuest) { alert('Please sign in to delete messages.'); return; }
        if (wrap.dataset.messageId) await deleteMessage(Number(wrap.dataset.messageId));
        wrap.remove();
      }
      if (action === 'regenerate') {
        if (state.isGuest) { alert('Please sign in to regenerate messages.'); return; }
        const lastUser = [...state.messages].reverse().find(m => m.role === 'user');
        if (lastUser) await sendMessage(lastUser.text);
      }
    });

    chatContent.appendChild(wrap);
    wirePinGestures(wrap, role, text);
    if (cardData) renderCard(cardData, wrap);
    scroll.scrollTop = scroll.scrollHeight;
    enhanceCode(wrap);
    return wrap;
  }

  function appendStreamBubble() {
    $('welcome')?.remove();
    const wrap = document.createElement('article'); wrap.className = 'message assistant message-enter message-streaming'; wrap.dataset.messageState = 'incoming'; wrap.hidden = true;

    const avatar = makeElement('div', 'avatar'); avatar.setAttribute('aria-hidden', 'true');
    const img = document.createElement('img'); img.src = '/assets/brand/logo-icon.svg'; img.alt = 'K'; img.width = 20;
    avatar.appendChild(img);

    const body = makeElement('div', 'message-body');
    const bubble = makeElement('div', 'bubble');
    bubble.appendChild(makeElement('div', 'markdown-body'));

    const thinking = makeElement('div', 'thinking'); thinking.hidden = true;
    const details = document.createElement('details');
    details.appendChild(makeElement('summary', '', 'Reasoning completed'));
    details.appendChild(makeElement('div', '', 'Kurukoo selected the appropriate response path. Private model reasoning is not exposed.'));
    thinking.appendChild(details);
    bubble.appendChild(thinking);

    const actions = makeElement('div', 'message-actions');
    [['copy', 'Copy', 'copy'], ['regenerate', 'Retry', 'retry'], ['delete', 'Delete', 'trash']].forEach(([act, lab, iconName]) => {
      const btn = makeElement('button', 'message-action-btn'); btn.type = 'button'; btn.dataset.action = act; btn.setAttribute('aria-label', lab); btn.title = lab; btn.appendChild(makeIcon(iconName, lab)); actions.appendChild(btn);
    });

    body.append(bubble, actions);
    wrap.append(avatar, body);
    chatContent.appendChild(wrap);
    wirePinGestures(wrap, 'assistant', 'Kurukoo is responding…');
    return wrap;
  }

  function addUserMessage(text, id = null) { $('welcome')?.remove(); state.messages.push({ role: 'user', text, id }); return createMessage('user', text, id); }

  function setDeferredStatus(card) {
    const status = $('deferred-status');
    if (!status) return;
    if (!card) { status.hidden = true; return; }
    if (card.type === 'agentic_storefront') {
      if (card.stage === 'deferred') {
        status.hidden = false;
        status.textContent = '⏳ Request deferred — Kurukoo will retain the request for a supported next step. Any notification depends on a configured channel.';
      } else if (card.stage === 'fulfillment') {
        status.hidden = false;
        status.textContent = 'Fulfilment milestone recorded. Confirm completion to continue the documented request lifecycle.';
      } else if (['slot_fill', 'quote_review', 'offer_review', 'delivery_selection', 'seller_handover', 'delivery_in_progress'].includes(card.stage)) {
        status.hidden = false;
        status.textContent = `Request flow · ${card.stage.replace(/_/g, ' ')} · ${card.progress || 0}%`;
      } else {
        status.hidden = true;
      }
      return;
    }
    if (!['worker_match','service_search','nearby_radar'].includes(card.type)) { status.hidden = true; return; }
    status.hidden = false;
    status.textContent = card.type === 'nearby_radar'
      ? '📡 Checking request context for a supported nearby path…'
      : '🔎 Assessing the request for a supported match. If no path is currently available, the request can be deferred.';
  }

  function collectStorefrontFields(holder) {
    const fields = {};
    holder.querySelectorAll('[data-storefront-field]').forEach(el => {
      const key = el.getAttribute('data-storefront-field');
      if (key) fields[key] = el.value.trim();
    });
    return fields;
  }

  function markStorefrontStepSuperseded(messageEl, label = 'Submitted — see the latest request state below.') {
    const holder = messageEl?.querySelector('.agentic-storefront');
    if (!holder || !holder.querySelector('[data-storefront-field]') || holder.dataset.superseded === 'true') return;
    holder.dataset.superseded = 'true';
    holder.classList.add('storefront-superseded');
    holder.setAttribute('aria-label', 'Previous request step');
    holder.querySelectorAll('button, input, textarea, select').forEach(control => {
      control.disabled = true;
      control.setAttribute('aria-disabled', 'true');
    });
    const note = makeElement('small', 'storefront-superseded-note', label);
    holder.appendChild(note);
  }

  async function advanceStorefront(requestId, action, fields, messageEl) {
    if (!requestId || (state.busy && action !== 'cancel')) return;
    state.busy = true;
    if (send) send.disabled = true;
    try {
      const res = await fetch(`/api/chat/economic-requests/storefront/${encodeURIComponent(requestId)}/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ action, requirements: fields || {}, conversationId: state.conversationId || undefined })
      });
      if (res.status === 401) { await ensureIdentity(); throw new Error('Session expired'); }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || 'Could not update request');
      const card = data.card;
      markStorefrontStepSuperseded(messageEl);
      setDeferredStatus(card);
      if (card?.requestId) state.activeStorefrontId = card.requestId;
      const wrap = appendStreamBubble();
      const output = wrap.querySelector('.markdown-body');
      setMarkdown(output, card.message || 'Updated.');
      renderCard(card, wrap);
      state.messages.push({ role: 'assistant', text: card.message || '', id: null });
      scroll.scrollTop = scroll.scrollHeight;
      await loadPoints();
    } catch (error) {
      setConnection(false, 'Connection issue');
      const wrap = appendStreamBubble();
      setMarkdown(wrap.querySelector('.markdown-body'), `Could not continue that request. **${escapeText(error.message)}**`);
    } finally {
      state.busy = false;
      if (send) send.disabled = false;
    }
  }

  async function startKnownOffer(offerId) {
    if (!offerId || state.busy) return;
    state.busy = true;
    if (send) send.disabled = true;
    try {
      const res = await fetch(`/api/chat/economic-requests/offers/${encodeURIComponent(offerId)}/start`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: '{}'
      });
      if (res.status === 401) { await ensureIdentity(); throw new Error('Session expired'); }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || 'Could not start request from that offer');
      const card = data.card;
      setDeferredStatus(card);
      if (card?.requestId) state.activeStorefrontId = card.requestId;
      const wrap = appendStreamBubble();
      setMarkdown(wrap.querySelector('.markdown-body'), card.message || 'Offer selected.');
      renderCard(card, wrap);
      state.messages.push({ role: 'assistant', text: card.message || '', id: null });
      scroll.scrollTop = scroll.scrollHeight;
      await loadPoints();
    } catch (error) {
      const wrap = appendStreamBubble();
      setMarkdown(wrap.querySelector('.markdown-body'), `Could not select that offer. **${escapeText(error.message)}**`);
    } finally { state.busy = false; if (send) send.disabled = false; }
  }

  async function selectDeliveryCandidate(requestId, providerPhone) {
    if (!requestId || !providerPhone || state.busy) return;
    state.busy = true;
    if (send) send.disabled = true;
    try {
      const res = await fetch(`/api/chat/economic-requests/${encodeURIComponent(requestId)}/delivery-selection`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ providerPhone })
      });
      if (res.status === 401) { await ensureIdentity(); throw new Error('Session expired'); }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || 'Could not select delivery provider');
      const card = data.card;
      setDeferredStatus(card);
      const wrap = appendStreamBubble();
      setMarkdown(wrap.querySelector('.markdown-body'), card.message || 'Delivery provider selected.');
      renderCard(card, wrap);
      state.messages.push({ role: 'assistant', text: card.message || '', id: null });
      scroll.scrollTop = scroll.scrollHeight;
    } catch (error) {
      const wrap = appendStreamBubble();
      setMarkdown(wrap.querySelector('.markdown-body'), `Could not select that delivery provider. **${escapeText(error.message)}**`);
    } finally { state.busy = false; if (send) send.disabled = false; }
  }

  function renderAgenticStorefront(card, messageEl) {
    const holder = makeElement('div', 'provider-card agentic-storefront');
    holder.dataset.requestId = String(card.requestId || '');
    holder.dataset.stage = String(card.stage || '');

    const progress = Math.max(0, Math.min(100, Number(card.progress) || 0));
    const progressClass = Math.round(progress / 10) * 10;
    const head = makeElement('div', 'storefront-head');
    head.append(
      makeElement('strong', '', card.title || 'Kurukoo'),
      makeElement('span', 'storefront-stage', String(card.stage || '').replace(/_/g, ' '))
    );
    holder.appendChild(head);

    const progressBar = makeElement('div', 'storefront-progress');
    progressBar.setAttribute('role', 'progressbar');
    progressBar.setAttribute('aria-valuenow', String(progress));
    progressBar.setAttribute('aria-valuemin', '0');
    progressBar.setAttribute('aria-valuemax', '100');
    progressBar.appendChild(makeElement('i', `storefront-progress-meter progress-${progressClass}`));
    holder.appendChild(progressBar);

    if (Array.isArray(card.fields) && card.fields.length) {
      const fields = makeElement('div', 'storefront-fields');
      card.fields.forEach(field => {
        const key = String(field.key || '');
        const label = makeElement('label', 'storefront-field');
        const labelText = makeElement('span', '', field.label || key);
        if (field.required) labelText.appendChild(makeElement('span', 'req', '*'));
        const input = document.createElement('input');
        input.type = 'text';
        input.dataset.storefrontField = key;
        input.value = String(field.value || '');
        input.placeholder = String(field.label || key);
        input.autocomplete = 'off';
        label.append(labelText, input);
        fields.appendChild(label);
      });
      holder.appendChild(fields);
    }

    if (Array.isArray(card.knownOffers) && card.knownOffers.length) {
      const offers = makeElement('section', 'storefront-known-offers');
      offers.appendChild(makeElement('strong', '', 'Known seller offers'));
      const list = makeElement('ul', 'storefront-offers-list');
      card.knownOffers.forEach(offer => {
        const item = makeElement('li');
        const details = makeElement('div');
        const price = Number(offer.priceMinor);
        const amount = Number.isInteger(price) ? `${price} ${String(offer.currency || 'NGN')}` : 'Price pending confirmation';
        details.append(
          makeElement('strong', '', offer.description || 'Seller offer'),
          makeElement('span', '', `${String(offer.sellerName || 'Seller')} · ${amount}`)
        );
        if (offer.availabilityNote) details.appendChild(makeElement('small', '', String(offer.availabilityNote)));
        const button = makeElement('button', 'sf-btn sf-primary', 'Choose offer');
        button.type = 'button';
        button.addEventListener('click', () => { void startKnownOffer(String(offer.id || '')); });
        item.append(details, button);
        list.appendChild(item);
      });
      offers.appendChild(list);
      holder.appendChild(offers);
    }

    if (Array.isArray(card.deliveryCandidates) && card.deliveryCandidates.length) {
      const candidates = makeElement('section', 'storefront-delivery-candidates');
      candidates.appendChild(makeElement('strong', '', 'Delivery options'));
      const list = makeElement('ul', 'storefront-offers-list');
      card.deliveryCandidates.forEach(provider => {
        const item = makeElement('li');
        const details = makeElement('div');
        details.append(
          makeElement('strong', '', provider.name || 'Delivery provider'),
          makeElement('span', '', `Profile details · listed rate ${String(provider.hourly_rate || 0)} NGN`)
        );
        const button = makeElement('button', 'sf-btn sf-primary', 'Choose delivery');
        button.type = 'button';
        button.addEventListener('click', () => { void selectDeliveryCandidate(card.requestId, String(provider.phone || '')); });
        item.append(details, button);
        list.appendChild(item);
      });
      candidates.appendChild(list);
      holder.appendChild(candidates);
    }

    if (Array.isArray(card.providers) && card.providers.length) {
      const providers = makeElement('ul', 'storefront-providers');
      card.providers.forEach((provider, index) => {
        const item = makeElement('li', index === 0 ? 'top' : '');
        item.append(
          makeElement('strong', '', provider.name || 'Provider'),
          makeElement('span', '', `Profile details · listed rate ${String(provider.hourly_rate || 0)} NGN`)
        );
        providers.appendChild(item);
      });
      holder.appendChild(providers);
    }

    if (card.quote) {
      const quote = makeElement('div', 'storefront-quote', 'Quote: ');
      quote.appendChild(makeElement('strong', '', `${String(card.quote.amount_minor)} ${String(card.quote.currency || 'NGN')}`));
      holder.appendChild(quote);
    }

    if (card.offer && typeof card.offer === 'object') {
      const offer = makeElement('section', 'storefront-offer');
      offer.appendChild(makeElement('strong', '', 'Seller offer'));
      offer.appendChild(makeElement('p', '', String(card.offer.description || 'Offer details are unavailable.')));
      const price = Number(card.offer.priceMinor);
      const amount = Number.isInteger(price) ? `${price} ${String(card.offer.currency || 'NGN')}` : 'Price pending confirmation';
      offer.appendChild(makeElement('span', 'storefront-offer-price', `Listed item price: ${amount}`));
      if (card.offer.availabilityNote) offer.appendChild(makeElement('small', '', String(card.offer.availabilityNote)));
      holder.appendChild(offer);
    }

    if (Array.isArray(card.participants) && card.participants.length) {
      const coordination = makeElement('section', 'storefront-coordination');
      coordination.appendChild(makeElement('strong', '', 'Coordination participants'));
      const participants = makeElement('ul', 'storefront-participants');
      card.participants.forEach(participant => {
        const item = makeElement('li');
        const role = String(participant.role || 'participant').replace(/_/g, ' ');
        const status = String(participant.status || 'invited').replace(/_/g, ' ');
        item.append(
          makeElement('strong', '', role),
          makeElement('span', '', `${status} · ${String(participant.capability || 'coordination detail pending')}`)
        );
        participants.appendChild(item);
      });
      coordination.appendChild(participants);
      holder.appendChild(coordination);
    }

    if (card.execution && typeof card.execution === 'object') {
      const execution = makeElement('section', 'storefront-execution');
      execution.appendChild(makeElement('strong', '', 'Execution status'));
      execution.appendChild(makeElement('span', 'storefront-execution-status', String(card.execution.status || 'pending').replace(/_/g, ' ')));
      execution.appendChild(makeElement('small', '', `Connector: ${String(card.execution.connectorId || 'not specified')}`));
      if (card.execution.externalReference) execution.appendChild(makeElement('small', '', `Provider reference: ${String(card.execution.externalReference)}`));
      if (card.execution.failureReason) execution.appendChild(makeElement('small', 'storefront-execution-failure', `Dispatch failed: ${String(card.execution.failureReason)}. Manual confirmation is required.`));
      if (Array.isArray(card.execution.evidence) && card.execution.evidence.length) {
        const evidence = makeElement('ul', 'storefront-execution-evidence');
        card.execution.evidence.forEach(item => {
          const source = String(item.source || 'evidence').replace(/_/g, ' ');
          const state = String(item.verificationState || 'unverified').replace(/_/g, ' ');
          evidence.appendChild(makeElement('li', '', `${String(item.type || 'event')} · ${source} · ${state}`));
        });
        execution.appendChild(evidence);
      }
      holder.appendChild(execution);
    }

    const actions = Array.isArray(card.actions) ? card.actions : [];
    if (actions.length) {
      const actionGroup = makeElement('div', 'storefront-actions');
      actions.forEach(action => {
        const style = action.style === 'danger' ? 'danger' : action.style === 'secondary' ? 'secondary' : 'primary';
        const button = makeElement('button', `sf-btn sf-${style}`, action.label || action.id || 'Continue');
        button.type = 'button';
        button.dataset.sfAction = String(action.id || '');
        button.addEventListener('click', () => {
          const actionId = button.dataset.sfAction || '';
          const fields = collectStorefrontFields(holder);
          if (actionId === 'start' && !card.requestId) {
            sendMessage(`Continue with ${card.skill || 'this request'}`);
            return;
          }
          if (!card.requestId || !actionId) return;
          void advanceStorefront(card.requestId, actionId, fields, messageEl);
        });
        actionGroup.appendChild(button);
      });
      holder.appendChild(actionGroup);
    }

    if (card.escrowProtected !== false) holder.appendChild(makeElement('span', 'escrow-badge', '🔒 Escrow Protected'));

    holder.querySelectorAll('[data-storefront-field]').forEach(field => {
      field.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
          event.preventDefault();
          holder.querySelector('.sf-btn.sf-primary')?.click();
        }
      });
    });

    messageEl.querySelector('.bubble').appendChild(holder);
    if (card.requestId) state.activeStorefrontId = card.requestId;
  }

  function renderSuggestions(options, messageEl, sponsored = []) {
    if ((!Array.isArray(options) || !options.length) && (!Array.isArray(sponsored) || !sponsored.length)) return;
    const holder = document.createElement('div');
    holder.className = 'intent-suggestion-bar';
    holder.setAttribute('aria-label', 'Suggested next actions');

    if (Array.isArray(options)) {
      options.forEach(option => {
        const opt = typeof option === 'string' ? { label: option, prompt: option } : option;
        if (!opt?.label || !opt?.prompt) return;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'suggestion-btn';
        btn.textContent = opt.label;
        btn.addEventListener('click', () => sendMessage(opt.prompt));
        holder.appendChild(btn);
      });
    }

    if (Array.isArray(sponsored)) {
      sponsored.forEach(ad => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'suggestion-btn sponsored';
        btn.appendChild(makeElement('span', '', 'Sponsored'));
        btn.appendChild(makeElement('strong', '', ad.title));
        btn.addEventListener('click', () => sendMessage(ad.keyword || ad.title));
        holder.appendChild(btn);
      });
    }

    messageEl.appendChild(holder);
  }

  function renderCard(card, messageEl) {
    if (!card || !messageEl) return;
    if (card.type === 'agentic_storefront') {
      if (card.stage === 'slot_fill' || card.stage === 'intent_extraction') {
        const missing = (Array.isArray(card.fields) ? card.fields : []).filter(field => field?.required && !field.value).map(field => String(field.label || field.key || 'the next detail').toLowerCase());
        if (missing.length && input) input.placeholder = `Tell me ${missing[0]}…`;
        return renderSuggestions(card.suggestions, messageEl, card.sponsored);
      }
      renderAgenticStorefront(card, messageEl);
      return renderSuggestions(card.suggestions, messageEl, card.sponsored);
    }
    if (card.type === 'suggestions') return renderSuggestions(card.options, messageEl, card.sponsored);
    if (card.type === 'intent_suggestions') return renderSuggestions(card.suggestions, messageEl, card.sponsored);
    if (card.type === 'ai_metadata') return updateModelStatus(card);

    if (card.type === 'auth_otp_input' || card.type === 'auth_conversation') {
      const step = card.type === 'auth_otp_input' ? 'otp' : String(card.step || 'name');
      if (state.isGuest) setAuthComposerStep(step);
      return;
      const holder = makeElement('div', 'auth-conversation-card');
      holder.dataset.authStep = step;
      const header = makeElement('div', 'auth-conversation-heading');
      header.append(makeIcon(step === 'otp' ? 'safety' : step === 'phone' ? 'channels' : 'chat', 'Authentication step'), makeElement('strong', '', step === 'name' ? 'Start with your name' : step === 'phone' ? 'Add your phone number' : 'Verify your number'));
      const copy = makeElement('p', 'auth-conversation-copy', step === 'name' ? 'I’ll use this to keep your conversation connected.' : step === 'phone' ? `Thanks${card.name ? `, ${card.name}` : ''}. Your number stays attached to this verification step.` : 'Enter the six-digit code sent to your phone.');
      const form = document.createElement('form'); form.className = 'auth-conversation-form';
      const input = document.createElement('input'); input.type = step === 'otp' ? 'text' : step === 'phone' ? 'tel' : 'text'; input.inputMode = step === 'otp' || step === 'phone' ? 'numeric' : 'text'; input.autocomplete = step === 'name' ? 'name' : step === 'phone' ? 'tel' : 'one-time-code'; input.maxLength = step === 'otp' ? 6 : 120; input.placeholder = step === 'name' ? 'Your name' : step === 'phone' ? '080… or +234…' : '6-digit code'; input.required = true;
      const submit = document.createElement('button'); submit.type = 'submit'; submit.className = 'auth-conversation-submit'; submit.setAttribute('aria-label', step === 'otp' ? 'Verify code' : 'Continue'); submit.title = step === 'otp' ? 'Verify code' : 'Continue'; submit.appendChild(makeIcon('send', submit.title));
      form.append(input, submit);
      form.addEventListener('submit', event => { event.preventDefault(); const value = input.value.trim(); if (!value) return; sendMessage(value); });
      holder.append(header, copy, form);
      if (step === 'otp' && card.devCode) holder.appendChild(makeElement('small', 'auth-conversation-dev-code', `Development code: ${card.devCode}`));
      messageEl.querySelector('.bubble')?.appendChild(holder);
      input.focus();
      return;
    }


    if (card.type === 'safety_contact_capture') {
      const holder = makeElement('div', 'safety-capture-card');
      const inner = makeElement('div', 'safety-capture-inner');
      const icon = makeElement('div', 'safety-capture-icon', '🛡️');
      const title = makeElement('strong', '', 'Add emergency contact');
      const desc = makeElement('p', '', `You're adding ${card.name} as a contact. Share their phone number in the chat to continue.`);
      const btn = makeElement('button', 'primary-btn', 'Manage contacts');
      btn.addEventListener('click', () => setInspectorOpen(true, 'safety-card'));

      inner.append(icon, title, desc, btn);
      holder.appendChild(inner);
      messageEl.querySelector('.bubble').appendChild(holder);
      loadSafety();
      return;
    }

    if (card.type === 'auth_gate' || card.type === 'auth_in_chat_start') {
      renderCard({ ...card, type: 'auth_conversation', step: card.step || 'name' }, messageEl);
      return;
      const gate = document.createElement('div');
      gate.className = 'auth-gate-card';
      const signedIn = state.isGuest === false;
      const guestId = document.cookie.split('; ').find(row => row.startsWith('kurukoo_guest_id='))?.split('=')[1];
      const returnUrl = card.returnUrl || window.location.pathname + window.location.search;

      if (signedIn) {
        gate.classList.add('auth-gate-card--resolved');
        const continuationCard = card.continuationCard;
        const header = makeElement('div', 'auth-gate-header'); header.appendChild(makeElement('h4', '', "You're signed in"));
        const body = makeElement('div', 'auth-gate-body');
        const p = document.createElement('p'); p.textContent = continuationCard ? 'Your request is ready to continue.' : 'Your request is preserved. Share the remaining details above so Kurukoo can continue matching it.';
        body.appendChild(p);
        if (!continuationCard) {
          const btn = makeElement('button', 'primary-btn', 'Continue this request');
          btn.type = 'button';
          body.appendChild(btn);
        }
        gate.append(header, body);
        gate.querySelector('button')?.addEventListener('click', () => input?.focus());
        messageEl.querySelector('.bubble').appendChild(gate);
        if (continuationCard) renderCard(continuationCard, messageEl);
        return;
      } else {
        const header = makeElement('div', 'auth-gate-header'); header.appendChild(makeElement('h4', '', card.title || 'Sign in to Continue'));
        const body = makeElement('div', 'auth-gate-body');
        const p = document.createElement('p'); p.textContent = card.message || 'Please sign in to proceed with your request.';
        body.appendChild(p);
        const btn = makeElement('button', 'primary-btn', 'Tell Kurukoo your name');
        btn.type = 'button';
        btn.dataset.action = 'start-profile';
        body.appendChild(btn);
        gate.append(header, body);
        gate.querySelector('[data-action="start-profile"]')?.addEventListener('click', () => {
          const returnTo = `${window.location.pathname}${window.location.search}`;
          const params = new URLSearchParams({ return: returnTo });
          if (state.conversationId) params.set('conversationId', state.conversationId);
          window.location.assign(`/login?${params.toString()}`);
        });
      }
      messageEl.querySelector('.bubble').appendChild(gate);
      return;
    }

    const holder = document.createElement('div');
    holder.className = 'provider-card';
    if (card.type === 'ride_picker') {
      holder.appendChild(makeElement('strong', '', 'Describe a ride request'));
      const qa = makeElement('div', 'quick-actions');
      ['🚗 Okada', '🛺 Keke', '🚕 Taxi'].forEach(t => { const b = makeElement('button', '', t); b.type = 'button'; qa.appendChild(b); });
      holder.append(qa, makeElement('span', 'escrow-badge', 'Availability is confirmed in the request flow.'));
      holder.querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => sendMessage(`${btn.textContent.trim()} ride`)));
    } else if (card.type === 'worker_match' || card.type === 'service_search') {
      holder.appendChild(makeElement('strong', '', card.category === 'food' ? 'Food request' : 'Service request'));
      holder.appendChild(makeElement('div', 'deferred', 'Kurukoo is assessing the request context for a supported path.'));
      holder.appendChild(makeElement('span', 'escrow-badge', 'Availability is confirmed before a next action is presented.'));
    } else if (card.type === 'nearby_radar') {
      holder.appendChild(makeElement('strong', '', 'Nearby context'));
      holder.appendChild(makeElement('div', 'deferred', 'Location-based information is shown only when relevant data is available.'));
    } else if (card.type === 'sports_search') {
      holder.appendChild(makeElement('strong', '', 'Sports network'));
      holder.appendChild(makeElement('div', 'deferred', 'Searching leagues, teams, matches and nearby play.'));
    } else if (card.type === 'event_coverage') {
      holder.appendChild(makeElement('strong', '', 'Event coverage request'));
      holder.appendChild(makeElement('div', 'deferred', 'Contributor participation and any resulting payment step require separate confirmation.'));
    } else if (card.type === 'security_booking') {
      holder.appendChild(makeElement('strong', '', 'Security-related request'));
      holder.appendChild(makeElement('span', 'escrow-badge', 'Provider suitability and availability require confirmation.'));
    } else if (card.type === 'reminder') {
      const reminder = card.reminder || {};
      const heading = document.createElement('strong');
      heading.textContent = 'Reminder saved';
      const detail = document.createElement('div');
      detail.className = 'deferred';
      const due = reminder.due_at ? new Date(reminder.due_at) : null;
      const dueText = due && !Number.isNaN(due.getTime()) ? ` for ${due.toLocaleString()}` : '';
      detail.textContent = reminder.title ? `${reminder.title}${dueText}.` : 'Your reminder is attached to this conversation.';
      const boundary = document.createElement('span');
      boundary.className = 'escrow-badge';
      boundary.textContent = 'This personal reminder does not create a provider request or payment step.';
      holder.append(heading, detail, boundary);
    } else if (card.type === 'provider_profile_setup') {
      holder.appendChild(makeElement('strong', '', 'Provider profile review'));
      const skill = String(card.skill || '').trim();
      const location = String(card.location || '').trim();
      holder.appendChild(makeElement('div', 'deferred', `Skill: ${skill || 'not specified'}${location ? ` · Location: ${location}` : ''}`));
      holder.appendChild(makeElement('span', 'escrow-badge', 'Review required. This does not publish availability, verification, pricing, matching, payment, or fulfilment.'));
      const confirm = makeElement('button', 'primary-btn', 'Confirm and save profile skill');
      confirm.type = 'button';
      confirm.addEventListener('click', async () => {
        confirm.disabled = true;
        confirm.textContent = 'Saving…';
        try {
          const response = await fetch('/api/profile/update', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ skills: skill ? [skill] : [], location: location || undefined, is_available: false }) });
          const data = await response.json().catch(() => ({}));
          if (!response.ok || !data.success) throw new Error(data.error || 'Could not save provider profile');
          confirm.textContent = 'Saved — availability remains off';
          holder.appendChild(makeElement('div', 'deferred', 'Profile skill saved. Turn availability on separately only when you are ready, and verification is still required before matching.'));
        } catch (error) {
          confirm.disabled = false;
          confirm.textContent = 'Confirm and save profile skill';
          holder.appendChild(makeElement('div', 'deferred', `Could not save profile: ${error.message || 'try again'}`));
        }
      });
      holder.appendChild(confirm);
    } else if (card.type === 'artist_booking') {
      holder.appendChild(makeElement('strong', '', 'Creator request'));
      holder.appendChild(makeElement('div', 'deferred', 'Availability and representation details require confirmation before a request can proceed.'));
      holder.appendChild(makeElement('span', 'escrow-badge', 'Payment availability is assessed separately.'));
    } else {
      holder.appendChild(makeElement('strong', '', card.category || card.type || 'Kurukoo action'));
    }
    messageEl.querySelector('.bubble').appendChild(holder);
  }

  async function uploadAttachment(file) {
    const allowed = /^(image\/(png|jpeg|webp|gif)|application\/pdf|video\/mp4|video\/webm)$/i.test(file.type || '');
    if (!allowed) throw new Error('Unsupported attachment type. Use an image, PDF or supported video.');
    if (file.size > 25 * 1024 * 1024) throw new Error('Attachment is larger than the 25 MB chat limit.');
    const reader = new FileReader();
    const data = await new Promise((resolve, reject) => { reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
    const response = await fetch('/api/chat/attachments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ name: file.name, type: file.type || 'application/octet-stream', data }) });
    if (!response.ok) { const err = await response.json().catch(() => ({})); throw new Error(err.error || 'Attachment upload failed'); }
    return (await response.json()).attachment;
  }

  async function sendMessage(raw) {
    const text = String(raw || input.value || '').trim(); if (!text || state.busy || !(await ensureIdentity())) return;
    state.controller = new AbortController(); setComposerBusy(true); setConnection(true); input.value = '';
    let attachment = state.attached;
    try {
      if (attachment instanceof File) { input.placeholder = 'Uploading attachment…'; attachment = await uploadAttachment(attachment); }
      state.attached = null; $('attachment-preview').hidden = true; $('attachment-preview').textContent = '';
      const finalText = attachment ? `${text}\n\n[Attachment: ${attachment.name} — ${attachment.type} — ${attachment.url}]` : text;
      const user = addUserMessage(finalText); const assistant = appendStreamBubble(); const output = assistant.querySelector('.markdown-body'); const thinking = assistant.querySelector('.thinking'); let full = ''; setTypingStatus('thinking');
      const response = await fetch('/api/chat/stream', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', signal: state.controller?.signal, body: JSON.stringify({ message: finalText, channel: 'web', conversationId: state.conversationId || undefined, attachment: attachment || undefined }) });
      if (response.status === 401) { await ensureIdentity(); throw new Error('Your session has expired.'); }
      if (!response.ok || !response.body) throw new Error(`Chat request failed (${response.status})`);
      const reader = response.body.getReader(), decoder = new TextDecoder(); let buffer = '';
      while (true) {
        const { value, done } = await reader.read(); if (done) break; buffer += decoder.decode(value, { stream: true }); const events = buffer.split('\n\n'); buffer = events.pop() || '';
        for (const event of events) {
          const line = event.split('\n').find(x => x.startsWith('data: ')); if (!line) continue; const payload = line.slice(6); if (payload === '[DONE]') continue;
          let data; try { data = JSON.parse(payload); } catch { continue; }
          if (data.type === 'conversation') { state.conversationId = data.conversationId; localStorage.setItem('kurukoo_conversation_id', state.conversationId); user.dataset.messageId = data.messageId || ''; }
          if (data.type === 'auth_success') {
            state.isGuest = false; state.authStep = 'none';
            setAuthComposerStep('none');
            setConnection(true);
            const logoutButton = $('workspace-logout') || $('logout-sidebar-btn'); if (logoutButton) logoutButton.hidden = false;
            if (data.phone) localStorage.setItem('kurukoo_user_phone', data.phone);
          }
          if (data.type === 'metadata') updateModelStatus(data);
          if (data.type === 'status') setTypingStatus(data.status, data.label);
          if (data.type === 'agent_goal') renderAgentGoal(data.goal, []);
          if (data.type === 'thought' && thinking) thinking.hidden = false;
          if (data.type === 'text') {
            if (assistant.hidden) { assistant.hidden = false; assistant.classList.remove('message-streaming'); assistant.classList.add('message-arrived'); }
            setTypingStatus('complete'); full += data.content || ''; setMarkdown(output, full); enhanceCode(assistant); scroll.scrollTop = scroll.scrollHeight;
          }
          if (data.type === 'done') {
            setTypingStatus('complete');
            if (assistant.hidden) { assistant.hidden = false; assistant.classList.remove('message-streaming'); assistant.classList.add('message-arrived'); }

            assistant.dataset.messageId = data.messageId || '';
            setDeferredStatus(data.cardData);
            if (data.cardData) renderCard(data.cardData, assistant);
            if (data.cardData?.type === 'agentic_storefront' && data.cardData.requestId) state.activeStorefrontId = data.cardData.requestId;
          }
          if (data.type === 'error') throw new Error(data.error || 'Stream error');
        }
      }
      if (state.isGuest) {
        if (/enter your phone number/i.test(full)) setAuthComposerStep('phone');
        else if (/6-digit verification code|code sent to your phone/i.test(full)) setAuthComposerStep('otp');
        else if (/profile is now verified|account is now connected/i.test(full)) setAuthComposerStep('none');
      }
      state.messages.push({ role: 'user', text: finalText, id: Number(user.dataset.messageId) || null }); state.messages.push({ role: 'assistant', text: full, id: Number(assistant.dataset.messageId) || null });
      if (!full) output.textContent = 'I could not complete that request. Please try again.';
      await refreshHistory();
    } catch (error) {
      if (error?.name === 'AbortError') { setConnection(true); setTypingStatus('complete'); assistant.hidden = false; assistant.classList.remove('message-streaming'); assistant.classList.add('message-arrived'); if (!full) setMarkdown(output, 'Generation stopped.'); return; }
      setConnection(false, 'Connection issue'); setTypingStatus('error'); assistant.hidden = false; assistant.classList.remove('message-streaming'); assistant.classList.add('message-arrived');
      const bubble = chatContent.querySelector('.message.assistant:last-child .markdown-body');
      if (bubble) setMarkdown(bubble, `I’m having trouble completing that right now. **Please try again.**\n\n_${escapeAttr(error.message)}_`);
    } finally { state.controller = null; setTypingStatus('complete'); setComposerBusy(false); if (state.authStep !== 'none') setAuthComposerStep(state.authStep); else input.placeholder = state.displayName ? 'Tell Kurukoo what you need…' : 'Tell Kurukoo what you need…'; input.focus(); loadPoints(); loadReminders(); loadSafety(); loadAgentGoal(); }
  }

  function updateModelStatus(data) { const label = $('model-badge'); if (label && data.model) label.textContent = data.model; }
  async function loadPoints() { try { const res = await fetch('/api/points/balance', { credentials: 'same-origin' }); if (!res.ok) return; const data = await res.json(); const points = Number(data.points || 0); const balance = $('points-balance')?.querySelector('span'); if (balance) balance.textContent = points; const ip = $('inspector-points'); if (ip) ip.textContent = points; } catch {} }
  function renderNotifications(notifications = []) {
    const list = $('notifications-list'); const summary = $('notifications-summary');
    if (!list) return;
    list.replaceChildren();
    const items = Array.isArray(notifications) ? notifications : [];
    const unreadItems = items.filter(item => item?.status === 'unread');
    const unread = unreadItems.length;
    const toastRegion = $('chat-toast-region');
    unreadItems.filter(item => item?.id && !state.notifiedNotificationIds.has(item.id)).slice(0, 3).forEach(item => { state.notifiedNotificationIds.add(item.id); if (!toastRegion) return; const toast = makeElement('div', 'chat-toast'); toast.append(makeIcon('alert', 'Notification'), makeElement('div', '', `${String(item.title || 'Kurukoo update')}\n${String(item.body || '')}`)); toastRegion.appendChild(toast); setTimeout(() => toast.remove(), 5200); });
    const badge = $('notification-badge');
    if (badge) { badge.textContent = unread > 99 ? '99+' : String(unread); badge.hidden = unread === 0; }
    if (summary) summary.textContent = unread ? `${unread} unread notification${unread === 1 ? '' : 's'} in your internal Kurukoo inbox.` : 'Your internal Kurukoo inbox is up to date.';
    if (!items.length) { list.appendChild(makeElement('div', 'empty-state', 'No notifications yet.')); return; }
    items.forEach(item => {
      const row = makeElement('div', 'notification-list-item');
      row.dataset.status = String(item.status || 'read');
      const title = makeElement('strong', '', String(item.title || 'Kurukoo update'));
      const body = makeElement('span', '', String(item.body || ''));
      const meta = makeElement('small', '', `${String(item.delivery_state || 'queued')} · ${String(item.created_at || '')}`);
      row.append(title, body, meta);
      if (item.status === 'unread') {
        const read = makeElement('button', 'text-btn', 'Mark read'); read.type = 'button';
        read.addEventListener('click', async () => {
          read.disabled = true;
          try {
            const response = await fetch(`/api/notifications/${encodeURIComponent(item.id)}/read`, { method: 'POST', credentials: 'same-origin' });
            if (!response.ok) throw new Error('Unable to mark notification read');
            await loadNotifications();
          } catch { read.disabled = false; }
        });
        row.appendChild(read);
      }
      list.appendChild(row);
    });
  }
  async function loadNotifications() { try { const res = await fetch('/api/notifications?limit=20', { credentials: 'same-origin' }); if (!res.ok) return; const data = await res.json(); renderNotifications(data.notifications || []); } catch {} }
  function personalizeQuickActions(profile = {}) {
    const location = String(profile.location || profile.primary_lga || '').trim();
    const preferences = profile.preferences && typeof profile.preferences === 'object' ? profile.preferences : {};
    const goal = String(preferences.goal || profile.goal || '').toLowerCase();
    const actions = [
      { prompt: location ? `What is useful to know near ${location}?` : 'Help me find something nearby', label: location ? 'Explore nearby' : 'Explore nearby', icon: 'discover' },
      { prompt: goal.includes('provider') || goal.includes('work') ? 'Help me find work or a service opportunity' : 'I need something sourced', label: goal.includes('provider') || goal.includes('work') ? 'Find work' : 'Source something', icon: 'work' },
      { prompt: 'Set a reminder', label: 'Reminder', icon: 'reminder' },
      { prompt: 'Help me stay safe', label: 'Safety', icon: 'safety' },
      { prompt: 'I need to get somewhere', label: 'Get somewhere', icon: 'ride' },
    ];
    document.querySelectorAll('.quick-actions, .composer-quick-actions').forEach(root => {
      const buttons = Array.from(root.querySelectorAll('button[data-prompt]'));
      actions.forEach((action, index) => {
        const button = buttons[index]; if (!button) return;
        button.dataset.prompt = action.prompt; button.dataset.personalized = location || goal ? 'profile' : 'default';
        button.replaceChildren(makeIcon(action.icon, ''), document.createTextNode(action.label));
      });
    });
  }

  async function loadMemory() { try { const res = await fetch('/api/profile', { credentials: 'same-origin' }); if (!res.ok) return; const data = await res.json(); const profile = data.profile || {}; if (!state.displayName && profile.name) state.displayName = String(profile.name); const memoryStatus = $('sidebar-memory-status'); if (memoryStatus) memoryStatus.textContent = profile.location || profile.name ? 'In use' : 'Ready'; personalizeQuickActions(profile); const text = `Kurukoo remembers ${profile.location || 'your area'}${profile.primary_lga ? `, ${profile.primary_lga}` : ''}. Your Memory Profile remains attached to your account.`; const mc = $('memory-context'); if (mc) mc.textContent = text; const im = $('inspector-memory'); if (im) im.textContent = text; } catch {} }

  function renderAgentGoal(goal, events = []) {
    const card = $('agent-goal-card'); const status = $('agent-goal-status'); const summary = $('agent-goal-summary'); const list = $('agent-goal-events'); const cancel = $('agent-goal-cancel');
    if (!card || !status || !summary || !list || !cancel) return;
    if (!goal) { card.hidden = true; return; }
    card.hidden = false; card.dataset.goalId = String(goal.id || '');
    status.textContent = String(goal.status || 'checking').replace(/_/g, ' ');
    summary.textContent = String(goal.summary || goal.objective || 'Kurukoo is checking the current objective.');
    list.replaceChildren();
    (Array.isArray(events) ? events.slice(-4) : []).forEach(event => {
      const row = makeElement('div', 'agent-goal-event');
      row.textContent = `${String(event.result || 'update').replace(/_/g, ' ')} · ${String(event.detail || event.action || '').slice(0, 180)}`;
      list.appendChild(row);
    });
    if (!list.childElementCount) list.appendChild(makeElement('div', 'empty-state', 'Kurukoo will show confirmed activity here.'));
    const stoppable = ['active', 'waiting', 'needs_user', 'blocked'].includes(String(goal.status || ''));
    cancel.hidden = !stoppable;
    cancel.onclick = async () => {
      if (!goal.id) return; cancel.disabled = true;
      try { const response = await fetch(`/api/agent/goals/${encodeURIComponent(goal.id)}/cancel`, { method: 'POST', credentials: 'same-origin' }); const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.error || 'Could not stop follow-up.'); renderAgentGoal(data.goal, events); }
      catch (error) { setInspectorFeedback(error.message || 'Could not stop follow-up.', 'error'); }
      finally { cancel.disabled = false; }
    };
  }

  async function loadAgentGoal() {
    try {
      const url = new URL('/api/agent/timeline', location.origin); if (state.conversationId) url.searchParams.set('conversationId', state.conversationId);
      const response = await fetch(url, { credentials: 'same-origin' }); if (!response.ok) { renderAgentGoal(null); return; }
      const data = await response.json(); renderAgentGoal(data.goal, data.events);
    } catch { renderAgentGoal(null); }
  }

  async function loadReminders() {
    try {
      const res = await fetch('/api/reminders', { credentials: 'same-origin' });
      const card = $('reminders-card'); const list = $('reminder-list');
      if (!res.ok || !card || !list) return;
      const data = await res.json(); const reminders = Array.isArray(data.reminders) ? data.reminders : []; state.nativeAssistance.reminders = reminders; updateNativeAssistanceStatus();
      card.hidden = false; list.replaceChildren();
      if (!reminders.length) { list.textContent = 'No active reminders.'; return; }
      reminders.forEach(reminder => {
        const row = document.createElement('div'); row.className = 'reminder-list-item';
        const title = document.createElement('strong'); title.textContent = String(reminder.title || 'Reminder');
        const due = document.createElement('span'); const parsed = reminder.due_at ? new Date(reminder.due_at) : null;
        due.textContent = parsed && !Number.isNaN(parsed.getTime()) ? parsed.toLocaleString() : 'Scheduled time unavailable';
        const cancel = document.createElement('button'); cancel.type = 'button'; cancel.className = 'text-btn'; cancel.textContent = 'Cancel';
        cancel.addEventListener('click', async () => { cancel.disabled = true; await fetch(`/api/reminders/${encodeURIComponent(reminder.id)}/cancel`, { method: 'POST', credentials: 'same-origin' }); loadReminders(); });
        row.append(title, due, cancel); list.appendChild(row);
      });
    } catch {}
  }

  function setInspectorFeedback(message, kind = 'info') { const feedback = $('inspector-feedback'); if (!feedback) return; feedback.hidden = !message; feedback.textContent = message || ''; feedback.dataset.kind = kind; }
  async function nativeAction(url, options = {}) { const response = await fetch(url, { credentials: 'same-origin', ...options }); let data = {}; try { data = await response.json(); } catch {} if (!response.ok) throw new Error(data.error || 'Action could not be completed.'); return data; }

  async function loadSafety() {
    try {
      const [contactsResponse, checkInsResponse] = await Promise.all([
        fetch('/api/safety/contacts', { credentials: 'same-origin' }),
        fetch('/api/safety/check-ins', { credentials: 'same-origin' }),
      ]);
      const card = $('safety-card'); const contactsList = $('safety-contact-list'); const checkInsList = $('safety-checkin-list');
      if (!contactsResponse.ok || !checkInsResponse.ok || !card || !contactsList || !checkInsList) return;
      const contactsData = await contactsResponse.json(); const checkInsData = await checkInsResponse.json();
      const contacts = Array.isArray(contactsData.contacts) ? contactsData.contacts : [];
      const checkIns = Array.isArray(checkInsData.checkIns) ? checkInsData.checkIns : [];
      state.nativeAssistance.checkIns = checkIns; updateNativeAssistanceStatus();
      card.hidden = false; contactsList.replaceChildren(); checkInsList.replaceChildren();

      const contactHeading = document.createElement('strong'); contactHeading.textContent = contacts.length ? 'Contacts' : 'No safety contacts yet.'; contactsList.appendChild(contactHeading);
      contacts.forEach(contact => {
        const row = document.createElement('div'); row.className = 'safety-list-item';
        const label = document.createElement('span'); label.textContent = `${contact.name} · ${contact.status}`; row.appendChild(label);
        if (contact.status === 'pending') {
          const activate = document.createElement('button'); activate.type = 'button'; activate.className = 'text-btn'; activate.textContent = 'Activate';
          activate.addEventListener('click', async () => { activate.disabled = true; try { await nativeAction(`/api/safety/contacts/${encodeURIComponent(contact.id)}/activate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ consentConfirmed: true }) }); await loadSafety(); } catch (e) { setInspectorFeedback(e.message, 'error'); } });
          row.appendChild(activate);
        }
        if (contact.status !== 'revoked') {
          const revoke = document.createElement('button'); revoke.type = 'button'; revoke.className = 'text-btn text-btn-danger'; revoke.textContent = 'Revoke';
          revoke.addEventListener('click', async () => { revoke.disabled = true; try { await nativeAction(`/api/safety/contacts/${encodeURIComponent(contact.id)}/revoke`, { method: 'POST' }); await loadSafety(); } catch (e) { setInspectorFeedback(e.message, 'error'); revoke.disabled = false; } });
          row.appendChild(revoke);
        }
        contactsList.appendChild(row);
      });
    } catch {}
  }

  async function refreshHistory() {
    loadPinnedMessages();
    try {
      const url = new URL('/api/chat/history', location.origin); if (state.conversationId) url.searchParams.set('conversationId', state.conversationId); url.searchParams.set('limit', '60');
      const res = await fetch(url, { credentials: 'same-origin' }); if (!res.ok) return; const data = await res.json(); if (data.messages?.length) state.messages = data.messages.map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', text: m.content, id: m.id })); const list = $('history-list'); if (!list) return; list.replaceChildren();
      data.conversations.forEach(c => addHistoryItem(c, c.id === state.conversationId));
      if (data.messages?.length && chatContent.querySelectorAll('.message').length === 0) renderMessages(data.messages);
    } catch { setConnection(false, 'Offline'); }
    loadAgentGoal();
  }

  async function reconcileHistoricalStorefrontCards(entries) {
    await Promise.all(entries.map(async ({ messageEl, cardData }) => {
      if (!cardData?.requestId || !messageEl?.querySelector('[data-storefront-field]')) return;
      try {
        const response = await fetch(`/api/chat/economic-requests/${encodeURIComponent(cardData.requestId)}`, { credentials: 'same-origin' });
        if (!response.ok) return;
        const data = await response.json().catch(() => ({}));
        const status = String(data.request?.status || '');
        if (status && status !== 'requested') {
          markStorefrontStepSuperseded(messageEl, `Request is ${status.replace(/_/g, ' ')} — review the latest state below.`);
        }
      } catch {}
    }));
  }

  function renderMessages(messages) {
    chatContent.replaceChildren();
    const entries = [];
    messages.forEach(m => {
      let cardData = null;
      if (m.card_data) try { cardData = JSON.parse(m.card_data); } catch {}
      const messageEl = createMessage(m.sender === 'user' ? 'user' : 'assistant', m.content, m.id, cardData, false);
      entries.push({ messageEl, cardData });
    });
    void reconcileHistoricalStorefrontCards(entries);
  }

  document.addEventListener('click', event => { const action = event.target.closest('[data-surface-view]'); if (action && action.dataset.surfaceWired !== '1') { event.preventDefault(); renderWorkspaceSurface(action.dataset.surfaceView); } });
  wireSurfaceActions();

  function setInspectorOpen(open, target = null) {
    const inspector = $('chat-inspector'); if (!inspector) return;
    if (open && inspector.classList.contains('is-collapsed')) setInspectorCollapsed(false);
    inspector.classList.toggle('open', open);
    $('memory-toggle')?.setAttribute('aria-expanded', String(open));
    $('notification-toggle')?.setAttribute('aria-expanded', String(open && target === 'notifications-card'));
    if (target) {
      inspector.querySelectorAll('.inspector-card').forEach(card => card.hidden = true);
      const targetCard = $(target); if (targetCard) targetCard.hidden = false;
    } else if (open) {
      inspector.querySelectorAll('.inspector-card').forEach(card => card.hidden = false);
    }
    localStorage.setItem('kurukoo_chat_inspector_open', open ? '1' : '0');
  }

  $('memory-toggle')?.addEventListener('click', () => setInspectorOpen(!$('chat-inspector')?.classList.contains('open')));
  $('notification-toggle')?.addEventListener('click', async () => { await loadNotifications(); setInspectorOpen(true, 'notifications-card'); });
  $('close-inspector')?.addEventListener('click', () => setInspectorOpen(false));

  function setInspectorCollapsed(collapsed) {
    const inspector = $('chat-inspector'); const button = $('inspector-collapse');
    if (!inspector || !button) return;
    inspector.classList.toggle('is-collapsed', collapsed);
    button.setAttribute('aria-expanded', String(!collapsed));
    button.setAttribute('aria-label', collapsed ? 'Expand context panel' : 'Collapse context panel');
    button.title = collapsed ? 'Expand context panel' : 'Collapse context panel';
    localStorage.setItem('kurukoo_chat_inspector_collapsed', collapsed ? '1' : '0');
  }
  $('inspector-collapse')?.addEventListener('click', () => setInspectorCollapsed(!$('chat-inspector')?.classList.contains('is-collapsed')));
  setInspectorCollapsed(localStorage.getItem('kurukoo_chat_inspector_collapsed') === '1');

  function closeOverflowMenu() {
    const menu = $('chat-overflow-menu'); const toggle = $('chat-overflow-toggle');
    if (!menu || !toggle) return;
    menu.hidden = true; toggle.setAttribute('aria-expanded', 'false');
  }
  function openOverflowMenu() {
    const menu = $('chat-overflow-menu'); const toggle = $('chat-overflow-toggle');
    if (!menu || !toggle) return;
    menu.hidden = false; toggle.setAttribute('aria-expanded', 'true');
    menu.querySelector('[role="menuitem"]')?.focus();
  }
  async function deleteCurrentConversation() {
    if (state.isGuest) { alert('Please sign in to delete conversations.'); return; }
    if (!state.conversationId) { setInspectorFeedback('There is no saved conversation to delete.', 'info'); return; }
    if (!window.confirm('Delete this conversation? This cannot be undone.')) return;
    const conversationId = state.conversationId;
    try {
      const response = await fetch(`/api/chat/conversation/${encodeURIComponent(conversationId)}`, { method: 'DELETE', credentials: 'same-origin' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to delete conversation.');
      localStorage.removeItem(`kurukoo_pins_${conversationId}`);
      localStorage.removeItem('kurukoo_conversation_id');
      state.conversationId = ''; state.messages = []; state.pinnedMessages = []; state.activeStorefrontId = null;
      chatContent.replaceChildren(); renderWelcome(); loadPinnedMessages(); refreshHistory();
      setInspectorOpen(false); setInspectorFeedback('Conversation deleted.', 'info');
    } catch (error) { setInspectorFeedback(error.message || 'Unable to delete conversation.', 'error'); }
  }
  function pinLatestConversationMessage() {
    const latest = [...state.messages].reverse().find(message => message && message.text);
    if (!latest) { setInspectorOpen(true); setInspectorFeedback('There is no message to pin yet.', 'info'); return; }
    const key = latest.id ? `message-${latest.id}` : `local-${state.messages.indexOf(latest)}`;
    togglePinnedMessage(key, { role: latest.role, text: latest.text });
    setInspectorOpen(true);
    $('pinned-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  $('chat-overflow-toggle')?.addEventListener('click', () => {
    const menu = $('chat-overflow-menu');
    if (menu?.hidden) openOverflowMenu(); else closeOverflowMenu();
  });
  $('chat-overflow-menu')?.addEventListener('click', event => {
    const item = event.target.closest('[role="menuitem"]'); if (!item) return;
    const action = item.dataset.overflowAction;
    if (action === 'delete') void deleteCurrentConversation();
    if (action === 'pin') pinLatestConversationMessage();
    closeOverflowMenu();
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.chat-overflow-wrap')) closeOverflowMenu();
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeOverflowMenu(); });
  if (localStorage.getItem('kurukoo_chat_inspector_open') === '1') setInspectorOpen(true);

  const wireQuickActions = (root) => {
    root.querySelectorAll('button[data-prompt]').forEach(btn => {
      btn.addEventListener('click', () => sendMessage(btn.dataset.prompt));
    });
  };

  document.addEventListener('kurukoo:qr', event => {
    const detail = event.detail || {};
    if (!detail.conversationId || !detail.intro) return;
    state.conversationId = detail.conversationId;
    localStorage.setItem('kurukoo_conversation_id', state.conversationId);
    $('welcome')?.remove();
    state.messages.push({ role: 'assistant', text: detail.intro, id: detail.messageId || null });
    createMessage('assistant', detail.intro, detail.messageId || null);
    refreshHistory();
  });

  document.addEventListener('kurukoo:voice', event => {
    const detail = event.detail || {};
    if (detail.type === 'conversation' && detail.conversationId) {
      state.conversationId = detail.conversationId;
      localStorage.setItem('kurukoo_conversation_id', state.conversationId);
      loadPinnedMessages();
      return;
    }
    if (detail.type === 'transcript' && detail.text) {
      $('welcome')?.remove();
      const role = detail.role === 'assistant' ? 'assistant' : 'user';
      state.messages.push({ role, text: detail.text, id: detail.messageId || null });
      createMessage(role, detail.text, detail.messageId || null);
      return;
    }
    if (detail.type === 'card' && detail.cardData) {
      const target = chatContent.querySelector('.message.assistant:last-child');
      if (target) renderCard(detail.cardData, target);
    }
  });

  function renderAttachmentPreview(file) {
    const preview = $('attachment-preview'); if (!preview) return;
    preview.replaceChildren();
    if (!file) { preview.hidden = true; return; }
    preview.hidden = false;
    preview.appendChild(makeIcon('attach', 'Attachment'));
    const details = makeElement('span'); details.className = 'attachment-name'; details.textContent = file.name;
    const meta = makeElement('span', 'attachment-meta', `${file.type || 'file'} · ${Math.max(1, Math.round(file.size / 1024))} KB`);
    const remove = makeElement('button', 'attachment-remove'); remove.type = 'button'; remove.setAttribute('aria-label', 'Remove attachment'); remove.title = 'Remove attachment'; remove.appendChild(makeIcon('close', 'Remove attachment'));
    remove.addEventListener('click', () => { state.attached = null; if ($('file-input')) $('file-input').value = ''; renderAttachmentPreview(null); });
    preview.append(details, meta, remove);
  }
  $('attach-file')?.addEventListener('click', () => $('file-input')?.click());
  $('file-input')?.addEventListener('change', event => { const file = event.target.files?.[0]; state.attached = file || null; renderAttachmentPreview(state.attached); });
  input?.addEventListener('input', () => { input.style.height = 'auto'; input.style.height = `${Math.min(input.scrollHeight, 180)}px`; if (!state.busy && send) send.disabled = !input.value.trim(); });
  input?.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } });
  send?.addEventListener('click', () => sendMessage());
  stop?.addEventListener('click', () => { state.controller?.abort(); });
  $('new-chat')?.addEventListener('click', async () => {
    if (!await ensureIdentity()) return;
    try {
      const res = await fetch('/api/chat/conversation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ channel: 'web', title: 'New conversation' }) });
      const data = await res.json();
      if (data.conversationId) { state.conversationId = data.conversationId; localStorage.setItem('kurukoo_conversation_id', data.conversationId); }
    } catch {}
    state.messages = []; state.activeStorefrontId = null; chatContent.replaceChildren();
    const ds = $('deferred-status'); if (ds) ds.hidden = true;
    renderWelcome(); refreshHistory();
  });

  $('logout-button')?.addEventListener('click', async () => {
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }); } catch (_) {}
    localStorage.removeItem('kurukoo_user_phone');
    localStorage.removeItem('kurukoo_user_name');
    window.location.assign('/');
  });

  function hydrateChatDeepLink() {
    const params = new URLSearchParams(window.location.search);
    const conversationId = params.get('conversationId');
    const prompt = params.get('prompt');
    const providerSlug = params.get('providerSlug');
    const topicSlug = params.get('topicSlug');
    const resourceSlug = params.get('resourceSlug');
    const requestId = params.get('requestId');
    if (conversationId) { state.conversationId = conversationId.slice(0, 160); localStorage.setItem('kurukoo_conversation_id', state.conversationId); }
    const contextParts = [];
    if (providerSlug) contextParts.push(`Provider context: ${providerSlug}`);
    if (topicSlug) contextParts.push(`Topic context: ${topicSlug}`);
    if (resourceSlug) contextParts.push(`Resource context: ${resourceSlug}`);
    if (requestId) contextParts.push(`Request context: ${requestId}`);
    const contextBanner = $('qr-context-banner');
    if (contextBanner && contextParts.length) { contextBanner.textContent = `${contextParts.join(' · ')}. Kurukoo will keep this context with the conversation.`; contextBanner.hidden = false; }
    if (prompt && input) { input.value = prompt.slice(0, 12000); input.dispatchEvent(new Event('input', { bubbles: true })); }
  }

  function renderWelcome() {
    chatContent.replaceChildren();
    const greeting = state.isGuest
      ? 'Welcome to Kurukoo. I’m designed to help you directly, organise a reminder, keep you safe, or coordinate people and services to fulfil your request. Can I take your name?'
      : `Welcome back${state.displayName ? `, ${state.displayName}` : ''}. What would you like to get done today?`;
    createMessage('assistant', greeting, null, null, false);
    const qa = makeElement('div', 'quick-actions welcome-quick-actions'); qa.id = 'quick-actions';
    [['I need a ride request', 'Ride'], ['I have a food request', 'Food'], ['I need repair help', 'Repair'], ['I want to discuss a work request', 'Work']].forEach(([p, l]) => {
      const b = makeElement('button', '', l); b.dataset.prompt = p; qa.appendChild(b);
    });
    chatContent.appendChild(qa); wireQuickActions(qa);
    if (state.isGuest) { void startGuestAuth().finally(() => renderWelcomeAuth()); }
    else setAuthComposerStep('none');
  }

  applyTheme();
  hydrateChatDeepLink();
  ensureIdentity().then(async ok => {
    if (ok) {
      await refreshHistory();
      await Promise.all([loadPoints(), loadMemory(), loadNotifications(), loadReminders(), loadSafety(), loadAgentGoal()]);
      if (!state.conversationId) renderWelcome();
    }
  });

})();
