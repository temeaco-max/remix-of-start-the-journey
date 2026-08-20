(() => {
  const tooltipTargetSelector = 'button[aria-label],a[aria-label],[role="button"][aria-label]';
  const legacyIcons = new Map([['‹','chevron-left'],['›','chevron-right'],['＋','plus'],['+','plus'],['×','close'],['✕','close'],['⌄','chevron-down'],['⌃','chevron-up'],['⋯','more']]);

  function decorateTooltips(root = document) {
    root.querySelectorAll(tooltipTargetSelector).forEach((el) => {
      const label = el.getAttribute('aria-label')?.trim();
      if (!label || el.getAttribute('data-tooltip')) return;
      el.setAttribute('data-tooltip', label);
      if (!el.getAttribute('title')) el.setAttribute('title', label);
    });
  }

  function replaceLegacyIconButton(button) {
    const raw = button.childNodes.length === 1 ? button.textContent?.trim() : '';
    if (!raw || !legacyIcons.has(raw) || button.querySelector('svg')) return;
    const icon = legacyIcons.get(raw);
    button.textContent = '';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'k-icon');
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', `/icons/kurukoo-icons.svg#${icon}`);
    svg.appendChild(use);
    button.appendChild(svg);
  }

  function replaceLegacyGlyphs(root = document) {
    root.querySelectorAll('button,a').forEach((button) => replaceLegacyIconButton(button));
    const newConversationGlyph = root.querySelector('.workspace-new > span[aria-hidden="true"]');
    if (newConversationGlyph && !newConversationGlyph.querySelector('svg') && legacyIcons.has(newConversationGlyph.textContent?.trim() || '')) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'k-icon'); svg.setAttribute('aria-hidden', 'true');
      const use = document.createElementNS('http://www.w3.org/2000/svg', 'use'); use.setAttribute('href', '/icons/kurukoo-icons.svg#plus'); svg.appendChild(use);
      newConversationGlyph.replaceWith(svg);
    }
  }

  function setSidebarState(sidebar, collapsed, storageKey) {
    sidebar.classList.toggle('is-collapsed', collapsed);
    sidebar.dataset.collapsed = collapsed ? 'true' : 'false';
    localStorage.setItem(storageKey, collapsed ? '1' : '0');
    const toggle = sidebar.querySelector('#workspace-collapse, #sidebar-collapse');
    if (toggle) {
      toggle.setAttribute('aria-expanded', String(!collapsed));
      toggle.setAttribute('aria-label', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
      toggle.setAttribute('title', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
      toggle.setAttribute('data-tooltip', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
      const use = toggle.querySelector('use');
      if (use) use.setAttribute('href', collapsed ? '/icons/kurukoo-icons.svg#chevron-right' : '/icons/kurukoo-icons.svg#chevron-left');
    }
  }

  function bindWorkspaceSidebar() {
    const sidebar = document.getElementById('workspace-sidebar');
    if (!sidebar) return;
    const storageKey = 'kurukoo.workspace.sidebar.collapsed';
    const saved = localStorage.getItem(storageKey) === '1';
    setSidebarState(sidebar, saved, storageKey);
    const toggle = sidebar.querySelector('#workspace-collapse');
    if (toggle && toggle.dataset.convergenceBound !== 'true') {
      toggle.dataset.convergenceBound = 'true';
      toggle.addEventListener('click', () => setSidebarState(sidebar, !sidebar.classList.contains('is-collapsed'), storageKey));
    }
  }

  function bindMoreMenus() {
    const pairs = [['workspace-more','workspace-more-items'],['sidebar-more-toggle','sidebar-more-items']];
    pairs.forEach(([toggleId, itemsId]) => {
      const toggle = document.getElementById(toggleId); const items = document.getElementById(itemsId);
      if (!toggle || !items || toggle.dataset.convergenceBound === 'true') return;
      toggle.dataset.convergenceBound = 'true';
      toggle.addEventListener('click', () => {
        const open = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', String(!open));
        toggle.classList.toggle('is-open', !open);
        items.hidden = open;
      });
    });
  }

  function addWorkspaceChatDock() {
    if (!document.body.classList.contains('workspace-page') || document.querySelector('.workspace-chat-dock')) return;
    const dock = document.createElement('div');
    dock.className = 'workspace-chat-dock';
    dock.innerHTML = `
      <span class="workspace-chat-dock-label">Conversation stays connected to this page.</span>
      <button class="dock-collapse" type="button" aria-label="Hide Ask shortcut"><svg class="k-icon" aria-hidden="true"><use href="/icons/kurukoo-icons.svg#close"></use></svg></button>
      <a href="/chat" aria-label="Open conversation"><img src="/assets/brand/logo-icon.png" alt="" width="18" height="18"> Ask Kurukoo</a>`;
    document.body.appendChild(dock);
    dock.querySelector('.dock-collapse')?.addEventListener('click', () => {
      dock.classList.add('is-minimized');
      localStorage.setItem('kurukoo.workspace.chatDockHidden', '1');
    });
    if (localStorage.getItem('kurukoo.workspace.chatDockHidden') === '1') dock.classList.add('is-minimized');
  }

  function bindKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        const target = document.querySelector('#message-input, .workspace-page .ask-cta');
        if (target instanceof HTMLElement) target.focus();
      }
      if (event.key === 'Escape') {
        document.querySelectorAll('[aria-expanded="true"][aria-controls]').forEach((el) => {
          if (el instanceof HTMLElement) el.click();
        });
      }
    });
  }

  function run() {
    replaceLegacyGlyphs();
    decorateTooltips();
    bindWorkspaceSidebar();
    bindMoreMenus();
    addWorkspaceChatDock();
    bindKeyboardShortcuts();
    const observer = new MutationObserver(() => {
      replaceLegacyGlyphs();
      decorateTooltips();
      bindWorkspaceSidebar();
      bindMoreMenus();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
})();
