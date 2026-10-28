import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { pool } from './db/pool.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';
import saleRoutes from './routes/sales.js';
import creditRoutes from './routes/credits.js';
import watercanRoutes from './routes/watercan.js';
import paymentRoutes from './routes/payments.js';
import { requireAuth } from './middleware/auth.js';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const app = express();
app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://checkout.razorpay.com'],
      frameSrc: ["'self'", 'https://api.razorpay.com', 'https://checkout.razorpay.com'],
      connectSrc: ["'self'", 'https://api.razorpay.com', 'https://lumberjack.razorpay.com'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
      fontSrc: ["'self'", 'data:', 'https:'],
      formAction: ["'self'", 'https://api.razorpay.com'],
      upgradeInsecureRequests: null
    }
  },
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors({
  origin: (process.env.FRONTEND_ORIGIN || 'http://localhost:5173').split(',').map(s => s.trim()),
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use('/api/payments', requireAuth, paymentRoutes);
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30 }), authRoutes);

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected', app: 'SUNMADHI STORE API' });
  } catch {
    res.status(503).json({ status: 'error', database: 'unavailable' });
  }
});
app.use('/api/products', requireAuth, productRoutes);
app.use('/api/categories', requireAuth, categoryRoutes);
app.use('/api/sales', requireAuth, saleRoutes);
app.use('/api/credits', requireAuth, creditRoutes);
app.use('/api/watercan', requireAuth, watercanRoutes);

app.get('/api/dashboard', requireAuth, async (_req, res, next) => {
  try {
    const [sales, stock, credits, count] = await Promise.all([
      pool.query("SELECT COALESCE(SUM(total_amount),0) AS revenue, COUNT(*)::int AS invoices FROM sales WHERE payment_status = 'Paid' AND created_at::date = CURRENT_DATE"),
      pool.query('SELECT COUNT(*)::int AS low_stock FROM products WHERE stock <= low_stock_threshold'),
      pool.query("SELECT COALESCE(SUM(balance_amount),0) AS outstanding FROM credit_customers WHERE status <> 'Cleared'"),
      pool.query('SELECT COUNT(*)::int AS products FROM products')
    ]);
    res.json({ today: sales.rows[0], stock: stock.rows[0], credit: credits.rows[0], products: count.rows[0] });
  } catch (e) { next(e); }
});

app.use('/api', (req, res) => res.status(404).json({ error: 'API route not found', path: req.path }));

// Serve the built React app (present only inside the Docker image)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = process.env.STATIC_DIR || path.resolve(__dirname, '../public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(publicDir, 'index.html')));
}
app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.code === '23505') return res.status(409).json({ error: 'A record with this value already exists.' });
  res.status(500).json({ error: 'Internal server error' });
});

const port = Number(process.env.PORT || 5000);
app.listen(port, () => console.log(`SUNMADHI STORE API running at http://localhost:${port}`));
