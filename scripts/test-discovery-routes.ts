/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import discoveryRouter from '../src/routes/discoveryRoutes.js';

const stack = (discoveryRouter as any).stack || [];
const routes = stack
    .filter((layer: any) => layer.route)
    .map((layer: any) => ({ path: layer.route.path, methods: Object.keys(layer.route.methods) }));

const mapRoute = routes.find((route: any) => route.path === '/api/discover/map');
if (!mapRoute) throw new Error('Discovery map route is missing');
if (!mapRoute.methods.includes('get')) throw new Error('Discovery map route must support GET');

console.log('Discovery route contract passed: GET /api/discover/map.');
