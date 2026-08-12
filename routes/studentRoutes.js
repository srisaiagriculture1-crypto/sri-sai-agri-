const express = require("express");
const router = express.Router();
const pool = require("../utils/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const upload = require("../utils/multerConfig");
const authenticate = require("../utils/authMiddleware");
const { sendEmail } = require('../utils/mailer');
const crypto = require('crypto');

// Register Student
router.post("/register", upload.single("photo"), async (req, res) => {
  const { 
    email, password, student_name, father_name, mother_name, 
    branch, inter_type, dob, gender, admission_type, 
    course_applied, medium, nationality, religion,
    door_no, village, mandal, pin, district,
    mobile1, mobile2, residence_phone, email_personal, reference,
    qualifications, roll_no, current_year, academic_enrolled_year
  } = req.body;

  const photo = req.file ? req.file.path.replace(/\\/g, "/") : "";

  try {
    // Fallback for initial registration where roll_no/password might be missing
    const authCredential = password || roll_no || email || "SriSai@123";
    const hashedPassword = await bcrypt.hash(authCredential, 10);

    // 1. Insert Student
    const [result] = await pool.query(
      `INSERT INTO students (
        email, password, student_name, father_name, mother_name,
        branch, inter_type, dob, gender, admission_type,
        course_applied, medium, nationality, religion,
        door_no, village, mandal, pin, district,
        mobile1, mobile2, residence_phone, email_personal, reference,
        photo, roll_no, current_year, academic_enrolled_year
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        email, hashedPassword, student_name, father_name, mother_name,
        branch, inter_type, dob || null, gender, admission_type,
        course_applied, medium, nationality, religion,
        door_no, village, mandal, pin, district,
        mobile1, mobile2, residence_phone, email_personal, reference,
        photo, roll_no, current_year || '1st year', academic_enrolled_year
      ]
    );

    const studentId = result.insertId;

    // 2. Insert Qualifications if provided
    if (qualifications) {
      const quals = JSON.parse(qualifications);
      for (const q of quals) {
        await pool.query(
          "INSERT INTO qualifications (student_id, examination, board_university, year_of_passing, percentage_cgpa) VALUES (?, ?, ?, ?, ?)",
          [studentId, q.examination, q.board_university, q.year_of_passing, q.percentage_cgpa]
        );
      }
    }

    // 3. Initialize Fees with null/zero
    const years = ["1st year", "2nd year", "3rd year", "4th year"];
    for (const year of years) {
      await pool.query(
        "INSERT INTO student_fees (student_id, academic_year) VALUES (?, ?)",
        [studentId, year]
      );
    }

    res.status(201).json({ message: "Registration successful", studentId });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Student Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.query("SELECT * FROM students WHERE email = ?", [email]);
    const student = rows[0];

    if (!student || !(await bcrypt.compare(password, student.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: student.id, role: 'student' }, process.env.JWT_SECRET || "srisai_secret_key_123", { expiresIn: "24h" });
    
    res.cookie("studentToken", token, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production", 
      sameSite: "Lax", 
      maxAge: 24 * 60 * 60 * 1000 
    });

    res.json({ message: "Login successful", student });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get Student Profile
router.get("/profile", async (req, res) => {
  const token = req.cookies.studentToken;
  if (!token) return res.status(401).json({ message: "Not authenticated" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "srisai_secret_key_123");
    
    const [students] = await pool.query("SELECT * FROM students WHERE id = ?", [decoded.id]);
    const student = students[0];

    if (!student) return res.status(404).json({ message: "Student not found" });

    const [qualifications] = await pool.query("SELECT * FROM qualifications WHERE student_id = ?", [student.id]);
    const [fees] = await pool.query("SELECT * FROM student_fees WHERE student_id = ?", [student.id]);

    // Calculate attendance percentage
    const [attRows] = await pool.query(
      "SELECT status, COUNT(*) as count FROM attendance WHERE student_id = ? GROUP BY status",
      [student.id]
    );
    let totalDays = 0;
    let presentDays = 0;
    attRows.forEach(row => {
      totalDays += row.count;
      if (row.status === 'Present') presentDays += row.count;
    });
    const attendancePercentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : "0.00";

    const [attendanceRecords] = await pool.query(
      "SELECT id, date, status FROM attendance WHERE student_id = ? ORDER BY date DESC",
      [student.id]
    );

    const [proofs] = await pool.query("SELECT id, fee_type, amount, academic_year, screenshot, status, created_at FROM payment_proofs WHERE student_id = ? ORDER BY created_at DESC", [student.id]);

    student.qualifications = qualifications;
    student.student_fees = fees;
    student.attendance_percentage = attendancePercentage;
    student.payment_proofs = proofs;
    student.attendance_records = attendanceRecords;

    res.json(student);
  } catch (err) {
    res.status(401).json({ message: "Session expired" });
  }
});

// Get All Students (Admin Only)
router.get("/admin/list", authenticate, async (req, res) => {
  try {
    console.log("🔍 Admin requesting student list...");
    const [rows] = await pool.query("SELECT id, roll_no, email, student_name, father_name, mother_name, branch, inter_type, dob, gender, admission_type, course_applied, medium, nationality, religion, door_no, village, mandal, pin, district, mobile1, mobile2, residence_phone, email_personal, reference, photo, current_year, academic_enrolled_year, created_at FROM students ORDER BY created_at DESC");
    console.log(`✅ Found ${rows.length} students in DB.`);
    res.json(rows);
  } catch (err) {
    console.error("❌ Admin student list error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// Update Student (Admin)
router.put("/admin/update/:id", authenticate, upload.single("photo"), async (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body };
  console.log("Incoming updates for student:", req.params.id, updates);
  
  try {
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    // Handle date formatting for MySQL
    if (updates.dob) {
      if (updates.dob === "") {
        updates.dob = null;
      } else if (typeof updates.dob === 'string' && updates.dob.includes('-')) {
        const parts = updates.dob.split('-');
        if (parts.length === 3 && parts[2].length === 4) {
          // Convert DD-MM-YYYY to YYYY-MM-DD
          updates.dob = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }
    }
    
    let updateQuery = "UPDATE students SET ";
    let queryParams = [];
    
    // Handle photo upload
    if (req.file) {
      updates.photo = req.file.path.replace(/\\/g, "/");
    }

    // Filter out fields that shouldn't be directly updated this way
    delete updates.id;
    delete updates._id;
    delete updates.created_at;

    const fields = Object.keys(updates);
    if (fields.length === 0) return res.json({ message: "No changes provided" });

    fields.forEach((field, index) => {
      updateQuery += `\`${field}\` = ?`;
      if (index < fields.length - 1) updateQuery += ", ";
      queryParams.push(updates[field]);
    });

    updateQuery += " WHERE id = ?";
    queryParams.push(id);

    await pool.query(updateQuery, queryParams);
    res.json({ message: "Student updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete Student (Admin)
router.delete("/admin/delete/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Delete associated payment proofs
    await pool.query("DELETE FROM payment_proofs WHERE student_id = ?", [id]);
    // 2. Delete associated fees
    await pool.query("DELETE FROM student_fees WHERE student_id = ?", [id]);
    // 3. Delete associated qualifications
    await pool.query("DELETE FROM qualifications WHERE student_id = ?", [id]);
    // 4. Delete student
    await pool.query("DELETE FROM students WHERE id = ?", [id]);
    
    res.json({ message: "Student deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST api/students/forgot-password
// @desc    Request password reset
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const [students] = await pool.query('SELECT * FROM students WHERE email = ?', [email]);
    if (students.length === 0) {
      return res.status(404).json({ message: 'No student found with this email' });
    }

    const student = students[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000); // 1 hour

    await pool.query('UPDATE students SET reset_token = ?, reset_token_expiry = ? WHERE id = ?', [token, expiry, student.id]);

    const resetUrl = `${req.protocol}://${req.get('host')}/portal/reset-password/${token}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #eef2f6; border-radius: 24px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #1a6b3c; margin: 0; font-size: 24px;">Sri Sai Agricultural College</h1>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Student Portal Access</p>
        </div>
        
        <p style="font-size: 16px; color: #1e293b; margin-bottom: 24px;">Hello <strong>${student.student_name}</strong>,</p>
        
        <p style="font-size: 16px; color: #475569; line-height: 1.6; margin-bottom: 32px;">
          We received a request to reset the password for your student portal account. 
          If you made this request, please click the button below:
        </p>
        
        <div style="text-align: center; margin-bottom: 32px;">
          <a href="${resetUrl}" style="display: inline-block; padding: 16px 32px; background-color: #1a6b3c; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; box-shadow: 0 4px 12px rgba(26, 107, 60, 0.2);">
            Reset My Password
          </a>
        </div>
        
        <div style="padding: 24px; background-color: #f8fafc; border-radius: 16px; margin-bottom: 32px;">
          <p style="font-size: 13px; color: #64748b; margin: 0; word-break: break-all;">
            <strong>Link not working?</strong> Copy and paste this URL into your browser:<br/>
            <span style="color: #1a6b3c;">${resetUrl}</span>
          </p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eef2f6; margin-bottom: 24px;"/>
        
        <p style="font-size: 13px; color: #94a3b8; text-align: center; margin: 0;">
          This link will expire in 1 hour.<br/>
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `;

    const success = await sendEmail(email, 'Password Reset Request - Sri Sai Agri', html);
    if (success) {
      res.json({ message: 'Reset link sent to your email' });
    } else {
      res.status(500).json({ message: 'Failed to send email. Check SMTP settings.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// @route   POST api/students/reset-password/:token
// @desc    Reset password using token
router.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const [students] = await pool.query('SELECT * FROM students WHERE reset_token = ? AND reset_token_expiry > NOW()', [token]);
    
    if (students.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const student = students[0];
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query('UPDATE students SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?', [hashedPassword, student.id]);

    res.json({ message: 'Password reset successful! You can now log in.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// ─── SEND FEE REMINDER EMAIL TO ALL STUDENTS ────────────────────────────────
router.post("/send-fee-reminder", authenticate, async (req, res) => {
  try {
    // Fetch all students with their email
    const [students] = await pool.query(
      "SELECT id, student_name, email, email_personal, roll_no, mobile1, course_applied FROM students ORDER BY student_name ASC"
    );

    if (!students.length) {
      return res.status(404).json({ message: "No students found." });
    }

    // Fetch all fees
    const [fees] = await pool.query(
      "SELECT student_id, academic_year, total_fee, hostel_fee, paid_amount, committed_fee FROM student_fees"
    );

    // Map fees by student
    const feesByStudent = {};
    fees.forEach(f => {
      if (!feesByStudent[f.student_id]) feesByStudent[f.student_id] = [];
      feesByStudent[f.student_id].push(f);
    });

    let sent = 0;
    let failed = 0;

    for (const student of students) {
      const recipientEmail = student.email;
      if (!recipientEmail || recipientEmail === "null") { failed++; continue; }

      const studentFees = feesByStudent[student.id] || [];

      // Calculate overall outstanding
      let totalDue = 0;
      let totalPaid = 0;
      let feeRowsHtml = '';

      studentFees.forEach(f => {
        const due = Number(f.total_fee || 0) + Number(f.hostel_fee || 0);
        const paid = Number(f.paid_amount || 0);
        const balance = Math.max(0, due - paid);
        totalDue += due;
        totalPaid += paid;

        if (due > 0) {
          feeRowsHtml += `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 12px 16px; font-weight: 600; color: #334155; text-transform: uppercase; font-size: 12px;">${f.academic_year}</td>
              <td style="padding: 12px 16px; text-align: right; color: #334155; font-size: 13px;">₹${due.toLocaleString('en-IN')}</td>
              <td style="padding: 12px 16px; text-align: right; color: #16a34a; font-size: 13px; font-weight: 600;">₹${paid.toLocaleString('en-IN')}</td>
              <td style="padding: 12px 16px; text-align: right; color: ${balance > 0 ? '#dc2626' : '#16a34a'}; font-weight: 700; font-size: 13px;">₹${balance.toLocaleString('en-IN')}</td>
            </tr>`;
        }
      });

      const totalBalance = Math.max(0, totalDue - totalPaid);
      const currentYear = new Date().getFullYear();
      const todayStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Fee Payment Reminder</title>
</head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family: 'Segoe UI', Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="620" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a4731 0%, #15803d 100%); padding: 36px 40px; text-align: center;">
              <p style="margin:0 0 8px 0; color: rgba(255,255,255,0.7); font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase;">Official Communication</p>
              <h1 style="margin:0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Sri Sai Institute of</h1>
              <h1 style="margin:0; color: #86efac; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Agricultural Sciences</h1>
              <p style="margin: 12px 0 0; color: rgba(255,255,255,0.7); font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">Fee Payment Reminder — ${currentYear}</p>
            </td>
          </tr>

          <!-- Important Notice Banner -->
          <tr>
            <td style="background: #fef9c3; border-left: 4px solid #ca8a04; padding: 14px 40px;">
              <p style="margin:0; color: #78350f; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">⚠️ Action Required — Fee Payment Due</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 36px 40px;">

              <p style="margin: 0 0 6px; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Dear Student,</p>
              <h2 style="margin: 0 0 24px; color: #0f172a; font-size: 22px; font-weight: 800;">${student.student_name}</h2>

              <p style="margin: 0 0 24px; color: #475569; font-size: 14px; line-height: 1.7;">
                We hope this message finds you well. This is a formal reminder from the <strong>Accounts Department</strong> of Sri Sai Institute of Agricultural Sciences regarding your outstanding fee dues for the current academic session.
              </p>

              <!-- Student Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 4px 0; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; width: 40%;">Roll Number</td>
                        <td style="padding: 4px 0; color: #0f172a; font-size: 13px; font-weight: 700;">${student.roll_no || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Course</td>
                        <td style="padding: 4px 0; color: #0f172a; font-size: 13px; font-weight: 700;">${student.course_applied || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Date</td>
                        <td style="padding: 4px 0; color: #0f172a; font-size: 13px; font-weight: 700;">${todayStr}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Fee Table -->
              ${feeRowsHtml ? `
              <p style="margin: 0 0 12px; color: #0f172a; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Fee Statement</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; margin-bottom: 28px;">
                <thead>
                  <tr style="background: #1a4731;">
                    <th style="padding: 12px 16px; color: #fff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; text-align: left;">Year</th>
                    <th style="padding: 12px 16px; color: #fff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; text-align: right;">Total Fee</th>
                    <th style="padding: 12px 16px; color: #fff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; text-align: right;">Paid</th>
                    <th style="padding: 12px 16px; color: #fff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; text-align: right;">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  ${feeRowsHtml}
                </tbody>
                <tfoot>
                  <tr style="background: #f8fafc; border-top: 2px solid #e2e8f0;">
                    <td colspan="3" style="padding: 14px 16px; font-weight: 800; font-size: 13px; color: #0f172a; text-align: right; text-transform: uppercase; letter-spacing: 0.5px;">Outstanding Balance</td>
                    <td style="padding: 14px 16px; font-weight: 800; font-size: 16px; color: ${totalBalance > 0 ? '#dc2626' : '#16a34a'}; text-align: right;">₹${totalBalance.toLocaleString('en-IN')}</td>
                  </tr>
                </tfoot>
              </table>` : ''}

              <p style="margin: 0 0 24px; color: #475569; font-size: 14px; line-height: 1.7;">
                We kindly request you to clear your outstanding dues at the earliest to avoid any inconvenience to your academic progress, including <strong>hall ticket issuance, result declaration,</strong> and <strong>participation in college events</strong>.
              </p>

              <!-- CTA Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #f0fdf4, #dcfce7); border-radius: 12px; border: 1px solid #bbf7d0; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="margin: 0 0 8px; color: #15803d; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">How to Pay</p>
                    <p style="margin: 0; color: #166534; font-size: 13px; line-height: 1.6;">Log in to the <strong>Student Portal</strong>, navigate to <strong>Fee Payments</strong>, and submit your payment screenshot for verification. Our accounts team will approve it within 24 hours.</p>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 6px; color: #475569; font-size: 13px; line-height: 1.7;">For queries, contact the accounts office or reach us at our college helpline during working hours (9:00 AM – 5:00 PM, Mon–Sat).</p>

              <p style="margin: 24px 0 0; color: #94a3b8; font-size: 12px; font-style: italic; border-top: 1px solid #f1f5f9; padding-top: 16px;">
                ✅ <strong>Please ignore this email if you have already completed your fee payment.</strong> Your payment may be under review or pending approval.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #0f172a; padding: 28px 40px; text-align: center;">
              <p style="margin: 0 0 4px; color: #ffffff; font-size: 13px; font-weight: 700;">Sri Sai Institute of Agricultural Sciences</p>
              <p style="margin: 0 0 12px; color: #64748b; font-size: 11px; letter-spacing: 1px; text-transform: uppercase;">Accounts & Finance Department</p>
              <p style="margin: 0; color: #475569; font-size: 11px;">This is an automated communication. Please do not reply to this email.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;

      const subject = `[Fee Reminder] Outstanding Dues — ${student.student_name} | Sri Sai Institute`;
      const ok = await sendEmail(recipientEmail, subject, html);
      if (ok) sent++; else failed++;
    }

    res.json({
      message: `Fee reminder emails dispatched successfully.`,
      sent,
      failed,
      total: students.length
    });

  } catch (err) {
    console.error("Fee reminder error:", err.message);
    res.status(500).json({ message: "Failed to send fee reminders: " + err.message });
  }
});

// ─── ADMIN: GET STUDENT ATTENDANCE SUMMARY (for PDF download) ───────────────
router.get("/attendance-summary", authenticate, async (req, res) => {
  try {
    const [students] = await pool.query(
      "SELECT id, student_name, roll_no, course_applied, branch FROM students ORDER BY student_name ASC"
    );

    const [counts] = await pool.query(
      "SELECT student_id, status, COUNT(*) as count FROM attendance GROUP BY student_id, status"
    );

    const countsMap = {};
    counts.forEach(c => {
      if (!countsMap[c.student_id]) countsMap[c.student_id] = { Present: 0, Absent: 0 };
      countsMap[c.student_id][c.status] = c.count;
    });

    const summary = students.map(s => {
      const stats = countsMap[s.id] || { Present: 0, Absent: 0 };
      const present = Number(stats.Present || 0);
      const absent = Number(stats.Absent || 0);
      const total = present + absent;
      const percentage = total > 0 ? ((present / total) * 100).toFixed(2) : "0.00";
      return {
        id: s.id,
        student_name: s.student_name,
        roll_no: s.roll_no,
        course_applied: s.course_applied,
        branch: s.branch,
        total_days: total,
        present_days: present,
        absent_days: absent,
        percentage
      };
    });

    res.json(summary);
  } catch (err) {
    console.error("Attendance summary error:", err.message);
    res.status(500).json({ message: "Failed to fetch attendance summary" });
  }
});

// ─── ADMIN: IMPORT STUDENTS VIA EXCEL/CSV ───────────────────
const XLSX = require("xlsx");
const excelUpload = require("multer")({
  storage: require("multer").memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.post("/admin/import", authenticate, excelUpload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const connection = await pool.getConnection();
  try {
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json(sheet);

    if (rawRows.length === 0) {
      return res.status(400).json({ message: "Uploaded sheet is empty" });
    }

    const normalizeKey = (key) => {
      return key
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");
    };

    let importedCount = 0;
    let skippedCount = 0;
    const skippedStudents = [];

    await connection.beginTransaction();

    const [importResult] = await connection.query(
      "INSERT INTO excel_imports (filename) VALUES (?)",
      [req.file.originalname]
    );
    const excelImportId = importResult.insertId;

    for (const row of rawRows) {
      const normalizedRow = {};
      Object.keys(row).forEach(k => {
        normalizedRow[normalizeKey(k)] = row[k];
      });

      const rowKeys = Object.keys(normalizedRow);

      const findValue = (keys, exactList, substringList = [], excludeList = []) => {
        for (const exact of exactList) {
          const foundKey = keys.find(k => k === exact);
          if (foundKey) return foundKey;
        }
        if (substringList.length > 0) {
          for (const sub of substringList) {
            const foundKey = keys.find(k => {
              const hasSub = k.includes(sub);
              const hasExclude = excludeList.some(ex => k.includes(ex));
              return hasSub && !hasExclude;
            });
            if (foundKey) return foundKey;
          }
        }
        return null;
      };

      const studentNameKey = findValue(rowKeys, ["student_name", "name", "fullname", "full_name", "studentname", "student"], ["name"], ["father", "mother", "parent"]);
      const student_name = studentNameKey ? normalizedRow[studentNameKey].toString().trim() : "";

      const rollNoKey = findValue(rowKeys, ["roll_no", "rollno", "roll_number", "rollnumber", "sno", "sl_no", "slno", "id"], ["roll", "reg", "sno"]);
      const roll_no = rollNoKey ? normalizedRow[rollNoKey].toString().trim() : "";

      const emailKey = findValue(rowKeys, ["email", "email_id", "emailid", "email_address", "emailaddress"], ["email"], ["personal"]);
      let email = emailKey ? normalizedRow[emailKey].toString().trim() : "";

      if (!email) {
        if (roll_no) {
          email = `${roll_no.toLowerCase().replace(/[^a-z0-9]/g, "")}@srisai.com`;
        } else if (student_name) {
          email = `${student_name.toLowerCase().replace(/[^a-z0-9]/g, "")}${Math.floor(100 + Math.random() * 900)}@srisai.com`;
        }
      }

      const branchKey = findValue(rowKeys, ["branch", "branch_name", "specialization", "course"], ["branch", "spec"]);
      const branch = branchKey ? normalizedRow[branchKey].toString().trim() : "";

      const courseKey = findValue(rowKeys, ["course_applied", "course", "courseapplied", "course_name"], ["course"]);
      const course_applied = courseKey ? normalizedRow[courseKey].toString().trim() : (branch || "Ag. B.Sc.");

      const enrolledYearKey = findValue(rowKeys, ["academic_enrolled_year", "enrolled_year", "academic_year", "enrolledyear", "batch", "academicyear"], ["enrolled", "batch", "academic"]);
      const academic_enrolled_year = enrolledYearKey ? normalizedRow[enrolledYearKey].toString().trim() : "";

      const mobileKey = findValue(rowKeys, ["mobile1", "mobile", "phone", "phonenumber", "phone_number", "mobile_number", "mobilenumber", "contact", "contact_number", "contactnumber"], ["mobile", "phone", "contact"], ["father", "mother", "parent", "residence", "alt", "2", "landline"]);
      const mobile1 = mobileKey ? normalizedRow[mobileKey].toString().trim() : "";

      const fatherKey = findValue(rowKeys, ["father_name", "fathername", "fathers_name", "father"], ["father"]);
      const father_name = fatherKey ? normalizedRow[fatherKey].toString().trim() : "";

      const motherKey = findValue(rowKeys, ["mother_name", "mothername", "mothers_name", "mother"], ["mother"]);
      const mother_name = motherKey ? normalizedRow[motherKey].toString().trim() : "";

      const interKey = findValue(rowKeys, ["inter_type", "intertype", "intermediate", "intermediate_type"], ["inter", "12th"]);
      const inter_type = interKey ? normalizedRow[interKey].toString().trim() : "";

      const dobKey = findValue(rowKeys, ["dob", "date_of_birth", "dateofbirth", "birthdate"], ["dob", "birth", "date_of_birth"]);
      const dobVal = dobKey ? normalizedRow[dobKey] : "";
      let dob = null;
      if (dobVal) {
        if (typeof dobVal === 'number') {
          const dateObj = new Date(Math.round((dobVal - 25569) * 86400 * 1000));
          if (!isNaN(dateObj.getTime())) dob = dateObj;
        } else {
          const parsed = new Date(dobVal);
          if (!isNaN(parsed.getTime())) dob = parsed;
        }
      }

      const genderKey = findValue(rowKeys, ["gender", "sex"], ["gender", "sex"]);
      const gender = genderKey ? normalizedRow[genderKey].toString().trim() : "";

      const admKey = findValue(rowKeys, ["admission_type", "admissiontype"], ["admission"]);
      const admission_type = admKey ? normalizedRow[admKey].toString().trim() : "";

      const mediumKey = findValue(rowKeys, ["medium", "medium_of_instruction"], ["medium"]);
      const medium = mediumKey ? normalizedRow[mediumKey].toString().trim() : "";

      const nationalityKey = findValue(rowKeys, ["nationality"], ["national"]);
      const nationality = nationalityKey ? normalizedRow[nationalityKey].toString().trim() : "";

      const religionKey = findValue(rowKeys, ["religion"], ["relig"]);
      const religion = religionKey ? normalizedRow[religionKey].toString().trim() : "";

      const doorKey = findValue(rowKeys, ["door_no", "doorno", "house_no", "houseno", "address"], ["door", "house", "addr"]);
      const door_no = doorKey ? normalizedRow[doorKey].toString().trim() : "";

      const villageKey = findValue(rowKeys, ["village", "town", "village_town"], ["vill", "town"]);
      const village = villageKey ? normalizedRow[villageKey].toString().trim() : "";

      const mandalKey = findValue(rowKeys, ["mandal", "tehsil", "sub_district"], ["mandal", "tehsil"]);
      const mandal = mandalKey ? normalizedRow[mandalKey].toString().trim() : "";

      const pinKey = findValue(rowKeys, ["pin", "pincode", "zip", "zipcode", "postal_code"], ["pin", "zip", "postal"]);
      const pin = pinKey ? normalizedRow[pinKey].toString().trim() : "";

      const districtKey = findValue(rowKeys, ["district"], ["dist"]);
      const district = districtKey ? normalizedRow[districtKey].toString().trim() : "";

      const mobile2Key = findValue(rowKeys, ["mobile2", "alternate_mobile", "alternative_mobile", "alt_mobile", "mobile_2"], ["mobile2", "alt_mobile", "alt_phone", "alternate"]);
      const mobile2 = mobile2Key ? normalizedRow[mobile2Key].toString().trim() : "";

      const residenceKey = findValue(rowKeys, ["residence_phone", "residence", "landline", "home_phone"], ["residence", "land", "home"]);
      const residence_phone = residenceKey ? normalizedRow[residenceKey].toString().trim() : "";

      const personalEmailKey = findValue(rowKeys, ["email_personal", "personal_email", "personalemail"], ["personal_email", "email_personal", "personalemail"]);
      const email_personal = personalEmailKey ? normalizedRow[personalEmailKey].toString().trim() : "";

      const referenceKey = findValue(rowKeys, ["reference", "referred_by"], ["ref"]);
      const reference = referenceKey ? normalizedRow[referenceKey].toString().trim() : "";

      const currentYearKey = findValue(rowKeys, ["current_year", "currentyear", "year", "year_level"], ["current_year", "year_level"]);
      const current_year = currentYearKey ? normalizedRow[currentYearKey].toString().trim() : "1st year";

      if (!student_name && !roll_no && !email) {
        skippedCount++;
        skippedStudents.push({ name: "Row " + (rawRows.indexOf(row) + 2), reason: "Empty student row" });
        continue;
      }
      if (!student_name) {
        skippedCount++;
        skippedStudents.push({ name: "Row " + (rawRows.indexOf(row) + 2), reason: "Missing Student Name" });
        continue;
      }

      // Check duplicate email
      const [existing] = await connection.query("SELECT id FROM students WHERE email = ?", [email]);
      if (existing.length > 0) {
        skippedCount++;
        skippedStudents.push({ name: student_name, email, reason: "Email already exists" });
        continue;
      }

      const authCredential = roll_no || email || "SriSai@123";
      const hashedPassword = await bcrypt.hash(authCredential.toString(), 10);

      const [studentResult] = await connection.query(
        `INSERT INTO students (
          email, password, student_name, father_name, mother_name,
          branch, inter_type, dob, gender, admission_type,
          course_applied, medium, nationality, religion,
          door_no, village, mandal, pin, district,
          mobile1, mobile2, residence_phone, email_personal, reference,
          roll_no, current_year, academic_enrolled_year, excel_import_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          email, hashedPassword, student_name, father_name, mother_name,
          branch, inter_type, dob, gender, admission_type,
          course_applied, medium, nationality, religion,
          door_no, village, mandal, pin, district,
          mobile1, mobile2, residence_phone, email_personal, reference,
          roll_no, current_year, academic_enrolled_year, excelImportId
        ]
      );

      const studentId = studentResult.insertId;

      const years = ["1st year", "2nd year", "3rd year", "4th year"];
      for (const y of years) {
        await connection.query(
          "INSERT INTO student_fees (student_id, academic_year) VALUES (?, ?)",
          [studentId, y]
        );
      }

      importedCount++;
    }

    if (importedCount === 0) {
      await connection.rollback();
      return res.json({
        message: `Successfully imported 0 students.`,
        importedCount,
        skippedCount,
        skippedStudents
      });
    }

    await connection.commit();
    res.json({
      message: `Successfully imported ${importedCount} students.`,
      importedCount,
      skippedCount,
      skippedStudents
    });
  } catch (err) {
    await connection.rollback();
    console.error("Excel import failed:", err);
    res.status(500).json({ message: "Failed to parse and import Excel file: " + err.message });
  } finally {
    connection.release();
  }
});

// GET: List all uploaded Excel imports with student counts
router.get("/admin/imports", authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT i.*, COUNT(s.id) as student_count 
      FROM excel_imports i 
      LEFT JOIN students s ON s.excel_import_id = i.id 
      GROUP BY i.id 
      ORDER BY i.uploaded_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE: Delete Excel import and all associated student accounts permanently
router.delete("/admin/imports/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Get all student IDs associated with this import
    const [students] = await connection.query("SELECT id FROM students WHERE excel_import_id = ?", [id]);
    const studentIds = students.map(s => s.id);

    if (studentIds.length > 0) {
      // 1. Delete associated payment proofs
      await connection.query("DELETE FROM payment_proofs WHERE student_id IN (?)", [studentIds]);
      // 2. Delete associated student fees
      await connection.query("DELETE FROM student_fees WHERE student_id IN (?)", [studentIds]);
      // 3. Delete associated qualifications
      await connection.query("DELETE FROM qualifications WHERE student_id IN (?)", [studentIds]);
      // 4. Delete associated attendance
      await connection.query("DELETE FROM attendance WHERE student_id IN (?)", [studentIds]);
      // 5. Delete students themselves
      await connection.query("DELETE FROM students WHERE excel_import_id = ?", [id]);
    }

    // 5. Delete the excel import record
    await connection.query("DELETE FROM excel_imports WHERE id = ?", [id]);

    await connection.commit();
    res.json({ message: "Excel import and all associated student accounts deleted permanently." });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ message: err.message });
  } finally {
    connection.release();
  }
});

// DELETE: Delete ALL student accounts and all associated data permanently
router.delete("/admin/clear-all-students", authenticate, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query("DELETE FROM payment_proofs");
    await connection.query("DELETE FROM student_fees");
    await connection.query("DELETE FROM qualifications");
    await connection.query("DELETE FROM attendance");
    await connection.query("DELETE FROM students");
    await connection.query("DELETE FROM excel_imports");

    await connection.commit();
    res.json({ message: "All student accounts and associated data have been permanently deleted." });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ message: err.message });
  } finally {
    connection.release();
  }
});

module.exports = router;
