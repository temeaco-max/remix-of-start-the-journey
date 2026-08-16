(() => {
  const mapEl = document.getElementById('radar-map') || document.getElementById('discover-map');
  const list = document.getElementById('radar-list') || document.getElementById('discover-list');
  const refresh = document.querySelector('[data-radar-refresh]');
  const layerButtons = document.querySelectorAll('[data-layer]');
  if (!mapEl || !window.L) return;

  const map = L.map(mapEl, { zoomControl: true }).setView([6.5244, 3.3792], 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap contributors' }).addTo(map);
  const markers = L.layerGroup().addTo(map);
  const activeLayers = new Set(['mobile', 'stationary', 'provider', 'service', 'place', 'business', 'event', 'agent', 'community_context', 'events']);
  const colors = { provider: '#25D366', service: '#E67E22', place: '#2E86DE', business: '#8E44AD', event: '#D35400', agent: '#6C5CE7', community_context: '#C0392B', mobile: '#25D366', stationary: '#E67E22' };
  let lastFeatures = [];

  function makeElement(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function actionUrl(properties) {
    const action = properties?.chatAction;
    const params = new URLSearchParams();
    params.set('prompt', properties?.entityId ? 'Review this exact discovery context with me' : 'Review these nearby discovery results with me');
    if (action?.entityId) params.set('discoveryEntityId', String(action.entityId));
    const conversationId = action?.context ? String(action.context).replace(/^conversation:/, '') : '';
    if (conversationId) params.set('conversationId', conversationId);
    return `/chat?${params.toString()}`;
  }

  function renderList(features) {
    if (!list) return;
    list.replaceChildren();
    if (!features.length) {
      list.appendChild(makeElement('div', 'k-row empty-state', 'No attributed discovery activity is available in this area yet.'));
      return;
    }
    features.slice(0, 20).forEach((feature) => {
      const properties = feature?.properties || {};
      const row = makeElement('article', 'k-row discover-network-item');
      const title = makeElement('strong', 'discover-network-title', properties.name || 'Nearby discovery');
      const detail = makeElement('span', 'k-muted discover-network-detail', `${properties.detail || 'Discovery item'} · ${properties.lifecycle || 'discovered'}`);
      const action = makeElement('a', 'k-btn k-btn-secondary discover-network-action', 'Open in Chat');
      action.href = actionUrl(properties);
      row.append(title, detail, action);
      list.appendChild(row);
    });
  }

  function renderMap(features) {
    markers.clearLayers();
    features.forEach((feature) => {
      const properties = feature?.properties || {};
      const coordinates = feature?.geometry?.coordinates;
      if (!Array.isArray(coordinates) || coordinates.length < 2) return;
      const [lng, lat] = coordinates;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      const layer = properties.entityType || properties.layer || 'place';
      const marker = L.circleMarker([lat, lng], { radius: properties.count > 1 ? 11 : 7, color: colors[layer] || '#777068', fillColor: colors[layer] || '#777068', fillOpacity: 0.78 });
      const popup = document.createElement('div');
      popup.append(
        makeElement('strong', '', properties.name || 'Nearby discovery'),
        makeElement('div', '', properties.detail || 'Discovery item'),
        makeElement('small', '', `Status: ${properties.lifecycle || 'discovered'} · Source: ${properties.source || 'attributed source'}`),
      );
      const action = makeElement('a', 'discover-network-action', 'Open exact context in Chat');
      action.href = actionUrl(properties);
      popup.appendChild(action);
      marker.bindPopup(popup).addTo(markers);
    });
  }

  function render(data) {
    lastFeatures = Array.isArray(data?.features) ? data.features : [];
    renderMap(lastFeatures);
    renderList(lastFeatures);
  }

  function getPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('Location is unavailable'));
      navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, maximumAge: 120000, timeout: 7000 });
    });
  }

  async function load() {
    try {
      const position = await getPosition();
      const { latitude, longitude } = position.coords;
      map.setView([latitude, longitude], Math.max(map.getZoom(), 13));
      const params = new URLSearchParams({ lat: String(Math.round(latitude * 100) / 100), lng: String(Math.round(longitude * 100) / 100), radius: '10000', layers: Array.from(activeLayers).join(','), cluster: 'true' });
      const conversationId = new URLSearchParams(window.location.search).get('conversationId');
      if (conversationId) params.set('conversationId', conversationId);
      const response = await fetch(`/api/discover/map?${params.toString()}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Discovery network unavailable');
      render(await response.json());
    } catch {
      render({ features: [] });
    }
  }

  refresh?.addEventListener('click', load);
  layerButtons.forEach((button) => {
    const layer = button.dataset.layer;
    if (!layer) return;
    button.setAttribute('aria-pressed', activeLayers.has(layer) ? 'true' : 'false');
    button.addEventListener('click', () => {
      if (activeLayers.has(layer)) activeLayers.delete(layer); else activeLayers.add(layer);
      button.setAttribute('aria-pressed', activeLayers.has(layer) ? 'true' : 'false');
      render({ features: lastFeatures.filter((feature) => activeLayers.has(feature?.properties?.entityType || feature?.properties?.layer)) });
      load();
    });
  });
  load();
})();
