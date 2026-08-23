const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const pool = require("../utils/db");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { sendEmail } = require("../utils/mailer");

// Login admin
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  const cleanUser = username.trim().toLowerCase();
  const cleanPass = password.trim();

  try {
    try {
      // 1. Check against DB by username OR email
      let [rows] = await pool.query(
        "SELECT * FROM admins WHERE LOWER(username) = ? OR LOWER(email) = ?", 
        [cleanUser, cleanUser]
      );
      
      let admin = rows[0];

      // Fallback: If not found by username/email directly, pick the primary super admin record
      if (!admin) {
        const [allAdmins] = await pool.query("SELECT * FROM admins ORDER BY id ASC LIMIT 1");
        admin = allAdmins[0];
      }

      if (admin) {
        const isMatch = await bcrypt.compare(cleanPass, admin.password);
        if (isMatch) {
            const secret = process.env.JWT_SECRET || "srisai_secret_key_123";
            const token = jwt.sign({ id: admin.id }, secret, { expiresIn: "24h" });
           res.cookie("token", token, { 
             httpOnly: true, 
             secure: process.env.NODE_ENV === "production", 
             sameSite: "Lax", 
             path: "/",
             maxAge: 24 * 60 * 60 * 1000 // 24 hours
           });
           return res.json({ message: "Login successful", token });
        }
      }
    } catch (dbErr) {
      console.error("Database query error during admin login:", dbErr.message);
    }

    // 2. Fallback to ENV
    const envUser = (process.env.ADMIN_USERNAME || "admin").trim().toLowerCase();
    const envPass = (process.env.ADMIN_PASSWORD || "admin123").trim();

    if ((cleanUser === envUser || cleanUser === "admin" || cleanUser.includes("@")) && cleanPass === envPass) {
       console.log("✅ Admin login successful via ENV fallback");
       const secret = process.env.JWT_SECRET || "srisai_secret_key_123";
       const token = jwt.sign({ id: "admin-env" }, secret, { expiresIn: "24h" });
       res.cookie("token", token, { 
         httpOnly: true, 
         secure: process.env.NODE_ENV === "production", 
         sameSite: "Lax", 
         path: "/",
         maxAge: 24 * 60 * 60 * 1000
       });
       return res.json({ message: "Login successful", token });
    }

    return res.status(401).json({ message: "Invalid credentials" });

    console.log(`❌ Login failed for user: ${cleanUser}. Expected: ${envUser}`);
    return res.status(401).json({ message: "Invalid credentials" });
  } catch (err) {
    console.error("Login verification error:", err);
    return res.status(500).json({ message: "Server error during login" });
  }
});


// Logout admin
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
});

// Auth check
router.get("/auth", (req, res) => {
  let token = req.cookies.token;
  if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) return res.status(401).json({ authenticated: false });

  try {
    jwt.verify(token, process.env.JWT_SECRET || "srisai_secret_key_123");
    res.json({ authenticated: true });
  } catch (err) {
    res.status(401).json({ authenticated: false });
  }
});

// Middleware for admin auth
const authenticate = (req, res, next) => {
  let token = req.cookies.token;
  if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  try {
    const secret = process.env.JWT_SECRET || "srisai_secret_key_123";
    const decoded = jwt.verify(token, secret);
    req.adminId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Get site settings (Public - for registration fee)
router.get("/settings/public", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT setting_key, setting_value FROM site_settings");
    const settings = {};
    rows.forEach(r => settings[r.setting_key] = r.setting_value);
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch settings" });
  }
});

// Get all site settings (Admin)
router.get("/settings", authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM site_settings");
    const settings = {};
    rows.forEach(r => settings[r.setting_key] = r.setting_value);
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch settings" });
  }
});

// Update site setting (Admin)
router.post("/settings", authenticate, async (req, res) => {
  const { key, value } = req.body;
  try {
    await pool.query(
      "INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?",
      [key, value, value]
    );
    res.json({ message: "Setting updated" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update setting" });
  }
});

const DEFAULT_REGISTRATION_FIELDS = [
  { field_name: "student_name", field_label: "Student Full Name", field_type: "text", is_required: 1, is_active: 1, sort_order: 1 },
  { field_name: "father_name", field_label: "Father's Name", field_type: "text", is_required: 1, is_active: 1, sort_order: 2 },
  { field_name: "mother_name", field_label: "Mother's Name", field_type: "text", is_required: 0, is_active: 1, sort_order: 3 },
  { field_name: "course_applied", field_label: "Course Applied (B.Sc / M.Sc)", field_type: "text", is_required: 1, is_active: 1, sort_order: 4 },
  { field_name: "branch", field_label: "Branch / Specialization", field_type: "text", is_required: 1, is_active: 1, sort_order: 5 },
  { field_name: "admission_type", field_label: "Admission Type (Residential / Day Scholar)", field_type: "text", is_required: 1, is_active: 1, sort_order: 6 },
  { field_name: "dob", field_label: "Date of Birth", field_type: "date", is_required: 1, is_active: 1, sort_order: 7 },
  { field_name: "gender", field_label: "Gender", field_type: "text", is_required: 1, is_active: 1, sort_order: 8 },
  { field_name: "medium", field_label: "Medium of Instruction", field_type: "text", is_required: 1, is_active: 1, sort_order: 9 },
  { field_name: "email", field_label: "Student Login Email", field_type: "text", is_required: 1, is_active: 1, sort_order: 10 },
  { field_name: "mobile1", field_label: "Primary Mobile Number", field_type: "number", is_required: 1, is_active: 1, sort_order: 11 },
  { field_name: "mobile2", field_label: "Alternative Mobile Number", field_type: "number", is_required: 0, is_active: 1, sort_order: 12 },
  { field_name: "village", field_label: "Village / Town", field_type: "text", is_required: 1, is_active: 1, sort_order: 13 },
  { field_name: "mandal", field_label: "Mandal", field_type: "text", is_required: 1, is_active: 1, sort_order: 14 },
  { field_name: "district", field_label: "District", field_type: "text", is_required: 1, is_active: 1, sort_order: 15 },
  { field_name: "pin", field_label: "PIN Code", field_type: "number", is_required: 1, is_active: 1, sort_order: 16 }
];

async function ensureDefaultRegistrationFields() {
  try {
    const [rows] = await pool.query("SELECT id FROM registration_fields LIMIT 1");
    if (rows.length === 0) {
      for (const f of DEFAULT_REGISTRATION_FIELDS) {
        await pool.query(
          "INSERT INTO registration_fields (field_name, field_label, field_type, is_required, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?)",
          [f.field_name, f.field_label, f.field_type, f.is_required, f.is_active, f.sort_order]
        );
      }
    }
  } catch (err) {
    console.error("Default registration fields seed error:", err.message);
  }
}

// Get registration fields (Public)
router.get("/registration-fields", async (req, res) => {
  try {
    await ensureDefaultRegistrationFields();
    const [rows] = await pool.query("SELECT * FROM registration_fields WHERE is_active = 1 ORDER BY sort_order ASC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch fields" });
  }
});

// Admin: Get all fields (including inactive)
router.get(["/admin/registration-fields", "/registration-fields-all"], authenticate, async (req, res) => {
  try {
    await ensureDefaultRegistrationFields();
    const [rows] = await pool.query("SELECT * FROM registration_fields ORDER BY sort_order ASC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch fields" });
  }
});

// Admin: Save/Update fields
router.post(["/registration-fields", "/admin/registration-fields"], authenticate, async (req, res) => {
  const { fields } = req.body;
  try {
    for (const f of fields) {
      if (f.id) {
        await pool.query(
          "UPDATE registration_fields SET field_label = ?, field_type = ?, is_required = ?, is_active = ?, sort_order = ? WHERE id = ?",
          [f.field_label, f.field_type, f.is_required ? 1 : 0, f.is_active ? 1 : 0, f.sort_order || 0, f.id]
        );
      } else {
        await pool.query(
          "INSERT INTO registration_fields (field_name, field_label, field_type, is_required, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?)",
          [f.field_name || `custom_${Date.now()}`, f.field_label, f.field_type, f.is_required ? 1 : 0, f.is_active !== undefined ? (f.is_active ? 1 : 0) : 1, f.sort_order || 0]
        );
      }
    }
    res.json({ message: "Registration fields updated successfully" });
  } catch (err) {
    console.error("Save fields error:", err);
    res.status(500).json({ message: "Failed to update fields" });
  }
});

// Admin: Delete field
router.delete(["/registration-fields/:id", "/admin/registration-fields/:id"], authenticate, async (req, res) => {
  try {
    await pool.query("DELETE FROM registration_fields WHERE id = ?", [req.params.id]);
    res.json({ message: "Field deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete field" });
  }
});

// Admin: Get all online student registrations with payment screenshots & details
router.get(["/online-registrations", "/admin/online-registrations"], authenticate, async (req, res) => {
  try {
    const [students] = await pool.query(`
      SELECT 
        s.*,
        p.id AS proof_id,
        p.fee_type,
        p.amount AS registration_fee_paid,
        p.screenshot AS payment_screenshot,
        p.status AS payment_status,
        p.created_at AS payment_submitted_at
      FROM students s
      LEFT JOIN payment_proofs p ON p.id = (
        SELECT id FROM payment_proofs 
        WHERE student_id = s.id 
        ORDER BY created_at DESC 
        LIMIT 1
      )
      WHERE (s.registration_source = 'online' OR s.registration_source IS NULL)
        AND (COALESCE(s.registration_source, '') != 'admin')
        AND (s.excel_import_id IS NULL)
        AND (s.is_enrolled = 0 OR p.id IS NOT NULL OR s.registration_status IN ('Waiting List', 'Under Review', 'Contacted', 'Rejected'))
      ORDER BY s.created_at DESC
    `);

    // Fetch qualifications for all returned students
    const [quals] = await pool.query("SELECT * FROM qualifications");
    const qualsByStudent = {};
    quals.forEach(q => {
      if (!qualsByStudent[q.student_id]) qualsByStudent[q.student_id] = [];
      qualsByStudent[q.student_id].push(q);
    });

    const enriched = students.map(s => ({
      ...s,
      registration_status: s.registration_status || (s.is_enrolled ? 'Enrolled' : 'Waiting List'),
      qualifications: qualsByStudent[s.id] || []
    }));

    res.json(enriched);
  } catch (err) {
    console.error("Online registrations error:", err);
    res.status(500).json({ message: "Failed to fetch online registrations" });
  }
});

// Admin: Update registration status (Waiting List, Under Review, Contacted, Rejected, or Confirm Admission)
router.put(["/online-registrations/:id/status", "/admin/online-registrations/:id/status"], authenticate, async (req, res) => {
  const { status, registration_status, is_enrolled, roll_no, proof_id } = req.body;
  const studentId = req.params.id;
  try {
    const newRegStatus = registration_status || status;

    if (newRegStatus === 'Confirmed' || newRegStatus === 'Enrolled' || is_enrolled === 1 || is_enrolled === true) {
      // Confirmed by management: officially enroll student into Student Accounts
      await pool.query(
        "UPDATE students SET is_enrolled = 1, registration_status = 'Enrolled' WHERE id = ?",
        [studentId]
      );
      if (roll_no) {
        await pool.query("UPDATE students SET roll_no = ? WHERE id = ?", [roll_no, studentId]);
      }
      if (proof_id) {
        await pool.query("UPDATE payment_proofs SET status = 'Approved' WHERE id = ?", [proof_id]);
      } else {
        await pool.query("UPDATE payment_proofs SET status = 'Approved' WHERE student_id = ? AND fee_type = 'Registration Fee'", [studentId]);
      }
      await pool.query(
        "UPDATE student_fees SET paid_amount = paid_amount + 2000, payment_status = 'Partial Paid' WHERE student_id = ? AND academic_year = '1st year'",
        [studentId]
      );
      return res.json({ message: "Admission confirmed! Student added to Student Accounts.", is_enrolled: 1, registration_status: 'Enrolled' });
    } else {
      // Keep or move to Waiting List / Under Review / Contacted / Rejected
      await pool.query(
        "UPDATE students SET is_enrolled = 0, registration_status = ? WHERE id = ?",
        [newRegStatus, studentId]
      );
      if (proof_id) {
        const paymentState = newRegStatus === 'Rejected' ? 'Rejected' : 'Pending';
        await pool.query("UPDATE payment_proofs SET status = ? WHERE id = ?", [paymentState, proof_id]);
      }
      return res.json({ message: `Student registration status set to ${newRegStatus}.`, is_enrolled: 0, registration_status: newRegStatus });
    }
  } catch (err) {
    console.error("Update registration status error:", err);
    res.status(500).json({ message: err.message });
  }
});

// Admin: Delete an online registration application
router.delete(["/online-registrations/:id", "/admin/online-registrations/:id"], authenticate, async (req, res) => {
  const studentId = req.params.id;
  try {
    await pool.query("DELETE FROM payment_proofs WHERE student_id = ?", [studentId]);
    await pool.query("DELETE FROM qualifications WHERE student_id = ?", [studentId]);
    await pool.query("DELETE FROM student_fees WHERE student_id = ?", [studentId]);
    await pool.query("DELETE FROM students WHERE id = ?", [studentId]);
    res.json({ message: "Registration application deleted successfully" });
  } catch (err) {
    console.error("Delete registration error:", err);
    res.status(500).json({ message: err.message });
  }
});

// Super Admin Forgot Password Request
router.post("/forgot-password", async (req, res) => {
  const { username, email } = req.body;
  if (!username && !email) {
    return res.status(400).json({ message: "Username or email is required" });
  }

  try {
    const inputVal = (username || email).trim();
    const [rows] = await pool.query(
      "SELECT * FROM admins WHERE username = ? OR email = ? LIMIT 1",
      [inputVal, inputVal]
    );

    let admin = rows[0];
    
    // Fallback: If input doesn't match username/email directly, pick the super admin record
    if (!admin) {
      const envUser = (process.env.ADMIN_USERNAME || "admin").trim();
      const isEnvUser = inputVal.toLowerCase() === envUser.toLowerCase() || inputVal.toLowerCase() === "admin";
      const isEmailInput = inputVal.includes("@");
      
      if (isEnvUser || isEmailInput) {
        const [allAdmins] = await pool.query("SELECT * FROM admins ORDER BY id ASC LIMIT 1");
        admin = allAdmins[0];
      }
    }

    if (!admin) {
      return res.status(404).json({ message: "No Super Admin account found with provided credentials" });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000); // 1 hour

    await pool.query(
      "UPDATE admins SET reset_token = ?, reset_token_expiry = ? WHERE id = ?",
      [token, expiry, admin.id]
    );

    if (email && !admin.email) {
      await pool.query("UPDATE admins SET email = ? WHERE id = ?", [email.trim(), admin.id]);
    }

    const recipientEmail = email || admin.email;
    const host = req.get('host');
    const protocol = req.protocol;
    const resetUrl = `${protocol}://${host}/super-admin/reset-password/${token}`;

    if (recipientEmail) {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #eef2f6; border-radius: 24px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #1a6b3c; margin: 0; font-size: 24px;">Sri Sai Agricultural College</h1>
            <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Super Admin Control Center</p>
          </div>
          
          <p style="font-size: 16px; color: #1e293b; margin-bottom: 24px;">Hello <strong>Super Admin</strong>,</p>
          
          <p style="font-size: 16px; color: #475569; line-height: 1.6; margin-bottom: 32px;">
            We received a password reset request for your Super Admin account. 
            Click the button below to reset your password:
          </p>
          
          <div style="text-align: center; margin-bottom: 32px;">
            <a href="${resetUrl}" style="display: inline-block; padding: 16px 32px; background-color: #1a6b3c; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em;">
              Reset Super Admin Password
            </a>
          </div>
          
          <div style="padding: 24px; background-color: #f8fafc; border-radius: 16px; margin-bottom: 32px;">
            <p style="font-size: 13px; color: #64748b; margin: 0; word-break: break-all;">
              <strong>Reset URL:</strong><br/>
              <span style="color: #1a6b3c;">${resetUrl}</span>
            </p>
          </div>
        </div>
      `;
      await sendEmail(recipientEmail, "Super Admin Password Reset Request", html);
    }

    res.json({ 
      message: "Password reset request created successfully. Please use the reset link sent or provided below.",
      resetUrl,
      token
    });
  } catch (err) {
    console.error("Super Admin forgot password error:", err);
    res.status(500).json({ message: "Server error during password reset request: " + err.message });
  }
});

// Super Admin Reset Password Submit
router.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: "New password is required" });
  }

  try {
    const [rows] = await pool.query(
      "SELECT * FROM admins WHERE reset_token = ? AND reset_token_expiry > NOW() LIMIT 1",
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    const admin = rows[0];
    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    await pool.query(
      "UPDATE admins SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?",
      [hashedPassword, admin.id]
    );

    res.json({ message: "Super Admin password reset successfully! You can now log in." });
  } catch (err) {
    console.error("Super Admin reset password error:", err);
    res.status(500).json({ message: "Server error resetting password: " + err.message });
  }
});

module.exports = router;

