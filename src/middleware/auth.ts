import { Request, Response, NextFunction } from 'express';
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

function getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) {
        throw new Error('JWT_SECRET must be configured with at least 32 characters');
    }
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
    const token = getToken(req);
    if (!token) {
        res.status(401).json({ error: 'Authentication required' });
        return;
    }
    try {
        const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] }) as AuthUser;
        if (!decoded || decoded.role === 'guest') {
            res.status(401).json({ error: 'Invalid authentication token' });
            return;
        }
        (req as AuthRequest).user = decoded;
        next();
    } catch {
        res.status(401).json({ error: 'Invalid or expired authentication token' });
    }
}

export function authenticateAdmin(req: Request, res: Response, next: NextFunction): void {
    const token = getToken(req) ||
        (typeof req.headers['x-admin-token'] === 'string' ? req.headers['x-admin-token'] : undefined) ||
        (typeof req.query.admin_token === 'string' ? req.query.admin_token : undefined);
    if (!token) {
        res.status(401).json({ error: 'Admin authorization token required' });
        return;
    }
    try {
        const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] }) as AuthUser;
        if (decoded && (decoded.role === 'admin' || decoded.username === 'admin')) {
            (req as AuthRequest).admin = decoded;
            (req as AuthRequest).user = decoded;
            next();
            return;
        }
        res.status(403).json({ error: 'Forbidden: Admin role required' });
    } catch {
        res.status(401).json({ error: 'Invalid or expired admin token' });
    }
}
