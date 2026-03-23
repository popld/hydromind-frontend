import { defineConfig } from '@umijs/max';
import proxy from './proxy';
import routes from './routes';

export default defineConfig({
  npmClient: 'pnpm',
  hash: true,
  antd: {},
  access: {},
  model: {},
  request: {},
  initialState: {},
  layout: {
    title: '氢枫企业管理 AI 系统',
    locale: false,
    siderWidth: 224,
  },
  routes,
  proxy,
  esbuildMinifyIIFE: true,
});
