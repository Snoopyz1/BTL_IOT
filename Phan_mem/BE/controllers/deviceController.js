const pool = require('../config/database');
const mqttHandler = require('../services/mqttHandler');

function parseBit(val) {
  if (Buffer.isBuffer(val)) return val[0] === 1;
  if (typeof val === 'number') return val === 1;
  return Boolean(val);
}

function formatDevice(row) {
  const esp32Connected = mqttHandler.getEsp32Status().connected;
  return {
    id: `D${String(row.device_id).padStart(3, '0')}`,
    name: row.device_name,
    type: row.device_type,
    location: row.location || '',
    status: parseBit(row.status) ? 'ON' : 'OFF',
    online: esp32Connected && parseBit(row.online),
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

    if (!mqttHandler.getEsp32Status().connected) {
      return res.status(503).json({
        success: false,
        message: 'Không thể điều khiển: Bo mạch ESP32 đang mất kết nối!',
      });
    }

    const device = rows[0];
    const oldStatus = parseBit(device.status) ? 'ON' : 'OFF';
    const newStatus = action === 'TURN_ON' ? 'ON' : 'OFF';
    const userId = req.userId || 1;

    // 1. Tạo bản ghi ActionHistory với trạng thái PENDING trước
    const [actionInsert] = await pool.query(
      'INSERT INTO ActionHistory (action, old_status, new_status, status, user_id, device_id) VALUES (?, ?, ?, ?, ?, ?)',
      [action, oldStatus, newStatus, 'PENDING', userId, id]
    );
    const actionId = actionInsert.insertId;

    // Broadcast WebSocket để trang lịch sử thao tác hiện ngay bản ghi PENDING
    mqttHandler.broadcast('action_history', {
      actionId,
      deviceId: `D${String(id).padStart(3, '0')}`,
      deviceName: device.device_name,
      action,
      status: 'PENDING',
      actionTime: new Date().toISOString(),
    });

    const startTime = Date.now();

    // 2. Gửi lệnh MQTT xuống ESP32
    if (device.mqtt_key) {
      mqttHandler.publishDeviceCommand(device.mqtt_key, newStatus);
    }

    // 3. Chờ phản hồi thực tế từ phần cứng (timeout 5 giây)
    const resp = await mqttHandler.waitForDeviceResponse(device.mqtt_key, newStatus, 5000);
    const duration = Date.now() - startTime;

    if (resp.success) {
      // Phần cứng thật đã phản hồi thành công!
      await pool.query(
        'UPDATE Devices SET status = ?, online = 1, updated_at = NOW() WHERE device_id = ?',
        [action === 'TURN_ON' ? 1 : 0, id]
      );

      await pool.query(
        'UPDATE ActionHistory SET status = ? WHERE action_id = ?',
        ['SUCCESS', actionId]
      );

      mqttHandler.broadcast('action_history', {
        actionId,
        deviceId: `D${String(id).padStart(3, '0')}`,
        status: 'SUCCESS',
      });

      const [updatedRows] = await pool.query('SELECT * FROM Devices WHERE device_id = ?', [id]);

      return res.json({
        success: true,
        message: `Đã ${action === 'TURN_ON' ? 'bật' : 'tắt'} ${device.device_name} thành công!`,
        device: formatDevice(updatedRows[0]),
        responseTime: duration,
      });
    } else {
      // Không có thiết bị thật phản hồi -> Thất bại
      await pool.query(
        'UPDATE ActionHistory SET status = ? WHERE action_id = ?',
        ['FAILED', actionId]
      );

      mqttHandler.broadcast('action_history', {
        actionId,
        deviceId: `D${String(id).padStart(3, '0')}`,
        status: 'FAILED',
      });

      // Trạng thái thiết bị trong DB giữ nguyên (không đổi)
      return res.json({
        success: false,
        message: `Thiết bị không phản hồi sau ${Math.round(duration / 1000)}s. Thao tác thất bại!`,
        device: formatDevice(device),
        responseTime: duration,
      });
    }
  } catch (error) {
    console.error('Send device command error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server!' });
  }
};
