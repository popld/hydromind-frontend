import type { InitialState } from '@/types/app';

export default function access(initialState: InitialState | undefined) {
  const currentUser = initialState?.currentUser;
  const permissions = new Set(currentUser?.permissions ?? []);
  const isLoggedIn = Boolean(currentUser);
  const hasPermission = (permission?: string) => {
    if (!isLoggedIn) {
      return false;
    }
    if (!permission) {
      return true;
    }
    return permissions.has('*:*:*') || permissions.has(permission);
  };

  const applyDataScope = <T extends Record<string, any>>(records: T[]) => {
    if (!currentUser) {
      return [];
    }
    if (currentUser.dataScope === 'all') {
      return records;
    }
    if (currentUser.dataScope === 'dept') {
      return records.filter((item) => item.deptName === currentUser.deptName);
    }
    return records.filter(
      (item) =>
        item.username === currentUser.username ||
        item.operator === currentUser.username ||
        item.ownerUsername === currentUser.username,
    );
  };

  return {
    currentUser,
    hasPermission,
    applyDataScope,
    canDashboard: isLoggedIn,
    canKnowledgeQa: hasPermission('knowledge:qa:use'),
    canKnowledgeBase: hasPermission('knowledge:base:view'),
    canKnowledgeDocument: hasPermission('knowledge:document:view'),
    canSystemUser: hasPermission('system:user:view'),
    canSystemDept: hasPermission('system:dept:view'),
    canSystemPost: hasPermission('system:post:view'),
    canSystemRole: hasPermission('system:role:view'),
    canSystemMenu: hasPermission('system:menu:view'),
    canSystemLogLogin: hasPermission('system:log:login:view'),
    canSystemLogOperation: hasPermission('system:log:operation:view'),
    canSystemSetting: hasPermission('system:setting:view'),
  };
}
