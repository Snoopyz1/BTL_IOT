import { useState, useEffect, useRef } from 'react';
import { mqttService } from '../services/mqttService.ts';
import type { RealtimeSensorValue, ChartDataPoint } from '../types/sensor.ts';

const MAX_CHART_POINTS = 30;

function getInitialChartData(): ChartDataPoint[] {
  try {
    const saved = sessionStorage.getItem('dashboard_chart_data');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Tự động làm sạch các điểm nhiễu > 2000 lux từ các phiên trước
        return parsed.map((p) => ({
          ...p,
          light: p.light !== undefined && p.light > 2000 ? 50 : p.light,
        }));
      }
    }
  } catch { /* ignore */ }
  return [];
}

async function loadLatestHistory(): Promise<{ points: ChartDataPoint[]; latest: Partial<RealtimeSensorValue> } | null> {
  try {
    const { getSensorData } = await import('../services/sensorService.ts');
    const res = await getSensorData({ limit: 60, page: 1 });
    if (!res || !res.data || res.data.length === 0) return null;

    // Sắp xếp các bản ghi theo thời gian tăng dần để vẽ biểu đồ
    const rows = [...res.data].reverse();
    const timeMap = new Map<string, { time: string; timestamp: number; temp?: number; hum?: number; light?: number }>();

    for (const r of rows) {
      if (!r.recordedAt) continue;
      const d = new Date(r.recordedAt);
      const timeStr = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      if (!timeMap.has(timeStr)) {
        timeMap.set(timeStr, { time: timeStr, timestamp: d.getTime() });
      }
      const entry = timeMap.get(timeStr)!;
      if (r.sensorType === 'temperature') entry.temp = r.value;
      else if (r.sensorType === 'humidity') entry.hum = r.value;
      else if (r.sensorType === 'light' && r.value < 2000) entry.light = r.value;
    }

    const points: ChartDataPoint[] = [];
    let lastT = 0, lastH = 0, lastL = 0;
    for (const [, val] of timeMap) {
      if (val.temp !== undefined) lastT = val.temp;
      if (val.hum !== undefined) lastH = val.hum;
      if (val.light !== undefined) lastL = val.light;
      points.push({
        time: val.time,
        timestamp: val.timestamp,
        temperature: val.temp ?? lastT,
        humidity: val.hum ?? lastH,
        light: val.light ?? lastL,
      });
    }

    const latestRow = res.data[0];
    return {
      points: points.slice(-MAX_CHART_POINTS),
      latest: {
        temperature: lastT,
        humidity: lastH,
        light: lastL,
        updatedAt: latestRow ? latestRow.recordedAt : new Date().toISOString(),
      },
    };
  } catch (err) {
    console.error('[RealtimeData] Không thể tải dữ liệu lịch sử cảm biến từ API:', err);
    return null;
  }
}

// Biến lưu trữ ngoài component để giữ dữ liệu liên tục khi chuyển tab/trang
let cachedChartData: ChartDataPoint[] = getInitialChartData();
let cachedValues: RealtimeSensorValue = {
  temperature: cachedChartData[cachedChartData.length - 1]?.temperature ?? 0,
  humidity: cachedChartData[cachedChartData.length - 1]?.humidity ?? 0,
  light: cachedChartData[cachedChartData.length - 1]?.light ?? 0,
  updatedAt: new Date().toISOString(),
  temperatureChange: 0,
  humidityChange: 0,
  lightChange: 0,
};
const cachedPrev = {
  temperature: cachedValues.temperature,
  humidity: cachedValues.humidity,
  light: cachedValues.light,
};

/**
 * Hook nhận dữ liệu cảm biến realtime từ Backend qua WebSocket.
 * Dữ liệu chartData được lưu liên tục, không bị reset khi chuyển trang.
 */
export function useRealtimeData() {
  const [values, setValues] = useState<RealtimeSensorValue>(cachedValues);
  const [chartData, setChartData] = useState<ChartDataPoint[]>(cachedChartData);
  const prevValues = useRef(cachedPrev);

  useEffect(() => {
    // Nếu chưa có dữ liệu trong cache, tải các bản ghi thật đã lưu gần nhất từ database
    if (cachedChartData.length === 0) {
      loadLatestHistory().then((result) => {
        if (result && result.points.length > 0) {
          cachedChartData = result.points;
          setChartData(result.points);
          try {
            sessionStorage.setItem('dashboard_chart_data', JSON.stringify(result.points));
          } catch { /* ignore */ }

          if (result.latest.temperature !== undefined) {
            const updated: RealtimeSensorValue = {
              temperature: result.latest.temperature ?? 0,
              humidity: result.latest.humidity ?? 0,
              light: result.latest.light ?? 0,
              updatedAt: result.latest.updatedAt ?? new Date().toISOString(),
              temperatureChange: 0,
              humidityChange: 0,
              lightChange: 0,
            };
            cachedValues = updated;
            cachedPrev.temperature = updated.temperature;
            cachedPrev.humidity = updated.humidity;
            cachedPrev.light = updated.light;
            prevValues.current = { ...cachedPrev };
            setValues(updated);
          }
        }
      });
    }

    // Kết nối WebSocket tới Backend
    mqttService.connect();

    const handleTemp = (_topic: string, payload: string) => {
      try {
        const data = JSON.parse(payload);
        setValues((prev) => {
          const change = data.value - prevValues.current.temperature;
          prevValues.current.temperature = data.value;
          cachedPrev.temperature = data.value;
          const updated = { ...prev, temperature: data.value, temperatureChange: change, updatedAt: data.timestamp };
          cachedValues = updated;
          return updated;
        });
      } catch { /* ignore */ }
    };

    const handleHumidity = (_topic: string, payload: string) => {
      try {
        const data = JSON.parse(payload);
        setValues((prev) => {
          const change = data.value - prevValues.current.humidity;
          prevValues.current.humidity = data.value;
          cachedPrev.humidity = data.value;
          const updated = { ...prev, humidity: data.value, humidityChange: change, updatedAt: data.timestamp };
          cachedValues = updated;
          return updated;
        });
      } catch { /* ignore */ }
    };

    const handleLight = (_topic: string, payload: string) => {
      try {
        const data = JSON.parse(payload);
        if (typeof data.value === 'number' && data.value >= 50000) return; // Bỏ qua xung nhiễu I2C
        setValues((prev) => {
          const change = data.value - prevValues.current.light;
          prevValues.current.light = data.value;
          cachedPrev.light = data.value;
          const updated = { ...prev, light: data.value, lightChange: change, updatedAt: data.timestamp };
          cachedValues = updated;
          return updated;
        });

        // Cập nhật biểu đồ và lưu vào cache liên tục
        setChartData((prev) => {
          const now = new Date();
          const point: ChartDataPoint = {
            time: now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            timestamp: now.getTime(),
            temperature: prevValues.current.temperature,
            humidity: prevValues.current.humidity,
            light: prevValues.current.light,
          };
          const base = prev.length > 0 ? prev : cachedChartData;
          const updated = [...base, point];
          const result = updated.length > MAX_CHART_POINTS ? updated.slice(-MAX_CHART_POINTS) : updated;
          cachedChartData = result;
          try {
            sessionStorage.setItem('dashboard_chart_data', JSON.stringify(result));
          } catch { /* ignore */ }
          return result;
        });
      } catch { /* ignore */ }
    };

    const unsubTemp = mqttService.subscribe('smarthome/sensor/temperature', handleTemp);
    const unsubHum = mqttService.subscribe('smarthome/sensor/humidity', handleHumidity);
    const unsubLight = mqttService.subscribe('smarthome/sensor/light', handleLight);

    return () => {
      unsubTemp();
      unsubHum();
      unsubLight();
    };
  }, []);

  return { values, chartData };
}

/**
 * Hook lấy danh sách thiết bị từ API thật
 */
export function useDevices() {
  const [devices, setDevices] = useState<import('../types/device.ts').Device[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDevices = async () => {
    try {
      const { getDevices } = await import('../services/deviceService.ts');
      const data = await getDevices();
      setDevices(data);
    } catch (err) {
      console.error('Failed to fetch devices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();

    // Lắng nghe cập nhật trạng thái thiết bị realtime từ WebSocket (ESP32 -> MQTT -> BE -> WS)
    const unsub = mqttService.subscribe('smarthome/device/status', (_topic, payload) => {
      try {
        const statusMap = JSON.parse(payload) as Record<string, 'ON' | 'OFF'>;
        setDevices((prevDevices) =>
          prevDevices.map((dev) => {
            let newStatus: 'ON' | 'OFF' | undefined;
            if (dev.mqttKey && statusMap[dev.mqttKey]) {
              newStatus = statusMap[dev.mqttKey];
            } else {
              const numericId = parseInt(dev.id.replace(/\D/g, ''), 10);
              const key = `LED${numericId}`;
              if (statusMap[key]) {
                newStatus = statusMap[key];
              }
            }

            if (newStatus && newStatus !== dev.status) {
              return {
                ...dev,
                status: newStatus,
                online: true,
                updatedAt: new Date().toISOString(),
              };
            }
            return dev;
          })
        );
      } catch (err) {
        console.error('Failed to parse device_status message:', err);
      }
    });

    // Lắng nghe cập nhật trạng thái kết nối của ESP32 để đồng bộ online/offline cho các thiết bị
    const unsubEsp = mqttService.subscribe('smarthome/esp32/status', (_topic, payload) => {
      try {
        const data = JSON.parse(payload);
        if (typeof data?.connected === 'boolean') {
          setDevices((prevDevices) =>
            prevDevices.map((dev) => ({
              ...dev,
              online: data.connected,
            }))
          );
        }
      } catch (err) {
        console.error('Failed to parse esp32 status in useDevices:', err);
      }
    });

    return () => {
      unsub();
      unsubEsp();
    };
  }, []);

  return { devices, loading, refetch: fetchDevices };
}
