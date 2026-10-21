const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'smarthome_secret_key_2026_thh';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '24h';

function formatUser(row) {
  let socialLinks = {};
  if (row.social_links) {
    socialLinks = typeof row.social_links === 'string' ? JSON.parse(row.social_links) : row.social_links;
  }
  return {
    id: `U${String(row.user_id).padStart(3, '0')}`,
    username: row.username,
    fullName: row.full_name || '',
    email: row.email || '',
    phone: row.phone || '',
    dateOfBirth: row.date_of_birth
      ? (row.date_of_birth instanceof Date ? row.date_of_birth.toISOString().split('T')[0] : String(row.date_of_birth))
      : '',
    address: row.address || '',
    avatar: row.avatar || '',
    role: row.role || 'User',
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : '',
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : '',
    socialLinks,
  };
}

exports.login = async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body || {};
    if (!usernameOrEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!',
      });
    }

    const [rows] = await pool.query(
      'SELECT * FROM User WHERE username = ? OR email = ?',
      [usernameOrEmail.trim(), usernameOrEmail.trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản hoặc email không tồn tại trong hệ thống!',
      });
    }

    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Mật khẩu không chính xác. Vui lòng thử lại!',
      });
    }

    const token = jwt.sign(
      { userId: user.user_id, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.json({
      success: true,
      token,
      user: formatUser(user),
      message: 'Đăng nhập thành công!',
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server!' });
  }
};

exports.register = async (req, res) => {
  try {
    const { fullName, username, email, password, phone } = req.body || {};

    if (!fullName || !username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ các thông tin bắt buộc!',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự!',
      });
    }

    // Kiểm tra trùng username hoặc email
    const [existing] = await pool.query(
      'SELECT user_id FROM User WHERE username = ? OR email = ?',
      [username.trim().toLowerCase(), email.trim().toLowerCase()]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Tên đăng nhập hoặc email đã được sử dụng!',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO User (username, password, full_name, email, phone, social_links)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        username.trim().toLowerCase(),
        hashedPassword,
        fullName.trim(),
        email.trim().toLowerCase(),
        phone || '',
        JSON.stringify({ github: 'https://github.com' }),
      ]
    );

    const [newUser] = await pool.query('SELECT * FROM User WHERE user_id = ?', [result.insertId]);

    const token = jwt.sign(
      { userId: result.insertId, username: username.trim().toLowerCase() },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.json({
      success: true,
      token,
      user: formatUser(newUser[0]),
      message: 'Đăng ký tài khoản thành công!',
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server!' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM User WHERE user_id = ?', [req.userId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }
    res.json({ success: true, user: formatUser(rows[0]) });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server!' });
  }
};
