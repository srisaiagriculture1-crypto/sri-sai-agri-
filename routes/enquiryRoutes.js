const express = require("express");
const router = express.Router();
const pool = require("../utils/db");
const authenticate = require("../utils/authMiddleware");

// Ensure enquiries table and all required columns exist
async function ensureEnquiriesSchema() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS enquiries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_name VARCHAR(255),
        parent_name VARCHAR(255),
        mobile VARCHAR(20),
        email VARCHAR(255),
        stream VARCHAR(100),
        batch VARCHAR(100),
        message TEXT,
        status VARCHAR(50) DEFAULT 'New',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    try { await pool.query(`ALTER TABLE enquiries ADD COLUMN student_name VARCHAR(255)`); } catch(e) {}
    try { await pool.query(`ALTER TABLE enquiries ADD COLUMN parent_name VARCHAR(255)`); } catch(e) {}
    try { await pool.query(`ALTER TABLE enquiries ADD COLUMN mobile VARCHAR(20)`); } catch(e) {}
    try { await pool.query(`ALTER TABLE enquiries ADD COLUMN email VARCHAR(255)`); } catch(e) {}
    try { await pool.query(`ALTER TABLE enquiries ADD COLUMN stream VARCHAR(100)`); } catch(e) {}
    try { await pool.query(`ALTER TABLE enquiries ADD COLUMN batch VARCHAR(100)`); } catch(e) {}
    try { await pool.query(`ALTER TABLE enquiries ADD COLUMN message TEXT`); } catch(e) {}
    try { await pool.query(`ALTER TABLE enquiries ADD COLUMN status VARCHAR(50) DEFAULT 'New'`); } catch(e) {}
    try { await pool.query(`ALTER TABLE enquiries ADD COLUMN notes TEXT`); } catch(e) {}
    try { await pool.query(`ALTER TABLE enquiries ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`); } catch(e) {}
  } catch (err) {
    console.error("ensureEnquiriesSchema error:", err);
  }
}

// PUBLIC: Submit enquiry
router.post("/", async (req, res) => {
  const { studentName, parentName, mobile, email, stream, batch, message, student_name, parent_name } = req.body;

  const sName = studentName || student_name || "Prospective Student";
  const pName = parentName || parent_name || "";

  try {
    await ensureEnquiriesSchema();

    // Check existing columns to build dynamic insert
    const [colsResult] = await pool.query("SHOW COLUMNS FROM enquiries");
    const existingCols = colsResult.map(c => c.Field);

    const insertData = {};
    if (existingCols.includes("student_name")) insertData["student_name"] = sName;
    else if (existingCols.includes("studentName")) insertData["studentName"] = sName;

    if (existingCols.includes("parent_name")) insertData["parent_name"] = pName;
    else if (existingCols.includes("parentName")) insertData["parentName"] = pName;

    if (existingCols.includes("mobile")) insertData["mobile"] = mobile || "";
    if (existingCols.includes("email")) insertData["email"] = email || "";
    if (existingCols.includes("stream")) insertData["stream"] = stream || "";
    if (existingCols.includes("batch")) insertData["batch"] = batch || "";
    if (existingCols.includes("message")) insertData["message"] = message || "";
    if (existingCols.includes("status")) insertData["status"] = "New";

    const fields = Object.keys(insertData);
    const values = Object.values(insertData);
    const placeholders = fields.map(() => "?").join(", ");

    const [result] = await pool.query(
      `INSERT INTO enquiries (${fields.join(", ")}) VALUES (${placeholders})`,
      values
    );

    res.status(201).json({ message: "Enquiry submitted successfully", id: result.insertId });
  } catch (err) {
    console.error("Submit enquiry error:", err);
    res.status(500).json({ message: "Failed to submit enquiry", error: err.message });
  }
});

// ADMIN: Get all enquiries
router.get("/", authenticate, async (req, res) => {
  try {
    await ensureEnquiriesSchema();
    const [colsResult] = await pool.query("SHOW COLUMNS FROM enquiries");
    const existingCols = colsResult.map(c => c.Field);

    const sNameExpr = existingCols.includes("student_name") ? "student_name" : (existingCols.includes("studentName") ? "studentName AS student_name" : "'' AS student_name");
    const pNameExpr = existingCols.includes("parent_name") ? "parent_name" : (existingCols.includes("parentName") ? "parentName AS parent_name" : "'' AS parent_name");
    const dateExpr = existingCols.includes("created_at") ? "created_at" : (existingCols.includes("createdAt") ? "createdAt AS created_at" : "NOW() AS created_at");
    const emailExpr = existingCols.includes("email") ? "email" : "'' AS email";
    const msgExpr = existingCols.includes("message") ? "message" : "'' AS message";
    const statusExpr = existingCols.includes("status") ? "status" : "'New' AS status";
    const notesExpr = existingCols.includes("notes") ? "notes" : "'' AS notes";

    const [rows] = await pool.query(`
      SELECT 
        id,
        ${sNameExpr},
        ${pNameExpr},
        mobile,
        stream,
        batch,
        ${emailExpr},
        ${msgExpr},
        ${statusExpr},
        ${notesExpr},
        ${dateExpr}
      FROM enquiries 
      ORDER BY id DESC
    `);
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
    await ensureEnquiriesSchema();
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

