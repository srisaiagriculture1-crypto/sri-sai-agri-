const express = require("express");
const router = express.Router();
const pool = require("../utils/db");
const upload = require("../utils/multerConfig");
const authenticate = require("../utils/authMiddleware");

// Get all faculty
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM faculty ORDER BY id ASC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add faculty (Protected)
router.post("/", authenticate, upload.single("image"), async (req, res) => {
  const { name, initials, department, experience, category } = req.body;
  const image = req.file ? req.file.path.replace(/\\/g, "/") : "";
  const cat = category || department || "";
  const init = initials || (name ? name.split(" ").filter(Boolean).map(n => n[0]).join("").substring(0, 2).toUpperCase() : "FC");

  try {
    const [result] = await pool.query(
      "INSERT INTO faculty (name, initials, department, experience, category, image) VALUES (?, ?, ?, ?, ?, ?)",
      [name, init, department, experience, cat, image]
    );
    const [newFaculty] = await pool.query("SELECT * FROM faculty WHERE id = ?", [result.insertId]);
    res.status(201).json(newFaculty[0]);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update faculty (Protected)
router.put("/:id", authenticate, upload.single("image"), async (req, res) => {
  const { name, initials, department, experience, category } = req.body;
  const cat = category || department || "";
  const init = initials || (name ? name.split(" ").filter(Boolean).map(n => n[0]).join("").substring(0, 2).toUpperCase() : "FC");
  const updateData = [name, init, department, experience, cat];
  let query = "UPDATE faculty SET name = ?, initials = ?, department = ?, experience = ?, category = ?";

  if (req.file) {
    query += ", image = ?";
    updateData.push(req.file.path.replace(/\\/g, "/"));
  }

  query += " WHERE id = ?";
  updateData.push(req.params.id);

  try {
    await pool.query(query, updateData);
    const [updatedFaculty] = await pool.query("SELECT * FROM faculty WHERE id = ?", [req.params.id]);
    res.json(updatedFaculty[0]);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete faculty (Protected)
router.delete("/:id", authenticate, async (req, res) => {
  try {
    await pool.query("DELETE FROM faculty WHERE id = ?", [req.params.id]);
    res.json({ message: "Faculty member deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
