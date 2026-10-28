import 'dotenv/config';
import { pool } from './pool.js';
const sql = `
CREATE TABLE IF NOT EXISTS admins (
 id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
 password_hash TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS categories (
 id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL UNIQUE, description TEXT DEFAULT '',
 icon TEXT DEFAULT '', color TEXT NOT NULL DEFAULT 'blue', is_service BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS products (
 id BIGSERIAL PRIMARY KEY, sku TEXT UNIQUE, name TEXT NOT NULL,
 category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
 category_name TEXT NOT NULL DEFAULT '', price NUMERIC(12,2) NOT NULL CHECK(price >= 0),
 cost_price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK(cost_price >= 0),
 stock INTEGER NOT NULL DEFAULT 0 CHECK(stock >= 0),
 low_stock_threshold INTEGER NOT NULL DEFAULT 5 CHECK(low_stock_threshold >= 0),
 unit TEXT NOT NULL DEFAULT 'pcs', active BOOLEAN NOT NULL DEFAULT TRUE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS sales (
 id BIGSERIAL PRIMARY KEY, invoice_no TEXT NOT NULL UNIQUE,
 customer_name TEXT NOT NULL DEFAULT 'Walk-in Customer', customer_phone TEXT DEFAULT '',
 subtotal NUMERIC(12,2) NOT NULL CHECK(subtotal >= 0), discount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK(discount >= 0), fee NUMERIC(12,2) NOT NULL DEFAULT 0,
 total_amount NUMERIC(12,2) NOT NULL CHECK(total_amount >= 0),
 payment_mode TEXT NOT NULL CHECK(payment_mode IN ('Cash','UPI','Card','Credit','Other')),
 payment_status TEXT NOT NULL DEFAULT 'Paid' CHECK(payment_status IN ('Paid','Pending','Partial','Cancelled')),
 notes TEXT DEFAULT '', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS sale_items (
 id BIGSERIAL PRIMARY KEY, sale_id BIGINT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
 product_id BIGINT REFERENCES products(id) ON DELETE SET NULL, product_name TEXT NOT NULL,
 quantity INTEGER NOT NULL CHECK(quantity > 0), unit_price NUMERIC(12,2) NOT NULL CHECK(unit_price >= 0),
 line_total NUMERIC(12,2) NOT NULL CHECK(line_total >= 0)
);
CREATE TABLE IF NOT EXISTS credit_customers (
 id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, phone TEXT DEFAULT '', items TEXT DEFAULT '',
 total_amount NUMERIC(12,2) NOT NULL CHECK(total_amount >= 0),
 paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK(paid_amount >= 0),
 balance_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK(balance_amount >= 0),
 due_date DATE, status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending','Cleared','Overdue')),
 notes TEXT DEFAULT '', sale_id BIGINT REFERENCES sales(id) ON DELETE SET NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS credit_payments (
 id BIGSERIAL PRIMARY KEY, credit_customer_id BIGINT NOT NULL REFERENCES credit_customers(id),
 amount NUMERIC(12,2) NOT NULL CHECK(amount > 0), payment_mode TEXT NOT NULL DEFAULT 'Cash',
 notes TEXT DEFAULT '', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS watercan_customers (
 id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, phone TEXT DEFAULT '', address TEXT DEFAULT '',
 advance_amount NUMERIC(12,2) NOT NULL DEFAULT 0, cans_held INTEGER NOT NULL DEFAULT 0,
 deliveries_count INTEGER NOT NULL DEFAULT 0, due_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
 payment_status TEXT NOT NULL DEFAULT 'Pending', last_delivery TIMESTAMPTZ,
 notes TEXT DEFAULT '', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT 'blue';
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_service BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS discount NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS code INTEGER;
CREATE SEQUENCE IF NOT EXISTS product_code_seq START 101;
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM products WHERE code IS NULL ORDER BY id LOOP
    UPDATE products SET code = nextval('product_code_seq') WHERE id = r.id;
  END LOOP;
END $$;
ALTER TABLE products ALTER COLUMN code SET DEFAULT nextval('product_code_seq');
CREATE UNIQUE INDEX IF NOT EXISTS products_code_idx ON products(code);
CREATE INDEX IF NOT EXISTS products_name_idx ON products USING GIN (to_tsvector('simple', name));
CREATE INDEX IF NOT EXISTS sales_created_at_idx ON sales(created_at DESC);
CREATE INDEX IF NOT EXISTS credits_phone_idx ON credit_customers(phone);
`;
try { await pool.query(sql); console.log('Database tables are ready.'); }
catch (e) { console.error(e); process.exitCode = 1; }
finally { await pool.end(); }
