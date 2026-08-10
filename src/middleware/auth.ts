import { Request, Response, NextFunction } from 'express';
import express from 'express';
import jwt from 'jsonwebtoken';

export interface AuthUser {
    id?: string | number;
    phone?: string;
    role?: string;
    username?: string;
    [key: string]: any;
}

export interface AuthRequest extends Request {
    user?: AuthUser;
    admin?: boolean | AuthUser;
}

type RateState = { count: number; resetAt: number };
const rateState = new Map<string, RateState>();
const AUTH_WINDOW_MS = 60_000;
const AUTH_MAX_REQUESTS = 60;

function rateLimit(req: Request, res: Response): boolean {
    const key = String(req.ip || req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim();
    const now = Date.now();
    const current = rateState.get(key);
    if (!current || current.resetAt <= now) {
        rateState.set(key, { count: 1, resetAt: now + AUTH_WINDOW_MS });
        return true;
    }
    current.count += 1;
    if (current.count > AUTH_MAX_REQUESTS) {
        res.setHeader('Retry-After', Math.ceil((current.resetAt - now) / 1000));
        res.status(429).json({ error: 'Too many authenticated requests' });
        return false;
    }
    return true;
}

function getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) throw new Error('JWT_SECRET must be configured with at least 32 characters');
    return secret;
}

function getToken(req: Request): string | undefined {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7).trim();
    const headerToken = req.headers['x-auth-token'];
    if (typeof headerToken === 'string' && headerToken.trim()) return headerToken.trim();
    return typeof req.query.token === 'string' ? req.query.token : undefined;
}

export function authenticateUser(req: Request, res: Response, next: NextFunction): void {
    if (!rateLimit(req, res)) return;
    const token = getToken(req);
    if (!token) return void res.status(401).json({ error: 'Authentication required' });
    try {
        const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] }) as AuthUser;
        if (!decoded || decoded.role === 'guest') return void res.status(401).json({ error: 'Invalid authentication token' });
        (req as AuthRequest).user = decoded;
        next();
    } catch { res.status(401).json({ error: 'Invalid or expired authentication token' }); }
}

export function authenticateAdmin(req: Request, res: Response, next: NextFunction): void {
    if (!rateLimit(req, res)) return;
    const token = getToken(req) ||
        (typeof req.headers['x-admin-token'] === 'string' ? req.headers['x-admin-token'] : undefined) ||
        (typeof req.query.admin_token === 'string' ? req.query.admin_token : undefined);
    if (!token) return void res.status(401).json({ error: 'Admin authorization token required' });
    try {
        const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] }) as AuthUser;
        if (decoded && (decoded.role === 'admin' || decoded.username === 'admin')) {
            (req as AuthRequest).admin = decoded;
            (req as AuthRequest).user = decoded;
            next();
            return;
        }
        res.status(403).json({ error: 'Forbidden: Admin role required' });
    } catch { res.status(401).json({ error: 'Invalid or expired admin token' }); }
}

function extractPhone(req: Request): string | undefined {
    const candidates = [
        req.body?.phone,
        req.body?.buyer_phone,
        req.body?.creator_phone,
        req.body?.provider_phone,
        req.body?.reporter_phone,
        req.body?.alert_phone,
        req.query?.phone,
        req.params?.phone
    ];
    const value = candidates.find(v => typeof v === 'string' && v.trim());
    return typeof value === 'string' ? value.trim() : undefined;
}

export function enforceUserOwnership(req: Request, res: Response, next: NextFunction): void {
    const user = (req as AuthRequest).user;
    if (!user?.phone) return void res.status(403).json({ error: 'Authenticated user identity is incomplete' });
    const requestedPhone = extractPhone(req);
    if (requestedPhone && requestedPhone !== String(user.phone)) {
        return void res.status(403).json({ error: 'You may only access your own user data' });
    }
    next();
}

// Route-level guard installed at registration time. This closes the large class of
// legacy /api handlers that predate the shared middleware without requiring every
// handler to be rewritten individually. Public read-only surfaces remain public.
const publicApi = [
    /^\/api\/auth\/login$/,
    /^\/api\/admin\/auth$/,
    /^\/api\/blog(?:\/.*)?$/,
    /^\/api\/daily-pick$/,
    /^\/api\/emergency$/,
    /^\/api\/referral\/resolve$/,
    /^\/api\/ads$/
];

function routePathIsPublic(path: string): boolean {
    return publicApi.some(pattern => pattern.test(path));
}

function normalizeRoutePaths(path: any): string[] {
    if (typeof path === 'string') return [path];
    if (Array.isArray(path)) return path.filter((p): p is string => typeof p === 'string');
    return [];
}

function installApiRouteGuards() {
    const application: any = (express as any).application;
    if (!application || application.__kurukooApiGuardsInstalled) return;
    application.__kurukooApiGuardsInstalled = true;

    for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
        const original = application[method];
        application[method] = function(path: any, ...handlers: any[]) {
            const paths = normalizeRoutePaths(path);
            if (paths.some(p => p.startsWith('/api/'))) {
                const isAdmin = paths.some(p => p.startsWith('/api/admin/'));
                const guardedPaths = paths.filter(p => p.startsWith('/api/') && !routePathIsPublic(p));
                if (guardedPaths.length > 0) {
                    const guard = isAdmin ? authenticateAdmin : authenticateUser;
                    const ownership = isAdmin ? null : enforceUserOwnership;
                    const guardHandlers = ownership ? [guard, ownership] : [guard];
                    return original.call(this, path, ...guardHandlers, ...handlers);
                }
            }
            return original.call(this, path, ...handlers);
        };
    }
}

installApiRouteGuards();
