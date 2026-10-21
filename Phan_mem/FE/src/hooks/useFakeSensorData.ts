/**
 * useFakeSensorData — Fake dữ liệu cảm biến trực tiếp ở Frontend.
 *
 * Sinh số ngẫu nhiên tự nhiên (giống phòng bình thường) rồi publish
 * vào mqttService nội bộ, KHÔNG gửi lên Backend/MQTT Broker.
 *
 * Cách dùng: gọi hook này một lần ở cấp cao (App hoặc Dashboard).
 * Tắt khi kết nối WebSocket BE thực sự nhận được dữ liệu thật.
 */

import { useEffect, useRef } from 'react';
import { mqttService } from '../services/mqttService.ts';

// ──────────────────────────────────────────────
// Giá trị ban đầu — môi trường phòng bình thường
// ──────────────────────────────────────────────
let currentTemp = 27.2;   // °C  (26 – 29.5)
let currentHumid = 62.5;  // %   (55 – 70)
let currentLight = 380;   // lux (300 – 520)

function generateReading() {
  currentTemp  = +(Math.min(29.5, Math.max(26.0, currentTemp  + (Math.random() - 0.5) * 0.4)).toFixed(1));
  currentHumid = +(Math.min(70.0, Math.max(55.0, currentHumid + (Math.random() - 0.5) * 1.0)).toFixed(1));
  currentLight = Math.round(Math.min(520, Math.max(300, currentLight + (Math.random() - 0.5) * 25)));
  return { temperature: currentTemp, humidity: currentHumid, light: currentLight };
}

/**
 * @param intervalMs  Chu kỳ phát dữ liệu (ms). Mặc định 3000ms.
 * @param enabled     Bật/tắt hook. Mặc định true.
 */
export function useFakeSensorData(intervalMs = 3000, enabled = true) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const emit = () => {
      const { temperature, humidity, light } = generateReading();
      const timestamp = new Date().toISOString();

      mqttService.publish(
        'smarthome/sensor/temperature',
        JSON.stringify({ sensorId: 'S001', value: temperature, unit: '°C', timestamp })
      );
      mqttService.publish(
        'smarthome/sensor/humidity',
        JSON.stringify({ sensorId: 'S002', value: humidity, unit: '%', timestamp })
      );
      mqttService.publish(
        'smarthome/sensor/light',
        JSON.stringify({ sensorId: 'S003', value: light, unit: 'lux', timestamp })
      );
    };

    // Phát ngay lần đầu
    emit();
    timerRef.current = setInterval(emit, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [intervalMs, enabled]);
}
