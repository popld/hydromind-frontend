import { request } from '@/services/request';
import type { DashboardOverview } from '@/types/dashboard';

export async function getDashboardOverview() {
  return request<DashboardOverview>({
    url: '/v1/dashboard/overview',
    method: 'GET',
  });
}
