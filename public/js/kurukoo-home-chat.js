(() => {
  const root = document.getElementById('homepage-chat');
  if (!root) return;
  const phone = localStorage.getItem('kurukoo_user_phone') || '+2348030000000';
  root.innerHTML = `<div class="home-chat-head"><strong>Kurukoo</strong><span>Economic OS • Online</span></div><div class="home-chat-messages" id="home-chat-messages"><div class="home-chat-bubble assistant">Ku Kurukoo! 🌅 What do you need to get done today?</div></div><div class="home-chat-actions"><button data-prompt="Book a ride for me">🚗 Ride</button><button data-prompt="Order food near me">🍔 Food</button><button data-prompt="Find a verified repair worker">🔧 Repair</button></div><form class="home-chat-form" id="home-chat-form"><input id="home-chat-input" placeholder="Message Kurukoo" autocomplete="off"><button>↑</button></form>`;
  const messages = document.getElementById('home-chat-messages'), input = document.getElementById('home-chat-input'), form = document.getElementById('home-chat-form');
  function bubble(role, text) { const el = document.createElement('div'); el.className = `home-chat-bubble ${role}`; el.textContent = text; messages.appendChild(el); messages.scrollTop = messages.scrollHeight; return el; }
  async function send(text) {
    text = String(text || input.value).trim(); if (!text) return; input.value = ''; bubble('user', text); const out = bubble('assistant', '');
    try {
      const response = await fetch('/api/chat/stream', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, message: text, channel: 'web' }) });
      const reader = response.body.getReader(), decoder = new TextDecoder(); let buffer = '';
      while (true) { const { value, done } = await reader.read(); if (done) break; buffer += decoder.decode(value, { stream: true }); const events = buffer.split('\n\n'); buffer = events.pop() || ''; for (const event of events) { const line = event.split('\n').find(x => x.startsWith('data: ')); if (!line) continue; const payload = line.slice(6); if (payload === '[DONE]') continue; try { const data = JSON.parse(payload); if (data.type === 'text') { out.textContent += data.content || ''; messages.scrollTop = messages.scrollHeight; } } catch {} } }
    } catch { out.textContent = 'I could not connect right now. Open the full chat to continue.'; }
  }
  form.addEventListener('submit', e => { e.preventDefault(); send(); });
  root.querySelectorAll('[data-prompt]').forEach(btn => btn.addEventListener('click', () => send(btn.dataset.prompt)));
})();
