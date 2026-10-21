const pool = require('../config/database');

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

exports.getProfile = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM User WHERE user_id = ?', [req.userId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }
    res.json(formatUser(rows[0]));
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server!' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { fullName, email, phone, dateOfBirth, address, socialLinks } = req.body || {};

    const updates = [];
    const params = [];

    if (fullName !== undefined) { updates.push('full_name = ?'); params.push(fullName); }
    if (email !== undefined) { updates.push('email = ?'); params.push(email); }
    if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
    if (dateOfBirth !== undefined) { updates.push('date_of_birth = ?'); params.push(dateOfBirth || null); }
    if (address !== undefined) { updates.push('address = ?'); params.push(address); }
    if (socialLinks !== undefined) { updates.push('social_links = ?'); params.push(JSON.stringify(socialLinks)); }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'Không có dữ liệu cập nhật' });
    }

    params.push(req.userId);
    await pool.query(
      `UPDATE User SET ${updates.join(', ')}, updated_at = NOW() WHERE user_id = ?`,
      params
    );

    const [rows] = await pool.query('SELECT * FROM User WHERE user_id = ?', [req.userId]);

    res.json({
      success: true,
      message: 'Cập nhật thông tin cá nhân thành công!',
      user: formatUser(rows[0]),
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server!' });
  }
};
