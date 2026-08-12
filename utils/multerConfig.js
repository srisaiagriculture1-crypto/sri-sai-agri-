const multer = require("multer");
const path = require("path");
const fs = require("fs");

let uploadDir = path.resolve(__dirname, "..", "uploads");

// Handle persistent storage on Hostinger versioned deployments
try {
  const normDir = __dirname.replace(/\\/g, '/');
  const parts = normDir.split('/hbuilds/versions/');
  if (parts.length > 1) {
    const persistentDir = path.join(parts[0], 'shared_uploads');
    if (!fs.existsSync(persistentDir)) {
      fs.mkdirSync(persistentDir, { recursive: true });
    }
    uploadDir = persistentDir;
  }
} catch (e) {
  console.error("Multer dir init:", e.message);
}

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for videos
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith("image") || 
      file.mimetype.startsWith("video") || 
      file.mimetype === "application/pdf"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only images, videos and PDFs are allowed"), false);
    }
  },
});

module.exports = upload;
