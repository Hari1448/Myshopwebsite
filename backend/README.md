# SUNMADHI STORE backend

REST API backend starter for the existing React frontend. Stack: Node.js, Express, PostgreSQL, JWT admin login.

## Included
- Admin login with bcrypt password hashes and JWT
- Product search/create/update/stock adjustment/soft delete
- Category CRUD
- Sales and invoice history; sale items and stock deduction happen in a PostgreSQL transaction
- Credit ledger and partial payments
- Water-can customer records, paid status, delivery counts
- Dashboard summary and health check
- Input validation, Helmet, CORS, login rate limiting

## 1. Prerequisites
Install Node.js 22+ and PostgreSQL 15+ (or Docker Desktop).

## 2. Setup
Copy `.env.example` to `.env`, then set `DATABASE_URL` and a unique `JWT_SECRET` (at least 32 random characters). Set a strong admin password. Never commit `.env`.

```bash
npm install
npm run db:init
npm run admin:create
npm run dev
```

API runs at `http://localhost:5000`. Check `GET /api/health`.

### Optional PostgreSQL with Docker
The included Compose file starts only the database:
```bash
docker compose up -d
```
For this local Compose setup, set `.env` database URL to:
`postgresql://postgres:change_me_local@localhost:5432/sunmadhi_store`
Use a different password for anything beyond local development.

## Login and call APIs
`POST /api/auth/login`
```json
{"email":"admin@sunmadhistore.local","password":"your-admin-password"}
```
Copy the returned token and send `Authorization: Bearer YOUR_TOKEN` on protected `/api/*` routes.

### Main routes
- `GET/POST /api/products`; `PUT/DELETE /api/products/:id`; `PATCH /api/products/:id/stock` with `{"delta":5}`
- `GET/POST/PUT/DELETE /api/categories`
- `GET/POST /api/sales`; `GET /api/sales/:id/items`
- `GET/POST /api/credits`; `POST /api/credits/:id/payments` with `{"amount":100,"payment_mode":"Cash"}`
- `GET/POST /api/watercan`; `PATCH /api/watercan/:id/paid`; `POST /api/watercan/:id/deliveries` with `{"cans":2}`
- `GET /api/dashboard`; `GET /api/health`

## Connect the React frontend
Copy `frontend-integration/api.js` into your frontend `src/` folder and set `VITE_API_URL=http://localhost:5000/api` in the frontend `.env`. Use `login()` to get a token, then use `api.get('/products')`, etc. See `frontend-integration/README.md`.

Important: the existing UI currently initializes from `src/data/mockData.js` and changes React state locally. To make the whole app truly persistent, each page's initial loading and save handlers must be updated to call these endpoints. This backend does not silently migrate the mock data or automatically wire every existing page.

## Payment gateway foundation
The backend exposes authenticated Razorpay config/order/signature-verification endpoints. Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to the backend environment only. The React POS now has an Online Payment option that creates an order, opens Razorpay Checkout, verifies the signature on the server, and only then saves the invoice as paid. Test this end-to-end with Razorpay test credentials before enabling live payments.

## Real-world integrations
Recharge, domestic money transfer, UPI/payment collection, SMS/WhatsApp and invoice tax features need a provider account, API keys, merchant onboarding and often regulatory/KYC approval. This project does not fake successful financial transactions. Connect a chosen authorised provider only after credentials and sandbox documentation are available. Never put provider secrets in React/Vite variables.
