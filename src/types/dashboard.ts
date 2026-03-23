export interface DashboardMetric {
  key: string;
  label: string;
  value: number;
  unit?: string;
  trend?: number;
}

export interface DashboardTrendPoint {
  date: string;
  qaCount: number;
  activeUsers: number;
}

export interface DashboardOverview {
  metrics: DashboardMetric[];
  trend: DashboardTrendPoint[];
  quickLinks: Array<{
    name: string;
    path: string;
    description: string;
  }>;
  activities: Array<{
    id: string;
    title: string;
    description: string;
    createdAt: string;
  }>;
}
