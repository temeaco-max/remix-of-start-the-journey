(() => {
  'use strict';
  if (!document.body?.classList.contains('k-app-page')) return;

  const api = async (url, options = {}) => {
    const response = await fetch(url, { credentials: 'same-origin', ...options, headers: { Accept: 'application/json', ...(options.headers || {}) } });
    const type = response.headers.get('content-type') || '';
    const payload = type.includes('application/json') ? await response.json() : { message: await response.text() };
    if (!response.ok) throw new Error(payload.error || payload.message || `Request failed (${response.status})`);
    return payload;
  };

  const live = (message) => {
    let node = document.querySelector('[data-kurukoo-app-live]');
    if (!node) {
      node = document.createElement('div');
      node.className = 'k-sr-only';
      node.dataset.kurukooAppLive = '';
      node.setAttribute('aria-live', 'polite');
      document.body.appendChild(node);
    }
    node.textContent = message;
  };

  const status = (text, ready = false) => {
    const node = document.createElement('span');
    node.className = `k-status${ready ? ' k-status--ready' : ''}`;
    node.textContent = text;
    return node;
  };

  const action = (label, href, handler) => {
    const node = document.createElement(href ? 'a' : 'button');
    if (href) node.href = href;
    else { node.type = 'button'; node.addEventListener('click', handler); }
    node.className = 'k-app-primary';
    node.textContent = label;
    return node;
  };

  const section = document.body.dataset.appSection || document.querySelector('[data-app-section]')?.dataset.appSection || '';
  const mainCard = () => document.querySelector('.k-app-main .k-app-card');

  async function renderDiscover() {
    const host = mainCard();
    if (!host) return;
    host.innerHTML = '<span class="k-app-card-label">Discover</span><h2>Nearby Pulse</h2><p class="k-muted">Loading live discovery state…</p>';
    try {
      const [providers, presence] = await Promise.all([
        api('/api/pulse/providers'),
        api('/api/pulse/status').catch(() => ({ active: false }))
      ]);
      const list = Array.isArray(providers.providers) ? providers.providers : [];
      const grid = document.createElement('div');
      grid.className = 'k-app-grid two';
      const nearby = document.createElement('article');
      nearby.className = 'k-app-card';
      nearby.innerHTML = '<span class="k-app-card-label">Nearby</span><h3>Current public Pulse</h3>';
      const rows = document.createElement('div');
      rows.className = 'k-action-row';
      rows.dataset.layout = 'stack';
      if (!list.length) {
        const empty = document.createElement('p');
        empty.className = 'k-muted';
        empty.textContent = 'No public Pulse providers are active right now.';
        rows.appendChild(empty);
      }
      list.slice(0, 12).forEach((provider) => {
        const row = document.createElement('div');
        row.className = 'k-surface';
        const title = document.createElement('strong');
        title.textContent = provider.skill || provider.category || provider.type || 'Local provider';
        const meta = document.createElement('p');
        meta.className = 'k-muted';
        meta.textContent = [provider.distance ? `${provider.distance} away` : null, provider.availability || provider.state || 'Active', provider.source || null].filter(Boolean).join(' · ');
        row.append(title, meta);
        rows.appendChild(row);
      });
      nearby.appendChild(rows);
      const own = document.createElement('article');
      own.className = 'k-app-card';
      own.innerHTML = '<span class="k-app-card-label">Your Presence</span><h3>Nearby participation</h3>';
      own.appendChild(status(presence.active ? 'Active on Pulse' : 'Not active', Boolean(presence.active)));
      const note = document.createElement('p');
      note.className = 'k-muted';
      note.textContent = presence.active ? 'Your Pulse session is active. Deactivate when you no longer want to be discoverable.' : 'Activate only when you intentionally want to participate in local discovery.';
      own.appendChild(note);
      if (presence.active) own.appendChild(action('Deactivate Pulse', null, async () => { try { await api('/api/pulse/deactivate', { method: 'POST' }); live('Nearby Pulse deactivated.'); await renderDiscover(); } catch (error) { live(error.message); } }));
      else own.appendChild(action('Activate from Chat', '/chat?prompt=I%20want%20to%20activate%20Nearby%20Pulse'));
      grid.append(nearby, own);
      host.replaceChildren(host.querySelector('.k-app-card-label') || document.createElement('span'), grid);
      const label = host.querySelector('.k-app-card-label');
      if (label) label.textContent = 'Discover';
      const boundary = document.createElement('p');
      boundary.className = 'k-muted';
      boundary.textContent = 'Discovery exposes sanitized public state only; it never turns a presence signal into a provider, price, stock or fulfilment claim.';
      host.appendChild(boundary);
    } catch (error) {
      host.innerHTML = '<span class="k-app-card-label">Discover</span><h2>Discovery unavailable</h2>';
      const note = document.createElement('p');
      note.className = 'k-muted';
      note.textContent = error.message || 'Nearby Pulse is unavailable right now.';
      host.appendChild(note);
      host.appendChild(action('Continue in Chat', '/chat'));
    }
  }

  async function renderEconomic() {
    const host = mainCard();
    if (!host) return;
    try {
      const [stripe, requests] = await Promise.all([
        api('/api/payments/stripe/status').catch(() => ({ configured: false })),
        api('/api/chat/economic-requests').catch(() => ({ requests: [] }))
      ]);
      const items = Array.isArray(requests.requests) ? requests.requests : [];
      const eligible = items.filter((item) => ['quoted', 'awaiting_confirmation', 'payment_pending'].includes(item.status) && item.quote && Number(item.quote.amount_minor) > 0);
      host.innerHTML = '<span class="k-app-card-label">Economic readiness</span><h2>Payment state stays evidence-gated.</h2><p class="k-muted">The client uses canonical Economic Request and payment state. No quote, intent or UI action is treated as payment success.</p>';
      const summary = document.createElement('div');
      summary.className = 'k-action-row';
      summary.append(status(stripe.configured ? 'Stripe configured' : 'Stripe not configured', Boolean(stripe.configured)), status(`${items.length} economic requests`));
      host.appendChild(summary);
      const list = document.createElement('div');
      list.className = 'k-action-row';
      list.dataset.layout = 'stack';
      if (!eligible.length) {
        const empty = document.createElement('p');
        empty.className = 'k-muted';
        empty.textContent = 'No current Economic Request requires payment action.';
        list.appendChild(empty);
      }
      eligible.slice(0, 10).forEach((request) => {
        const row = document.createElement('article');
        row.className = 'k-surface';
        const title = document.createElement('strong');
        title.textContent = request.skill || request.category || 'Economic Request';
        const detail = document.createElement('p');
        detail.className = 'k-muted';
        detail.textContent = `${String(request.status || 'unknown').replaceAll('_', ' ')} · ${request.quote.currency || 'GBP'} ${(Number(request.quote.amount_minor) / 100).toFixed(2)}`;
        row.append(title, detail, action('Review in Chat →', `/chat?prompt=${encodeURIComponent(`Continue my ${request.skill || request.category || 'economic request'} and review payment state`)}`));
        if (stripe.configured && section === 'checkout') {
          const pay = action(request.status === 'payment_pending' ? 'Payment pending' : 'Start Stripe payment', null, async () => {
            pay.disabled = true;
            try {
              const result = await api('/api/payments/stripe/intents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ economicRequestId: request.id }) });
              live(`Payment intent ${result.status}. Provider reconciliation is still authoritative.`);
              pay.textContent = `Intent ${result.status}`;
            } catch (error) { pay.disabled = false; live(error.message); }
          });
          pay.disabled = request.status === 'payment_pending';
          row.appendChild(pay);
        }
        list.appendChild(row);
      });
      host.appendChild(list);
      const boundary = document.createElement('p');
      boundary.className = 'k-muted';
      boundary.textContent = stripe.configured ? 'Provider configuration is present; final payment success requires signed provider evidence and reconciliation.' : 'Payment provider is unavailable for this deployment.';
      host.appendChild(boundary);
    } catch (error) {
      host.innerHTML = '<span class="k-app-card-label">Economic layer</span><h2>Payment state unavailable</h2>';
      const note = document.createElement('p');
      note.className = 'k-muted';
      note.textContent = error.message || 'Economic state could not be loaded.';
      host.appendChild(note);
    }
  }

  if (section === 'discover') renderDiscover();
  if (['wallet', 'subscriptions', 'checkout', 'confirmations'].includes(section)) renderEconomic();
})();
