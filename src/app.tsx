import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { RunTimeLayoutConfig } from '@umijs/max';
import { history } from '@umijs/max';
import { Dropdown } from 'antd';
import { getCurrentUser } from '@/services/api/auth';
import { useAuthStore } from '@/stores/auth.store';
import type { InitialState } from '@/types/app';

const queryClient = new QueryClient();
const LOGIN_PATH = '/login';

export async function getInitialState(): Promise<InitialState> {
  const token = typeof window === 'undefined' ? '' : useAuthStore.getState().token;

  if (!token) {
    return {};
  }

  try {
    const currentUser = await getCurrentUser();
    return { currentUser };
  } catch {
    useAuthStore.getState().clearToken();
    if (history.location.pathname !== LOGIN_PATH) {
      history.push(LOGIN_PATH);
    }
    return {};
  }
}

export function rootContainer(container: ReactNode) {
  return createElement(QueryClientProvider, { client: queryClient }, container);
}

export const layout: RunTimeLayoutConfig = ({ initialState }) => {
  return {
    title: '氢枫企业管理 AI 系统',
    layout: 'mix',
    onPageChange: () => {
      const { location } = history;
      if (!initialState?.currentUser && location.pathname !== LOGIN_PATH) {
        history.push(LOGIN_PATH);
      }
    },
    avatarProps: {
      title: initialState?.currentUser?.nickname || '未登录',
      render: (_, dom) => (
        <Dropdown
          menu={{
            items: [{ key: 'logout', label: '退出登录' }],
            onClick: ({ key }) => {
              if (key === 'logout') {
                useAuthStore.getState().clearToken();
                history.push(LOGIN_PATH);
              }
            },
          }}
        >
          <span>{dom}</span>
        </Dropdown>
      ),
    },
  };
};
