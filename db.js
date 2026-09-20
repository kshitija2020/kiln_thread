// database/db.js
// Thin wrapper around a pg connection pool. Import this from server.js
// instead of talking to `pg` directly, so connection settings live in one place.

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // e.g. postgres://user:password@localhost:5432/kilnthread
  ssl: process.env.DATABASE_URL?.includes('localhost')
    ? false
    : { rejectUnauthorized: false }, // most hosted Postgres (Render, Railway, Supabase) needs this
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
