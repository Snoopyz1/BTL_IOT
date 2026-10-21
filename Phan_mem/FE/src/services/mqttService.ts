/**
 * MQTT Service — Kết nối WebSocket tới Backend để nhận dữ liệu realtime.
 *
 * Backend lắng nghe MQTT từ ESP32 → broadcast qua WebSocket tới tất cả FE clients.
 * FE subscribe các topic nội bộ giống MQTT để giữ tương thích với useRealtimeData hook.
 *
 * Luồng dữ liệu:
 * ESP32 → MQTT Broker → Backend (subscribe) → WebSocket → Frontend (mqttService)
 */

export type MqttConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

type MessageHandler = (topic: string, payload: string) => void;
type StatusHandler = (status: MqttConnectionStatus) => void;

class MqttService {
  private status: MqttConnectionStatus = 'disconnected';
  private messageHandlers: Map<string, MessageHandler[]> = new Map();
  private statusHandlers: StatusHandler[] = [];
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  /** Lấy trạng thái kết nối hiện tại */
  getStatus(): MqttConnectionStatus {
    return this.status;
  }

  /** Đăng ký handler khi trạng thái kết nối thay đổi */
  onStatusChange(handler: StatusHandler): () => void {
    this.statusHandlers.push(handler);
    return () => {
      this.statusHandlers = this.statusHandlers.filter((h) => h !== handler);
    };
  }

  /** Kết nối WebSocket tới Backend server */
  async connect(): Promise<void> {
    if (this.status === 'connected' || this.status === 'connecting') return;

    this.setStatus('connecting');

    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.setStatus('connected');
        console.log('[WS] ✅ Đã kết nối tới Backend WebSocket');
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch {
          /* ignore invalid JSON */
        }
      };

      this.ws.onclose = () => {
        this.setStatus('disconnected');
        console.log('[WS] Ngắt kết nối. Tự động kết nối lại sau 3s...');
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.setStatus('error');
      };
    } catch {
      this.setStatus('error');
      this.scheduleReconnect();
    }
  }

  /** Ngắt kết nối WebSocket */
  async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus('disconnected');
  }

  /** Subscribe một topic nội bộ */
  subscribe(topic: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(topic)) {
      this.messageHandlers.set(topic, []);
    }
    this.messageHandlers.get(topic)!.push(handler);

    return () => {
      const handlers = this.messageHandlers.get(topic);
      if (handlers) {
        this.messageHandlers.set(
          topic,
          handlers.filter((h) => h !== handler)
        );
      }
    };
  }

  /** Publish tới topic nội bộ (không gửi qua MQTT) */
  publish(topic: string, payload: string): void {
    const handlers = this.messageHandlers.get(topic) || [];
    handlers.forEach((handler) => handler(topic, payload));
  }

  /**
   * Xử lý message từ WebSocket Backend.
   * Chuyển đổi message format thành các topic nội bộ tương thích MQTT.
   */
  private handleMessage(message: { type: string; data: Record<string, unknown> }): void {
    if (message.type === 'sensor_data') {
      const { temperature, humidity, light, timestamp } = message.data as {
        temperature: number;
        humidity: number;
        light: number;
        timestamp: string;
      };

      // Dispatch tới các topic giống MQTT để hook useRealtimeData nhận được
      this.publishToHandlers(
        'smarthome/sensor/temperature',
        JSON.stringify({ sensorId: 'S001', value: temperature, unit: '°C', timestamp })
      );

      this.publishToHandlers(
        'smarthome/sensor/humidity',
        JSON.stringify({ sensorId: 'S002', value: humidity, unit: '%', timestamp })
      );

      this.publishToHandlers(
        'smarthome/sensor/light',
        JSON.stringify({ sensorId: 'S003', value: light, unit: 'lux', timestamp })
      );
    }

    if (message.type === 'device_status') {
      this.publishToHandlers('smarthome/device/status', JSON.stringify(message.data));
    }
  }

  /** Phát message tới tất cả handler đã subscribe topic */
  private publishToHandlers(topic: string, payload: string): void {
    const handlers = this.messageHandlers.get(topic) || [];
    handlers.forEach((handler) => handler(topic, payload));

    // Wildcard handlers
    const wildcardHandlers = this.messageHandlers.get('#') || [];
    wildcardHandlers.forEach((handler) => handler(topic, payload));
  }

  /** Cập nhật trạng thái và thông báo */
  private setStatus(status: MqttConnectionStatus): void {
    this.status = status;
    this.statusHandlers.forEach((handler) => handler(status));
  }

  /** Lên lịch tự động kết nối lại */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 3000);
  }
}

// Singleton instance
export const mqttService = new MqttService();
