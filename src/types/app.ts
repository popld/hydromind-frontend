export type DataScope = 'all' | 'dept' | 'self';

export interface CurrentUser {
  id: string;
  username: string;
  nickname: string;
  deptName: string;
  roleCodes: string[];
  permissions: string[];
  dataScope: DataScope;
}

export interface InitialState {
  currentUser?: CurrentUser;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
  expiresIn: number;
}
