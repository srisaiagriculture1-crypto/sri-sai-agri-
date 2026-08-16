const express = require("express");
const router = express.Router();
const pool = require("../utils/db");
const authenticate = require("../utils/authMiddleware");

// PUBLIC: Submit enquiry
router.post("/", async (req, res) => {
  const { studentName, parentName, mobile, email, stream, batch, message, student_name, parent_name } = req.body;

  const sName = studentName || student_name || "Prospective Student";
  const pName = parentName || parent_name || "";

  try {
    const [result] = await pool.query(
      `INSERT INTO enquiries (student_name, parent_name, mobile, email, stream, batch, message, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'New')`,
      [sName, pName, mobile, email, stream, batch, message]
    );
    res.status(201).json({ message: "Enquiry submitted successfully", id: result.insertId });
  } catch (err) {
    console.error("Submit enquiry error:", err);
    res.status(400).json({ message: "Failed to submit enquiry", error: err.message });
  }
});

// ADMIN: Get all enquiries
router.get("/", authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM enquiries ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) {
    console.error("Get enquiries error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ADMIN: Update enquiry status / notes
router.put("/:id/status", authenticate, async (req, res) => {
  const { status, notes } = req.body;
  try {
    await pool.query(
      "UPDATE enquiries SET status = COALESCE(?, status), notes = COALESCE(?, notes) WHERE id = ?",
      [status, notes, req.params.id]
    );
    res.json({ message: `Enquiry status updated to ${status || 'updated'}` });
  } catch (err) {
    console.error("Update enquiry status error:", err);
    res.status(500).json({ message: "Failed to update enquiry status", error: err.message });
  }
});

// ADMIN: Delete enquiry
router.delete("/:id", authenticate, async (req, res) => {
  try {
    await pool.query("DELETE FROM enquiries WHERE id = ?", [req.params.id]);
    res.json({ message: "Enquiry deleted successfully" });
  } catch (err) {
    console.error("Delete enquiry error:", err);
    res.status(500).json({ message: "Failed to delete enquiry", error: err.message });
  }
});

module.exports = router;

