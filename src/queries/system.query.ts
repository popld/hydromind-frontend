import { useQuery } from '@tanstack/react-query';
import {
  getDeptTree,
  getLoginLogs,
  getMenuTree,
  getOperationLogs,
  getPosts,
  getRoles,
  getSystemSettings,
  getUsers,
} from '@/services/api/system';
import { queryKeys } from './keys';

export function useUserPage(keyword?: string) {
  return useQuery({
    queryKey: queryKeys.system.users(keyword),
    queryFn: () => getUsers({ pageNum: 1, pageSize: 100, keyword }),
  });
}

export function useDeptTree() {
  return useQuery({
    queryKey: queryKeys.system.deptTree,
    queryFn: getDeptTree,
  });
}

export function usePostPage(keyword?: string) {
  return useQuery({
    queryKey: queryKeys.system.posts(keyword),
    queryFn: () => getPosts({ pageNum: 1, pageSize: 100, keyword }),
  });
}

export function useRolePage(keyword?: string) {
  return useQuery({
    queryKey: queryKeys.system.roles(keyword),
    queryFn: () => getRoles({ pageNum: 1, pageSize: 100, keyword }),
  });
}

export function useMenuTree() {
  return useQuery({
    queryKey: queryKeys.system.menuTree,
    queryFn: getMenuTree,
  });
}

export function useLoginLogPage(keyword?: string) {
  return useQuery({
    queryKey: queryKeys.system.loginLogs(keyword),
    queryFn: () => getLoginLogs({ pageNum: 1, pageSize: 100, keyword }),
  });
}

export function useOperationLogPage(keyword?: string) {
  return useQuery({
    queryKey: queryKeys.system.operationLogs(keyword),
    queryFn: () => getOperationLogs({ pageNum: 1, pageSize: 100, keyword }),
  });
}

export function useSystemSettings() {
  return useQuery({
    queryKey: queryKeys.system.settings,
    queryFn: getSystemSettings,
  });
}
