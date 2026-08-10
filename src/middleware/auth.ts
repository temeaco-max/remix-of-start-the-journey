import { Request, Response, NextFunction } from 'express';
import express from 'express';
import jwt from 'jsonwebtoken';
import net from 'net';

export interface AuthUser { id?: string | number; phone?: string; role?: string; username?: string; [key: string]: any; }
export interface AuthRequest extends Request { user?: AuthUser; admin?: boolean | AuthUser; body: any; query: any; params: any; }

type RateState = { count: number; resetAt: number };
const rateState = new Map<string, RateState>();
const AUTH_WINDOW_MS = 60_000;
const AUTH_MAX_REQUESTS = 60;

function rateLimit(req: Request, res: Response): boolean {
    const key = String(req.ip || req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim();
    const now = Date.now();
    const current = rateState.get(key);
    if (!current || current.resetAt <= now) { rateState.set(key, { count: 1, resetAt: now + AUTH_WINDOW_MS }); return true; }
    current.count += 1;
    if (current.count > AUTH_MAX_REQUESTS) { res.setHeader('Retry-After', Math.ceil((current.resetAt - now) / 1000)); res.status(429).json({ error: 'Too many authenticated requests' }); return false; }
    return true;
}

function getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) throw new Error('JWT_SECRET must be configured with at least 32 characters');
    return secret;
}

function getCookie(req: Request, name: string): string | undefined {
    const raw = String(req.headers.cookie || '');
    const pair = raw.split(';').map(v => v.trim()).find(v => v.startsWith(`${name}=`));
    return pair ? decodeURIComponent(pair.slice(name.length + 1)) : undefined;
}

function getToken(req: Request): string | undefined {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7).trim();
    const headerToken = req.headers['x-auth-token'];
    if (typeof headerToken === 'string' && headerToken.trim()) return headerToken.trim();
    return getCookie(req, 'kurukoo_auth');
}

export function authenticateUser(req: Request, res: Response, next: NextFunction): void {
    if (!rateLimit(req, res)) return;
    const token = getToken(req);
    if (!token) return void res.status(401).json({ error: 'Authentication required' });
    try {
        const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] }) as AuthUser;
        if (!decoded || decoded.role === 'guest' || !decoded.phone) return void res.status(401).json({ error: 'Invalid authentication token' });
        (req as AuthRequest).user = decoded;
        next();
    } catch { res.status(401).json({ error: 'Invalid or expired authentication token' }); }
}

export function authenticateAdmin(req: Request, res: Response, next: NextFunction): void {
    if (!rateLimit(req, res)) return;
    const token = getToken(req) || (typeof req.headers['x-admin-token'] === 'string' ? req.headers['x-admin-token'] : undefined);
    if (!token) return void res.status(401).json({ error: 'Admin authorization token required' });
    try {
        const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] }) as AuthUser;
        if (decoded && (decoded.role === 'admin' || decoded.username === 'admin')) { (req as AuthRequest).admin = decoded; (req as AuthRequest).user = decoded; next(); return; }
        res.status(403).json({ error: 'Forbidden: Admin role required' });
    } catch { res.status(401).json({ error: 'Invalid or expired admin token' }); }
}

function extractPhone(req: Request): string | undefined {
    const candidates = [req.body?.phone, req.body?.buyer_phone, req.body?.creator_phone, req.body?.provider_phone, req.body?.reporter_phone, req.body?.alert_phone, req.query?.phone, req.params?.phone];
    const value = candidates.find(v => typeof v === 'string' && v.trim());
    return typeof value === 'string' ? value.trim() : undefined;
}

export function enforceUserOwnership(req: Request, res: Response, next: NextFunction): void {
    const user = (req as AuthRequest).user;
    if (!user?.phone) return void res.status(403).json({ error: 'Authenticated user identity is incomplete' });
    const authenticatedPhone = String(user.phone);
    const requestedPhone = extractPhone(req);
    if (requestedPhone && requestedPhone !== authenticatedPhone) return void res.status(403).json({ error: 'You may only access your own user data' });

    // Legacy endpoints that omitted a phone parameter must inherit the verified
    // session identity rather than falling back to a demo/default user.
    if (!requestedPhone) {
        if (req.query && typeof req.query === 'object') req.query.phone = authenticatedPhone;
        if (req.body && typeof req.body === 'object' && ('phone' in req.body || req.method !== 'GET')) req.body.phone = authenticatedPhone;
    }
    next();
}

function isPrivateOrReservedIp(host: string): boolean {
    const normalized = host.trim().toLowerCase();
    if (normalized === 'localhost' || normalized.endsWith('.localhost') || normalized === '0.0.0.0' || normalized === '::' || normalized === '::1') return true;
    if (net.isIP(normalized) !== 4) return false;
    const parts = normalized.split('.').map(Number);
    const [a, b] = parts;
    return a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a === 0;
}

function validateSensitiveInput(req: Request, res: Response, next: NextFunction): void {
    const body = req.body || {};
    if (body.rating !== undefined) { const rating = Number(body.rating); if (!Number.isInteger(rating) || rating < 1 || rating > 5) return void res.status(400).json({ error: 'Rating must be an integer from 1 to 5' }); }
    if (body.amount_points !== undefined) { const amount = Number(body.amount_points); if (!Number.isInteger(amount) || amount <= 0 || amount > 1_000_000) return void res.status(400).json({ error: 'Invalid Points amount' }); }
    if (req.path === '/api/iot/command') {
        if (body.protocol === 'http') {
            const host = String(body.ip || '').trim();
            if (!host || isPrivateOrReservedIp(host)) return void res.status(400).json({ error: 'IoT HTTP targets must use a non-private host' });
            if (!/^[a-zA-Z0-9.-]+$/.test(host)) return void res.status(400).json({ error: 'Invalid IoT host' });
            const method = String(body.method || 'POST').toUpperCase();
            if (!['GET', 'POST'].includes(method)) return void res.status(400).json({ error: 'IoT HTTP method not allowed' });
            const targetPath = String(body.path || '/');
            if (!targetPath.startsWith('/') || targetPath.includes('..')) return void res.status(400).json({ error: 'Invalid IoT target path' });
        } else if (body.protocol === 'mqtt' && (!body.topic || String(body.topic).length > 200)) return void res.status(400).json({ error: 'Invalid MQTT topic' });
    }
    if (req.path === '/api/admin/disputes/resolve' && !['release', 'refund'].includes(String(body.action))) return void res.status(400).json({ error: 'Invalid dispute resolution action' });
    next();
}

function isPublicRoute(method: string, path: string): boolean {
    if (method === 'post' && (/^\/api\/auth\/(login|request-otp|verify-otp)$/.test(path) || /^\/api\/admin\/auth$/.test(path) || /^\/api\/referral\/resolve$/.test(path))) return true;
    if (method === 'get' && (/^\/api\/blog(?:\/.*)?$/.test(path) || /^\/api\/daily-pick$/.test(path) || /^\/api\/emergency$/.test(path) || /^\/api\/ads$/.test(path))) return true;
    return false;
}

function normalizeRoutePaths(path: any): string[] { if (typeof path === 'string') return [path]; if (Array.isArray(path)) return path.filter((p): p is string => typeof p === 'string'); return []; }

function installApiRouteGuards() {
    const application: any = (express as any).application;
    if (!application || application.__kurukooApiGuardsInstalled) return;
    application.__kurukooApiGuardsInstalled = true;
    for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
        const original = application[method];
        application[method] = function(path: any, ...handlers: any[]) {
            const paths = normalizeRoutePaths(path);
            const apiPaths = paths.filter(p => p.startsWith('/api/'));
            if (apiPaths.length > 0 && !apiPaths.every(p => isPublicRoute(method, p))) {
                const isAdmin = apiPaths.some(p => p.startsWith('/api/admin/'));
                const guard = isAdmin ? authenticateAdmin : authenticateUser;
                const ownership = isAdmin ? null : enforceUserOwnership;
                return original.call(this, path, ...(ownership ? [guard, validateSensitiveInput, ownership] : [guard, validateSensitiveInput]), ...handlers);
            }
            return original.call(this, path, ...handlers);
        };
    }
}

installApiRouteGuards();
