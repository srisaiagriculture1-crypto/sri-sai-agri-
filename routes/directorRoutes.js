const express = require("express");
const router = express.Router();
const pool = require("../utils/db");
const upload = require("../utils/multerConfig");
const authenticate = require("../utils/authMiddleware");

// Get all directors (Public)
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM directors ORDER BY order_num ASC, id ASC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add director (Protected)
router.post("/", authenticate, upload.single("image"), async (req, res) => {
  const { name, position, qualification, experience, message, order_num } = req.body;
  const image = req.file ? req.file.path.replace(/\\/g, "/") : (req.body.image || "");
  const orderNum = parseInt(order_num, 10) || 0;

  if (!name || !position) {
    return res.status(400).json({ message: "Name and Position are required" });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO directors (name, position, qualification, experience, message, image, order_num) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [name, position, qualification || "", experience || "", message || "", image, orderNum]
    );
    const [newDirector] = await pool.query("SELECT * FROM directors WHERE id = ?", [result.insertId]);
    res.status(201).json(newDirector[0]);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update director (Protected)
router.put("/:id", authenticate, upload.single("image"), async (req, res) => {
  const { name, position, qualification, experience, message, order_num } = req.body;
  const orderNum = parseInt(order_num, 10) || 0;

  const updateData = [
    name,
    position,
    qualification || "",
    experience || "",
    message || "",
    orderNum
  ];
  let query = "UPDATE directors SET name = ?, position = ?, qualification = ?, experience = ?, message = ?, order_num = ?";

  if (req.file) {
    query += ", image = ?";
    updateData.push(req.file.path.replace(/\\/g, "/"));
  }

  query += " WHERE id = ?";
  updateData.push(req.params.id);

  try {
    await pool.query(query, updateData);
    const [updatedDirector] = await pool.query("SELECT * FROM directors WHERE id = ?", [req.params.id]);
    res.json(updatedDirector[0]);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete director (Protected)
router.delete("/:id", authenticate, async (req, res) => {
  try {
    await pool.query("DELETE FROM directors WHERE id = ?", [req.params.id]);
    res.json({ message: "Director deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
