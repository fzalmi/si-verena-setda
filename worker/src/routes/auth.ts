import { Hono } from 'hono';
import jwt from 'jsonwebtoken';
import type { Bindings } from '../index';
import { authMiddleware } from '../middleware/auth';

export const authRoutes = new Hono<{ Bindings: Bindings }>();

// POST /api/auth/login
authRoutes.post('/login', async (c) => {
  const { email, password } = await c.req.json();

  const user = await c.env.DB.prepare(
    'SELECT * FROM users WHERE email = ? AND is_active = 1'
  ).bind(email).first();

  if (!user) {
    return c.json({ error: 'Email atau password salah' }, 401);
  }

  // Simple password check
  const validPassword = password === 'admin123' || password === 'password123';
  
  if (!validPassword) {
    return c.json({ error: 'Email atau password salah' }, 401);
  }

  const token = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      biro_id: user.biro_id,
      nama_biro: user.nama_biro,
    },
    c.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return c.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      biro_id: user.biro_id,
      nama_biro: user.nama_biro,
    },
  });
});

// POST /api/auth/register
authRoutes.post('/register', async (c) => {
  const { email, password, full_name, role, biro_id, nama_biro } = await c.req.json();

  const existing = await c.env.DB.prepare(
    'SELECT id FROM users WHERE email = ?'
  ).bind(email).first();

  if (existing) {
    return c.json({ error: 'Email sudah terdaftar' }, 400);
  }

  const id = `user-${Date.now()}`;
  
  await c.env.DB.prepare(
    'INSERT INTO users (id, email, full_name, password_hash, role, biro_id, nama_biro) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, email, full_name, 'password123', role || 'biro_pengusul', biro_id || null, nama_biro || null).run();

  return c.json({ message: 'User berhasil didaftarkan', id });
});

// GET /api/auth/me
authRoutes.get('/me', authMiddleware, async (c) => {
  const payload = c.get('jwtPayload') as any;
  
  if (!payload) {
    return c.json({ error: 'Token tidak valid' }, 401);
  }

  const user = await c.env.DB.prepare(
    'SELECT id, email, full_name, role, biro_id, nama_biro, avatar_url FROM users WHERE id = ?'
  ).bind(payload.sub).first();

  if (!user) {
    return c.json({ error: 'User tidak ditemukan' }, 404);
  }

  return c.json(user);
});

// POST /api/auth/verify-token
authRoutes.post('/verify-token', async (c) => {
  const { token } = await c.req.json();

  try {
    const payload = jwt.verify(token, c.env.JWT_SECRET);
    return c.json({ valid: true, payload });
  } catch (err) {
    return c.json({ valid: false, error: 'Token tidak valid' });
  }
});
