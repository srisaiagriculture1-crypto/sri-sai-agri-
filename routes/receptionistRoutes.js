const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const pool = require("../utils/db");
const authenticate = require("../utils/authMiddleware");

// Ensure receptionists table exists
const ensureReceptionistsTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS receptionists (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (err) {
    console.error("ensureReceptionistsTable error:", err.message);
  }
};

// Receptionist Login (by Email or Username)
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Email / Username and password are required" });
  }

  const cleanUser = username.trim().toLowerCase();
  const cleanPass = password.trim();

  try {
    await ensureReceptionistsTable();

    // 1. Check in database
    const [rows] = await pool.query(
      "SELECT * FROM receptionists WHERE LOWER(username) = ?",
      [cleanUser]
    );

    let authenticated = false;
    let receptionistData = null;

    if (rows.length > 0) {
      const user = rows[0];
      const isMatch = await bcrypt.compare(cleanPass, user.password).catch(() => false);
      if (isMatch || cleanPass === user.password) {
        authenticated = true;
        receptionistData = user;
      }
    }

    // 2. Fallback to ENV credentials
    const expectedUsername = (process.env.RECEPTIONIST_USERNAME || "srisai2026").trim().toLowerCase();
    const expectedPassword = (process.env.RECEPTIONIST_PASSWORD || "srisai@2026").trim();
    if (!authenticated && cleanUser === expectedUsername && cleanPass === expectedPassword) {
      authenticated = true;
      receptionistData = { id: "receptionist", name: "Front Desk Receptionist", username: expectedUsername };
    }

    if (authenticated && receptionistData) {
      const secret = process.env.JWT_SECRET || "srisai_secret_key_123";
      const token = jwt.sign(
        { id: receptionistData.id, username: receptionistData.username, role: "receptionist" },
        secret,
        { expiresIn: "24h" }
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Lax",
        path: "/",
        maxAge: 24 * 60 * 60 * 1000
      });

      return res.json({
        message: "Login successful",
        token,
        user: { id: receptionistData.id, name: receptionistData.name, username: receptionistData.username }
      });
    }

    return res.status(401).json({ message: "Invalid email / username or password" });
  } catch (err) {
    console.error("Receptionist login error:", err);
    return res.status(500).json({ message: "Login service error: " + err.message });
  }
});

// Receptionist Logout
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
});

// Check Receptionist Auth
router.get("/auth", (req, res) => {
  const token = req.cookies.token || (req.headers.authorization ? req.headers.authorization.split(" ")[1] : null);
  if (!token) return res.status(401).json({ authenticated: false });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "srisai_secret_key_123");
    if (decoded.role === "receptionist" || decoded.id) {
      return res.json({ authenticated: true, user: decoded });
    }
    return res.status(401).json({ authenticated: false });
  } catch (err) {
    res.status(401).json({ authenticated: false });
  }
});

// ─────────────────────────────────────────────────────────────
// SUPER ADMIN MANAGEMENT ENDPOINTS (PROTECTED)
// ─────────────────────────────────────────────────────────────

// Get all receptionist accounts
router.get("/admin/list", authenticate, async (req, res) => {
  try {
    await ensureReceptionistsTable();
    const [rows] = await pool.query(
      "SELECT id, name, username, status, created_at FROM receptionists ORDER BY id ASC"
    );
    res.json(rows);
  } catch (err) {
    console.error("GET /api/receptionist/admin/list error:", err);
    res.status(500).json({ message: err.message });
  }
});

// Create new receptionist account (Name, Email, Password)
router.post("/admin/create", authenticate, async (req, res) => {
  const { name, email, username, password } = req.body;
  const loginEmail = (email || username || "").trim().toLowerCase();

  if (!name || !loginEmail || !password) {
    return res.status(400).json({ message: "Name, Email, and Password are required" });
  }

  try {
    await ensureReceptionistsTable();

    // Check if email/username already taken
    const [existing] = await pool.query(
      "SELECT id FROM receptionists WHERE LOWER(username) = ?",
      [loginEmail]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: "An account with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password.trim(), 10);
    const [result] = await pool.query(
      "INSERT INTO receptionists (name, username, password, status) VALUES (?, ?, ?, 'Active')",
      [name.trim(), loginEmail, hashedPassword]
    );

    const [created] = await pool.query(
      "SELECT id, name, username, status, created_at FROM receptionists WHERE id = ?",
      [result.insertId]
    );
    res.status(201).json({ message: "Receptionist account created successfully", account: created[0] });
  } catch (err) {
    console.error("POST /api/receptionist/admin/create error:", err);
    res.status(400).json({ message: err.message });
  }
});

// Update receptionist account
router.put("/admin/update/:id", authenticate, async (req, res) => {
  const { name, email, username, password } = req.body;
  const loginEmail = (email || username || "").trim().toLowerCase();
  const { id } = req.params;

  try {
    await ensureReceptionistsTable();

    if (loginEmail) {
      const [existing] = await pool.query(
        "SELECT id FROM receptionists WHERE LOWER(username) = ? AND id != ?",
        [loginEmail, id]
      );
      if (existing.length > 0) {
        return res.status(400).json({ message: "Email already in use by another account." });
      }
    }

    const updateFields = [];
    const updateValues = [];

    if (name) { updateFields.push("name = ?"); updateValues.push(name.trim()); }
    if (loginEmail) { updateFields.push("username = ?"); updateValues.push(loginEmail); }
    if (password && password.trim().length > 0) {
      const hashed = await bcrypt.hash(password.trim(), 10);
      updateFields.push("password = ?");
      updateValues.push(hashed);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: "No changes provided to update" });
    }

    updateValues.push(id);
    await pool.query(`UPDATE receptionists SET ${updateFields.join(", ")} WHERE id = ?`, updateValues);

    const [updated] = await pool.query(
      "SELECT id, name, username, status, created_at FROM receptionists WHERE id = ?",
      [id]
    );
    res.json({ message: "Receptionist account updated successfully", account: updated[0] });
  } catch (err) {
    console.error("PUT /api/receptionist/admin/update error:", err);
    res.status(400).json({ message: err.message });
  }
});

// Delete receptionist account
router.delete("/admin/delete/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    await ensureReceptionistsTable();
    await pool.query("DELETE FROM receptionists WHERE id = ?", [id]);
    res.json({ message: "Receptionist account deleted successfully" });
  } catch (err) {
    console.error("DELETE /api/receptionist/admin/delete error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
