# SUNMADHI STORE frontend + backend connection

This frontend keeps the existing pages/styles and now uses the Express API for admin login, categories, products/stock, sales/invoices, credit ledger, and water-can customer records.

## Local startup
1. Install Node.js 22+ and PostgreSQL 15+, or Docker Desktop.
2. In `backend`, copy `.env.example` to `.env`. Set a strong `JWT_SECRET`, database password, and a unique admin password of 12+ characters. Do not commit `.env`.
3. In the backend folder run `npm install`, `npm run db:init`, `npm run admin:create`, `npm run dev`.
4. In `frontend`, copy `.env.example` to `.env` (default `VITE_API_URL=http://localhost:5000/api`). Run `npm install` then `npm run dev`.
5. Sign in with the `ADMIN_EMAIL` and `ADMIN_PASSWORD` from backend `.env`.

The frontend will create the starter categories in the database if it finds no categories. It intentionally does not import demo/mock products, bills or customer data. Add your actual inventory after signing in.

## Online deployment
- Deploy backend to a Node.js host and PostgreSQL to a managed PostgreSQL provider. Configure `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_ORIGIN` (the deployed frontend URL), admin env vars, and `NODE_ENV=production` on the backend.
- Deploy `frontend` as a static Vite site and set `VITE_API_URL=https://YOUR-API-HOST/api` before building.
- Use HTTPS on both hosts, rotate the initial admin password, keep database/network access restricted, and never put secrets in `VITE_*` variables.
- Add your custom domain to the frontend host and update `FRONTEND_ORIGIN` to that exact origin.

## Razorpay online payments
The backend includes authenticated `/api/payments/config`, `/api/payments/orders`, and `/api/payments/verify` endpoints. To enable them, add Razorpay TEST credentials first to backend `.env` (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`) and install dependencies again. Keep the secret on the server only. The Billing POS includes an Online Payment option: it creates an order, opens Razorpay Checkout, verifies the signature server-side, and only then saves the invoice as paid. Do not record an online payment as paid until server verification succeeds. Move to live keys only after your merchant account is approved and sandbox tests pass.

Recharge and money-transfer actions are not connected to a provider; the app warns instead of claiming that those financial transactions succeeded.
