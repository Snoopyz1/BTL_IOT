const mqtt = require('mqtt');

let mqttClient = null;
let wssInstance = null;
let dbPool = null;

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
}

/**
 * Xử lý dữ liệu cảm biến từ ESP32
 * ESP32 gửi: { "temperature": 28.5, "humidity": 65.0, "light": 720.0 }
 */
async function handleSensorData(data) {
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

    // Broadcast tới tất cả WebSocket clients
    broadcast('sensor_data', {
      temperature,
      humidity,
      light,
      timestamp: timestamp.toISOString(),
    });
  } catch (error) {
    console.error('[MQTT] Lỗi lưu dữ liệu cảm biến:', error.message);
  }
}

/**
 * Xử lý phản hồi trạng thái thiết bị từ ESP32
 * ESP32 gửi: { "LED1": "ON", "LED2": "OFF", "LED3": "ON" }
 */
async function handleDeviceRespond(data) {
  try {
    for (const [key, value] of Object.entries(data)) {
      const status = value === 'ON' ? 1 : 0;

      // Kiểm tra trạng thái cũ để ghi log ActionHistory nếu ESP32 thay đổi trạng thái (do tự động theo cảm biến hoặc từ xa)
      const [rows] = await dbPool.query('SELECT device_id, status FROM Devices WHERE mqtt_key = ?', [key]);
      if (rows.length > 0) {
        const device = rows[0];
        const oldVal = Buffer.isBuffer(device.status) ? device.status[0] : Number(device.status);
        if (oldVal !== status) {
          const oldStatusStr = oldVal === 1 ? 'ON' : 'OFF';
          const newStatusStr = status === 1 ? 'ON' : 'OFF';
          const actionStr = status === 1 ? 'TURN_ON' : 'TURN_OFF';

          await dbPool.query(
            'INSERT INTO ActionHistory (action, old_status, new_status, user_id, device_id) VALUES (?, ?, ?, ?, ?)',
            [actionStr, oldStatusStr, newStatusStr, 1, device.device_id]
          );
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
  broadcast,
  handleSensorData,
  handleDeviceRespond,
};
