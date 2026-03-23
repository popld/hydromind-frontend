import type { DashboardOverview } from '@/types/dashboard';

export const dashboardOverview: DashboardOverview = {
  metrics: [
    { key: 'qa', label: '本周问答次数', value: 218, unit: '次', trend: 12 },
    { key: 'users', label: '活跃用户', value: 86, unit: '人', trend: 8 },
    { key: 'bases', label: '知识库数量', value: 12, unit: '个', trend: 3 },
    { key: 'docs', label: '知识文档数量', value: 463, unit: '篇', trend: 15 },
  ],
  trend: [
    { date: '03-17', qaCount: 22, activeUsers: 40 },
    { date: '03-18', qaCount: 30, activeUsers: 55 },
    { date: '03-19', qaCount: 28, activeUsers: 48 },
    { date: '03-20', qaCount: 35, activeUsers: 63 },
    { date: '03-21', qaCount: 31, activeUsers: 59 },
    { date: '03-22', qaCount: 39, activeUsers: 71 },
    { date: '03-23', qaCount: 33, activeUsers: 66 },
  ],
  quickLinks: [
    { name: '知识问答', path: '/knowledge/qa', description: '进入企业知识问答工作台' },
    { name: '用户管理', path: '/system/user', description: '查看和维护系统账号' },
    { name: '菜单管理', path: '/system/menu', description: '维护管理后台菜单结构' },
  ],
  activities: [
    { id: 'act-1', title: '制度知识库完成更新', description: '新增 18 篇制度文档并完成索引。', createdAt: '2026-03-23 09:10' },
    { id: 'act-2', title: '登录安全策略调整', description: '管理员开启登录验证码策略。', createdAt: '2026-03-22 16:45' },
    { id: 'act-3', title: '角色权限同步完成', description: '项目经理角色新增审批查看权限。', createdAt: '2026-03-22 10:20' },
  ],
};
