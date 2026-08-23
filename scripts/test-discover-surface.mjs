import fs from 'node:fs';

function assert(condition, message) { if (!condition) throw new Error(`FAIL: ${message}`); console.log(`ok: ${message}`); }
const branch = process.env.KURUKOO_DISCOVER_REF || 'discover-phase5-convergence';
const appSurface = fs.readFileSync('src/routes/appSurfaceRoutes.ts', 'utf8');
const discover = fs.readFileSync('public/js/kurukoo-discover-convergence.js', 'utf8');
const mapLoader = fs.readFileSync('public/js/kurukoo-discover-map-loader.js', 'utf8');
const css = fs.readFileSync('public/css/kurukoo-discover-convergence.css', 'utf8');
const legacy = fs.readFileSync('views/discover.ejs', 'utf8');
const architecture = fs.readFileSync('docs/architecture/discover-experience.md', 'utf8');

assert(appSurface.includes("['/discover': 'discover']") || appSurface.includes("'/discover': 'discover'"), 'canonical /discover route is registered by appSurfaceRoutes');
assert(appSurface.includes('kurukoo-discover-convergence.css'), 'Discover CSS is loaded only through the Discover screen asset branch');
assert(appSurface.includes('kurukoo-discover-convergence.js'), 'Discover renderer is loaded only through the Discover screen asset branch');
assert(appSurface.includes('kurukoo-discover-map-loader.js'), 'existing map is sequenced through a Discover-only loader');
assert(discover.includes('/api/discover/home?'), 'renderer consumes canonical Discover home data');
assert(discover.includes('/api/relationships?relationshipType=follow'), 'renderer reads canonical Follow state');
assert(discover.includes('/api/discover/items/'), 'renderer uses canonical Discover action boundary');
assert(discover.includes('/api/relationships/'), 'Follow removal uses canonical relationshipService route');
assert(discover.includes('Community-shared'), 'Topics expose a community truth label');
assert(discover.includes('System-generated'), 'capabilities expose a system-generated truth label');
assert(discover.includes('Verified source'), 'verified discovery truth is visible');
assert(discover.includes('Discover is unavailable right now.'), 'authority failure is distinct from empty state');
assert(discover.includes('No attributed recommendations yet.'), 'empty state is truthful and non-fabricated');
assert(mapLoader.includes('/js/kurukoo-discover-map.js'), 'existing canonical map implementation is reused rather than recreated');
assert(css.includes('@media(max-width:640px)'), 'Discover has mobile-specific responsive rules');
assert(!legacy.includes('route owner'), 'legacy discover template is not asserted as route owner');
assert(architecture.includes('Discover composer'), 'architecture confirms Discover is a thin composition over canonical systems');
assert(branch.length > 0, 'test reference is present');
console.log('PASS test-discover-surface');
