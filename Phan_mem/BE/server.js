require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const { WebSocketServer } = require('ws');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Server Startup ──────────────────────────────────────
async function start() {
  try {
    // ── Bước 1: Tạo database nếu chưa tồn tại ──
    const dbName = process.env.DB_NAME || 'smarthome_iot';
    const tempConn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    });
    await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await tempConn.end();
    console.log(`✅ Database '${dbName}' sẵn sàng!`);

    // ── Bước 2: Kết nối MySQL Pool ──
    const pool = require('./config/database');
    await pool.query('SELECT 1');
    console.log('✅ MySQL Pool đã kết nối!');

    // ── Bước 3: Khởi tạo bảng và dữ liệu mẫu ──
    await initializeDatabase(pool);

    // ── Bước 4: Đăng ký API Routes ──
    app.use('/api/auth', require('./routes/authRoutes'));
    app.use('/api/sensors', require('./routes/sensorRoutes'));
    app.use('/api/devices', require('./routes/deviceRoutes'));
    app.use('/api/actions', require('./routes/actionRoutes'));
    app.use('/api/profile', require('./routes/profileRoutes'));

    // Route riêng cho sensor-data (top-level, không nằm trong /sensors)
    const sensorController = require('./controllers/sensorController');
    app.get('/api/sensor-data', sensorController.getSensorData);

    // Health check
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // ── Bước 5: HTTP Server + WebSocket ──
    const server = http.createServer(app);
    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws) => {
      console.log(`[WS] Client kết nối. Tổng: ${wss.clients.size}`);
      ws.on('close', () => {
        console.log(`[WS] Client ngắt kết nối. Tổng: ${wss.clients.size}`);
      });
      ws.on('error', (err) => {
        console.error('[WS] Error:', err.message);
      });
    });

    // ── Bước 6: Khởi tạo MQTT Handler ──
    const mqttHandler = require('./services/mqttHandler');
    mqttHandler.init(wss, pool);


    // ── Bước 7: Khởi động server ──
    server.listen(PORT, () => {
      console.log('═══════════════════════════════════════════════');
      console.log(`🚀 SmartHome Backend đang chạy tại:`);
      console.log(`   REST API:   http://localhost:${PORT}/api`);
      console.log(`   WebSocket:  ws://localhost:${PORT}`);
      console.log('═══════════════════════════════════════════════');
    });
  } catch (error) {
    console.error('❌ Khởi động server thất bại:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// ─── Khởi tạo Database Schema + Seed Data ────────────────
async function initializeDatabase(pool) {
  // Tạo bảng User
  await pool.query(`
    CREATE TABLE IF NOT EXISTS User (
      user_id INT(10) AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      full_name VARCHAR(50),
      email VARCHAR(50) UNIQUE,
      phone VARCHAR(20),
      date_of_birth DATE,
      address VARCHAR(255),
      avatar VARCHAR(255) DEFAULT '',
      role VARCHAR(20) DEFAULT 'User',
      social_links JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // Tạo bảng Devices
  await pool.query(`
    CREATE TABLE IF NOT EXISTS Devices (
      device_id INT(10) AUTO_INCREMENT PRIMARY KEY,
      device_name VARCHAR(50) NOT NULL,
      device_type VARCHAR(50),
      location VARCHAR(50),
      status BIT DEFAULT 0,
      online BIT DEFAULT 1,
      mqtt_key VARCHAR(10),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      user_id INT(10),
      FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE SET NULL
    )
  `);

  // Tạo bảng Sensor
  await pool.query(`
    CREATE TABLE IF NOT EXISTS Sensor (
      sensor_id INT(10) AUTO_INCREMENT PRIMARY KEY,
      sensor_type VARCHAR(50),
      sensor_name VARCHAR(50),
      unit VARCHAR(50),
      status BIT DEFAULT 1,
      location VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      device_id INT(10),
      FOREIGN KEY (device_id) REFERENCES Devices(device_id) ON DELETE SET NULL
    )
  `);

  // Tạo bảng DataSensor
  await pool.query(`
    CREATE TABLE IF NOT EXISTS DataSensor (
      data_id INT(10) AUTO_INCREMENT PRIMARY KEY,
      sensor_id INT(10),
      value DECIMAL(10, 2),
      recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sensor_id) REFERENCES Sensor(sensor_id) ON DELETE CASCADE
    )
  `);

  // Tạo bảng ActionHistory
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ActionHistory (
      action_id INT(10) AUTO_INCREMENT PRIMARY KEY,
      action VARCHAR(255),
      old_status VARCHAR(50),
      new_status VARCHAR(50),
      status VARCHAR(50) DEFAULT 'SUCCESS',
      action_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      user_id INT(10),
      device_id INT(10),
      FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE SET NULL,
      FOREIGN KEY (device_id) REFERENCES Devices(device_id) ON DELETE SET NULL
    )
  `);

  // Tạo bảng Rules
  await pool.query(`
    CREATE TABLE IF NOT EXISTS Rules (
      threshold_id INT(10) AUTO_INCREMENT PRIMARY KEY,
      threshold_value DECIMAL(10, 2),
      comparison_operator VARCHAR(50),
      action_type VARCHAR(50),
      user_id INT(10),
      device_id INT(10),
      sensor_id INT(10),
      FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE SET NULL,
      FOREIGN KEY (device_id) REFERENCES Devices(device_id) ON DELETE SET NULL,
      FOREIGN KEY (sensor_id) REFERENCES Sensor(sensor_id) ON DELETE SET NULL
    )
  `);

  console.log('✅ Các bảng đã sẵn sàng!');

  // ── Seed dữ liệu mặc định nếu bảng User trống ──
  const [users] = await pool.query('SELECT COUNT(*) as count FROM User');
  if (users[0].count === 0) {
    console.log('📦 Đang tạo dữ liệu mẫu...');

    // 1. User mặc định (mật khẩu: 123456)
    const hashedPassword = await bcrypt.hash('123456', 10);
    await pool.query(
      `INSERT INTO User (username, password, full_name, email, phone, address, role, social_links)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'hoang',
        hashedPassword,
        'Hoàng Trần',
        'hoang.tran@example.com',
        '+84 912 345 678',
        'Hà Nội, Việt Nam',
        'Administrator',
        JSON.stringify({
          github: 'https://github.com/usera',
          figma: 'https://figma.com/@usera',
        }),
      ]
    );

    // 2. Thiết bị (3 LED tương ứng 3 thông số: Nhiệt độ, Độ ẩm, Ánh sáng)
    await pool.query(
      `INSERT INTO Devices (device_name, device_type, location, status, online, mqtt_key, user_id) VALUES
       ('Đèn Nhiệt độ', 'light', 'Phòng khách', 0, 1, 'LED1', 1),
       ('Đèn Độ ẩm', 'light', 'Phòng khách', 0, 1, 'LED2', 1),
       ('Đèn Ánh sáng', 'light', 'Phòng khách', 0, 1, 'LED3', 1)`
    );

    // 3. Cảm biến (3 cảm biến trên board ESP32)
    await pool.query(
      `INSERT INTO Sensor (sensor_type, sensor_name, unit, status, location) VALUES
       ('temperature', 'Cảm biến nhiệt độ', '°C', 1, 'Phòng khách'),
       ('humidity', 'Cảm biến độ ẩm', '%', 1, 'Phòng khách'),
       ('light', 'Cảm biến ánh sáng', 'lux', 1, 'Phòng khách')`
    );

    // 4. Quy tắc tự động (matching firmware thresholds)
    await pool.query(
      `INSERT INTO Rules (threshold_value, comparison_operator, action_type, user_id, device_id, sensor_id) VALUES
       (35.5, '>', 'TURN_ON', 1, 1, 1),
       (34.5, '<', 'TURN_OFF', 1, 1, 1),
       (31.0, '>', 'TURN_ON', 1, 2, 2),
       (29.0, '<', 'TURN_OFF', 1, 2, 2),
       (95.0, '<', 'TURN_ON', 1, 3, 3),
       (105.0, '>', 'TURN_OFF', 1, 3, 3)`
    );

    console.log('✅ Dữ liệu mẫu đã được tạo!');
    console.log('   👤 Tài khoản: hoang / 123456');
  }
}

// ── Khởi động ──
start();
