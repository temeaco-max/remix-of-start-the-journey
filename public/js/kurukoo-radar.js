(() => {
  const list = document.getElementById('radar-list');
  const map = document.getElementById('radar-map');
  const refresh = document.querySelector('[data-radar-refresh]');
  const layerButtons = document.querySelectorAll('[data-layer]');
  const render = (label = 'Nearby activity') => {
    if (!list) return;
    list.innerHTML = '<div class="k-row"><span>' + label + '</span><span class="k-muted">Live data appears here</span></div>';
  };
  refresh?.addEventListener('click', async () => {
    render('Refreshing nearby activity…');
    if (!navigator.geolocation) return render('Location unavailable');
    navigator.geolocation.getCurrentPosition(
      () => render('Nearby activity refreshed'),
      () => render('Location permission is off — chat can still search by area'),
      {enableHighAccuracy:false, maximumAge:120000, timeout:5000}
    );
  });
  layerButtons.forEach(button => button.addEventListener('click', () => {
    layerButtons.forEach(b => b.setAttribute('aria-pressed', 'false'));
    button.setAttribute('aria-pressed', 'true');
    render(button.dataset.layer + ' layer selected');
  }));
  map?.setAttribute('role', 'img');
})();