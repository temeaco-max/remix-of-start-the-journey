(() => {
  const tooltipTargetSelector = 'button[aria-label],a[aria-label],[role="button"][aria-label]';
  const legacyIcons = new Map([['‹','chevron-left'],['›','chevron-right'],['＋','plus'],['+','plus'],['×','close'],['✕','close'],['⌄','chevron-down'],['⌃','chevron-up'],['⋯','more']]);
  const semanticNavIcons = new Map([
    ['Conversation','chat'],['Requests','request'],['Reminders','reminder'],['Saved & offers','saved'],['Cart','package'],['Points','points'],['Top up','points'],['Subscription','settings'],['Tasks','work'],['Connect','channels'],['Daily Picks','discover'],['Discover','discover'],['Memory','saved'],['Safety','safety'],['Call','mic'],['Settings','settings'],['Help','help'],['Sign out','logout']
  ]);

  function decorateTooltips(root = document) {
    root.querySelectorAll(tooltipTargetSelector).forEach((el) => {
      const label = el.getAttribute('aria-label')?.trim();
      if (!label || el.getAttribute('data-tooltip')) return;
      el.setAttribute('data-tooltip', label);
      if (!el.getAttribute('title')) el.setAttribute('title', label);
    });
  }

  function setIcon(button, iconName) {
    const use = button.querySelector('svg use');
    if (use) {
      use.setAttribute('href', `/icons/kurukoo-icons.svg#${iconName}`);
      return;
    }
    button.textContent = '';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'k-icon'); svg.setAttribute('aria-hidden', 'true');
    const iconUse = document.createElementNS('http://www.w3.org/2000/svg', 'use'); iconUse.setAttribute('href', `/icons/kurukoo-icons.svg#${iconName}`); svg.appendChild(iconUse); button.appendChild(svg);
  }

  function replaceLegacyIconButton(button) {
    const raw = button.childNodes.length === 1 ? button.textContent?.trim() : '';
    if (!raw || !legacyIcons.has(raw) || button.querySelector('svg')) return;
    setIcon(button, legacyIcons.get(raw));
  }

  function replaceLegacyGlyphs(root = document) {
    root.querySelectorAll('button,a').forEach((button) => replaceLegacyIconButton(button));
    const newConversationGlyph = root.querySelector('.workspace-new > span[aria-hidden="true"]');
    if (newConversationGlyph && !newConversationGlyph.querySelector('svg') && legacyIcons.has(newConversationGlyph.textContent?.trim() || '')) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'k-icon'); svg.setAttribute('aria-hidden', 'true');
      const use = document.createElementNS('http://www.w3.org/2000/svg', 'use'); use.setAttribute('href', '/icons/kurukoo-icons.svg#plus'); svg.appendChild(use); newConversationGlyph.replaceWith(svg);
    }
  }

  function normaliseSemanticNavigation(root = document) {
    root.querySelectorAll('.workspace-nav a,.workspace-nav button,.conversation-subnav .workspace-link,.sidebar-link').forEach((entry) => {
      const label = entry.querySelector('span:last-child')?.textContent?.trim();
      const icon = label ? semanticNavIcons.get(label) : undefined;
      if (icon) setIcon(entry.querySelector('.workspace-nav-icon,.sidebar-link .k-icon')?.closest('.workspace-nav-icon,.sidebar-link') || entry, icon);
    });
  }

  function setSidebarState(sidebar, collapsed, storageKey) {
    sidebar.classList.toggle('is-collapsed', collapsed);
    sidebar.dataset.collapsed = collapsed ? 'true' : 'false';
    localStorage.setItem(storageKey, collapsed ? '1' : '0');
    const toggle = sidebar.querySelector('#workspace-collapse, #sidebar-collapse');
    if (toggle) {
      toggle.setAttribute('aria-expanded', String(!collapsed));
      const label = collapsed ? 'Expand sidebar' : 'Collapse sidebar';
      toggle.setAttribute('aria-label', label); toggle.setAttribute('title', label); toggle.setAttribute('data-tooltip', label);
      setIcon(toggle, collapsed ? 'chevron-right' : 'chevron-left');
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
        toggle.setAttribute('aria-expanded', String(!open)); toggle.classList.toggle('is-open', !open); items.hidden = open;
      });
    });
  }

  function addWorkspaceChatDock() {
    if (!document.body.classList.contains('workspace-page') || document.querySelector('.workspace-chat-dock')) return;
    const dock = document.createElement('div'); dock.className = 'workspace-chat-dock';
    dock.innerHTML = `<span class="workspace-chat-dock-label">Conversation stays connected to this page.</span><button class="dock-collapse" type="button" aria-label="Hide Ask shortcut"><svg class="k-icon" aria-hidden="true"><use href="/icons/kurukoo-icons.svg#chevron-down"></use></svg></button><a href="/chat" aria-label="Open conversation"><img src="/assets/brand/logo-icon.png" alt="" width="18" height="18"> Ask Kurukoo</a>`;
    document.body.appendChild(dock);
    const toggle = dock.querySelector('.dock-collapse');
    toggle?.addEventListener('click', () => {
      const minimized = dock.classList.toggle('is-minimized');
      const label = minimized ? 'Show Ask shortcut' : 'Hide Ask shortcut';
      toggle.setAttribute('aria-label', label); toggle.setAttribute('title', label); toggle.setAttribute('data-tooltip', label); setIcon(toggle, minimized ? 'chevron-up' : 'chevron-down');
      localStorage.setItem('kurukoo.workspace.chatDockHidden', minimized ? '1' : '0');
    });
    if (localStorage.getItem('kurukoo.workspace.chatDockHidden') === '1') {
      dock.classList.add('is-minimized'); if (toggle) { const label = 'Show Ask shortcut'; toggle.setAttribute('aria-label', label); toggle.setAttribute('title', label); toggle.setAttribute('data-tooltip', label); setIcon(toggle, 'chevron-up'); }
    }
  }

  function bindKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); const target = document.querySelector('#message-input, .workspace-page .ask-cta'); if (target instanceof HTMLElement) target.focus(); }
      if (event.key === 'Escape') document.querySelectorAll('[aria-expanded="true"][aria-controls]').forEach((el) => { if (el instanceof HTMLElement) el.click(); });
    });
  }

  function run() {
    replaceLegacyGlyphs(); normaliseSemanticNavigation(); decorateTooltips(); bindWorkspaceSidebar(); bindMoreMenus(); addWorkspaceChatDock(); bindKeyboardShortcuts();
    const observer = new MutationObserver(() => { replaceLegacyGlyphs(); normaliseSemanticNavigation(); decorateTooltips(); bindWorkspaceSidebar(); bindMoreMenus(); });
    observer.observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true }); else run();
})();
