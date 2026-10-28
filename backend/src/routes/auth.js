import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { validate } from '../middleware/validate.js';
const router = Router();
const loginSchema = z.object({ email: z.string().email().max(254), password: z.string().min(1).max(200) });
router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const result = await pool.query('SELECT id,name,email,password_hash FROM admins WHERE email=lower($1)', [req.body.email]);
    const admin = result.rows[0];
    if (!admin || !(await bcrypt.compare(req.body.password, admin.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    const token = jwt.sign({ sub: String(admin.id), email: admin.email, name: admin.name }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, admin: { id: admin.id, name: admin.name, email: admin.email }, expiresIn: 28800 });
  } catch (e) { next(e); }
});
router.get('/me', (req, res) => res.status(501).json({ error: 'Use protected route with bearer token; this endpoint is not enabled yet.' }));
export default router;
