--
-- PostgreSQL database dump
--

\restrict 25Da6QCNo6zufc3zsAlLGMVbLM4euNx9DGLwSd6yfWfh2eY0lcfdxoFeTHHleTQ

-- Dumped from database version 16.15
-- Dumped by pg_dump version 16.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.sale_items DROP CONSTRAINT IF EXISTS sale_items_sale_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sale_items DROP CONSTRAINT IF EXISTS sale_items_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS products_category_id_fkey;
ALTER TABLE IF EXISTS ONLY public.credit_payments DROP CONSTRAINT IF EXISTS credit_payments_credit_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.credit_customers DROP CONSTRAINT IF EXISTS credit_customers_sale_id_fkey;
DROP INDEX IF EXISTS public.sales_created_at_idx;
DROP INDEX IF EXISTS public.products_name_idx;
DROP INDEX IF EXISTS public.products_code_idx;
DROP INDEX IF EXISTS public.credits_phone_idx;
ALTER TABLE IF EXISTS ONLY public.watercan_customers DROP CONSTRAINT IF EXISTS watercan_customers_pkey;
ALTER TABLE IF EXISTS ONLY public.sales DROP CONSTRAINT IF EXISTS sales_pkey;
ALTER TABLE IF EXISTS ONLY public.sales DROP CONSTRAINT IF EXISTS sales_invoice_no_key;
ALTER TABLE IF EXISTS ONLY public.sale_items DROP CONSTRAINT IF EXISTS sale_items_pkey;
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS products_sku_key;
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS products_pkey;
ALTER TABLE IF EXISTS ONLY public.credit_payments DROP CONSTRAINT IF EXISTS credit_payments_pkey;
ALTER TABLE IF EXISTS ONLY public.credit_customers DROP CONSTRAINT IF EXISTS credit_customers_pkey;
ALTER TABLE IF EXISTS ONLY public.categories DROP CONSTRAINT IF EXISTS categories_pkey;
ALTER TABLE IF EXISTS ONLY public.categories DROP CONSTRAINT IF EXISTS categories_name_key;
ALTER TABLE IF EXISTS ONLY public.admins DROP CONSTRAINT IF EXISTS admins_pkey;
ALTER TABLE IF EXISTS ONLY public.admins DROP CONSTRAINT IF EXISTS admins_email_key;
ALTER TABLE IF EXISTS public.watercan_customers ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.sales ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.sale_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.products ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.credit_payments ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.credit_customers ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.categories ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.admins ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.watercan_customers_id_seq;
DROP TABLE IF EXISTS public.watercan_customers;
DROP SEQUENCE IF EXISTS public.sales_id_seq;
DROP TABLE IF EXISTS public.sales;
DROP SEQUENCE IF EXISTS public.sale_items_id_seq;
DROP TABLE IF EXISTS public.sale_items;
DROP SEQUENCE IF EXISTS public.products_id_seq;
DROP TABLE IF EXISTS public.products;
DROP SEQUENCE IF EXISTS public.product_code_seq;
DROP SEQUENCE IF EXISTS public.credit_payments_id_seq;
DROP TABLE IF EXISTS public.credit_payments;
DROP SEQUENCE IF EXISTS public.credit_customers_id_seq;
DROP TABLE IF EXISTS public.credit_customers;
DROP SEQUENCE IF EXISTS public.categories_id_seq;
DROP TABLE IF EXISTS public.categories;
DROP SEQUENCE IF EXISTS public.admins_id_seq;
DROP TABLE IF EXISTS public.admins;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admins (
    id bigint NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.admins OWNER TO postgres;

--
-- Name: admins_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admins_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admins_id_seq OWNER TO postgres;

--
-- Name: admins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admins_id_seq OWNED BY public.admins.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id bigint NOT NULL,
    name text NOT NULL,
    description text DEFAULT ''::text,
    icon text DEFAULT ''::text,
    color text DEFAULT 'blue'::text NOT NULL,
    is_service boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: credit_customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.credit_customers (
    id bigint NOT NULL,
    name text NOT NULL,
    phone text DEFAULT ''::text,
    items text DEFAULT ''::text,
    total_amount numeric(12,2) NOT NULL,
    paid_amount numeric(12,2) DEFAULT 0 NOT NULL,
    balance_amount numeric(12,2) DEFAULT 0 NOT NULL,
    due_date date,
    status text DEFAULT 'Pending'::text NOT NULL,
    notes text DEFAULT ''::text,
    sale_id bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT credit_customers_balance_amount_check CHECK ((balance_amount >= (0)::numeric)),
    CONSTRAINT credit_customers_paid_amount_check CHECK ((paid_amount >= (0)::numeric)),
    CONSTRAINT credit_customers_status_check CHECK ((status = ANY (ARRAY['Pending'::text, 'Cleared'::text, 'Overdue'::text]))),
    CONSTRAINT credit_customers_total_amount_check CHECK ((total_amount >= (0)::numeric))
);


ALTER TABLE public.credit_customers OWNER TO postgres;

--
-- Name: credit_customers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.credit_customers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.credit_customers_id_seq OWNER TO postgres;

--
-- Name: credit_customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.credit_customers_id_seq OWNED BY public.credit_customers.id;


--
-- Name: credit_payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.credit_payments (
    id bigint NOT NULL,
    credit_customer_id bigint NOT NULL,
    amount numeric(12,2) NOT NULL,
    payment_mode text DEFAULT 'Cash'::text NOT NULL,
    notes text DEFAULT ''::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT credit_payments_amount_check CHECK ((amount > (0)::numeric))
);


ALTER TABLE public.credit_payments OWNER TO postgres;

--
-- Name: credit_payments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.credit_payments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.credit_payments_id_seq OWNER TO postgres;

--
-- Name: credit_payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.credit_payments_id_seq OWNED BY public.credit_payments.id;


--
-- Name: product_code_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.product_code_seq
    START WITH 101
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_code_seq OWNER TO postgres;

--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id bigint NOT NULL,
    sku text,
    name text NOT NULL,
    category_id bigint,
    category_name text DEFAULT ''::text NOT NULL,
    price numeric(12,2) NOT NULL,
    cost_price numeric(12,2) DEFAULT 0 NOT NULL,
    stock integer DEFAULT 0 NOT NULL,
    low_stock_threshold integer DEFAULT 5 NOT NULL,
    unit text DEFAULT 'pcs'::text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    code integer DEFAULT nextval('public.product_code_seq'::regclass),
    CONSTRAINT products_cost_price_check CHECK ((cost_price >= (0)::numeric)),
    CONSTRAINT products_low_stock_threshold_check CHECK ((low_stock_threshold >= 0)),
    CONSTRAINT products_price_check CHECK ((price >= (0)::numeric)),
    CONSTRAINT products_stock_check CHECK ((stock >= 0))
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.products_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.products_id_seq OWNER TO postgres;

--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: sale_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sale_items (
    id bigint NOT NULL,
    sale_id bigint NOT NULL,
    product_id bigint,
    product_name text NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    line_total numeric(12,2) NOT NULL,
    CONSTRAINT sale_items_line_total_check CHECK ((line_total >= (0)::numeric)),
    CONSTRAINT sale_items_quantity_check CHECK ((quantity > 0)),
    CONSTRAINT sale_items_unit_price_check CHECK ((unit_price >= (0)::numeric))
);


ALTER TABLE public.sale_items OWNER TO postgres;

--
-- Name: sale_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sale_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sale_items_id_seq OWNER TO postgres;

--
-- Name: sale_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sale_items_id_seq OWNED BY public.sale_items.id;


--
-- Name: sales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sales (
    id bigint NOT NULL,
    invoice_no text NOT NULL,
    customer_name text DEFAULT 'Walk-in Customer'::text NOT NULL,
    customer_phone text DEFAULT ''::text,
    subtotal numeric(12,2) NOT NULL,
    discount numeric(12,2) DEFAULT 0 NOT NULL,
    fee numeric(12,2) DEFAULT 0 NOT NULL,
    total_amount numeric(12,2) NOT NULL,
    payment_mode text NOT NULL,
    payment_status text DEFAULT 'Paid'::text NOT NULL,
    notes text DEFAULT ''::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT sales_discount_check CHECK ((discount >= (0)::numeric)),
    CONSTRAINT sales_payment_mode_check CHECK ((payment_mode = ANY (ARRAY['Cash'::text, 'UPI'::text, 'Card'::text, 'Credit'::text, 'Other'::text]))),
    CONSTRAINT sales_payment_status_check CHECK ((payment_status = ANY (ARRAY['Paid'::text, 'Pending'::text, 'Partial'::text, 'Cancelled'::text]))),
    CONSTRAINT sales_subtotal_check CHECK ((subtotal >= (0)::numeric)),
    CONSTRAINT sales_total_amount_check CHECK ((total_amount >= (0)::numeric))
);


ALTER TABLE public.sales OWNER TO postgres;

--
-- Name: sales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sales_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sales_id_seq OWNER TO postgres;

--
-- Name: sales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sales_id_seq OWNED BY public.sales.id;


--
-- Name: watercan_customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.watercan_customers (
    id bigint NOT NULL,
    name text NOT NULL,
    phone text DEFAULT ''::text,
    address text DEFAULT ''::text,
    advance_amount numeric(12,2) DEFAULT 0 NOT NULL,
    cans_held integer DEFAULT 0 NOT NULL,
    deliveries_count integer DEFAULT 0 NOT NULL,
    due_amount numeric(12,2) DEFAULT 0 NOT NULL,
    payment_status text DEFAULT 'Pending'::text NOT NULL,
    last_delivery timestamp with time zone,
    notes text DEFAULT ''::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.watercan_customers OWNER TO postgres;

--
-- Name: watercan_customers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.watercan_customers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.watercan_customers_id_seq OWNER TO postgres;

--
-- Name: watercan_customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.watercan_customers_id_seq OWNED BY public.watercan_customers.id;


--
-- Name: admins id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins ALTER COLUMN id SET DEFAULT nextval('public.admins_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: credit_customers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.credit_customers ALTER COLUMN id SET DEFAULT nextval('public.credit_customers_id_seq'::regclass);


--
-- Name: credit_payments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.credit_payments ALTER COLUMN id SET DEFAULT nextval('public.credit_payments_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: sale_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sale_items ALTER COLUMN id SET DEFAULT nextval('public.sale_items_id_seq'::regclass);


--
-- Name: sales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales ALTER COLUMN id SET DEFAULT nextval('public.sales_id_seq'::regclass);


--
-- Name: watercan_customers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.watercan_customers ALTER COLUMN id SET DEFAULT nextval('public.watercan_customers_id_seq'::regclass);


--
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admins (id, name, email, password_hash, created_at) FROM stdin;
1	Hari	sunmadhistore@gmail.com	$2a$12$CZzTrsuGZBmjmHK08mCAzeJbdv7n2bGhCLGwJvz0nN73xL0hKACRO	2026-10-28 10:04:42.233897+00
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, name, description, icon, color, is_service, created_at) FROM stdin;
1	Clothes	Readymade, Sarees & Textiles	👕	blue	f	2026-10-28 10:04:56.18366+00
2	Cosmetics	Skincare, Haircare & Makeup	💄	pink	f	2026-10-28 10:04:56.192621+00
3	Fancy Store	Bangles, Gifts & Accessories	💍	purple	f	2026-10-28 10:04:56.201799+00
4	Electrical & Electronics	Bulbs, Wires, Chargers & Cables	🔌	orange	f	2026-10-28 10:04:56.212149+00
5	Watercan Supply	20L Water Can Delivery & Refills	💧	cyan	f	2026-10-28 10:04:56.221695+00
6	Recharge	Mobile (Jio, Airtel, Vi) & DTH	⚡	emerald	t	2026-10-28 10:04:56.230349+00
7	Money Transfer	Domestic Bank Transfer & UPI	💸	teal	t	2026-10-28 10:04:56.239756+00
\.


--
-- Data for Name: credit_customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.credit_customers (id, name, phone, items, total_amount, paid_amount, balance_amount, due_date, status, notes, sale_id, created_at) FROM stdin;
\.


--
-- Data for Name: credit_payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.credit_payments (id, credit_customer_id, amount, payment_mode, notes, created_at) FROM stdin;
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, sku, name, category_id, category_name, price, cost_price, stock, low_stock_threshold, unit, active, created_at, updated_at, code) FROM stdin;
\.


--
-- Data for Name: sale_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sale_items (id, sale_id, product_id, product_name, quantity, unit_price, line_total) FROM stdin;
\.


--
-- Data for Name: sales; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sales (id, invoice_no, customer_name, customer_phone, subtotal, discount, fee, total_amount, payment_mode, payment_status, notes, created_at) FROM stdin;
\.


--
-- Data for Name: watercan_customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.watercan_customers (id, name, phone, address, advance_amount, cans_held, deliveries_count, due_amount, payment_status, last_delivery, notes, created_at) FROM stdin;
\.


--
-- Name: admins_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admins_id_seq', 1, true);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 7, true);


--
-- Name: credit_customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.credit_customers_id_seq', 1, false);


--
-- Name: credit_payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.credit_payments_id_seq', 1, false);


--
-- Name: product_code_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.product_code_seq', 101, false);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.products_id_seq', 1, false);


--
-- Name: sale_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sale_items_id_seq', 1, false);


--
-- Name: sales_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sales_id_seq', 1, false);


--
-- Name: watercan_customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.watercan_customers_id_seq', 1, false);


--
-- Name: admins admins_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_email_key UNIQUE (email);


--
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);


--
-- Name: categories categories_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: credit_customers credit_customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.credit_customers
    ADD CONSTRAINT credit_customers_pkey PRIMARY KEY (id);


--
-- Name: credit_payments credit_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.credit_payments
    ADD CONSTRAINT credit_payments_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: products products_sku_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key UNIQUE (sku);


--
-- Name: sale_items sale_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_pkey PRIMARY KEY (id);


--
-- Name: sales sales_invoice_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_invoice_no_key UNIQUE (invoice_no);


--
-- Name: sales sales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_pkey PRIMARY KEY (id);


--
-- Name: watercan_customers watercan_customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.watercan_customers
    ADD CONSTRAINT watercan_customers_pkey PRIMARY KEY (id);


--
-- Name: credits_phone_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX credits_phone_idx ON public.credit_customers USING btree (phone);


--
-- Name: products_code_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX products_code_idx ON public.products USING btree (code);


--
-- Name: products_name_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX products_name_idx ON public.products USING gin (to_tsvector('simple'::regconfig, name));


--
-- Name: sales_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sales_created_at_idx ON public.sales USING btree (created_at DESC);


--
-- Name: credit_customers credit_customers_sale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.credit_customers
    ADD CONSTRAINT credit_customers_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE SET NULL;


--
-- Name: credit_payments credit_payments_credit_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.credit_payments
    ADD CONSTRAINT credit_payments_credit_customer_id_fkey FOREIGN KEY (credit_customer_id) REFERENCES public.credit_customers(id);


--
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: sale_items sale_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;


--
-- Name: sale_items sale_items_sale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 25Da6QCNo6zufc3zsAlLGMVbLM4euNx9DGLwSd6yfWfh2eY0lcfdxoFeTHHleTQ

