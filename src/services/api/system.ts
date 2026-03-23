import { request } from '@/services/request';
import type { PageParams, PageResult } from '@/types/api';
import type {
  DeptFormPayload,
  DeptTreeItem,
  LoginLogItem,
  MenuFormPayload,
  MenuItem,
  OperationLogItem,
  PostFormPayload,
  PostItem,
  RoleFormPayload,
  RoleItem,
  SystemSettings,
  UserFormPayload,
  UserItem,
} from '@/types/system';

export async function getUsers(params?: PageParams) {
  return request<PageResult<UserItem>>({
    url: '/v1/system/users',
    method: 'GET',
    params,
  });
}

export async function createUser(data: UserFormPayload) {
  return request<UserItem>({
    url: '/v1/system/users',
    method: 'POST',
    data,
  });
}

export async function updateUser(id: string, data: UserFormPayload) {
  return request<UserItem>({
    url: `/v1/system/users/${id}`,
    method: 'PUT',
    data,
  });
}

export async function deleteUser(id: string) {
  return request<boolean>({
    url: `/v1/system/users/${id}`,
    method: 'DELETE',
  });
}

export async function getDeptTree() {
  return request<DeptTreeItem[]>({
    url: '/v1/system/depts/tree',
    method: 'GET',
  });
}

export async function createDept(data: DeptFormPayload) {
  return request<DeptTreeItem>({
    url: '/v1/system/depts',
    method: 'POST',
    data,
  });
}

export async function updateDept(id: string, data: DeptFormPayload) {
  return request<DeptTreeItem>({
    url: `/v1/system/depts/${id}`,
    method: 'PUT',
    data,
  });
}

export async function deleteDept(id: string) {
  return request<boolean>({
    url: `/v1/system/depts/${id}`,
    method: 'DELETE',
  });
}

export async function getPosts(params?: PageParams) {
  return request<PageResult<PostItem>>({
    url: '/v1/system/posts',
    method: 'GET',
    params,
  });
}

export async function createPost(data: PostFormPayload) {
  return request<PostItem>({
    url: '/v1/system/posts',
    method: 'POST',
    data,
  });
}

export async function updatePost(id: string, data: PostFormPayload) {
  return request<PostItem>({
    url: `/v1/system/posts/${id}`,
    method: 'PUT',
    data,
  });
}

export async function deletePost(id: string) {
  return request<boolean>({
    url: `/v1/system/posts/${id}`,
    method: 'DELETE',
  });
}

export async function getRoles(params?: PageParams) {
  return request<PageResult<RoleItem>>({
    url: '/v1/system/roles',
    method: 'GET',
    params,
  });
}

export async function createRole(data: RoleFormPayload) {
  return request<RoleItem>({
    url: '/v1/system/roles',
    method: 'POST',
    data,
  });
}

export async function updateRole(id: string, data: RoleFormPayload) {
  return request<RoleItem>({
    url: `/v1/system/roles/${id}`,
    method: 'PUT',
    data,
  });
}

export async function deleteRole(id: string) {
  return request<boolean>({
    url: `/v1/system/roles/${id}`,
    method: 'DELETE',
  });
}

export async function getMenuTree() {
  return request<MenuItem[]>({
    url: '/v1/system/menus/tree',
    method: 'GET',
  });
}

export async function createMenu(data: MenuFormPayload) {
  return request<MenuItem>({
    url: '/v1/system/menus',
    method: 'POST',
    data,
  });
}

export async function updateMenu(id: string, data: MenuFormPayload) {
  return request<MenuItem>({
    url: `/v1/system/menus/${id}`,
    method: 'PUT',
    data,
  });
}

export async function deleteMenu(id: string) {
  return request<boolean>({
    url: `/v1/system/menus/${id}`,
    method: 'DELETE',
  });
}

export async function getLoginLogs(params?: PageParams) {
  return request<PageResult<LoginLogItem>>({
    url: '/v1/system/logs/login',
    method: 'GET',
    params,
  });
}

export async function getOperationLogs(params?: PageParams) {
  return request<PageResult<OperationLogItem>>({
    url: '/v1/system/logs/operation',
    method: 'GET',
    params,
  });
}

export async function getSystemSettings() {
  return request<SystemSettings>({
    url: '/v1/system/settings',
    method: 'GET',
  });
}

export async function updateSystemSettings(data: SystemSettings) {
  return request<SystemSettings>({
    url: '/v1/system/settings',
    method: 'PUT',
    data,
  });
}
