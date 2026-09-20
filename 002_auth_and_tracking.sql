-- Kiln & Thread — migration 002: auth + delivery tracking
-- Run after schema.sql + seed.sql:
--   psql -d kilnthread -f database/migrations/002_auth_and_tracking.sql

-- ============================================================
-- Customer login (email + password). Stripe still handles payment
-- identity separately — this is just for "view my orders".
-- ============================================================
ALTER TABLE customers ADD COLUMN password_hash TEXT;

-- ============================================================
-- ADMINS — separate table from customers on purpose. Keeping
-- staff accounts out of the customers table means a bug in the
-- storefront's signup flow can never accidentally grant admin
-- access, and the two login forms can never be confused server-side.
-- ============================================================
CREATE TABLE admins (
  id            SERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Widen the order status lifecycle to Amazon-style delivery stages.
-- ============================================================
ALTER TABLE orders DROP CONSTRAINT orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending',            -- checkout started, not yet paid
    'paid',               -- payment confirmed (== "Order Placed" to the customer)
    'processing',         -- maker is preparing the order
    'shipped',            -- handed to carrier
    'out_for_delivery',
    'delivered',
    'cancelled',
    'refunded',
    'expired'
  ));

ALTER TABLE orders ADD COLUMN tracking_number TEXT;
ALTER TABLE orders ADD COLUMN carrier TEXT;
ALTER TABLE orders ADD COLUMN estimated_delivery DATE;

-- ============================================================
-- ORDER_STATUS_HISTORY — every stage change, timestamped, with an
-- optional note. This is what powers the Amazon-style tracking
-- timeline on the customer's order page: query this table, don't
-- infer history from a single status column.
-- ============================================================
CREATE TABLE order_status_history (
  id          SERIAL PRIMARY KEY,
  order_id    INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status      TEXT NOT NULL,
  note        TEXT,
  changed_by  TEXT,              -- 'system' (webhook) or an admin's email
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_status_history_order ON order_status_history(order_id);

-- Track whether the "order placed" confirmation email has gone out,
-- so a retried webhook delivery can't double-send it.
ALTER TABLE orders ADD COLUMN confirmation_email_sent_at TIMESTAMPTZ;
