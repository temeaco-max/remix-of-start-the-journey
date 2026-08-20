import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative: string) => fs.existsSync(path.join(root, relative));

assert.equal(exists('public/css/kurukoo-ui-convergence.css'), true, 'shared web convergence CSS missing');
assert.equal(exists('public/js/kurukoo-ui-convergence.js'), true, 'shared web convergence JS missing');
assert.equal(exists('mobile/kurukoo-mobile/components/kurukoo-ui.tsx'), true, 'shared mobile UI primitives missing');
assert.equal(exists('mobile/kurukoo-mobile/lib/platform-contract.ts'), true, 'mobile platform contract missing');

const app = read('src/index.ts');
assert.ok(app.includes('kurukoo-ui-convergence.css'), 'server must inject visual convergence CSS');
assert.ok(app.includes('kurukoo-ui-convergence.js'), 'server must inject visual convergence JS');

const webCss = read('public/css/kurukoo-ui-convergence.css');
for (const token of ['--k-accent:#B95D3C', '--k-ink:#24221F', '--k-surface:#F7F2EC', '--k-border:#E6DED5', '44px', 'data-tooltip', 'workspace-chat-dock.is-minimized']) {
  assert.ok(webCss.includes(token), `visual CSS contract missing ${token}`);
}

const webJs = read('public/js/kurukoo-ui-convergence.js');
for (const marker of ['replaceLegacyGlyphs', 'decorateTooltips', 'setSidebarState', 'workspace.chatDockHidden', 'kurukoo.workspace.sidebar.collapsed']) {
  assert.ok(webJs.includes(marker), `visual interaction contract missing ${marker}`);
}

const mobileUi = read('mobile/kurukoo-mobile/components/kurukoo-ui.tsx');
for (const marker of ['IconButton', 'accessibilityLabel', 'width:44', 'height:44', 'SurfaceHeader', 'StatusPill', 'ActionButton', 'MessageBubble', 'SectionCard', 'EmptyState']) {
  assert.ok(mobileUi.includes(marker), `mobile visual primitive missing ${marker}`);
}

const sprite = read('public/icons/kurukoo-icons.svg');
const referenced = new Set<string>();
const scanRoots = ['views', 'public/chat', 'public/js', 'public/css', 'mobile/kurukoo-mobile'];
for (const relativeRoot of scanRoots) {
  const absolute = path.join(root, relativeRoot);
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(?:ejs|html|js|tsx|ts|css)$/.test(entry.name)) {
        const content = fs.readFileSync(full, 'utf8');
        const regex = /kurukoo-icons\.svg#([a-z0-9-]+)/g;
        for (const match of content.matchAll(regex)) referenced.add(match[1]);
      }
    }
  };
  if (fs.existsSync(absolute)) walk(absolute);
}
for (const icon of referenced) assert.ok(sprite.includes(`id="${icon}"`), `referenced icon is missing from canonical sprite: ${icon}`);

console.log(JSON.stringify({
  passed: true,
  referencedIcons: referenced.size,
  note: 'Visual contract, interaction behaviors, tooltip/collapse affordances, and mobile primitives are present and icon references resolve.'
}, null, 2));
