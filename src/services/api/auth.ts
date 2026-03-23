import { request } from '@/services/request';
import type { CurrentUser, LoginPayload, LoginResult } from '@/types/app';

export async function login(data: LoginPayload) {
  return request<LoginResult>({
    url: '/v1/auth/login',
    method: 'POST',
    data,
  });
}

export async function logout() {
  return request<boolean>({
    url: '/v1/auth/logout',
    method: 'POST',
  });
}

export async function getCurrentUser() {
  return request<CurrentUser>({
    url: '/v1/auth/current-user',
    method: 'GET',
  });
}
