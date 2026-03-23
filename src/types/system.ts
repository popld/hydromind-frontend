export interface UserItem {
  id: string;
  username: string;
  nickname: string;
  deptName: string;
  postNames: string[];
  roleNames: string[];
  status: 'enabled' | 'disabled';
  createdAt: string;
}

export interface UserFormPayload {
  username: string;
  nickname: string;
  deptName: string;
  postNames: string[];
  roleNames: string[];
  status: 'enabled' | 'disabled';
}

export interface DeptTreeItem {
  id: string;
  name: string;
  parentId?: string;
  children?: DeptTreeItem[];
}

export interface DeptFormPayload {
  name: string;
  parentId?: string;
}

export interface PostItem {
  id: string;
  name: string;
  code: string;
  status: 'enabled' | 'disabled';
}

export interface PostFormPayload {
  name: string;
  code: string;
  status: 'enabled' | 'disabled';
}

export interface RoleItem {
  id: string;
  name: string;
  code: string;
  permissions: string[];
  status: 'enabled' | 'disabled';
}

export interface RoleFormPayload {
  name: string;
  code: string;
  permissions: string[];
  status: 'enabled' | 'disabled';
}

export interface MenuItem {
  id: string;
  name: string;
  path: string;
  parentId?: string;
  permission?: string;
  children?: MenuItem[];
}

export interface MenuFormPayload {
  name: string;
  path: string;
  parentId?: string;
  permission?: string;
}

export interface LoginLogItem {
  id: string;
  username: string;
  ip: string;
  browser: string;
  status: 'success' | 'failed';
  loginAt: string;
}

export interface OperationLogItem {
  id: string;
  operator: string;
  action: string;
  target: string;
  status: 'success' | 'failed';
  createdAt: string;
}

export interface SystemSettings {
  appName: string;
  enableKnowledgeQa: boolean;
  enableOperationLog: boolean;
  enableLoginCaptcha: boolean;
  defaultKnowledgeBaseId: string;
}
