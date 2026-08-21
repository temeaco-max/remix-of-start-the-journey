(() => {
  'use strict';
  if (!document.body?.classList.contains('k-app-page')) return;
  if (document.documentElement.dataset.kurukooDeskSystem === 'true') return;
  document.documentElement.dataset.kurukooDeskSystem = 'true';

  const legacyToCanonical = (pathname) => {
    const direct = {
      '/app': '/desk','/app/agent': '/desk','/app/discover': '/discover','/app/requests': '/requests','/app/tasks': '/tasks','/app/connect': '/connect','/app/reminders': '/reminders','/app/saved': '/saved','/app/cart': '/cart','/app/agents': '/agents','/app/capabilities': '/capabilities','/app/opportunities': '/opportunities','/app/wallet': '/wallet','/app/points': '/points','/app/top-up': '/top-up','/app/subscriptions': '/subscriptions','/app/checkout': '/checkout','/app/confirmations': '/confirmations','/app/memory': '/memory','/app/artifacts': '/artifacts','/app/prayer': '/prayer','/app/call': '/call','/app/notifications': '/notifications','/app/safety': '/safety','/app/settings': '/settings'
    };
    if (direct[pathname]) return direct[pathname];
    if (pathname.startsWith('/app/requests/')) return pathname.replace('/app/requests/', '/requests/');
    if (pathname.startsWith('/app/tasks/')) return pathname.replace('/app/tasks/', '/tasks/');
    if (pathname.startsWith('/app/agents/')) return pathname.replace('/app/agents/', '/agents/');
    if (pathname.startsWith('/app/opportunities/')) return pathname.replace('/app/opportunities/', '/opportunities/');
    if (pathname.startsWith('/app/connections/')) return pathname.replace('/app/connections/', '/connections/');
    if (pathname.startsWith('/app/memory/')) return pathname.replace('/app/memory/', '/memory/');
    if (pathname.startsWith('/app/artifacts/')) return pathname.replace('/app/artifacts/', '/artifacts/');
    return pathname;
  };

  const normalizeLinks = () => {
    document.querySelectorAll('a[href]').forEach((anchor) => {
      const raw = anchor.getAttribute('href');
      if (!raw || raw.startsWith('#') || raw.startsWith('mailto:') || raw.startsWith('tel:') || raw.startsWith('javascript:')) return;
      try {
        const url = new URL(raw, window.location.origin);
        if (url.origin !== window.location.origin) return;
        const canonical = legacyToCanonical(url.pathname);
        if (canonical !== url.pathname) {
          url.pathname = canonical;
          anchor.setAttribute('href', `${url.pathname}${url.search}${url.hash}`);
        }
      } catch {}
    });
  };

  const closeAll = () => document.querySelectorAll('.k-desk-drawer:not([hidden])').forEach((panel) => {
    panel.hidden = true;
    const button = document.querySelector(`[aria-controls="${panel.id}"]`);
    button?.setAttribute('aria-expanded', 'false');
  });

  const makeDrawer = ({ id, title }) => {
    if (document.getElementById(id)) return null;
    const panel = document.createElement('aside');
    panel.className = 'k-desk-drawer'; panel.id = id; panel.hidden = true; panel.setAttribute('aria-label', title);
    panel.innerHTML = `<div class="k-desk-drawer-head"><div><span class="k-desk-drawer-kicker">Kurukoo</span><h2>${title}</h2></div><button type="button" class="k-desk-drawer-close" aria-label="Close ${title}">×</button></div><div class="k-desk-drawer-body"></div>`;
    document.body.appendChild(panel);
    panel.querySelector('.k-desk-drawer-close')?.addEventListener('click', closeAll);
    return panel;
  };

  const makeButton = (label, id, symbol) => {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'k-desk-icon-button'; button.setAttribute('aria-label', label); button.setAttribute('aria-controls', id); button.setAttribute('aria-expanded', 'false'); button.innerHTML = `<span aria-hidden="true">${symbol}</span>`; return button;
  };

  const renderSearch = (body) => {
    body.innerHTML = '<form class="k-desk-search-form"><label for="k-desk-search-input">Search Kurukoo</label><input id="k-desk-search-input" type="search" autocomplete="off" placeholder="Search conversations, requests, tasks, people, topics…"><p class="k-desk-search-hint">Use Agent for open-ended or semantic search.</p><div class="k-desk-search-results" role="listbox"></div></form>';
    const input = body.querySelector('input'); const results = body.querySelector('.k-desk-search-results');
    const sources = [['Desk','/desk','Your workspace'],['Agent','/chat','Talk to Kurukoo'],['Discover','/discover','Find people, places, products and opportunities'],['Requests','/requests','Track active and completed requests'],['Tasks','/tasks','Manage tasks and contributions'],['Connect','/connect','Connected services and channels'],['Memory','/memory','Saved context and provenance'],['Topics','/topics','Community Topics'],['Opportunities','/opportunities','Current opportunities'],['Notifications','/notifications','Updates and actions needed'],['Settings','/settings','Account and preferences']];
    const draw = () => {
      const q = String(input.value || '').trim().toLowerCase(); results.replaceChildren();
      sources.filter(([label, href, description]) => !q || `${label} ${description}`.toLowerCase().includes(q)).forEach(([label, href, description]) => { const a=document.createElement('a'); a.className='k-desk-search-result'; a.href=href; a.innerHTML=`<strong>${label}</strong><span>${description}</span>`; results.appendChild(a); });
      if (q) { const a=document.createElement('a'); a.className='k-desk-search-result k-desk-search-result-agent'; a.href=`/chat?prompt=${encodeURIComponent(`Search Kurukoo for ${input.value.trim()}`)}`; a.innerHTML='<strong>Ask Agent</strong><span>Search semantically across Kurukoo.</span>'; results.appendChild(a); }
    };
    input.addEventListener('input', draw); input.addEventListener('keydown', (event) => { if (event.key === 'Enter' && input.value.trim()) { event.preventDefault(); window.location.assign(`/chat?prompt=${encodeURIComponent(`Search Kurukoo for ${input.value.trim()}`)}`); } }); draw(); queueMicrotask(() => input.focus());
  };

  const renderNotifications = async (body) => {
    body.innerHTML = '<p class="k-muted">Loading notifications…</p>';
    try {
      const response = await fetch('/api/notifications', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`Notifications unavailable (${response.status})`);
      const payload = await response.json(); const items = Array.isArray(payload) ? payload : Array.isArray(payload.notifications) ? payload.notifications : [];
      if (!items.length) { body.innerHTML = '<div class="k-desk-empty-state"><strong>You are up to date.</strong><p>No notifications need your attention.</p></div>'; return; }
      body.replaceChildren(); const list=document.createElement('div'); list.className='k-desk-notification-list';
      items.slice(0,30).forEach((item)=>{ const row=document.createElement('article'); row.className=`k-desk-notification${item.read||item.readAt?'':' is-unread'}`; const title=String(item.title||item.type||'Kurukoo update'); const message=String(item.body||item.message||''); const target=String(item.link||item.href||'/notifications'); row.innerHTML=`<div><strong>${title}</strong><p>${message}</p></div><a href="${target}">${item.actionLabel||'Open'}</a>`; list.appendChild(row); });
      body.appendChild(list); const all=document.createElement('a'); all.className='k-desk-drawer-primary'; all.href='/notifications'; all.textContent='View all notifications →'; body.appendChild(all);
    } catch (error) { body.innerHTML=`<div class="k-desk-empty-state"><strong>Notifications are unavailable</strong><p>${String(error?.message||'Open Notifications for the full state.')}</p><a href="/notifications">Open Notifications →</a></div>`; }
  };

  const renderProfile = (body) => {
    const identity=document.querySelector('.k-app-identity'); const name=identity?.querySelector('strong')?.textContent?.trim()||'Your account'; const phone=identity?.querySelector('small')?.textContent?.trim()||'';
    body.innerHTML=`<div class="k-desk-profile-card"><div class="k-desk-avatar">${name.slice(0,1).toUpperCase()}</div><div><strong>${name}</strong><span>${phone}</span></div></div>`;
    [['Settings','/settings'],['Memory','/memory'],['Notifications','/notifications'],['Open Agent','/chat']].forEach(([label,href])=>{const a=document.createElement('a');a.className='k-desk-drawer-link';a.href=href;a.textContent=label;body.appendChild(a);});
    const logout=document.createElement('a');logout.className='k-desk-drawer-link is-danger';logout.href='/api/auth/logout';logout.textContent='Sign out';body.appendChild(logout);
  };

  const boot = () => {
    normalizeLinks();
    const host=document.querySelector('.k-app-header-actions'); if(!host) return;
    const search=makeDrawer({id:'kurukoo-drawer-search',title:'Search'}); const notifications=makeDrawer({id:'kurukoo-drawer-notifications',title:'Notifications'}); const profile=makeDrawer({id:'kurukoo-drawer-profile',title:'Account'}); if(!search||!notifications||!profile) return;
    const controls=[[search,'Search','⌕',renderSearch],[notifications,'Notifications','◔',renderNotifications],[profile,'Account','◉',renderProfile]];
    controls.forEach(([panel,label,symbol,render])=>{const button=makeButton(label,panel.id,symbol);button.addEventListener('click',()=>{if(panel.hidden){closeAll();panel.hidden=false;button.setAttribute('aria-expanded','true');render(panel.querySelector('.k-desk-drawer-body'));}else closeAll();});host.prepend(button);});
    const ask=host.querySelector('.k-app-ask'); if(ask){ask.textContent='Ask Agent';ask.setAttribute('aria-label','Open Agent');}
    document.addEventListener('keydown',(event)=>{if(event.key==='Escape')closeAll();});
    const observer=new MutationObserver(()=>normalizeLinks()); observer.observe(document.body,{subtree:true,childList:true});
  };

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
