async (page) => {
  return await page.evaluate(() => {
    const button = [...document.querySelectorAll('button')].find((el) => (el.textContent || '').trim() === 'Continue');
    const chain = [];
    let node = button;
    while (node && chain.length < 8) {
      const r = node.getBoundingClientRect();
      const s = getComputedStyle(node);
      chain.push({ tag: node.tagName, className: node.className, top: r.top, bottom: r.bottom, height: r.height, scrollHeight: node.scrollHeight, clientHeight: node.clientHeight, overflowY: s.overflowY, position: s.position });
      node = node.parentElement;
    }
    return { button: chain[0] || null, chain, windowScrollY: scrollY, documentScrollHeight: document.documentElement.scrollHeight, bodyScrollHeight: document.body.scrollHeight, activeScrollers: [...document.querySelectorAll('*')].filter((el) => el.scrollHeight > el.clientHeight + 2 && ['auto','scroll'].includes(getComputedStyle(el).overflowY)).slice(0, 10).map((el) => ({ tag: el.tagName, className: el.className, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight })) };
  });
}
