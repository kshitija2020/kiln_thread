-- Kiln & Thread — database schema (PostgreSQL)
-- Run with: psql -U youruser -d kilnthread -f schema.sql

-- ============================================================
-- MAKERS — the independent artisans behind each product
-- ============================================================
CREATE TABLE makers (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  bio           TEXT,
  location      TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- CATEGORIES — Ceramics, Woven, Woodwork, Candles, Leather...
-- ============================================================
CREATE TABLE categories (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL UNIQUE,
  slug          TEXT NOT NULL UNIQUE
);

-- ============================================================
-- PRODUCTS
-- Prices are stored in cents (integer) to avoid float rounding
-- errors — the classic mistake in any commerce schema.
-- ============================================================
CREATE TABLE products (
  id            SERIAL PRIMARY KEY,
  slug          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  maker_id      INTEGER NOT NULL REFERENCES makers(id),
  category_id   INTEGER NOT NULL REFERENCES categories(id),
  price_cents   INTEGER NOT NULL CHECK (price_cents > 0),
  material      TEXT,
  description   TEXT,
  maker_quote   TEXT,
  photo_url     TEXT,
  stock_qty     INTEGER NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_maker ON products(maker_id);
CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = true;

-- ============================================================
-- CUSTOMERS
-- Populated on first checkout — no account/password required,
-- Stripe handles payment identity. Add auth fields later if you
-- want accounts.
-- ============================================================
CREATE TABLE customers (
  id            SERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- ORDERS
-- One row per checkout attempt. status moves:
--   pending -> paid -> fulfilled            (happy path)
--   pending -> expired                      (checkout abandoned)
--   paid -> refunded                        (after the fact)
-- stripe_session_id lets the webhook find the right row to update.
-- ============================================================
CREATE TABLE orders (
  id                  SERIAL PRIMARY KEY,
  order_number        TEXT NOT NULL UNIQUE,           -- e.g. 'KT-482913', shown to the customer
  customer_id         INTEGER REFERENCES customers(id),
  stripe_session_id   TEXT UNIQUE,
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','paid','fulfilled','expired','refunded','cancelled')),
  subtotal_cents      INTEGER NOT NULL,
  shipping_cents      INTEGER NOT NULL DEFAULT 0,
  total_cents         INTEGER NOT NULL,
  shipping_name       TEXT,
  shipping_address    TEXT,
  shipping_city       TEXT,
  shipping_state      TEXT,
  shipping_zip        TEXT,
  shipping_country    TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at             TIMESTAMPTZ,
  fulfilled_at        TIMESTAMPTZ
);

CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_stripe_session ON orders(stripe_session_id);

-- ============================================================
-- ORDER_ITEMS
-- Snapshots product name/price at time of purchase — if you
-- change a product's price next month, past orders must still
-- show what the customer actually paid.
-- ============================================================
CREATE TABLE order_items (
  id                SERIAL PRIMARY KEY,
  order_id          INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id        INTEGER REFERENCES products(id),
  product_name      TEXT NOT NULL,        -- snapshot, survives product renames/deletion
  unit_price_cents  INTEGER NOT NULL,     -- snapshot, survives price changes
  quantity          INTEGER NOT NULL CHECK (quantity > 0)
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- ============================================================
-- Keep updated_at current on products
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
