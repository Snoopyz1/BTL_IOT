const pool = require('../config/database');
const mqttHandler = require('../services/mqttHandler');

function parseBit(val) {
  if (Buffer.isBuffer(val)) return val[0] === 1;
  if (typeof val === 'number') return val === 1;
  return Boolean(val);
}

function formatDevice(row) {
  return {
    id: `D${String(row.device_id).padStart(3, '0')}`,
    name: row.device_name,
    type: row.device_type,
    location: row.location || '',
    status: parseBit(row.status) ? 'ON' : 'OFF',
    online: parseBit(row.online),
    mqttKey: row.mqtt_key || null,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : '',
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : '',
  };
}

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Devices ORDER BY device_id');
    res.json(rows.map(formatDevice));
  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({ message: 'Lỗi server!' });
  }
};

exports.getById = async (req, res) => {
  try {
    const id = parseInt(String(req.params.id).replace(/\D/g, ''), 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
    }
    const [rows] = await pool.query('SELECT * FROM Devices WHERE device_id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thiết bị' });
    }
    res.json(formatDevice(rows[0]));
  } catch (error) {
    console.error('Get device by ID error:', error);
    res.status(500).json({ message: 'Lỗi server!' });
  }
};

exports.sendCommand = async (req, res) => {
  try {
    const id = parseInt(String(req.params.id).replace(/\D/g, ''), 10);
    const { action } = req.body || {};

    if (!action || (action !== 'TURN_ON' && action !== 'TURN_OFF')) {
      return res.status(400).json({
        success: false,
        message: 'Lệnh không hợp lệ. Sử dụng TURN_ON hoặc TURN_OFF',
      });
    }

    const [rows] = await pool.query('SELECT * FROM Devices WHERE device_id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thiết bị' });
    }

    const device = rows[0];
    const oldStatus = parseBit(device.status) ? 'ON' : 'OFF';
    const newStatus = action === 'TURN_ON' ? 'ON' : 'OFF';

    // Gửi lệnh MQTT xuống ESP32
    if (device.mqtt_key) {
      mqttHandler.publishDeviceCommand(device.mqtt_key, newStatus);
    }

    // Cập nhật trạng thái trong DB
    await pool.query(
      'UPDATE Devices SET status = ?, updated_at = NOW() WHERE device_id = ?',
      [action === 'TURN_ON' ? 1 : 0, id]
    );

    // Ghi lịch sử điều khiển
    const userId = req.userId || 1;
    await pool.query(
      'INSERT INTO ActionHistory (action, old_status, new_status, user_id, device_id) VALUES (?, ?, ?, ?, ?)',
      [action, oldStatus, newStatus, userId, id]
    );

    // Lấy thiết bị sau khi cập nhật
    const [updatedRows] = await pool.query('SELECT * FROM Devices WHERE device_id = ?', [id]);

    res.json({
      success: true,
      message: `Đã ${action === 'TURN_ON' ? 'bật' : 'tắt'} ${device.device_name} thành công!`,
      device: formatDevice(updatedRows[0]),
      responseTime: 150,
    });
  } catch (error) {
    console.error('Send device command error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server!' });
  }
};
