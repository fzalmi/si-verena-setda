import { Context, Next } from 'hono';
import jwt from 'jsonwebtoken';
import type { Bindings } from '../index';

export const authMiddleware = async (c: Context<{ Bindings: Bindings }>, next: Next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Token tidak ditemukan' }, 401);
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const payload = jwt.verify(token, c.env.JWT_SECRET);
    c.set('jwtPayload', payload);
    await next();
  } catch (err) {
    return c.json({ error: 'Token tidak valid atau expired' }, 401);
  }
};

// Role-based access control
export const requireRole = (...roles: string[]) => {
  return async (c: Context<{ Bindings: Bindings }>, next: Next) => {
    const payload = c.get('jwtPayload') as any;
    
    if (!payload || !roles.includes(payload.role)) {
      return c.json({ error: 'Akses ditolak' }, 403);
    }
    
    await next();
  };
};
