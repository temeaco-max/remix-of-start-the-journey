(() => {
  'use strict';
  if (document.body?.dataset.workspaceSection !== 'desk' && document.body?.dataset.appSection !== 'desk') return;
  const root = document.querySelector('[data-desk-root]');
  if (!root || document.documentElement.dataset.kurukooDeskData === 'true') return;
  document.documentElement.dataset.kurukooDeskData = 'true';

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&', '<': '<', '>': '>', '"': '"', "'": '&#39;' }[c]));
  const humanize = (value) => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()) || 'Not available';
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

  const settle = (promise) => promise.then((value) => ({ ok: true, value })).catch((error) => ({ ok: false, error }));

  const actionNeededStatuses = new Set(['awaiting_confirmation', 'reserved', 'payment_pending']);
  const progressStatuses = new Set([
    'requested', 'awaiting_match', 'partially_matched', 'matched', 'quoting', 'quoted',
    'paid', 'in_fulfillment', 'fulfilled',
  ]);

  const item = ({ kind, title, meta, href, primary }) => {
    const action = href
      ? `<a class="${primary ? 'k-app-primary' : 'k-app-card-action'}" href="${esc(href)}">${primary ? 'Continue' : 'Open'} →</a>`
      : '';
    return `<article class="k-app-card k-desk-item" data-desk-kind="${esc(kind)}">
      <span class="k-app-card-label">${esc(kind)}</span>
      <h3>${esc(title)}</h3>
      <p>${esc(meta)}</p>
      ${action}
    </article>`;
  };

  const renderBand = (name, html) => {
    const band = root.querySelector(`[data-desk-band="${name}"]`);
    const list = root.querySelector(`[data-desk-list="${name}"]`);
    if (!band || !list) return;
    if (!html) {
      band.hidden = true;
      list.innerHTML = '';
      return;
    }
    list.innerHTML = html;
    band.hidden = false;
  };

  const load = async () => {
    const loading = root.querySelector('[data-desk-loading]');
    const errorEl = root.querySelector('[data-desk-error]');
    if (loading) loading.hidden = false;
    if (errorEl) errorEl.hidden = true;

    const [requestsR, tasksR, notificationsR, remindersR, pointsR] = await Promise.all([
      settle(api('/api/chat/economic-requests')),
      settle(api('/api/tasks')),
      settle(api('/api/notifications')),
      settle(api('/api/reminders')),
      settle(api('/api/points/balance')),
    ]);

    if (loading) loading.hidden = true;

    const anyFailed = [requestsR, tasksR, notificationsR, remindersR].some((r) => !r.ok);
    if (errorEl) errorEl.hidden = !anyFailed;

    const requests = requestsR.ok
      ? (Array.isArray(requestsR.value?.requests) ? requestsR.value.requests : Array.isArray(requestsR.value) ? requestsR.value : [])
      : [];
    const tasks = tasksR.ok
      ? (Array.isArray(tasksR.value) ? tasksR.value : Array.isArray(tasksR.value?.tasks) ? tasksR.value.tasks : [])
      : [];
    const notifications = notificationsR.ok
      ? (Array.isArray(notificationsR.value?.notifications) ? notificationsR.value.notifications : Array.isArray(notificationsR.value) ? notificationsR.value : [])
      : [];
    const reminders = remindersR.ok
      ? (Array.isArray(remindersR.value?.reminders) ? remindersR.value.reminders : Array.isArray(remindersR.value) ? remindersR.value : [])
      : [];
    const points = pointsR.ok ? Number(pointsR.value?.points ?? pointsR.value?.balance ?? 0) : null;

    const attention = [];
    const progress = [];
    const cont = [];

    notifications.filter((n) => !n.read && !n.readAt).slice(0, 6).forEach((n) => {
      const title = n.title || n.body || n.message || 'Notification';
      const link = typeof n.link === 'string' && n.link.startsWith('/') ? n.link
        : n.conversation_id ? `/chat/${encodeURIComponent(n.conversation_id)}`
        : '/notifications';
      attention.push(item({
        kind: 'Notification',
        title: String(title).slice(0, 120),
        meta: [humanize(n.surface || n.object_type || 'Kurukoo'), formatDate(n.created_at || n.createdAt)].filter(Boolean).join(' · '),
        href: link,
        primary: true,
      }));
    });

    requests.forEach((req) => {
      const status = String(req.status || '').toLowerCase();
      const id = String(req.id || '');
      const skill = humanize(req.skill || req.category || 'request');
      const title = `${skill}${id ? ` · ${id.slice(0, 8)}` : ''}`;
      const meta = `Status: ${humanize(status)}${req.updated_at || req.updatedAt ? ` · ${formatDate(req.updated_at || req.updatedAt)}` : ''}`;
      if (actionNeededStatuses.has(status)) {
        attention.push(item({
          kind: 'Request · action',
          title,
          meta,
          href: `/confirmation?request=${encodeURIComponent(id)}`,
          primary: true,
        }));
      } else if (progressStatuses.has(status)) {
        progress.push(item({
          kind: 'Request',
          title,
          meta,
          href: `/chat?prompt=${encodeURIComponent(`Continue my ${skill} request ${id}`)}`,
          primary: false,
        }));
      } else if (status === 'completed') {
        cont.push(item({
          kind: 'Completed request',
          title,
          meta,
          href: `/requests/${encodeURIComponent(id)}`,
          primary: false,
        }));
      }
    });

    tasks.forEach((task) => {
      const status = String(task.status || 'available').toLowerCase();
      const id = String(task.id || '');
      const title = task.title || task.name || `Task ${id.slice(0, 8)}`;
      const meta = `Status: ${humanize(status)}${task.sourceType ? ` · ${humanize(task.sourceType)}` : ''}`;
      if (status === 'available' && !task.assignedTo) {
        attention.push(item({ kind: 'Task · available', title, meta, href: '/tasks', primary: true }));
      } else if (status === 'in_progress' && task.assignedTo) {
        progress.push(item({ kind: 'Task', title, meta, href: '/tasks', primary: false }));
      } else if (['completed', 'approved'].includes(status)) {
        cont.push(item({ kind: 'Completed task', title, meta, href: '/tasks', primary: false }));
      }
    });

    const now = Date.now();
    reminders.forEach((rem) => {
      const status = String(rem.status || 'scheduled').toLowerCase();
      if (['cancelled', 'completed', 'done'].includes(status)) return;
      const due = rem.dueAt || rem.due_at;
      const dueMs = due ? new Date(due).getTime() : NaN;
      const overdue = !Number.isNaN(dueMs) && dueMs < now;
      const title = rem.title || rem.note || 'Reminder';
      const meta = [overdue ? 'Overdue' : humanize(status), formatDate(due)].filter(Boolean).join(' · ');
      const href = `/chat?prompt=${encodeURIComponent(`Show reminder ${rem.id || title}`)}`;
      if (overdue) attention.push(item({ kind: 'Reminder · overdue', title, meta, href, primary: true }));
      else progress.push(item({ kind: 'Reminder', title, meta, href, primary: false }));
    });

    renderBand('attention', attention.slice(0, 8).join('') || '');
    renderBand('progress', progress.slice(0, 8).join('') || '');
    renderBand('continue', cont.slice(0, 6).join('') || '');

    const availableParts = [];
    availableParts.push(item({
      kind: 'Conversation',
      title: 'Ask Kurukoo',
      meta: 'Chat remains the source of truth for requests, reminders, memory, agents and actions.',
      href: '/chat',
      primary: true,
    }));
    if (!requests.length) {
      availableParts.push(item({
        kind: 'Requests',
        title: 'No Economic Requests yet',
        meta: 'Start in Chat when you are ready to source, compare or continue a request. No provider or payment state is assumed.',
        href: '/requests',
        primary: false,
      }));
    } else {
      availableParts.push(item({
        kind: 'Requests',
        title: `${requests.length} request${requests.length === 1 ? '' : 's'} on record`,
        meta: 'Review lifecycle, next actions and continuation without a parallel order model.',
        href: '/requests',
        primary: false,
      }));
    }
    availableParts.push(item({
      kind: 'Memory',
      title: 'Memory Profile',
      meta: 'Kurukoo remembers useful things, and you control what it remembers.',
      href: '/memory',
      primary: false,
    }));
    availableParts.push(item({
      kind: 'Notifications',
      title: notifications.length ? `${notifications.length} notification${notifications.length === 1 ? '' : 's'}` : 'Notification centre',
      meta: 'Source-linked updates with explicit next actions.',
      href: '/notifications',
      primary: false,
    }));
    if (points !== null) {
      availableParts.push(item({
        kind: 'Points',
        title: `${points.toLocaleString()} points`,
        meta: 'Balance from the canonical points owner.',
        href: '/points',
        primary: false,
      }));
    }
    availableParts.push(item({
      kind: 'Discover',
      title: 'Explore the network',
      meta: 'Nearby, Today, Topics and Opportunities from canonical discovery data.',
      href: '/discover',
      primary: false,
    }));

    renderBand('available', availableParts.join(''));
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load, { once: true });
  else setTimeout(load, 0);
})();
