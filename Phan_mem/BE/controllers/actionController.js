const pool = require('../config/database');

function formatAction(row) {
  return {
    id: `A${String(row.action_id).padStart(3, '0')}`,
    deviceId: `D${String(row.device_id).padStart(3, '0')}`,
    deviceName: row.device_name || '',
    action: row.action,
    status: row.status || 'SUCCESS',
    actionTime: row.action_time ? new Date(row.action_time).toISOString() : '',
    responseTime: row.action_time
      ? new Date(new Date(row.action_time).getTime() + 150).toISOString()
      : undefined,
    responseDuration: 150,
    createdBy: row.username || 'system',
  };
}

exports.getAll = async (req, res) => {
  try {
    const { deviceId, action, status, time, from, to, page = '1', limit = '20' } = req.query;

    const whereConditions = [];
    const params = [];

    if (deviceId) {
      const numericId = parseInt(String(deviceId).replace(/\D/g, ''), 10);
      if (!isNaN(numericId)) {
        whereConditions.push('ah.device_id = ?');
        params.push(numericId);
      }
    }

    if (action) {
      whereConditions.push('ah.action = ?');
      params.push(String(action).trim());
    }

    if (status && String(status).trim()) {
      whereConditions.push('ah.status = ?');
      params.push(String(status).trim().toUpperCase());
    }

    if (time && String(time).trim()) {
      const t = String(time).trim().replace(/\//g, '-');
      whereConditions.push('CAST(ah.action_time AS CHAR) LIKE ?');
      params.push(`%${t}%`);
    }

    if (from) {
      whereConditions.push('ah.action_time >= ?');
      params.push(String(from).trim());
    }

    if (to) {
      const toStr = String(to).trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(toStr)) {
        whereConditions.push('ah.action_time <= ?');
        params.push(`${toStr} 23:59:59`);
      } else {
        whereConditions.push('ah.action_time <= ?');
        params.push(toStr);
      }
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    // Đếm tổng
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM ActionHistory ah ${whereClause}`,
      [...params]
    );
    const total = countResult[0].total;

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 20));
    const totalPages = Math.ceil(total / limitNum);
    const offset = (pageNum - 1) * limitNum;

    // Truy vấn với JOIN để lấy device_name và username
    const [rows] = await pool.query(
      `SELECT ah.*, d.device_name, u.username
       FROM ActionHistory ah
       LEFT JOIN Devices d ON ah.device_id = d.device_id
       LEFT JOIN User u ON ah.user_id = u.user_id
       ${whereClause}
       ORDER BY ah.action_time DESC
       LIMIT ? OFFSET ?`,
      [...params, limitNum, offset]
    );

    res.json({
      data: rows.map(formatAction),
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    });
  } catch (error) {
    console.error('Get actions error:', error);
    res.status(500).json({ message: 'Lỗi server!' });
  }
};
