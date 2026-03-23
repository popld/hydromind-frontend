import { useQuery } from '@tanstack/react-query';
import { getDashboardOverview } from '@/services/api/dashboard';
import { queryKeys } from './keys';

export function useDashboardOverview() {
  return useQuery({
    queryKey: queryKeys.dashboard.overview,
    queryFn: getDashboardOverview,
  });
}
