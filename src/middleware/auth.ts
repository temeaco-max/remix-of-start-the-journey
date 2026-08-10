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

const JWT_SECRET = process.env.JWT_SECRET || 'kurukoo_fallback_secret_39281';

export function authenticateUser(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;
    const token = (authHeader && authHeader.startsWith('Bearer '))
        ? authHeader.slice(7).trim()
        : (req.headers['x-auth-token'] as string) || (req.query.token as string);

    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
            (req as AuthRequest).user = decoded;
            return next();
        } catch (err) {
            res.status(401).json({ error: 'Invalid or expired authentication token' });
            return;
        }
    }

    // Fallback: If no token provided, check for phone/user identifier in body/headers
    const phone = req.body?.buyer_phone || req.body?.phone || req.headers['x-phone'] || req.query?.phone;
    if (phone) {
        (req as AuthRequest).user = { phone: String(phone), role: 'user' };
        return next();
    }

    (req as AuthRequest).user = { role: 'guest' };
    return next();
}

export function authenticateAdmin(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;
    const token = (authHeader && authHeader.startsWith('Bearer '))
        ? authHeader.slice(7).trim()
        : (req.headers['x-admin-token'] as string) || (req.query.admin_token as string) || (req.headers['x-auth-token'] as string);

    if (!token) {
        res.status(401).json({ error: 'Admin authorization token required' });
        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
        if (decoded && (decoded.role === 'admin' || decoded.username === 'admin')) {
            (req as AuthRequest).admin = decoded;
            (req as AuthRequest).user = decoded;
            return next();
        }
        res.status(403).json({ error: 'Forbidden: Admin role required' });
    } catch (err) {
        res.status(401).json({ error: 'Invalid or expired admin token' });
    }
}
