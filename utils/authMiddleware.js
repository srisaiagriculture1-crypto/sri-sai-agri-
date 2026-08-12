const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  const token = req.cookies.token || req.cookies.studentToken || (req.headers.authorization && req.headers.authorization.split(" ")[1]);
  console.log("🔒 Auth Check - Cookies:", req.cookies);
  
  if (!token) {
    console.log("❌ No token found in cookies or headers");
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const secret = process.env.JWT_SECRET || "srisai_secret_key_123";
    const decoded = jwt.verify(token, secret);
    req.admin = decoded;
    req.user = decoded;
    console.log("✅ Token verified for ID:", decoded.id, "Role:", decoded.role);
    next();
  } catch (err) {
    console.log("❌ Token verification failed:", err.message);
    res.status(403).json({ message: "Invalid token: " + err.message });
  }
};

module.exports = authenticate;
