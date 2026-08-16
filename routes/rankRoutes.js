const express = require("express");
const router = express.Router();
const pool = require("../utils/db");
const upload = require("../utils/multerConfig");
const authenticate = require("../utils/authMiddleware");

// Get all ranks
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM ranks ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create rank (Protected)
router.post("/", authenticate, upload.single("image"), async (req, res) => {
  const { studentName, student_name, name, hallTicketNumber, hall_ticket_number, rank, exam, stream, year } = req.body;
  const sName = studentName || student_name || name || "";
  const htNo = hallTicketNumber || hall_ticket_number || "";
  const image = req.file ? req.file.path.replace(/\\/g, "/") : "";

  try {
    const [result] = await pool.query(
      "INSERT INTO ranks (student_name, hall_ticket_number, rank, exam, stream, year, image) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [sName, htNo, rank, exam, stream || "Agri Science", parseInt(year) || new Date().getFullYear(), image]
    );
    const [newRank] = await pool.query("SELECT * FROM ranks WHERE id = ?", [result.insertId]);
    res.status(201).json(newRank[0]);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete rank (Protected)
router.delete("/:id", authenticate, async (req, res) => {
  try {
    await pool.query("DELETE FROM ranks WHERE id = ?", [req.params.id]);
    res.json({ message: "Rank deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update rank (Protected)
router.put("/:id", authenticate, upload.single("image"), async (req, res) => {
  const { studentName, student_name, name, hallTicketNumber, hall_ticket_number, rank, exam, stream, year } = req.body;
  const sName = studentName || student_name || name || "";
  const htNo = hallTicketNumber || hall_ticket_number || "";
  const yr = parseInt(year) || new Date().getFullYear();
  const updateData = [sName, htNo, rank, exam, stream || "Agri Science", yr];
  let query = "UPDATE ranks SET student_name = ?, hall_ticket_number = ?, rank = ?, exam = ?, stream = ?, year = ?";

  if (req.file) {
    query += ", image = ?";
    updateData.push(req.file.path.replace(/\\/g, "/"));
  }

  query += " WHERE id = ?";
  updateData.push(req.params.id);

  try {
    await pool.query(query, updateData);
    const [updatedRank] = await pool.query("SELECT * FROM ranks WHERE id = ?", [req.params.id]);
    res.json(updatedRank[0]);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
