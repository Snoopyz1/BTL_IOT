import { apiFetch } from './api';
import type { User, UserUpdatePayload } from '../types/user';

/** Lấy thông tin profile */
export async function getProfile(): Promise<User> {
  return apiFetch<User>('/profile');
}

/** Cập nhật thông tin profile */
export async function updateProfile(payload: UserUpdatePayload): Promise<User> {
  const res = await apiFetch<{ success: boolean; message: string; user: User }>('/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return res.user;
}
