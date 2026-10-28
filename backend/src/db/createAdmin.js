import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool } from './pool.js';
try {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12) {
    throw new Error('Set ADMIN_NAME, ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters in .env');
  }
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await pool.query(
    `INSERT INTO admins(name,email,password_hash) VALUES($1,lower($2),$3)
     ON CONFLICT(email) DO UPDATE SET name=EXCLUDED.name,password_hash=EXCLUDED.password_hash`,
    [ADMIN_NAME, ADMIN_EMAIL, hash]
  );
  console.log(`Admin account created/updated for ${ADMIN_EMAIL}. Change its password after first login.`);
} catch (e) { console.error(e.message); process.exitCode = 1; }
finally { await pool.end(); }
