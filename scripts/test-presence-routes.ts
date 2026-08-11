import presenceRouter from '../src/routes/presenceRoutes.js';

const stack = (presenceRouter as any).stack || [];
const routes = stack.filter((layer: any) => layer.route).map((layer: any) => ({
    path: layer.route.path,
    methods: Object.keys(layer.route.methods),
}));

const expected = [
    ['GET', '/api/stats/pulse'],
    ['POST', '/api/pulse/live'],
    ['POST', '/api/pulse/activate'],
    ['POST', '/api/pulse/deactivate'],
    ['GET', '/api/pulse/status'],
    ['GET', '/api/pulse/providers'],
];

for (const [method, path] of expected) {
    const route = routes.find((item: any) => item.path === path && item.methods.includes(method.toLowerCase()));
    if (!route) throw new Error(`Missing ${method} ${path}`);
}

console.log(`Presence route contract passed: ${expected.length} routes.`);
