const express = require("express");
const router = express.Router();
const pool = require("../utils/db");
const authenticate = require("../utils/authMiddleware");
const upload = require("../utils/multerConfig");

// Update Student Fees (Admin Only)
router.put("/admin/update/:studentId", authenticate, async (req, res) => {
  const { studentId } = req.params;
  const { fees } = req.body; // Array of fee objects for different years

  try {
    for (const fee of fees) {
      const year = fee.academic_year || '1st year';
      const [existing] = await pool.query(
        "SELECT id FROM student_fees WHERE student_id = ? AND LOWER(academic_year) = LOWER(?)",
        [studentId, year]
      );

      if (existing.length > 0) {
        await pool.query(
          `UPDATE student_fees SET 
            total_fee = ?, paid_amount = ?, 
            hostel_fee = ?, hostel_fee_paid = ?,
            exam_fee = ?, exam_fee_paid = ?,
            practical_fee = ?, practical_fee_paid = ?,
            travelling_fee = ?, travelling_fee_paid = ?,
            committed_fee = ?, admission_fee = ?, 
            breakdown_total_fee = ?, breakdown_practical_fee = ?,
            breakdown_hostel_fee = ?, breakdown_travelling_fee = ?,
            payment_status = ?
          WHERE student_id = ? AND LOWER(academic_year) = LOWER(?)`,
          [
            Number(fee.total_fee || 0), Number(fee.paid_amount || 0),
            Number(fee.hostel_fee || 0), Number(fee.hostel_fee_paid || 0),
            Number(fee.exam_fee || 0), Number(fee.exam_fee_paid || 0),
            Number(fee.practical_fee || 0), Number(fee.practical_fee_paid || 0),
            Number(fee.travelling_fee || 0), Number(fee.travelling_fee_paid || 0),
            Number(fee.committed_fee || 0), Number(fee.admission_fee || 0),
            Number(fee.breakdown_total_fee || 0), Number(fee.breakdown_practical_fee || 0),
            Number(fee.breakdown_hostel_fee || 0), Number(fee.breakdown_travelling_fee || 0),
            fee.payment_status || 'Pending',
            studentId, year
          ]
        );
      } else {
        await pool.query(
          `INSERT INTO student_fees (
            student_id, academic_year, total_fee, paid_amount,
            hostel_fee, hostel_fee_paid,
            exam_fee, exam_fee_paid,
            practical_fee, practical_fee_paid,
            travelling_fee, travelling_fee_paid,
            committed_fee, admission_fee,
            breakdown_total_fee, breakdown_practical_fee,
            breakdown_hostel_fee, breakdown_travelling_fee,
            payment_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            studentId, year,
            Number(fee.total_fee || 0), Number(fee.paid_amount || 0),
            Number(fee.hostel_fee || 0), Number(fee.hostel_fee_paid || 0),
            Number(fee.exam_fee || 0), Number(fee.exam_fee_paid || 0),
            Number(fee.practical_fee || 0), Number(fee.practical_fee_paid || 0),
            Number(fee.travelling_fee || 0), Number(fee.travelling_fee_paid || 0),
            Number(fee.committed_fee || 0), Number(fee.admission_fee || 0),
            Number(fee.breakdown_total_fee || 0), Number(fee.breakdown_practical_fee || 0),
            Number(fee.breakdown_hostel_fee || 0), Number(fee.breakdown_travelling_fee || 0),
            fee.payment_status || 'Pending'
          ]
        );
      }
    }
    res.json({ message: "Fees updated successfully" });
  } catch (err) {
    console.error("Error updating fees:", err);
    res.status(400).json({ message: err.message });
  }
});

// Get Fees for a student
router.get("/:studentId", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM student_fees WHERE student_id = ? ORDER BY academic_year ASC",
      [req.params.studentId]
    );
    res.json(rows);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all Payment Proofs for Admin
router.get("/admin/proofs", authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, s.student_name, s.roll_no, s.course_applied, s.branch, s.mobile1, s.email
       FROM payment_proofs p
       LEFT JOIN students s ON p.student_id = s.id
       ORDER BY p.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Upload Payment Proof
router.post("/upload-proof", upload.single("screenshot"), async (req, res) => {
  const { fee_type, amount, academic_year, student_id } = req.body;
  
  let targetStudentId = req.user?.id || req.admin?.id || student_id;
  if (!targetStudentId && req.cookies.studentToken) {
    try {
      const jwt = require("jsonwebtoken");
      const secret = process.env.JWT_SECRET || "srisai_secret_key_123";
      const decoded = jwt.verify(req.cookies.studentToken, secret);
      targetStudentId = decoded.id;
    } catch(e) {}
  }

  if (!targetStudentId) {
    return res.status(400).json({ message: "Student identification required" });
  }

  const screenshot = req.file ? req.file.path.replace(/\\/g, "/") : "";

  if (!screenshot) return res.status(400).json({ message: "Screenshot required" });

  try {
    await pool.query(
      "INSERT INTO payment_proofs (student_id, fee_type, amount, academic_year, screenshot, status) VALUES (?, ?, ?, ?, ?, 'Pending')",
      [targetStudentId, fee_type || 'Registration Fee', amount || 0, academic_year || '1st year', screenshot]
    );
    res.status(201).json({ message: "Payment proof submitted successfully" });
  } catch (err) {
    console.error("Upload proof error:", err);
    res.status(500).json({ message: err.message });
  }
});

// Update Payment Proof Status (Approve/Reject) (Admin Only)
router.put("/proofs/:proofId/status", authenticate, async (req, res) => {
  const { proofId } = req.params;
  const { status } = req.body; // 'Approved' or 'Rejected'

  try {
    const [proofs] = await pool.query("SELECT * FROM payment_proofs WHERE id = ?", [proofId]);
    if (proofs.length === 0) return res.status(404).json({ message: "Payment proof not found" });
    const proof = proofs[0];

    await pool.query("UPDATE payment_proofs SET status = ? WHERE id = ?", [status, proofId]);

    // If approved, automatically add paid amount to student's fee record for that category
    if (status === 'Approved') {
      const year = proof.academic_year || '1st year';
      let colToIncrement = 'paid_amount';
      if (proof.fee_type === 'Hostel Fee') colToIncrement = 'hostel_fee_paid';
      else if (proof.fee_type === 'Examination Fee' || proof.fee_type === 'Exam Fee') colToIncrement = 'exam_fee_paid';
      else if (proof.fee_type === 'Practical Fee') colToIncrement = 'practical_fee_paid';
      else if (proof.fee_type === 'Travelling Expenses' || proof.fee_type === 'Travelling Fee') colToIncrement = 'travelling_fee_paid';

      // Ensure record exists
      const [existing] = await pool.query(
        "SELECT id FROM student_fees WHERE student_id = ? AND LOWER(academic_year) = LOWER(?)",
        [proof.student_id, year]
      );
      if (existing.length > 0) {
        await pool.query(
          `UPDATE student_fees SET ${colToIncrement} = ${colToIncrement} + ? WHERE student_id = ? AND LOWER(academic_year) = LOWER(?)`,
          [Number(proof.amount || 0), proof.student_id, year]
        );
      } else {
        await pool.query(
          `INSERT INTO student_fees (student_id, academic_year, ${colToIncrement}) VALUES (?, ?, ?)`,
          [proof.student_id, year, Number(proof.amount || 0)]
        );
      }
    }

    res.json({ message: `Payment proof ${status.toLowerCase()} successfully`, proof });
  } catch (err) {
    console.error("Error updating payment proof status:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
