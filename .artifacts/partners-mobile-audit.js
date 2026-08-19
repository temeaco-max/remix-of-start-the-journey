async (page) => {
  return await page.evaluate(() => {
    const getRect = (selector) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const box = element.getBoundingClientRect();
      return {
        x: Math.round(box.x),
        y: Math.round(box.y),
        width: Math.round(box.width),
        height: Math.round(box.height),
      };
    };
    const stages = Array.from(document.querySelectorAll('.partner-stage'));
    const actions = Array.from(document.querySelectorAll('.partner-button.is-primary')).slice(0, 4);
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      document: {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      },
      stageTops: stages.map((element) => Math.round(element.getBoundingClientRect().top)),
      mobilePreviewDisplay: getComputedStyle(document.querySelector('.partner-mobile-preview')).display,
      railProof: getRect('.partner-rail-proof'),
      primaryActions: actions.map((element) => {
        const box = element.getBoundingClientRect();
        return { text: element.textContent.trim(), width: Math.round(box.width), height: Math.round(box.height) };
      }),
      unnamedLinks: Array.from(document.querySelectorAll('a')).filter((anchor) => !anchor.textContent.trim() && !anchor.getAttribute('aria-label')).length,
    };
  });
}
