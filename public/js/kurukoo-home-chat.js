(() => {
  const root = document.getElementById('homepage-chat'); if (!root) return;
  const state = { phone: localStorage.getItem('kurukoo_user_phone') || '', token: localStorage.getItem('kurukoo_auth_token') || '' };
  root.innerHTML = `<div class="home-chat-head"><strong>Kurukoo</strong><span>Economic OS • Online</span></div><div class="home-chat-messages" id="home-chat-messages"><div class="home-chat-bubble assistant">Kurukoo is ready. What do you need to get done?</div></div><div class="home-chat-actions"><button data-prompt="Book a ride for me">🚗 Ride</button><button data-prompt="Order food near me">🍔 Food</button><button data-prompt="Find a verified repair worker">🔧 Repair</button><button data-prompt="Help me find a way to earn">⚡ Earn</button></div><form class="home-chat-form" id="home-chat-form"><input id="home-chat-input" placeholder="Message Kurukoo" autocomplete="off" maxlength="12000"><button aria-label="Send">↑</button></form>`;
  const messages = document.getElementById('home-chat-messages'), input = document.getElementById('home-chat-input'), form = document.getElementById('home-chat-form');
  function bubble(role, text) { const el = document.createElement('div'); el.className = `home-chat-bubble ${role}`; el.textContent = text; messages.appendChild(el); messages.scrollTop = messages.scrollHeight; return el; }
  async function ensureIdentity() {
    if (state.phone && state.token) return true;
    const entered = window.prompt('Enter your phone number to continue with Kurukoo:'); if (!entered) return false; state.phone = entered.trim(); if (!state.phone) return false;
    try { const r = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ phone:state.phone, name:'Kurukoo User' }) }); if (!r.ok) return false; const data = await r.json(); if (!data.token) return false; state.token=data.token; localStorage.setItem('kurukoo_user_phone',state.phone); localStorage.setItem('kurukoo_auth_token',state.token); return true; } catch { return false; }
  }
  async function send(text) {
    text = String(text || input.value).trim(); if (!text || !(await ensureIdentity())) return; input.value=''; bubble('user', text); const out=bubble('assistant','');
    try {
      const response=await fetch('/api/chat/stream',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${state.token}`},body:JSON.stringify({message:text,channel:'web'})});
      if(!response.ok || !response.body) throw new Error('connection'); const reader=response.body.getReader(),decoder=new TextDecoder(); let buffer='';
      while(true){const {value,done}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});const events=buffer.split('\n\n');buffer=events.pop()||'';for(const event of events){const line=event.split('\n').find(x=>x.startsWith('data: '));if(!line)continue;const payload=line.slice(6);if(payload==='[DONE]')continue;try{const data=JSON.parse(payload);if(data.type==='text'){out.textContent+=data.content||'';messages.scrollTop=messages.scrollHeight;}}catch{}}}
    } catch { out.textContent='I could not connect right now. Open the full chat to continue.'; }
  }
  form.addEventListener('submit',e=>{e.preventDefault();send();}); root.querySelectorAll('[data-prompt]').forEach(btn=>btn.addEventListener('click',()=>send(btn.dataset.prompt)));
})();
