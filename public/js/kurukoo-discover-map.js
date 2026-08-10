(() => {
  const mapEl = document.getElementById('radar-map');
  const list = document.getElementById('radar-list');
  const refresh = document.querySelector('[data-radar-refresh]');
  const layerButtons = document.querySelectorAll('[data-layer]');
  if (!mapEl || !window.L) return;
  const map = L.map(mapEl, {zoomControl:true}).setView([6.5244,3.3792], 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom:19, attribution:'© OpenStreetMap contributors'}).addTo(map);
  const layers = {};
  let activeLayers = new Set(['mobile','stationary','agents','emergency','deals','events']);
  let markers = L.layerGroup().addTo(map);
  const renderList = features => {
    if (!list) return;
    list.innerHTML = '';
    if (!features.length) { list.innerHTML = '<div class="k-row"><span>No public nearby signals</span><span class="k-muted">Try chat</span></div>'; return; }
    features.slice(0,12).forEach(feature => {
      const row = document.createElement('div'); row.className='k-row';
      const title = document.createElement('span'); title.textContent = feature.properties?.name || feature.properties?.detail || 'Nearby';
      const detail = document.createElement('span'); detail.className='k-muted'; detail.textContent = feature.properties?.detail || feature.properties?.layer || '';
      row.append(title, detail); list.appendChild(row);
    });
  };
  const load = async () => {
    if (!navigator.geolocation) return renderList([]);
    navigator.geolocation.getCurrentPosition(async pos => {
      const {latitude,longitude}=pos.coords; map.setView([latitude,longitude],13);
      const query = encodeURIComponent(Array.from(activeLayers).join(','));
      try {
        const response = await fetch(`/api/discover/map?lat=${latitude}&lng=${longitude}&radius=10000&layers=${query}`, {credentials:'include'});
        if (!response.ok) throw new Error('Radar unavailable');
        const data = await response.json(); markers.clearLayers();
        const features = data.features || [];
        features.forEach(feature => {
          const [lng,lat] = feature.geometry.coordinates;
          const marker = L.circleMarker([lat,lng], {radius:7});
          marker.bindPopup(`<strong>${escapeHtml(feature.properties?.name || 'Nearby')}</strong><br>${escapeHtml(feature.properties?.detail || '')}`);
          marker.addTo(markers);
        });
        renderList(features);
      } catch { renderList([]); }
    }, () => renderList([]), {enableHighAccuracy:false,maximumAge:120000,timeout:7000});
  };
  const escapeHtml = value => String(value).replace(/[&<>\"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[char]));
  refresh?.addEventListener('click', load);
  layerButtons.forEach(button => button.addEventListener('click', () => {
    const layer = button.dataset.layer;
    if (activeLayers.has(layer)) activeLayers.delete(layer); else activeLayers.add(layer);
    button.setAttribute('aria-pressed', activeLayers.has(layer) ? 'true' : 'false'); load();
  }));
  load();
})();