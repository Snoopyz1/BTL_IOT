import { apiFetch } from './api';
import type { Sensor, SensorDataQuery, SensorDataResponse } from '../types/sensor';

/** Lấy danh sách tất cả cảm biến */
export async function getSensors(): Promise<Sensor[]> {
  return apiFetch<Sensor[]>('/sensors');
}

/** Lấy thông tin cảm biến theo ID */
export async function getSensorById(id: string): Promise<Sensor | undefined> {
  try {
    return await apiFetch<Sensor>(`/sensors/${id}`);
  } catch {
    return undefined;
  }
}

/** Lấy dữ liệu lịch sử cảm biến với filter và phân trang */
export async function getSensorData(query: SensorDataQuery): Promise<SensorDataResponse> {
  const params = new URLSearchParams();

  if (query.sensorId) params.set('sensorId', query.sensorId);
  if (query.sensorType) params.set('sensorType', query.sensorType);
  if (query.time) params.set('time', query.time);
  if (query.search) params.set('search', query.search);
  if (query.from) params.set('from', query.from);
  if (query.to) params.set('to', query.to);
  params.set('page', String(query.page));
  params.set('limit', String(query.limit));

  return apiFetch<SensorDataResponse>(`/sensor-data?${params.toString()}`);
}
