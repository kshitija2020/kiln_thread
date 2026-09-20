# Kiln & Thread — database

PostgreSQL schema for the storefront. Five tables:

```
makers ──┐
         ├──< products
categories ┘        \
                      >── order_items ──< orders ──> customers
```

- **makers** — the artisans; product pages pull maker name/bio from here.
- **categories** — Ceramics, Woven, Woodwork, Candles, Leather.
- **products** — prices stored as integer cents (never floats — avoids rounding bugs at checkout).
- **customers** — created on first checkout from the Stripe session email, no password/auth.
- **orders** / **order_items** — one row per checkout. `order_items` snapshots the product name and price at time of purchase, so a later price change or renamed product doesn't rewrite history.

## Setup

```bash
createdb kilnthread
psql -d kilnthread -f schema.sql
psql -d kilnthread -f seed.sql        # loads the current 12-product catalog
```

Hosted options if you don't want to run Postgres locally: **Supabase**, **Neon**, and **Railway** all have a free Postgres tier — create a database there, copy the connection string into `server/.env` as `DATABASE_URL`, then run the two files above against it (`psql "$DATABASE_URL" -f schema.sql`, etc.).

## How the backend uses it

- `GET /products` reads the live catalog — this replaces the old hardcoded product list in `server.js`.
- `POST /create-checkout-session` looks up prices from `products` (never trusts a price from the browser), writes a `pending` row to `orders` + `order_items`, then creates the Stripe session.
- The `/webhook` handler flips that order to `paid` once Stripe confirms, and fills in the shipping address Stripe collected.
- `GET /order-status/:sessionId` reads the order back out for your confirmation page.

## Order lifecycle

```
pending  →  paid  →  fulfilled
   ↓
expired   (checkout abandoned, Stripe session timed out)
```

Nothing currently moves an order from `paid` to `fulfilled` — that's on you to wire up once you have a packing/shipping workflow (an admin endpoint, a cron job checking a shipping API, etc.).

## Useful queries

```sql
-- Best sellers by units sold
SELECT p.name, SUM(oi.quantity) AS units_sold
FROM order_items oi
JOIN products p ON p.id = oi.product_id
JOIN orders o ON o.id = oi.order_id
WHERE o.status = 'paid'
GROUP BY p.name
ORDER BY units_sold DESC;

-- Revenue by maker
SELECT m.name, SUM(oi.unit_price_cents * oi.quantity) / 100.0 AS revenue_usd
FROM order_items oi
JOIN products p ON p.id = oi.product_id
JOIN makers m ON m.id = p.maker_id
JOIN orders o ON o.id = oi.order_id
WHERE o.status = 'paid'
GROUP BY m.name
ORDER BY revenue_usd DESC;

-- Low stock products
SELECT name, stock_qty FROM products WHERE stock_qty < 5 AND is_active = true;
```
