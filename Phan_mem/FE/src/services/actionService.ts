import { apiFetch } from './api';
import type { ActionQuery, ActionResponse } from '../types/action';
import type { Device } from '../types/device';

/** Lấy lịch sử điều khiển thiết bị với filter và phân trang */
export async function getActions(query: ActionQuery): Promise<ActionResponse> {
  const params = new URLSearchParams();

  if (query.deviceId) params.set('deviceId', query.deviceId);
  if (query.action) params.set('action', query.action);
  if (query.status) params.set('status', query.status);
  if (query.time) params.set('time', query.time);
  if (query.from) params.set('from', query.from);
  if (query.to) params.set('to', query.to);
  params.set('page', String(query.page));
  params.set('limit', String(query.limit));

  return apiFetch<ActionResponse>(`/actions?${params.toString()}`);
}

/** Lấy danh sách thiết bị cho dropdown filter */
export async function getActionDevices(): Promise<Array<{ id: string; name: string }>> {
  const devices = await apiFetch<Device[]>('/devices');
  return devices.map((d) => ({ id: d.id, name: d.name }));
}
