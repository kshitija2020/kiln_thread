// server/auth.js
// Password hashing + JWT helpers, and Express middleware that protects
// customer and admin routes. Two separate token "kinds" (customer/admin)
// so a customer token can never be replayed against an admin route.

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "kiln_thread_local_secure_jwt_token_2026_dev_key";
if (!process.env.JWT_SECRET) {
  console.warn("WARNING: JWT_SECRET is not set in .env. Using development fallback secret.");
}

function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

function issueToken(payload, kind) {
  return jwt.sign({ ...payload, kind }, JWT_SECRET, { expiresIn: "7d" });
}

// Reads "Authorization: Bearer <token>", verifies it, and requires
// token.kind to match what the route expects ('customer' or 'admin').
function requireAuth(kind) {
  return (req, res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Not signed in." });

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.kind !== kind) {
        return res.status(403).json({ error: "Not authorized for this area." });
      }
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ error: "Session expired, please sign in again." });
    }
  };
}

module.exports = {
  hashPassword,
  verifyPassword,
  issueToken,
  requireCustomer: requireAuth("customer"),
  requireAdmin: requireAuth("admin"),
};
