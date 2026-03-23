import type { PageResult } from '@/types/api';

export function buildResponse<T>(data: T) {
  return {
    code: 0,
    message: 'ok',
    success: true,
    data,
    traceId: `mock-${Date.now()}`,
  };
}

export function buildPageResult<T>(source: T[], pageNum = 1, pageSize = 10): PageResult<T> {
  const start = (pageNum - 1) * pageSize;
  const end = start + pageSize;
  return {
    list: source.slice(start, end),
    total: source.length,
    pageNum,
    pageSize,
  };
}

export function keywordFilter<T>(source: T[], keyword: string | undefined, fields: Array<keyof T>) {
  if (!keyword) {
    return source;
  }
  const normalized = keyword.toLowerCase();
  return source.filter((item) =>
    fields.some((field) => String(item[field] ?? '').toLowerCase().includes(normalized)),
  );
}
