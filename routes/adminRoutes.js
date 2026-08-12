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

// Get registration fields (Public)
router.get("/registration-fields", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM registration_fields WHERE is_active = 1 ORDER BY sort_order ASC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch fields" });
  }
});

// Admin: Get all fields (including inactive)
router.get("/admin/registration-fields", authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM registration_fields ORDER BY sort_order ASC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch fields" });
  }
});

// Admin: Save/Update fields
router.post("/registration-fields", authenticate, async (req, res) => {
  const { fields } = req.body;
  try {
    for (const f of fields) {
      if (f.id) {
        await pool.query(
          "UPDATE registration_fields SET field_label = ?, field_type = ?, is_required = ?, is_active = ?, sort_order = ? WHERE id = ?",
          [f.field_label, f.field_type, f.is_required, f.is_active, f.sort_order, f.id]
        );
      } else {
        await pool.query(
          "INSERT INTO registration_fields (field_name, field_label, field_type, is_required, sort_order) VALUES (?, ?, ?, ?, ?)",
          [f.field_name, f.field_label, f.field_type, f.is_required, f.sort_order]
        );
      }
    }
    res.json({ message: "Registration fields updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update fields" });
  }
});

// Admin: Delete field
router.delete("/registration-fields/:id", authenticate, async (req, res) => {
  try {
    await pool.query("DELETE FROM registration_fields WHERE id = ?", [req.params.id]);
    res.json({ message: "Field deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete field" });
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

