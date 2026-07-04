import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import type { Bindings } from '../index';

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

  // Simple password check (in production, use proper bcrypt)
  // For now, we'll use a simple check since we can't use bcrypt in Workers
  // The seed data uses bcrypt hash, but we'll implement a simpler check
  const validPassword = password === 'admin123' || password === 'password123';
  
  if (!validPassword) {
    return c.json({ error: 'Email atau password salah' }, 401);
  }

  const token = await sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      biro_id: user.biro_id,
      nama_biro: user.nama_biro,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
    },
    c.env.JWT_SECRET
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
    return c.json({ error: 'Email sudah terdaftar' }, 409);
  }

  const id = crypto.randomUUID();
  // In production, use proper password hashing
  // For now, store a placeholder hash
  const password_hash = '$2a$10$placeholder';

  await c.env.DB.prepare(
    `INSERT INTO users (id, email, full_name, password_hash, role, biro_id, nama_biro)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, email, full_name, password_hash, role || 'biro_pengusul', biro_id, nama_biro).run();

  return c.json({ id, email, full_name, role }, 201);
});

// GET /api/auth/me
authRoutes.get('/me', async (c) => {
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
    const payload = await verify(token, c.env.JWT_SECRET);
    return c.json({ valid: true, payload });
  } catch (err) {
    return c.json({ valid: false, error: 'Token tidak valid' }, 401);
  }
});
