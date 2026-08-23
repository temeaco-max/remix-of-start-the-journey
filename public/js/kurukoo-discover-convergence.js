(() => {
  'use strict';
  if (document.body?.dataset.appSection !== 'discover') return;

  const container = document.querySelector('.k-app-container');
  if (!container) return;

  const state = { view: 'all', radius: 10000, home: null, relationships: new Set(), loading: true };
  const sectionMeta = {
    for_you: ['For You', 'Fresh and relevant'],
    nearby: ['Nearby', 'Around you'],
    today: ['Today', 'Time-sensitive'],
    topics: ['Topics', 'Community context'],
    opportunities: ['Opportunities', 'Ways to participate'],
    explore: ['Explore Kurukoo', 'What Kurukoo can do'],
  };

  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const icon = (name) => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('k-app-icon');
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', `/icons/kurukoo-icons.svg#${name}`);
    svg.appendChild(use);
    return svg;
  };
  const humanize = (value) => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const api = async (url, options = {}) => {
    const response = await fetch(url, { credentials: 'same-origin', ...options, headers: { Accept: 'application/json', ...(options.headers || {}) } });
    const payload = response.headers.get('content-type')?.includes('application/json') ? await response.json() : null;
    if (!response.ok) throw new Error(payload?.error || 'Discovery unavailable');
    return payload || {};
  };

  function shell() {
    container.replaceChildren();
    const header = make('header', 'discover-os-header');
    const copy = make('div', 'discover-os-header__copy');
    copy.append(
      make('span', 'k-app-eyebrow', 'Discover'),
      make('h1', '', 'See what could matter to you today.'),
      make('p', '', 'Useful local context, conversations, opportunities and capabilities — clearly attributed and easy to continue in Chat.'),
    );
    const controls = make('div', 'discover-os-header__controls');
    const search = make('form', 'discover-os-search');
    search.setAttribute('role', 'search');
    const input = make('input');
    input.type = 'search'; input.placeholder = 'Search Discover'; input.autocomplete = 'off'; input.id = 'discover-os-search';
    const submit = make('button', 'discover-os-search__submit', 'Explore'); submit.type = 'submit';
    search.append(icon('discover'), input, submit);
    search.addEventListener('submit', (event) => {
      event.preventDefault();
      const query = input.value.trim();
      if (query) window.location.assign(`/chat?prompt=${encodeURIComponent(`Help me discover ${query}`)}`);
    });
    const tabs = make('div', 'discover-os-tabs');
    [['all','All'],['nearby','Nearby'],['topics','Topics'],['opportunities','Opportunities'],['explore','What Kurukoo can do']].forEach(([value,label]) => {
      const button = make('button', `discover-os-tab${state.view === value ? ' is-active' : ''}`, label);
      button.type = 'button'; button.dataset.view = value; button.setAttribute('aria-pressed', state.view === value ? 'true' : 'false');
      button.addEventListener('click', () => { state.view = value; render(); });
      tabs.appendChild(button);
    });
    controls.append(search, tabs);
    header.append(copy, controls);

    const trust = make('section', 'discover-os-trust', '');
    trust.append(icon('discover'));
    const trustCopy = make('div');
    trustCopy.append(make('strong', '', 'Discovery is a starting point, not proof.'), make('span', '', ' Every result keeps its source, freshness and truth boundary. Open the exact context before asking Kurukoo to act.'));
    trust.append(trustCopy);
    const trustLink = make('a', '', 'How it works'); trustLink.href = '/help#discover'; trust.append(trustLink);

    const density = make('div', 'discover-os-density-row');
    density.append(make('span', 'k-app-eyebrow', 'Your discovery view'), make('span', 'discover-os-density', state.loading ? 'Loading…' : densityLabel()));

    const content = make('div', 'discover-os-content');
    container.append(header, trust, density, content);
  }

  const densityLabel = () => state.home?.density === 'rich' ? 'Rich attributed activity' : state.home?.density === 'sparse' ? 'Sparse but useful' : 'Explore-first view';
  const sourceLabel = (item) => {
    if (item?.type === 'topic') return 'Community-shared';
    if (item?.type === 'capability') return 'System-generated';
    if (item?.sponsored) return 'Sponsored';
    if (item?.source) return humanize(String(item.source).split(':').pop());
    return 'Attributed source';
  };
  const truthLabel = (item) => {
    if (item?.sponsored) return item.disclosure || 'Sponsored';
    if (item?.verified && item?.available) return 'Verified · available';
    if (item?.verified) return 'Verified source';
    if (item?.available) return 'Source-declared availability';
    if (item?.type === 'topic') return 'Community context';
    return item?.evidenceLevel ? humanize(item.evidenceLevel) : 'Unverified';
  };
  const chatHref = (item) => {
    const params = new URLSearchParams({ prompt: item?.chatAction?.prompt || `Help me explore ${item?.title || 'this discovery context'}` });
    if (item?.type === 'discovery') params.set('discoveryEntityId', item.chatAction?.id || item.id);
    if (item?.type === 'topic') params.set('topicId', item.chatAction?.id || item.id);
    return `/chat?${params.toString()}`;
  };

  async function toggleAction(item, action, button) {
    button.disabled = true;
    const active = action === 'follow' ? state.relationships.has(`topic:${item.id}`) : false;
    try {
      const method = active ? 'DELETE' : 'POST';
      const url = active && action === 'follow'
        ? `/api/relationships/${encodeURIComponent(item.type)}/${encodeURIComponent(item.id)}`
        : `/api/discover/items/${encodeURIComponent(item.type)}/${encodeURIComponent(item.id)}/actions`;
      await api(url, { method, headers: { 'Content-Type': 'application/json' }, body: method === 'POST' ? JSON.stringify({ action }) : undefined });
      if (action === 'follow') {
        if (active) state.relationships.delete(`topic:${item.id}`); else state.relationships.add(`topic:${item.id}`);
      }
      button.textContent = action === 'follow' ? (active ? 'Follow' : 'Following') : action === 'watch' ? 'Watching' : 'Saved';
    } catch (error) {
      button.disabled = false;
      button.textContent = error.message || 'Try again';
    }
  }

  function card(item) {
    const article = make('article', 'discover-os-card');
    article.appendChild(make('div', 'discover-os-card__mark')).firstChild.appendChild(icon(item.type === 'topic' ? 'chat' : item.type === 'capability' ? 'sparkles' : item.sponsored ? 'badge' : 'discover'));
    const body = make('div', 'discover-os-card__body');
    const top = make('div', 'discover-os-card__top');
    const title = make('h3', '', item.title || 'Discovery item');
    top.append(title, make('span', 'discover-os-card__source', sourceLabel(item)));
    const detail = make('p', '', item.detail || 'Source-attributed discovery context.');
    const truth = make('div', 'discover-os-card__truth');
    truth.append(make('span', 'discover-os-pill', truthLabel(item)));
    if (item.distanceMetres != null) truth.append(make('span', 'discover-os-pill', `${Math.round(Number(item.distanceMetres))} m`));
    if (item.lifecycle) truth.append(make('span', 'discover-os-pill', humanize(item.lifecycle)));
    if (item.expiresAt) truth.append(make('span', 'discover-os-pill', 'Time-sensitive'));
    const actions = make('div', 'discover-os-actions');
    const open = make('a', 'discover-os-action discover-os-action--primary', item.type === 'promotion' ? (item.ctaText || 'Learn more') : item.type === 'capability' ? 'Ask Kurukoo' : 'Open');
    open.href = item.type === 'promotion' && item.destination ? item.destination : chatHref(item);
    if (item.sponsored) open.addEventListener('click', () => { void fetch(`/api/discover/promotions/${encodeURIComponent(String(item.id).replace(/^promotion:/,''))}/click`, { method: 'POST', keepalive: true }).catch(() => {}); });
    actions.appendChild(open);
    if (item.actions?.includes('follow')) {
      const follow = make('button', 'discover-os-action', state.relationships.has(`${item.type}:${item.id}`) ? 'Following' : 'Follow');
      follow.type = 'button'; follow.addEventListener('click', () => toggleAction(item, 'follow', follow)); actions.appendChild(follow);
    }
    if (item.actions?.includes('watch')) {
      const watch = make('button', 'discover-os-action', 'Watch');
      watch.type = 'button'; watch.addEventListener('click', () => toggleAction(item, 'watch', watch)); actions.appendChild(watch);
    }
    if (item.actions?.includes('save')) {
      const save = make('button', 'discover-os-action', 'Save');
      save.type = 'button'; save.addEventListener('click', () => toggleAction(item, 'save', save)); actions.appendChild(save);
    }
    body.append(top, detail, truth, actions);
    article.appendChild(body);
    if (item.sponsored) void fetch(`/api/discover/promotions/${encodeURIComponent(String(item.id).replace(/^promotion:/,''))}/impression`, { method: 'POST', keepalive: true }).catch(() => {});
    return article;
  }

  function section(key, items) {
    if (state.view !== 'all' && key !== state.view && !(state.view === 'nearby' && ['for_you','nearby','today'].includes(key))) return null;
    const wrapper = make('section', 'discover-os-section');
    const heading = make('div', 'discover-os-section__heading');
    const copy = make('div'); copy.append(make('span', 'k-app-eyebrow', sectionMeta[key][1]), make('h2', '', sectionMeta[key][0]));
    heading.append(copy, make('span', 'discover-os-count', String(Array.isArray(items) ? items.length : 0)));
    const list = make('div', 'discover-os-grid');
    const values = Array.isArray(items) ? items.slice(0, 6) : [];
    if (!values.length) {
      const empty = make('div', 'discover-os-empty');
      empty.append(make('strong', '', `No ${sectionMeta[key][0].toLowerCase()} attributed yet.`), make('p', '', emptyCopy(key)));
      list.appendChild(empty);
    } else values.forEach((item) => list.appendChild(card(item)));
    wrapper.append(heading, list);
    return wrapper;
  }
  const emptyCopy = (key) => ({
    for_you: 'Kurukoo is not inventing recommendations. Explore another view or ask directly in Chat.',
    nearby: 'Nearby data is unavailable or quiet. No provider availability is inferred from an empty result.',
    today: 'Nothing with explicit freshness or expiry evidence is currently surfaced.',
    topics: 'Public Topics will appear here when canonical community content is available.',
    opportunities: 'No current opportunity context is attributed to this view.',
    explore: 'Kurukoo capabilities remain available through Chat and the canonical capability catalogue.',
  }[key] || 'No attributed content yet.');

  function nearbyPanel() {
    if (!['all','nearby'].includes(state.view)) return null;
    const panel = make('section', 'discover-os-nearby');
    const head = make('div', 'discover-os-nearby__heading');
    const copy = make('div'); copy.append(make('span','k-app-eyebrow','Nearby network'), make('h2','','Local context, kept approximate'), make('p','','The map is a presentation layer only. Public coordinates are fuzzed and visibility is not proof of availability.'));
    const controls = make('div','discover-os-nearby__controls');
    [['3000','3 km'],['10000','10 km'],['25000','25 km']].forEach(([value,label])=>{const b=make('button',`discover-os-radius${String(state.radius)===value?' is-active':''}`,label);b.type='button';b.addEventListener('click',()=>{state.radius=Number(value);load();});controls.appendChild(b);});
    head.append(copy,controls);
    const mapShell = make('div','discover-os-map-shell'); mapShell.innerHTML='<div id="discover-map" class="discover-os-map" role="application" aria-label="Approximate nearby discovery map"></div><div class="discover-os-map-state" data-map-status>Preparing nearby network…</div>';
    const resultList = make('div','discover-os-nearby-results'); resultList.id='discover-list'; resultList.setAttribute('aria-live','polite'); resultList.setAttribute('aria-busy','true');
    panel.append(head,mapShell,resultList);
    return panel;
  }

  async function getPosition() {
    if (!navigator.geolocation) return { latitude: 0, longitude: 0, approximate: true };
    return new Promise((resolve) => navigator.geolocation.getCurrentPosition(
      (p) => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude, approximate: false }),
      () => resolve({ latitude: 0, longitude: 0, approximate: true }),
      { enableHighAccuracy: false, maximumAge: 120000, timeout: 7000 },
    ));
  }

  async function load() {
    shell();
    const content = container.querySelector('.discover-os-content');
    if (!content) return;
    const loading = make('div', 'discover-os-loading');
    loading.append(make('span', '', 'Loading your discovery view…'), make('small', '', 'Using canonical discovery sources.'));
    content.append(loading);
    try {
      const where = await getPosition();
      const params = new URLSearchParams({ lat: String(where.latitude), lng: String(where.longitude), radius: String(state.radius), limit: '60' });
      const home = await api(`/api/discover/home?${params.toString()}`);
      state.home = home;
      try {
        const relationships = await api('/api/relationships?relationshipType=follow&limit=100');
        state.relationships = new Set((relationships.relationships || []).map((r) => `${r.targetType}:${r.targetId}`));
      } catch { state.relationships = new Set(); }
      render();
    } catch {
      state.home = null;
      content.replaceChildren();
      const error = make('section', 'discover-os-error', '');
      error.append(make('strong', '', 'Discover is unavailable right now.'), make('p', '', 'The canonical discovery authority could not be read. No local, provider or opportunity state is inferred.'), (() => { const b = make('button','discover-os-action discover-os-action--primary','Retry'); b.type='button'; b.addEventListener('click',load); return b; })(), (() => { const a = make('a','discover-os-action','Continue in Chat'); a.href='/chat'; return a; })());
      content.appendChild(error);
    }
  }

  function render() {
    shell();
    const density = container.querySelector('.discover-os-density');
    if (density) density.textContent = densityLabel();
    const content = container.querySelector('.discover-os-content');
    if (!content) return;
    content.replaceChildren();
    const sections = state.home?.sections || {};
    const nearby = nearbyPanel(); if (nearby) content.appendChild(nearby);
    Object.entries(sections).forEach(([key, items]) => {
      const block = section(key, items);
      if (block) content.appendChild(block);
    });
    if (state.home?.sparse || state.home?.density === 'empty') {
      const sparse = make('section','discover-os-sparse');
      sparse.append(make('strong','','There is not much attributed here yet.'), make('p','',state.home?.explanation || 'Explore another view or ask Kurukoo directly; the system does not fabricate discovery results.'), (()=>{const a=make('a','discover-os-action discover-os-action--primary','Ask Kurukoo');a.href='/chat?prompt=Help%20me%20discover%20something%20useful';return a;})());
      content.appendChild(sparse);
    }
  }

  load();
})();
