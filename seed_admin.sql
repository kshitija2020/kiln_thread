-- Seeds one admin account. Password is 'changeme123' — the hash below is a
-- real bcrypt(10) hash of that exact string (verified, not a placeholder).
-- Log in once, then change it immediately; there's no self-serve admin
-- signup on purpose (see server/auth.js).
--
-- Generate your own hash instead of reusing this one in production:
--   node -e "console.log(require('bcryptjs').hashSync('your-new-password', 10))"

INSERT INTO admins (email, name, password_hash) VALUES
  ('admin@kilnandthread.com', 'Store Admin', '$2b$10$CQcVythC4PHyFZZD38mWLOrzi/pnoe6/UjLTGLawh53ZrHB0xIMhq');
