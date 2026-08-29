/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import contentRouter from '../src/routes/contentRoutes.js';

const stack = (contentRouter as any).stack || [];
const routes = stack.filter((layer: any) => layer.route).map((layer: any) => ({ path: layer.route.path, methods: Object.keys(layer.route.methods) }));

for (const [method, path] of [
    ['GET', '/resources'],
    ['GET', '/resources/:slug'],
    ['GET', '/api/resources'],
    ['GET', '/api/resources/:slug'],
    ['GET', '/api/blog'],
    ['GET', '/api/blog/:slug'],
]) {
    const route = routes.find((item: any) => item.path === path && item.methods.includes(method.toLowerCase()));
    if (!route) throw new Error(`Missing ${method} ${path}`);
}

console.log('Content route contract passed: Resources and Blog endpoints present.');