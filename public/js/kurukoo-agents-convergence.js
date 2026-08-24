(() => {
  'use strict';
  if (document.body?.dataset.appSection !== 'agents') return;
  if (document.documentElement.dataset.kurukooAgentsConvergence === 'true') return;
  document.documentElement.dataset.kurukooAgentsConvergence = 'true';

  const list = document.querySelector('[data-agents-list]');
  const empty = document.querySelector('[data-agents-empty]');
  if (!list) return;

  const esc = (value) => String(value ?? '').replace(/[&<>\"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const humanize = (value) => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()) || 'Unknown';

  const formatDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  };

  const api = async (url) => {
    const response = await fetch(url, { credentials: 'same-origin', headers: { Accept: 'application/json' } });
    const type = response.headers.get('content-type') || '';
    const payload = type.includes('application/json') ? await response.json().catch(() => null) : null;
    if (!response.ok) {
      const err = new Error(payload?.error || `Request failed (${response.status})`);
      err.status = response.status;
      throw err;
    }
    return payload;
  };

  const goalPresenceLabel = (status) => {
    const map = {
      active: 'Working',
      waiting: 'Waiting',
      needs_user: 'Needs your input',
      blocked: 'Blocked',
      completed: 'Completed',
      cancelled: 'Cancelled',
      failed: 'Failed',
      expired: 'Expired',
    };
    return map[String(status || '')] || humanize(status);
  };

  const render = (goals) => {
    if (empty) empty.hidden = Boolean(goals.length);
    if (!goals.length) {
      list.innerHTML = '';
      return;
    }
    list.setAttribute('aria-busy', 'false');
    const rows = goals.slice(0, 25).map((goal) => {
      const status = String(goal.status || '').toLowerCase();
      const id = esc(String(goal.id || '').slice(0, 8));
      const objective = esc(String(goal.objective || goal.summary || 'Agent goal'));
      const presence = esc(goalPresenceLabel(goal.status));
      const updated = esc(formatDate(goal.updatedAt || goal.updated_at));
      const href = `/chat?prompt=${encodeURIComponent(`Show me my agent objective ${goal.id || ''}`)}`;
      return `<article class="k-agent-goal-row">
        <div class="k-agent-goal-head">
          <strong class="k-agent-goal-objective">${objective}${id ? ` <small>· ${id}</small>` : ''}</strong>
          <span class="k-agent-goal-status" data-agent-goal-status="${esc(status)}">${presence}</span>
        </div>
        ${updated ? `<small class="k-agent-goal-updated">Updated ${updated}</small>` : ''}
        <a class="k-agent-goal-link" href="${href}">Open in Chat →</a>
      </article>`;
    });
    list.innerHTML = `${rows.join('')}`;
  };

  const load = async () => {
    try {
      const data = await api('/api/agent/goals');
      const goals = Array.isArray(data.goals) ? data.goals : Array.isArray(data) ? data : [];
      render(goals);
    } catch (error) {
      if (empty) { empty.hidden = false; empty.querySelector('h3').textContent = 'Agent goals are unavailable'; }
      list.setAttribute('aria-busy', 'false');
      list.innerHTML = '';
    }
  };

  list.addEventListener('click', (event) => {
    const link = event.target.closest('.k-agent-goal-link');
    if (!link) return;
    // Links are real hrefs to /chat with prompt, so default navigation is fine
  });

  void load();

  // Set up periodic refresh for live goals (owner-scoped, lightweight)
  let refreshTimer = null;
  const startRefresh = () => {
    stopRefresh();
    refreshTimer = setInterval(() => { void load(); }, 30000);
  };
  const stopRefresh = () => { if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null; } };
  startRefresh();
  window.addEventListener('beforeunload', stopRefresh);
})();