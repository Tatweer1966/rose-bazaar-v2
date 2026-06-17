const pg = require("pg");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const { Pool } = pg;
const pool = new Pool({
  host: process.env.DB_HOST || "rose-db-v2",
  port: parseInt(process.env.DB_PORT || "5432"),
  user: process.env.DB_USER || "rosebazaar",
  password: process.env.DB_PASSWORD || "RoseBazaar@2025",
  database: process.env.DB_NAME || "rose_bazaar_v2",
});

const JWT_SECRET = process.env.JWT_SECRET || "rose-bazaar-admin-secret-2025";
const JWT_EXPIRES = "24h";

async function loginAdmin(request, reply) {
  const { email, password } = request.body || {};
  if (!email || !password) {
    return reply.code(400).send({ error: "Email and password are required" });
  }

  try {
    const result = await pool.query(
      "SELECT id, email, name, role, password_hash FROM cms_admins WHERE email = $1 AND is_active = true",
      [email]
    );
    const admin = result.rows[0];
    if (!admin) {
      return reply.code(401).send({ error: "Invalid email or password" });
    }

    let validPassword = false;
    if (admin.password_hash) {
      validPassword = await bcrypt.compare(password, admin.password_hash);
    } else {
      // First login — accept "admin123" as default, then hash it
      if (password === "admin123") {
        validPassword = true;
        const hash = await bcrypt.hash(password, 12);
        await pool.query("UPDATE cms_admins SET password_hash = $1 WHERE id = $2", [hash, admin.id]);
      }
    }

    if (!validPassword) {
      return reply.code(401).send({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    await pool.query(
      "INSERT INTO cms_audit_log (admin_id, action, entity_type, details) VALUES ($1, $2, $3, $4)",
      [admin.id, "login", "admin", JSON.stringify({ ip: request.ip })]
    );

    return reply.send({
      token,
      user: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
    });
  } catch (err) {
    request.log.error(err, "Login error");
    return reply.code(500).send({ error: "Internal server error" });
  }
}

async function getMe(request, reply) {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return reply.code(401).send({ error: "Not authenticated" });
  }

  try {
    const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET);
    const result = await pool.query(
      "SELECT id, email, name, role FROM cms_admins WHERE id = $1 AND is_active = true",
      [decoded.id]
    );
    if (!result.rows[0]) return reply.code(401).send({ error: "User not found" });
    return reply.send({ user: result.rows[0] });
  } catch (err) {
    return reply.code(401).send({ error: "Invalid token" });
  }
}

async function changePassword(request, reply) {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return reply.code(401).send({ error: "Not authenticated" });
  }

  const { current_password, new_password } = request.body || {};
  if (!current_password || !new_password) {
    return reply.code(400).send({ error: "Current and new password required" });
  }
  if (new_password.length < 6) {
    return reply.code(400).send({ error: "Password must be at least 6 characters" });
  }

  try {
    const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET);
    const result = await pool.query(
      "SELECT id, password_hash FROM cms_admins WHERE id = $1",
      [decoded.id]
    );
    const admin = result.rows[0];
    if (!admin) return reply.code(404).send({ error: "User not found" });

    const valid = admin.password_hash
      ? await bcrypt.compare(current_password, admin.password_hash)
      : current_password === "admin123";

    if (!valid) return reply.code(401).send({ error: "Current password is incorrect" });

    const hash = await bcrypt.hash(new_password, 12);
    await pool.query("UPDATE cms_admins SET password_hash = $1 WHERE id = $2", [hash, admin.id]);

    return reply.send({ success: true, message: "Password updated" });
  } catch (err) {
    return reply.code(500).send({ error: "Internal server error" });
  }
}

module.exports = { loginAdmin, getMe, changePassword };
