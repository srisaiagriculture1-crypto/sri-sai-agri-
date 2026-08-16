const express = require("express");
const router = express.Router();
const pool = require("../utils/db");
const upload = require("../utils/multerConfig");
const authenticate = require("../utils/authMiddleware");

// Get all gallery items (optional ?category= filter)
router.get("/", async (req, res) => {
  try {
    const { category } = req.query;
    let query = "SELECT * FROM gallery";
    const params = [];
    if (category) {
      query += " WHERE category = ?";
      params.push(category);
    }
    query += " ORDER BY created_at DESC";
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add gallery item (Protected)
router.post("/", authenticate, upload.single("image"), async (req, res) => {
  const { label, sub_label, category, type } = req.body;
  const image = req.file ? req.file.path.replace(/\\/g, "/") : "";
  let mediaType = type;
  if (!mediaType || mediaType === 'image') {
    if (req.file && (req.file.mimetype.startsWith('video') || /\.(mp4|webm|mov|mkv|ogg)$/i.test(req.file.originalname))) {
      mediaType = 'video';
    } else {
      mediaType = 'image';
    }
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO gallery (image, label, sub_label, category, type) VALUES (?, ?, ?, ?, ?)",
      [image, label, sub_label, category || 'general', mediaType]
    );
    const [newItem] = await pool.query("SELECT * FROM gallery WHERE id = ?", [result.insertId]);
    res.status(201).json(newItem[0]);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update gallery item (Protected)
router.put("/:id", authenticate, upload.single("image"), async (req, res) => {
  const { label, sub_label, category, type } = req.body;
  const image = req.file ? req.file.path.replace(/\\/g, "/") : undefined;
  let mediaType = type;
  if (req.file && (req.file.mimetype.startsWith('video') || /\.(mp4|webm|mov|mkv|ogg)$/i.test(req.file.originalname))) {
    mediaType = 'video';
  }

  try {
    let query = "UPDATE gallery SET label = ?, sub_label = ?, category = ?, type = ?";
    let params = [label, sub_label, category, mediaType || 'image'];

    if (image) {
      query += ", image = ?";
      params.push(image);
    }

    query += " WHERE id = ?";
    params.push(req.params.id);

    await pool.query(query, params);
    const [updatedItem] = await pool.query("SELECT * FROM gallery WHERE id = ?", [req.params.id]);
    res.json(updatedItem[0]);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete gallery item (Protected)
router.delete("/:id", authenticate, async (req, res) => {
  try {
    await pool.query("DELETE FROM gallery WHERE id = ?", [req.params.id]);
    res.json({ message: "Gallery item deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
