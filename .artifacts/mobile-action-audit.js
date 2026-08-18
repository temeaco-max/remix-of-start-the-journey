async (page) => {
  return await page.evaluate(() => {
    const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
    const text = (el) => (el.textContent || '').trim();
    const describe = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return { tag: el.tagName, text: text(el).slice(0, 80), className: el.className, top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height, position: s.position, zIndex: s.zIndex }; };
    const actions = [...document.querySelectorAll('a.workspace-button, button.workspace-button, .workspace-panel button, .workspace-hero-card a')].filter(visible).map(describe);
    const fixed = [...document.querySelectorAll('body *')].filter((el) => visible(el) && ['fixed', 'sticky'].includes(getComputedStyle(el).position)).slice(-20).map(describe);
    const content = document.querySelector('.workspace-content');
    const contentRect = content?.getBoundingClientRect();
    return { route: location.pathname, scrollY, actions, fixed, contentPaddingLeft: contentRect ? contentRect.left : null, contentPaddingRight: contentRect ? innerWidth - contentRect.right : null, viewportHeight: innerHeight, documentHeight: document.documentElement.scrollHeight };
  });
}
