/**
 * Script mô phỏng ESP32 gửi dữ liệu cảm biến qua MQTT (HiveMQ)
 * Chạy độc lập: npm run simulate  (hoặc node scripts/fakeSensors.js)
 *
 * Tác dụng:
 * 1. Đóng vai trò là ESP32 ảo, kết nối HiveMQ Broker
 * 2. Cứ mỗi 3s gửi gói tin { temperature, humidity, light } lên topic 'Sensor/thh'
 * 3. Lắng nghe lệnh điều khiển từ Web trên topic 'Device_control/thh'
 * 4. Phản hồi trạng thái các LED trên topic 'Device_respond/thh'
 * 5. Tự động kiểm tra ngưỡng để bật/tắt LED giống firmware ESP32
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mqtt = require('mqtt');

const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://broker.hivemq.com:1883';
const topicSensor = process.env.MQTT_TOPIC_SENSOR || 'Sensor/thh';
const topicControl = process.env.MQTT_TOPIC_CONTROL || 'Device_control/thh';
const topicRespond = process.env.MQTT_TOPIC_RESPOND || 'Device_respond/thh';

const clientId = `ESP32_Virtual_Simulator_${Math.floor(Math.random() * 10000)}`;

console.log('═══════════════════════════════════════════════════════');
console.log('  🤖 MÔ PHỎNG PHẦN CỨNG ESP32 (VIRTUAL ESP32)');
console.log(`  Broker:  ${brokerUrl}`);
console.log(`  Topic:   ${topicSensor} (Publish) | ${topicControl} (Subscribe)`);
console.log('═══════════════════════════════════════════════════════');

const client = mqtt.connect(brokerUrl, {
  clientId,
  clean: true,
  reconnectPeriod: 5000,
});

let ledStates = {
  LED1: 'OFF',
  LED2: 'OFF',
  LED3: 'OFF',
};

let step = 0;
let tempBase = 30.0;
let humidBase = 32.0;
let lightBase = 180.0;

function generateReadings() {
  step++;
  const tempWave = Math.sin(step * 0.15) * 4.5 + (Math.random() - 0.5) * 0.5;
  const humidWave = Math.cos(step * 0.12) * 8.0 + (Math.random() - 0.5) * 0.8;
  const lightWave = Math.sin(step * 0.08) * 160 + (Math.random() - 0.5) * 20;

  const temperature = Math.round((tempBase + tempWave) * 10) / 10;
  const humidity = Math.round((humidBase + humidWave) * 10) / 10;
  const light = Math.round(Math.max(30, lightBase + lightWave));

  return { temperature, humidity, light };
}

function checkAndControlLEDs(temp, humid, lux) {
  let changed = false;

  // LED1: Nhiệt độ > 35.5*C ON, < 34.5*C OFF
  if (temp > 35.5 && ledStates.LED1 !== 'ON') {
    ledStates.LED1 = 'ON';
    changed = true;
  } else if (temp < 34.5 && ledStates.LED1 !== 'OFF') {
    ledStates.LED1 = 'OFF';
    changed = true;
  }

  // LED2: Độ ẩm > 31.0% ON, < 29.0% OFF
  if (humid > 31.0 && ledStates.LED2 !== 'ON') {
    ledStates.LED2 = 'ON';
    changed = true;
  } else if (humid < 29.0 && ledStates.LED2 !== 'OFF') {
    ledStates.LED2 = 'OFF';
    changed = true;
  }

  // LED3: Ánh sáng < 95 lx ON, > 105 lx OFF
  if (lux < 95.0 && ledStates.LED3 !== 'ON') {
    ledStates.LED3 = 'ON';
    changed = true;
  } else if (lux > 105.0 && ledStates.LED3 !== 'OFF') {
    ledStates.LED3 = 'OFF';
    changed = true;
  }

  if (changed) {
    publishDeviceRespond();
    console.log(`[LED AUTO] Cập nhật trạng thái đèn theo cảm biến:`, ledStates);
  }
}

function publishDeviceRespond() {
  const payload = JSON.stringify(ledStates);
  client.publish(topicRespond, payload, { retain: true });
  console.log(`[MQTT] → ${topicRespond}: ${payload}`);
}

client.on('connect', () => {
  console.log('✅ Đã kết nối HiveMQ Broker!');

  // Subscribe lệnh điều khiển
  client.subscribe(topicControl, (err) => {
    if (err) console.error('Subscribe lỗi:', err);
    else console.log(`📡 Đã lắng nghe lệnh điều khiển tại: ${topicControl}`);
  });

  // Gửi trạng thái đèn ban đầu
  publishDeviceRespond();

  // Bắt đầu chu kỳ gửi cảm biến mỗi 3s
  setInterval(() => {
    const data = generateReadings();
    const payload = JSON.stringify(data);

    client.publish(topicSensor, payload);
    console.log(`[SENSOR] 📡 Gửi: Temp=${data.temperature}°C | Hum=${data.humidity}% | Lux=${data.light}lx`);

    checkAndControlLEDs(data.temperature, data.humidity, data.light);
  }, 3000);
});

client.on('message', (topic, message) => {
  if (topic === topicControl) {
    try {
      const command = JSON.parse(message.toString());
      console.log(`[CONTROL] 📥 Nhận lệnh điều khiển:`, command);

      for (const [key, val] of Object.entries(command)) {
        if (key in ledStates) {
          ledStates[key] = val === 'ON' ? 'ON' : 'OFF';
        }
      }

      publishDeviceRespond();
    } catch (e) {
      console.error('Lỗi phân tích lệnh:', e.message);
    }
  }
});

client.on('error', (err) => {
  console.error('Lỗi kết nối MQTT:', err.message);
});
