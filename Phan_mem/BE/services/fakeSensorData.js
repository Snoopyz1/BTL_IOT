const mqttHandler = require('./mqttHandler');

/**
 * =============================================================================
 * HÀM FAKE DATA CẢM BIẾN TẠM THỜI (MÔI TRƯỜNG BÌNH THƯỜNG)
 * Dùng khi không mang theo mạch cảm biến phần cứng ESP32.
 * Khi nào có mạch thật, bạn chỉ cần xoá file này và bỏ gọi hàm trong server.js!
 * =============================================================================
 */

let fakeTimer = null;

// Giá trị ban đầu ở điều kiện phòng bình thường
let currentTemp = 27.2;  // Nhiệt độ phòng bình thường: ~26°C - 29.5°C
let currentHumid = 62.5; // Độ ẩm phòng bình thường: ~55% - 70%
let currentLight = 380;  // Ánh sáng phòng có đèn: ~300 - 520 lux

/**
 * Sinh 1 bộ dữ liệu cảm biến ngẫu nhiên môi trường bình thường
 * (Biến thiên tự nhiên, trôi dạt nhẹ nhàng như cảm biến thật trong phòng)
 */
function generateNormalReading() {
  // Nhiệt độ: dao động nhẹ ±0.2°C, giữ an toàn trong khoảng 26.0°C - 29.5°C
  const tempDelta = (Math.random() - 0.5) * 0.4;
  currentTemp = Math.min(29.5, Math.max(26.0, currentTemp + tempDelta));

  // Độ ẩm: dao động nhẹ ±0.6%, giữ trong khoảng 55.0% - 70.0%
  const humidDelta = (Math.random() - 0.5) * 1.0;
  currentHumid = Math.min(70.0, Math.max(55.0, currentHumid + humidDelta));

  // Ánh sáng: dao động nhẹ ±15 lux, giữ trong khoảng 300 - 520 lux
  const lightDelta = Math.round((Math.random() - 0.5) * 25);
  currentLight = Math.min(520, Math.max(300, currentLight + lightDelta));

  return {
    temperature: Math.round(currentTemp * 10) / 10,
    humidity: Math.round(currentHumid * 10) / 10,
    light: Math.round(currentLight),
  };
}

/**
 * Khởi chạy tự động phát fake data định kỳ
 * @param {number} intervalMs Chu kỳ phát (mặc định 3000ms = 3 giây)
 */
function startFakeSensorData(intervalMs = 3000) {
  if (fakeTimer) clearInterval(fakeTimer);

  console.log(`[FAKE DATA] 🌿 Đang tự động tạo dữ liệu môi trường bình thường (mỗi ${intervalMs / 1000}s)...`);

  const emit = async () => {
    try {
      const reading = generateNormalReading();
      // Ghi dữ liệu vào MySQL (DataSensor) và broadcast WebSocket tới Frontend
      await mqttHandler.handleSensorData(reading);
      console.log(
        `[FAKE DATA] 📊 Nhiệt độ: ${reading.temperature}°C | Độ ẩm: ${reading.humidity}% | Ánh sáng: ${reading.light} lux`
      );
    } catch (err) {
      console.error('[FAKE DATA] Lỗi ghi dữ liệu:', err.message);
    }
  };

  // Phát ngay mẫu đầu tiên
  emit();

  // Lặp định kỳ
  fakeTimer = setInterval(emit, intervalMs);

  return fakeTimer;
}

/**
 * Dừng phát fake data
 */
function stopFakeSensorData() {
  if (fakeTimer) {
    clearInterval(fakeTimer);
    fakeTimer = null;
    console.log('[FAKE DATA] 🛑 Đã dừng phát dữ liệu giả lập.');
  }
}

module.exports = {
  startFakeSensorData,
  stopFakeSensorData,
  generateNormalReading,
};
