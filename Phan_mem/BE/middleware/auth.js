const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'smarthome_secret_key_2026_thh';

/** Bắt buộc có token hợp lệ */
function authRequired(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ success: false, message: 'Token không được cung cấp!' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.username = decoded.username;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn!' });
  }
}

/** Gắn userId nếu có token, không chặn nếu không có */
function authOptional(req, res, next) {
  const token = extractToken(req);
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.userId = decoded.userId;
      req.username = decoded.username;
    } catch { /* ignore invalid token */ }
  }
  if (!req.userId) {
    req.userId = 1;
    req.username = 'hoang';
  }
  next();
}

function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  return null;
}

module.exports = { authRequired, authOptional };
