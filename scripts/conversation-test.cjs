/* Extended conversation test with screenshots for UX evaluation. */
const puppeteer = require('puppeteer-core');
const fs = require('fs');

function findChrome() {
  const candidates = ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium'];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  return null;
}

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', executablePath: findChrome(), args: ['--no-sandbox'], defaultViewport: { width: 1280, height: 800 } });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', err => errors.push(String(err && err.message || err).slice(0, 200)));

  await page.goto('http://localhost:3000/chat', { waitUntil: 'domcontentloaded' });
  // The service worker may take control on first visit and reload the page once.
  // Wait for the page to settle after any initial reload.
  await new Promise(r => setTimeout(r, 1500));
  const settled = await page.evaluate(() => { window.__settle = true; return true; }).catch(() => false);
  if (!settled) { await new Promise(r => setTimeout(r, 4000)); await page.evaluate(() => { window.__settle = true; }).catch(() => {}); }
  await new Promise(r => setTimeout(r, 1500));


  const turn = async (text, screenshot, wait = 13000) => {
    await page.type('#message-input', text, { delay: 8 });
    await page.click('#send-message');
    await new Promise(r => setTimeout(r, wait));
    const state = await page.evaluate(() => {
      const content = document.getElementById('chat-content');
      const msgs = Array.from(content.querySelectorAll('.message')).map(m => ({
        role: m.className.includes('user') ? 'user' : 'assistant',
        text: (m.querySelector('.bubble') ? m.querySelector('.bubble').innerText : '').slice(0, 300),
        hasCard: !!m.querySelector('.provider-card, .agentic-storefront, [class*="card"]'),
      }));
      const visible = Array.from(document.querySelectorAll('.message')).filter(m => !m.hidden && m.offsetParent !== null).length;
      return { msgs, visible, scrollHeight: content.scrollHeight };
    });
    await page.screenshot({ path: `/tmp/chat-turn-${screenshot}.png` });
    console.log(`\n===== TURN ${screenshot}: "${text}" =====`);
    state.msgs.forEach(m => console.log(`[${m.role}]${m.hasCard ? ' [CARD]' : ''} ${m.text.slice(0, 250)}`));
    return state;
  };

  // Conversation 1: casual
  await turn('hi, how are you today?', 1);
  // Conversation 2: real request
  await turn('my laptop is running really slow and the fan is loud', 2);
  // Conversation 3: follow-up
  await turn('its a macbook pro from 2019', 3);
  // Conversation 4: asking what kurukoo can do
  await turn('what else can you help me with?', 4);

  console.log('\n===== PAGE ERRORS =====');
  errors.length ? errors.forEach(e => console.log(e)) : console.log('(none)');
  await browser.close();
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });