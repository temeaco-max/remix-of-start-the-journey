(() => {
  const nativeFetch = window.fetch.bind(window);
  const adminToken = () => window.localStorage.getItem('kurukoo_admin') || '';

  window.fetch = (input, init = {}) => {
    const rawUrl = input instanceof Request ? input.url : String(input || '');
    const url = new URL(rawUrl, window.location.origin);
    if (!url.pathname.startsWith('/api/admin/')) return nativeFetch(input, init);

    const headers = new Headers(input instanceof Request ? input.headers : undefined);
    new Headers(init.headers || {}).forEach((value, key) => headers.set(key, value));
    const token = adminToken();
    if (token) headers.set('x-admin-token', token);

    return nativeFetch(input, {
      ...init,
      headers,
      credentials: init.credentials || 'same-origin',
    });
  };

  const isLogin = /\/admin\/login(?:\.html)?$/.test(window.location.pathname);
  if (isLogin || document.documentElement.dataset.adminShell === 'true') return;

  const inject = () => {
    document.documentElement.dataset.adminShell = 'true';
    if (!document.getElementById('kurukoo-admin-convergence-css')) {
      const link = document.createElement('link');
      link.id = 'kurukoo-admin-convergence-css';
      link.rel = 'stylesheet';
      link.href = '/css/admin-pages/admin-convergence-shell.css';
      document.head.appendChild(link);
    }

    const path = window.location.pathname + window.location.search;
    const current = (href) => path === href || (href !== '/admin/' && path.startsWith(href));
    const links = [
      ['/admin/', 'Control Room'],
      ['/admin/?section=conversations', 'Conversations'],
      ['/admin/?section=providers', 'Providers'],
      ['/admin/?section=economic', 'Economic'],
      ['/admin/?section=moderation', 'Moderation'],
      ['/admin/?section=compliance', 'Compliance'],
      ['/admin/?section=notifications', 'Notifications'],
      ['/admin/?section=connectors', 'Integrations'],
      ['/admin/ai-agents.html', 'Agents'],
      ['/admin/analytics.html', 'Analytics'],
      ['/admin/revenue.html', 'Revenue'],
      ['/admin/marketing.html', 'Marketing'],
      ['/admin/ads.html', 'Advertising'],
      ['/admin/content.html', 'Content'],
      ['/admin/curation.html', 'Curation'],
      ['/admin/?section=settings', 'Settings'],
      ['/admin/?section=seo', 'SEO'],
    ];

    const bar = document.createElement('aside');
    bar.className = 'kurukoo-admin-convergence-bar';
    bar.setAttribute('aria-label', 'Kurukoo admin control plane');
    bar.innerHTML = `
      <div class="kurukoo-admin-convergence-brand">
        <a href="/admin/" aria-label="Kurukoo Admin Control Room">
          <img src="/assets/brand/logo-icon.png" alt="" width="28" height="28">
          <span>Kurukoo Admin</span>
        </a>
        <span class="kurukoo-admin-convergence-state"><span aria-hidden="true"></span> Control plane</span>
      </div>
      <nav class="kurukoo-admin-convergence-nav" aria-label="Admin modules">
        ${links.map(([href, label]) => `<a href="${href}"${current(href) ? ' aria-current="page"' : ''}>${label}</a>`).join('')}
      </nav>
      <div class="kurukoo-admin-convergence-actions">
        <a href="/" target="_blank" rel="noopener">Open site</a>
        <button type="button" data-admin-convergence-logout>Sign out</button>
      </div>`;

    document.body.prepend(bar);
    document.querySelector('[data-admin-convergence-logout]')?.addEventListener('click', () => {
      window.localStorage.removeItem('kurukoo_admin');
      window.location.assign('/admin/login.html');
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject, { once: true });
  else inject();
})();

//# sourceURL=kurukoo-admin-auth.js
