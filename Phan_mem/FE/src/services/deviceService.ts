import { apiFetch } from './api';
import type { Device, DeviceCommand, DeviceCommandResponse } from '../types/device';

/** Lấy danh sách tất cả thiết bị */
export async function getDevices(): Promise<Device[]> {
  return apiFetch<Device[]>('/devices');
}

/** Lấy thông tin thiết bị theo ID */
export async function getDeviceById(id: string): Promise<Device | undefined> {
  try {
    return await apiFetch<Device>(`/devices/${id}`);
  } catch {
    return undefined;
  }
}

/**
 * Gửi lệnh điều khiển thiết bị
 * Backend sẽ publish MQTT command xuống ESP32
 */
export async function sendDeviceCommand(
  deviceId: string,
  command: DeviceCommand
): Promise<DeviceCommandResponse> {
  return apiFetch<DeviceCommandResponse>(`/devices/${deviceId}/command`, {
    method: 'POST',
    body: JSON.stringify(command),
  });
}

/** Đếm số thiết bị online (tính từ data đã fetch) */
export function getOnlineDeviceCount(): { online: number; total: number } {
  return { online: 0, total: 0 };
}
