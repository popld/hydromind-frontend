export const queryKeys = {
  dashboard: {
    overview: ['dashboard', 'overview'] as const,
  },
  knowledge: {
    bases: (keyword?: string) => ['knowledge', 'bases', keyword ?? ''] as const,
    documents: (keyword?: string) => ['knowledge', 'documents', keyword ?? ''] as const,
    conversations: ['knowledge', 'conversations'] as const,
    messages: (conversationId?: string) => ['knowledge', 'messages', conversationId ?? ''] as const,
  },
  system: {
    users: (keyword?: string) => ['system', 'users', keyword ?? ''] as const,
    deptTree: ['system', 'dept-tree'] as const,
    posts: (keyword?: string) => ['system', 'posts', keyword ?? ''] as const,
    roles: (keyword?: string) => ['system', 'roles', keyword ?? ''] as const,
    menuTree: ['system', 'menu-tree'] as const,
    loginLogs: (keyword?: string) => ['system', 'login-logs', keyword ?? ''] as const,
    operationLogs: (keyword?: string) => ['system', 'operation-logs', keyword ?? ''] as const,
    settings: ['system', 'settings'] as const,
  },
};
