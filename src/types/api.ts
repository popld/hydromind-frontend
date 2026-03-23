export interface ApiResponse<T> {
  code: number;
  message: string;
  success: boolean;
  data: T;
  traceId: string;
}

export interface PageParams {
  pageNum?: number;
  pageSize?: number;
  keyword?: string;
  status?: string;
  baseId?: string;
  [key: string]: unknown;
}

export interface PageResult<T> {
  list: T[];
  total: number;
  pageNum: number;
  pageSize: number;
}
