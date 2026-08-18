async (page) => {
  const result = await page.evaluate(() => {
    const visible = (el) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
    };
    const text = (el) => (el.textContent || '').trim();
    const links = [...document.querySelectorAll('a')].filter(visible);
    const buttons = [...document.querySelectorAll('button')].filter(visible);
    const nav = performance.getEntriesByType('navigation')[0];
    return {
      route: location.pathname,
      viewport: { width: innerWidth, height: innerHeight },
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      headings: [...document.querySelectorAll('h1,h2,h3')].filter(visible).map(text),
      sidebar: document.querySelector('#workspace-sidebar') ? (() => { const r = document.querySelector('#workspace-sidebar').getBoundingClientRect(); return { width: r.width, visible: visible(document.querySelector('#workspace-sidebar')) }; })() : null,
      bottomActions: [...document.querySelectorAll('[class*="composer"], [class*="action-bar"], [class*="bottom"], footer, button')].filter(visible).slice(-12).map((el) => ({ tag: el.tagName, text: text(el).slice(0, 80), rect: (() => { const r = el.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; })() })),
      visibleLinks: links.length,
      visibleButtons: buttons.length,
      navTiming: { domContentLoaded: nav?.domContentLoadedEventEnd || 0, load: nav?.loadEventEnd || 0 }
    };
  });
  return result;
}
