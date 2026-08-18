async (page) => {
  return await page.evaluate(() => {
    const sidebar = document.querySelector('#workspace-sidebar');
    const collapse = document.querySelector('#workspace-collapse');
    const measure = () => {
      const r = sidebar ? sidebar.getBoundingClientRect() : null;
      return { left: r?.left ?? null, right: r?.right ?? null, width: r?.width ?? null, bodyScrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth };
    };
    const before = measure();
    collapse?.click();
    const after = measure();
    return { before, after, collapseAria: collapse?.getAttribute('aria-label'), bodyOverflowX: getComputedStyle(document.body).overflowX, documentOverflowX: getComputedStyle(document.documentElement).overflowX };
  });
}
