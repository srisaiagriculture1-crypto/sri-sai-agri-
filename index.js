// GLOBAL ERROR CATCHER
process.on('uncaughtException', (err) => {
  console.error("⛔️ CRITICAL CRASH (Uncaught):", err.message);
  console.error(err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error("⛔️ CRITICAL CRASH (Unhandled Rejection):", reason);
});

try {
  console.log("🎬 SCRIPT STARTING...");
  require("dotenv").config();
  console.log("✅ Dotenv loaded");
  
  const express = require("express");
  const cors = require("cors");
  const path = require("path");
  const fs = require("fs");
  const cookieParser = require("cookie-parser");
  console.log("✅ Modules loaded");

  const app = express();
  const PORT = process.env.PORT || 5000;

  app.use(cors({
    origin: true,
    credentials: true
  }));
  app.use(cookieParser());
  app.use(express.json());
  const uploadsDir = path.resolve(__dirname, "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Explicit route handler for serving upload files dynamically across versioned deployments & persistent shared_uploads
  app.get("/uploads/:filename", (req, res) => {
    const filename = path.basename(req.params.filename);

    // 1. Direct candidate paths
    const possiblePaths = [
      path.resolve(__dirname, "uploads", filename),
      path.resolve(process.cwd(), "uploads", filename),
      path.resolve(__dirname, "..", "uploads", filename),
      path.resolve(__dirname, "..", "shared_uploads", filename),
      path.resolve(__dirname, "..", "..", "shared_uploads", filename),
      path.resolve(__dirname, "..", "..", "uploads", filename),
      path.resolve(__dirname, "sri-sai-agriculture", "uploads", filename),
      path.resolve(process.cwd(), "sri-sai-agriculture", "uploads", filename)
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        return res.sendFile(p);
      }
    }

    // 2. Walk up parent directories searching for uploads/filename or shared_uploads/filename
    let curr = __dirname;
    for (let i = 0; i < 6; i++) {
      const p1 = path.join(curr, "uploads", filename);
      if (fs.existsSync(p1) && fs.statSync(p1).isFile()) return res.sendFile(p1);

      const p2 = path.join(curr, "shared_uploads", filename);
      if (fs.existsSync(p2) && fs.statSync(p2).isFile()) return res.sendFile(p2);

      const parent = path.dirname(curr);
      if (parent === curr) break;
      curr = parent;
    }

    // 3. Search across all subdirectories of domain root / hbuilds versions
    try {
      const normDir = __dirname.replace(/\\/g, '/');
      const domainRoot = (normDir.split('/hbuilds/')[0] || normDir.split('/public_html')[0] || normDir).trim();
      
      const searchInDir = (dir, depth = 0) => {
        if (depth > 5 || !fs.existsSync(dir)) return null;
        try {
          const items = fs.readdirSync(dir, { withFileTypes: true });
          for (const item of items) {
            const fullPath = path.join(dir, item.name);
            if (item.isFile() && item.name === filename) {
              return fullPath;
            }
            if (item.isDirectory() && (item.name === 'uploads' || item.name === 'shared_uploads' || item.name === 'hbuilds' || item.name === 'versions' || item.name === 'nodejs')) {
              const found = searchInDir(fullPath, depth + 1);
              if (found) return found;
            }
          }
        } catch(e) {}
        return null;
      };

      const foundPath = searchInDir(domainRoot);
      if (foundPath && fs.existsSync(foundPath)) {
        return res.sendFile(foundPath);
      }
    } catch(e) {
      console.error("Deep search error note:", e.message);
    }

    res.status(404).send("File not found");
  });

  app.use("/uploads", express.static(uploadsDir));
  app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

  // Import Routes
  app.use("/api/students", require("./routes/studentRoutes"));
  app.use("/api/faculty", require("./routes/facultyRoutes"));
  app.use("/api/courses", require("./routes/courseRoutes"));
  app.use("/api/stories", require("./routes/storyRoutes"));
  app.use("/api/testimonials", require("./routes/testimonialRoutes"));
  app.use("/api/ranks", require("./routes/rankRoutes"));
  app.use("/api/gallery", require("./routes/galleryRoutes"));
  app.use("/api/hero", require("./routes/heroRoutes"));
  app.use("/api/enquiries", require("./routes/enquiryRoutes"));
  app.use("/api/subjects", require("./routes/subjectRoutes"));
  app.use("/api/qualifications", require("./routes/qualificationRoutes"));
  app.use("/api/admin", require("./routes/adminRoutes"));
  app.use("/api/admin", require("./routes/syncRoutes"));
  app.use("/api/student-fees", require("./routes/feeRoutes"));
  app.use("/api/staff", require("./routes/staffRoutes"));
  app.use("/api/receptionist", require("./routes/receptionistRoutes"));
  app.use("/api/directors", require("./routes/directorRoutes"));
  console.log("✅ Routes initialized");

  // Serve static files with dynamic path resolution
  const possibleBuildPaths = [
    path.resolve(__dirname, "sri-sai-agriculture", "build"),
    path.resolve(__dirname, "build"),
    path.resolve(process.cwd(), "sri-sai-agriculture", "build"),
    path.resolve(process.cwd(), "build")
  ];

  let activeBuildPath = possibleBuildPaths.find(p => fs.existsSync(path.join(p, "index.html")));
  if (!activeBuildPath) {
    console.warn("⚠️ Could not locate index.html in candidate paths:", possibleBuildPaths);
    activeBuildPath = possibleBuildPaths[0];
  } else {
    console.log("✅ Serving SPA static files from:", activeBuildPath);
  }

  app.use(express.static(activeBuildPath));
  
  // SPA fallback middleware (stream index.html directly)
  app.use((req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
      return next();
    }
    const indexPath = path.join(activeBuildPath, "index.html");
    if (!fs.existsSync(indexPath)) {
      console.error("❌ index.html missing at:", indexPath);
      return res.status(404).send("Application build not found. Please rebuild the frontend.");
    }
    res.setHeader("Content-Type", "text/html; charset=UTF-8");
    const stream = fs.createReadStream(indexPath);
    stream.on("error", (err) => {
      console.error("Error reading index.html:", err);
      if (!res.headersSent) {
        res.status(500).send("Error reading application: " + err.message);
      }
    });
    stream.pipe(res);
  });

  // Auto-initialize Admin Account
  const initAdmin = async () => {
    try {
      const bcrypt = require("bcryptjs");
      const pool = require("./utils/db");
      const username = process.env.ADMIN_USERNAME || "admin";
      const password = process.env.ADMIN_PASSWORD || "admin123";
      const hashedPassword = await bcrypt.hash(password, 10);

      const [rows] = await pool.query("SELECT * FROM admins WHERE username = ?", [username]);
      if (rows.length === 0) {
        console.log("ℹ️ Auto-creating default admin account...");
        await pool.query("INSERT INTO admins (username, password) VALUES (?, ?)", [username, hashedPassword]);
        console.log("✨ Admin account created!");
      } else {
        console.log("✨ Admin account verified.");
      }

      // Ensure admins table has columns for password reset
      try { await pool.query("ALTER TABLE admins ADD COLUMN email VARCHAR(255)"); } catch(e) {}
      try { await pool.query("ALTER TABLE admins ADD COLUMN reset_token VARCHAR(255)"); } catch(e) {}
      try { await pool.query("ALTER TABLE admins ADD COLUMN reset_token_expiry DATETIME"); } catch(e) {}

      // Initialize Tables
      console.log("ℹ️ Initializing database tables...");
      await pool.query(`
        CREATE TABLE IF NOT EXISTS payment_proofs (
          id INT AUTO_INCREMENT PRIMARY KEY, 
          student_id INT, 
          fee_type VARCHAR(50), 
          amount DECIMAL(10,2), 
          academic_year VARCHAR(20), 
          screenshot VARCHAR(255), 
          status VARCHAR(20) DEFAULT 'Pending', 
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS site_settings (
          id INT AUTO_INCREMENT PRIMARY KEY, 
          setting_key VARCHAR(50) UNIQUE, 
          setting_value TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      
      // Seed default registration fee if not exists
      await pool.query(`
        INSERT IGNORE INTO site_settings (setting_key, setting_value) 
        VALUES ('registration_fee', '2000')
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS registration_fields (
          id INT AUTO_INCREMENT PRIMARY KEY, 
          field_name VARCHAR(100), 
          field_label VARCHAR(255), 
          field_type VARCHAR(20) DEFAULT 'text',
          is_required BOOLEAN DEFAULT FALSE,
          is_active BOOLEAN DEFAULT TRUE,
          sort_order INT DEFAULT 0
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS staff (
          id INT AUTO_INCREMENT PRIMARY KEY,
          employee_id VARCHAR(50),
          name VARCHAR(255),
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          department VARCHAR(100),
          role VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Add missing columns to staff table if they don't exist
      try { await pool.query(`ALTER TABLE staff ADD COLUMN employee_id VARCHAR(50)`); } catch(e) {}
      try { await pool.query(`ALTER TABLE staff ADD COLUMN role VARCHAR(100)`); } catch(e) {}

      // Seed default staff account if staff table is empty
      try {
        const [staffRows] = await pool.query("SELECT id FROM staff LIMIT 1");
        if (staffRows.length === 0) {
          const staffPass = await bcrypt.hash("password123", 10);
          await pool.query(
            "INSERT INTO staff (employee_id, name, email, password, department, role) VALUES (?, ?, ?, ?, ?, ?)",
            ["EMP001", "Admin Staff", "staff@srisai.com", staffPass, "Administration", "Manager"]
          );
          console.log("✨ Default staff account created!");
        }
      } catch(e) { console.error("Staff seed note:", e.message); }

      // Excel Imports Migration
      await pool.query(`
        CREATE TABLE IF NOT EXISTS excel_imports (
          id INT AUTO_INCREMENT PRIMARY KEY,
          filename VARCHAR(255) NOT NULL,
          uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      try { await pool.query(`ALTER TABLE students ADD COLUMN excel_import_id INT DEFAULT NULL`); } catch(e) {}
      try { await pool.query(`ALTER TABLE students ADD COLUMN is_enrolled TINYINT(1) DEFAULT 1`); } catch(e) {}
      try { await pool.query(`ALTER TABLE students ADD COLUMN registration_status VARCHAR(50) DEFAULT 'Enrolled'`); } catch(e) {}

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
      try { await pool.query(`ALTER TABLE enquiries ADD COLUMN status VARCHAR(50) DEFAULT 'New'`); } catch(e) {}
      try { await pool.query(`ALTER TABLE enquiries ADD COLUMN notes TEXT`); } catch(e) {}

      await pool.query(`
        CREATE TABLE IF NOT EXISTS staff_attendance (
          id INT AUTO_INCREMENT PRIMARY KEY,
          staff_id INT NOT NULL,
          date DATE NOT NULL,
          status ENUM('Present', 'Absent', 'Leave', 'Half Day') DEFAULT 'Present',
          check_in VARCHAR(20),
          check_out VARCHAR(20),
          marked_by_admin TINYINT(1) DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_staff_date (staff_id, date),
          FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS attendance (
          id INT AUTO_INCREMENT PRIMARY KEY,
          student_id INT,
          date DATE,
          status ENUM('Present', 'Absent', 'Leave') DEFAULT 'Present',
          marked_by INT, -- staff_id
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY (student_id, date)
        )
      `);

      // Migration for category-wise student_fees fields
      const feeCols = [
        "total_fee DECIMAL(10,2) DEFAULT 0",
        "paid_amount DECIMAL(10,2) DEFAULT 0",
        "hostel_fee DECIMAL(10,2) DEFAULT 0",
        "hostel_fee_paid DECIMAL(10,2) DEFAULT 0",
        "exam_fee DECIMAL(10,2) DEFAULT 0",
        "exam_fee_paid DECIMAL(10,2) DEFAULT 0",
        "practical_fee DECIMAL(10,2) DEFAULT 0",
        "practical_fee_paid DECIMAL(10,2) DEFAULT 0",
        "travelling_fee DECIMAL(10,2) DEFAULT 0",
        "travelling_fee_paid DECIMAL(10,2) DEFAULT 0",
        "breakdown_total_fee DECIMAL(10,2) DEFAULT 0",
        "breakdown_practical_fee DECIMAL(10,2) DEFAULT 0",
        "breakdown_hostel_fee DECIMAL(10,2) DEFAULT 0",
        "breakdown_travelling_fee DECIMAL(10,2) DEFAULT 0"
      ];
      for (const colDef of feeCols) {
        try {
          await pool.query(`ALTER TABLE student_fees ADD COLUMN IF NOT EXISTS ${colDef}`);
        } catch (e) {
          // Alternative syntax for MySQL versions without ADD COLUMN IF NOT EXISTS
          try {
            const colName = colDef.split(" ")[0];
            await pool.query(`ALTER TABLE student_fees ADD COLUMN ${colDef}`);
          } catch(err) { /* column may already exist */ }
        }
      }

      // Directors Table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS directors (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          position VARCHAR(255) NOT NULL,
          image VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Receptionists Table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS receptionists (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          username VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          phone VARCHAR(50),
          status VARCHAR(50) DEFAULT 'Active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Seed default receptionist account if empty
      try {
        const [recRows] = await pool.query("SELECT id FROM receptionists LIMIT 1");
        if (recRows.length === 0) {
          const bcrypt = require("bcryptjs");
          const defaultUser = (process.env.RECEPTIONIST_USERNAME || "srisai2026").trim();
          const defaultPass = (process.env.RECEPTIONIST_PASSWORD || "srisai@2026").trim();
          const hashed = await bcrypt.hash(defaultPass, 10);
          await pool.query(
            "INSERT INTO receptionists (name, username, password, phone, status) VALUES (?, ?, ?, ?, 'Active')",
            ["Front Desk Receptionist", defaultUser, hashed, "9876543210"]
          );
          console.log("✨ Default receptionist account created!");
        }
      } catch(e) { console.error("Receptionist seed note:", e.message); }

      console.log("✅ Database tables verified.");
    } catch (err) {
      console.error("❌ Admin init failed:", err.message);
    }
  };

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    initAdmin();
  }).on('error', (err) => {
    console.error("❌ SERVER FAILED TO START:", err.message);
  });

  // DB Test
  const pool = require("./utils/db");
  pool.getConnection()
    .then(c => { console.log("✅ DB Connected!"); c.release(); })
    .catch(e => console.error("❌ DB Error:", e.message));

} catch (err) {
  console.error("⛔️ INITIALIZATION ERROR:", err.message);
  console.error(err.stack);
}
