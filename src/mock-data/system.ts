import type {
  DeptTreeItem,
  LoginLogItem,
  MenuItem,
  OperationLogItem,
  PostItem,
  RoleItem,
  SystemSettings,
  UserItem,
} from '@/types/system';

export const users: UserItem[] = [
  {
    id: 'u-1',
    username: 'admin',
    nickname: '系统管理员',
    deptName: '信息中心',
    postNames: ['系统管理员'],
    roleNames: ['超级管理员'],
    status: 'enabled',
    createdAt: '2026-03-01 09:00',
  },
  {
    id: 'u-2',
    username: 'zhangsan',
    nickname: '张三',
    deptName: '项目管理部',
    postNames: ['项目经理'],
    roleNames: ['项目经理'],
    status: 'enabled',
    createdAt: '2026-03-10 10:20',
  },
  {
    id: 'u-3',
    username: 'lisi',
    nickname: '李四',
    deptName: '综合管理部',
    postNames: ['专员'],
    roleNames: ['普通员工'],
    status: 'disabled',
    createdAt: '2026-03-12 14:30',
  },
];

export const deptTree: DeptTreeItem[] = [
  {
    id: 'dept-root',
    name: '氢枫集团',
    children: [
      { id: 'dept-1', name: '信息中心', parentId: 'dept-root' },
      { id: 'dept-2', name: '项目管理部', parentId: 'dept-root' },
      { id: 'dept-3', name: '综合管理部', parentId: 'dept-root' },
    ],
  },
];

export const posts: PostItem[] = [
  { id: 'post-1', name: '系统管理员', code: 'sys_admin', status: 'enabled' },
  { id: 'post-2', name: '项目经理', code: 'project_manager', status: 'enabled' },
  { id: 'post-3', name: '专员', code: 'staff', status: 'enabled' },
];

export const roles: RoleItem[] = [
  { id: 'role-1', name: '超级管理员', code: 'super_admin', permissions: ['*:*:*'], status: 'enabled' },
  { id: 'role-2', name: '项目经理', code: 'project_manager', permissions: ['knowledge:qa:use', 'system:user:view'], status: 'enabled' },
  { id: 'role-3', name: '普通员工', code: 'staff', permissions: ['knowledge:qa:use'], status: 'enabled' },
];

export const menuTree: MenuItem[] = [
  { id: 'menu-1', name: '工作台', path: '/dashboard', permission: 'dashboard:view' },
  {
    id: 'menu-2',
    name: '知识中心',
    path: '/knowledge',
    children: [
      { id: 'menu-2-1', name: '知识问答', path: '/knowledge/qa', parentId: 'menu-2', permission: 'knowledge:qa:use' },
      { id: 'menu-2-2', name: '知识库管理', path: '/knowledge/base', parentId: 'menu-2', permission: 'knowledge:base:view' },
      { id: 'menu-2-3', name: '文档管理', path: '/knowledge/document', parentId: 'menu-2', permission: 'knowledge:document:view' },
    ],
  },
  {
    id: 'menu-3',
    name: '系统管理',
    path: '/system',
    children: [
      { id: 'menu-3-1', name: '用户管理', path: '/system/user', parentId: 'menu-3', permission: 'system:user:view' },
      { id: 'menu-3-2', name: '角色管理', path: '/system/role', parentId: 'menu-3', permission: 'system:role:view' },
      { id: 'menu-3-3', name: '菜单管理', path: '/system/menu', parentId: 'menu-3', permission: 'system:menu:view' },
    ],
  },
];

export const loginLogs: LoginLogItem[] = [
  { id: 'log-login-1', username: 'admin', ip: '10.0.0.8', browser: 'Chrome', status: 'success', loginAt: '2026-03-23 08:50' },
  { id: 'log-login-2', username: 'zhangsan', ip: '10.0.0.9', browser: 'Edge', status: 'success', loginAt: '2026-03-23 08:47' },
  { id: 'log-login-3', username: 'lisi', ip: '10.0.0.10', browser: 'Chrome', status: 'failed', loginAt: '2026-03-22 20:10' },
];

export const operationLogs: OperationLogItem[] = [
  { id: 'log-op-1', operator: 'admin', action: '更新系统设置', target: '系统设置', status: 'success', createdAt: '2026-03-23 09:20' },
  { id: 'log-op-2', operator: 'admin', action: '新增知识库', target: '企业制度库', status: 'success', createdAt: '2026-03-22 16:40' },
  { id: 'log-op-3', operator: 'zhangsan', action: '查看用户列表', target: '用户管理', status: 'success', createdAt: '2026-03-22 10:05' },
];

export let systemSettings: SystemSettings = {
  appName: '氢枫企业管理 AI 系统',
  enableKnowledgeQa: true,
  enableOperationLog: true,
  enableLoginCaptcha: false,
  defaultKnowledgeBaseId: 'kb-1',
};
