import { apiFetch } from './api';
import type { User } from '../types/user';
import type { LoginPayload, RegisterPayload, AuthResponse } from '../types/auth';

const TOKEN_KEY = 'smarthome_auth_token';
const USER_KEY = 'smarthome_auth_user';

/** Đăng nhập — gọi API thật */
export async function login(payload: LoginPayload): Promise<AuthResponse> {
  try {
    const res = await apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.success && res.token && res.user) {
      localStorage.setItem(TOKEN_KEY, res.token);
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    }

    return res;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Đăng nhập thất bại!',
    };
  }
}

/** Đăng ký tài khoản — gọi API thật */
export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  try {
    const res = await apiFetch<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.success && res.token && res.user) {
      localStorage.setItem(TOKEN_KEY, res.token);
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    }

    return res;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Đăng ký thất bại!',
    };
  }
}

/** Lấy session hiện tại từ localStorage */
export function getCurrentUser(): { user: User | null; token: string | null } {
  const token = localStorage.getItem(TOKEN_KEY);
  const userStr = localStorage.getItem(USER_KEY);

  if (!token || !userStr) {
    return { user: null, token: null };
  }

  try {
    const user = JSON.parse(userStr);
    return { user, token };
  } catch {
    return { user: null, token: null };
  }
}

/** Đăng xuất */
export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/** Xác thực token */
export async function verifyToken(): Promise<boolean> {
  try {
    await apiFetch('/auth/me');
    return true;
  } catch {
    return false;
  }
}
