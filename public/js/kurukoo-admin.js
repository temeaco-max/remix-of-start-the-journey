(() => {
  const queue = document.getElementById('admin-queue');
  const refresh = document.getElementById('load-admin');
  const section = new URLSearchParams(location.search).get('section') || 'overview';
  const render = (text) => { if (queue) queue.innerHTML = '<div class="k-row"><span>' + text + '</span><span class="k-muted">Authenticated admin API required</span></div>'; };
  refresh?.addEventListener('click', () => render(section + ' queue ready'));
})();