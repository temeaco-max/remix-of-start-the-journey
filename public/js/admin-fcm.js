(() => {
  const boot = async () => {
    const main = document.querySelector('.admin-main, main, .control-room, .admin-content');
    if (!main || document.getElementById('admin-fcm-readiness')) return;
    try {
      const response = await fetch('/api/admin/platform/overview', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
      if (!response.ok) return;
      const data = await response.json();
      const fcm = data.fcm || {};
      const card = document.createElement('section');
      card.id = 'admin-fcm-readiness';
      card.className = 'card';
      const server = fcm.server || {};
      const web = fcm.web || {};
      const delivery = fcm.delivery || 'unknown';
      const state = delivery === 'ready_for_runtime_device_validation' ? 'Configured — device validation pending' : 'Needs configuration';
      card.innerHTML = `<div class="k-section-heading"><div><p class="k-muted">Push delivery</p><h2>Firebase Cloud Messaging</h2></div><span class="k-status">${state}</span></div><div class="k-list"><div class="k-row"><span>Server credentials</span><strong>${server.configured ? 'Configured' : 'Not configured'}</strong></div><div class="k-row"><span>Web client + VAPID</span><strong>${web.configured ? 'Configured' : 'Not configured'}</strong></div><div class="k-row"><span>Registered devices</span><strong>${Number(fcm.registeredDevices || 0)}</strong></div><div class="k-row"><span>Delivery worker</span><strong>Canonical queue · 15s drain</strong></div><div class="k-row"><span>Truth boundary</span><strong>Accepted ≠ delivered</strong></div></div><p class="k-muted">${server.reason || web.reason || 'FCM readiness unavailable.'}</p>`;
      main.insertBefore(card, main.firstChild);
    } catch (error) {
      console.warn('[Kurukoo Admin FCM] readiness unavailable', error);
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else void boot();
})();
