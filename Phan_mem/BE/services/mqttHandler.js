const mqtt = require('mqtt');
const EventEmitter = require('events');

const deviceResponseEmitter = new EventEmitter();
const activeCommands = new Set();

let mqttClient = null;
let wssInstance = null;
let dbPool = null;

let lastEsp32MessageTime = 0;
let isEsp32Connected = false;

const ESP32_TIMEOUT_MS = 5000; // 5 giây không nhận được tín hiệu -> tính là mất kết nối (tránh giật mạng)

function recordEsp32Heartbeat() {
  lastEsp32MessageTime = Date.now();
  if (!isEsp32Connected) {
    isEsp32Connected = true;
    console.log('[ESP32] 🟢 ESP32 đã kết nối và phát tín hiệu!');
    broadcast('esp32_status', {
      connected: true,
      lastSeen: new Date().toISOString(),
    });
  }
}

function getEsp32Status() {
  const connected = isEsp32Connected && (Date.now() - lastEsp32MessageTime <= ESP32_TIMEOUT_MS);
  return {
    connected,
    lastSeen: lastEsp32MessageTime ? new Date(lastEsp32MessageTime).toISOString() : null,
  };
}

/**
 * Broadcast message tới tất cả WebSocket clients đang kết nối
 */
function broadcast(type, data) {
  if (!wssInstance) return;
  const message = JSON.stringify({ type, data });
  wssInstance.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
}

/**
 * Khởi tạo MQTT client, subscribe các topic từ ESP32
 */
function init(wss, pool) {
  wssInstance = wss;
  dbPool = pool;

  const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://broker.hivemq.com:1883';
  const clientId = process.env.MQTT_CLIENT_ID || `SmartHome_BE_${Date.now()}`;
  const topicSensor = process.env.MQTT_TOPIC_SENSOR || 'Sensor/thh';
  const topicRespond = process.env.MQTT_TOPIC_RESPOND || 'Device_respond/thh';

  console.log(`[MQTT] Đang kết nối tới ${brokerUrl}...`);

  mqttClient = mqtt.connect(brokerUrl, {
    clientId,
    username: process.env.MQTT_USERNAME || '',
    password: process.env.MQTT_PASSWORD || '',
    clean: true,
    reconnectPeriod: 5000,
    connectTimeout: 10000,
  });

  mqttClient.on('connect', () => {
    console.log('[MQTT] ✅ Đã kết nối broker thành công!');
    mqttClient.subscribe([topicSensor, topicRespond], (err) => {
      if (err) {
        console.error('[MQTT] Subscribe error:', err);
      } else {
        console.log(`[MQTT] Đã subscribe: ${topicSensor}, ${topicRespond}`);
      }
    });
  });

  mqttClient.on('error', (err) => {
    console.error('[MQTT] Error:', err.message);
  });

  mqttClient.on('reconnect', () => {
    console.log('[MQTT] Đang kết nối lại...');
  });

  mqttClient.on('message', async (topic, payload) => {
    try {
      const data = JSON.parse(payload.toString());

      if (topic === topicSensor) {
        await handleSensorData(data);
      }

      if (topic === topicRespond) {
        await handleDeviceRespond(data);
      }
    } catch (error) {
      console.error('[MQTT] Lỗi xử lý message:', error.message);
    }
  });

  // Kiểm tra định kỳ trạng thái kết nối của ESP32 (quá 3s không gửi dữ liệu -> ngắt kết nối)
  setInterval(() => {
    if (isEsp32Connected && (Date.now() - lastEsp32MessageTime > ESP32_TIMEOUT_MS)) {
      isEsp32Connected = false;
      console.log('[ESP32] 🔴 ESP32 mất kết nối (quá 3s không nhận được tín hiệu)!');
      broadcast('esp32_status', {
        connected: false,
        lastSeen: lastEsp32MessageTime ? new Date(lastEsp32MessageTime).toISOString() : null,
      });
    }
  }, 500);
}

/**
 * Xử lý dữ liệu cảm biến từ ESP32
 * ESP32 gửi: { "temperature": 28.5, "humidity": 65.0, "light": 720.0 }
 */
async function handleSensorData(data) {
  recordEsp32Heartbeat();
  const { temperature, humidity, light } = data;
  const timestamp = new Date();

  try {
    // Lấy sensor_id mapping
    const [sensors] = await dbPool.query('SELECT sensor_id, sensor_type FROM Sensor');
    const sensorMap = {};
    sensors.forEach((s) => { sensorMap[s.sensor_type] = s.sensor_id; });

    // Insert 3 bản ghi vào DataSensor
    const insertPromises = [];
    if (temperature !== undefined && sensorMap['temperature']) {
      insertPromises.push(
        dbPool.query('INSERT INTO DataSensor (sensor_id, value, recorded_at) VALUES (?, ?, ?)',
          [sensorMap['temperature'], temperature, timestamp])
      );
    }
    if (humidity !== undefined && sensorMap['humidity']) {
      insertPromises.push(
        dbPool.query('INSERT INTO DataSensor (sensor_id, value, recorded_at) VALUES (?, ?, ?)',
          [sensorMap['humidity'], humidity, timestamp])
      );
    }
    if (light !== undefined && sensorMap['light']) {
      insertPromises.push(
        dbPool.query('INSERT INTO DataSensor (sensor_id, value, recorded_at) VALUES (?, ?, ?)',
          [sensorMap['light'], light, timestamp])
      );
    }

    await Promise.all(insertPromises);

    // Cập nhật thời gian cảm biến
    await dbPool.query('UPDATE Sensor SET updated_at = NOW() WHERE sensor_id IN (?, ?, ?)',
      [sensorMap['temperature'], sensorMap['humidity'], sensorMap['light']].filter(Boolean));

    // Broadcast tới tất cả WebSocket clients nếu có ít nhất 1 dữ liệu cảm biến hợp lệ
    if (temperature !== undefined || humidity !== undefined || light !== undefined) {
      broadcast('sensor_data', {
        temperature,
        humidity,
        light,
        timestamp: timestamp.toISOString(),
      });
    }
  } catch (error) {
    console.error('[MQTT] Lỗi lưu dữ liệu cảm biến:', error.message);
  }
}

/**
 * Xử lý phản hồi trạng thái thiết bị từ ESP32
 * ESP32 gửi: { "LED1": "ON", "LED2": "OFF", "LED3": "ON" }
 */
async function handleDeviceRespond(data) {
  recordEsp32Heartbeat();
  try {
    for (const [key, value] of Object.entries(data)) {
      const status = value === 'ON' ? 1 : 0;

      // Phát sự kiện cho promise đang chờ phản hồi từ phần cứng
      deviceResponseEmitter.emit(key, value);

      // Nếu không có lệnh web thủ công đang chờ, kiểm tra trạng thái cũ để ghi log tự động
      if (!activeCommands.has(key)) {
        const [rows] = await dbPool.query('SELECT device_id, status FROM Devices WHERE mqtt_key = ?', [key]);
        if (rows.length > 0) {
          const device = rows[0];
          const oldVal = Buffer.isBuffer(device.status) ? device.status[0] : Number(device.status);
          if (oldVal !== status) {
            const oldStatusStr = oldVal === 1 ? 'ON' : 'OFF';
            const newStatusStr = status === 1 ? 'ON' : 'OFF';
            const actionStr = status === 1 ? 'TURN_ON' : 'TURN_OFF';

            await dbPool.query(
              'INSERT INTO ActionHistory (action, old_status, new_status, status, user_id, device_id) VALUES (?, ?, ?, "SUCCESS", ?, ?)',
              [actionStr, oldStatusStr, newStatusStr, 1, device.device_id]
            );
          }
        }
      }

      await dbPool.query(
        'UPDATE Devices SET status = ?, online = 1, updated_at = NOW() WHERE mqtt_key = ?',
        [status, key]
      );
    }

    // Broadcast trạng thái thiết bị tới FE
    broadcast('device_status', data);
  } catch (error) {
    console.error('[MQTT] Lỗi cập nhật trạng thái thiết bị:', error.message);
  }
}

/**
 * Chờ phản hồi từ phần cứng ESP32 cho mqttKey cụ thể
 * @param {string} mqttKey - LED1, LED2, LED3
 * @param {string} expectedAction - ON, OFF
 * @param {number} timeoutMs - Thời gian chờ tối đa (ms)
 */
function waitForDeviceResponse(mqttKey, expectedAction, timeoutMs = 5000) {
  return new Promise((resolve) => {
    let timer = null;

    activeCommands.add(mqttKey);

    const onResponse = (status) => {
      if (status === expectedAction) {
        if (timer) clearTimeout(timer);
        activeCommands.delete(mqttKey);
        deviceResponseEmitter.removeListener(mqttKey, onResponse);
        resolve({ success: true, status });
      }
    };

    deviceResponseEmitter.on(mqttKey, onResponse);

    timer = setTimeout(() => {
      activeCommands.delete(mqttKey);
      deviceResponseEmitter.removeListener(mqttKey, onResponse);
      resolve({ success: false, timeout: true });
    }, timeoutMs);
  });
}

/**
 * Publish lệnh điều khiển xuống ESP32
 * @param {string} mqttKey - LED1, LED2, LED3
 * @param {string} action - ON, OFF
 */
function publishDeviceCommand(mqttKey, action) {
  if (!mqttClient || !mqttClient.connected) {
    console.error('[MQTT] Không thể publish: chưa kết nối broker');
    return false;
  }

  const topicControl = process.env.MQTT_TOPIC_CONTROL || 'Device_control/thh';
  const payload = JSON.stringify({ [mqttKey]: action });

  mqttClient.publish(topicControl, payload, (err) => {
    if (err) {
      console.error('[MQTT] Publish error:', err);
    } else {
      console.log(`[MQTT] → ${topicControl}: ${payload}`);
    }
  });

  return true;
}

module.exports = {
  init,
  publishDeviceCommand,
  waitForDeviceResponse,
  getEsp32Status,
  broadcast,
  handleSensorData,
  handleDeviceRespond,
};
