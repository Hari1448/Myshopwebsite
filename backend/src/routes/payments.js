import { Router } from 'express';
import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
const router = Router();
const configured = () => Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
router.get('/config', (_req, res) => res.json({ enabled: configured(), keyId: process.env.RAZORPAY_KEY_ID || null, currency: 'INR' }));
router.post('/orders', validate(z.object({ amount: z.coerce.number().positive().max(10000000), receipt: z.string().max(40).optional() })), async (req, res, next) => {
  try {
    if (!configured()) return res.status(503).json({ error: 'Online payments are not configured. Add Razorpay merchant keys to the backend environment.' });
    const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
    const order = await razorpay.orders.create({ amount: Math.round(req.body.amount * 100), currency: 'INR', receipt: req.body.receipt || `sunmadhi_${Date.now()}` });
    res.status(201).json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (e) { next(e); }
});
router.post('/verify', validate(z.object({ razorpay_order_id: z.string(), razorpay_payment_id: z.string(), razorpay_signature: z.string() })), (req, res) => {
  if (!configured()) return res.status(503).json({ error: 'Online payments are not configured.' });
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
  const a = Buffer.from(expected); const b = Buffer.from(razorpay_signature);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.status(400).json({ verified: false, error: 'Payment signature verification failed.' });
  res.json({ verified: true, paymentId: razorpay_payment_id, orderId: razorpay_order_id });
});
export default router;
