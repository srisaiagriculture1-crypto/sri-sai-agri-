const express = require("express");
const router = express.Router();
const pool = require("../utils/db");
const upload = require("../utils/multerConfig");
const authenticate = require("../utils/authMiddleware");

// Ensure directors table exists
const ensureDirectorsTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS directors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        position VARCHAR(255) NOT NULL,
        image VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (err) {
    console.error("ensureDirectorsTable error:", err.message);
  }
};

// Get all directors (Public)
router.get("/", async (req, res) => {
  try {
    await ensureDirectorsTable();
    const [rows] = await pool.query("SELECT * FROM directors ORDER BY id ASC");
    res.json(rows);
  } catch (err) {
    console.error("GET /api/directors error:", err);
    res.status(500).json({ message: err.message });
  }
});

// Add director (Protected)
router.post("/", authenticate, upload.single("image"), async (req, res) => {
  try {
    await ensureDirectorsTable();
    const { name, position } = req.body;
    const image = req.file ? req.file.path.replace(/\\/g, "/") : (req.body.image || "");

    if (!name || !position) {
      return res.status(400).json({ message: "Name and Position are required" });
    }

    const [result] = await pool.query(
      "INSERT INTO directors (name, position, image) VALUES (?, ?, ?)",
      [name.trim(), position.trim(), image]
    );

    const [newDirector] = await pool.query("SELECT * FROM directors WHERE id = ?", [result.insertId]);
    res.status(201).json(newDirector[0]);
  } catch (err) {
    console.error("POST /api/directors error:", err);
    res.status(400).json({ message: err.message });
  }
});

// Update director (Protected)
router.put("/:id", authenticate, upload.single("image"), async (req, res) => {
  try {
    await ensureDirectorsTable();
    const { name, position } = req.body;
    const updateData = [name ? name.trim() : "", position ? position.trim() : ""];
    let query = "UPDATE directors SET name = ?, position = ?";

    if (req.file) {
      query += ", image = ?";
      updateData.push(req.file.path.replace(/\\/g, "/"));
    }

    query += " WHERE id = ?";
    updateData.push(req.params.id);

    await pool.query(query, updateData);
    const [updatedDirector] = await pool.query("SELECT * FROM directors WHERE id = ?", [req.params.id]);
    res.json(updatedDirector[0]);
  } catch (err) {
    console.error("PUT /api/directors/:id error:", err);
    res.status(400).json({ message: err.message });
  }
});

// Delete director (Protected)
router.delete("/:id", authenticate, async (req, res) => {
  try {
    await ensureDirectorsTable();
    await pool.query("DELETE FROM directors WHERE id = ?", [req.params.id]);
    res.json({ message: "Director deleted successfully" });
  } catch (err) {
    console.error("DELETE /api/directors/:id error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
