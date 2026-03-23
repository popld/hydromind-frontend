# admin 启动说明

`admin` 是氢枫企业管理 AI 系统当前阶段的主前端应用，对应 `toB` 管理后台。

当前目标不是一次把所有业务做完，而是先把这几块做成可运行基线：

- 登录与权限骨架
- 工作台首页
- 知识问答
- 知识库管理
- 用户/部门/岗位/角色/菜单管理
- 日志与系统设置
- Mock 接口

## 推荐初始化方式

建议使用：

- `Umi Max`
- `Ant Design Pro`
- `pnpm`

如果本机暂时没有 `pnpm`，也可以直接用 `npm` 安装和启动。

建议首装依赖：

```text
@umijs/max
antd
@ant-design/pro-components
zustand
@tanstack/react-query
axios
react-markdown
remark-gfm
echarts
echarts-for-react
```

## 目标目录

```text
admin/
├── mock/
├── config/
├── src/
│   ├── layouts/
│   ├── modules/
│   ├── services/
│   ├── stores/
│   ├── queries/
│   ├── components/
│   ├── mock-data/
│   ├── types/
│   └── utils/
└── docs/
```

## 首批页面

- `/dashboard`
- `/knowledge/qa`
- `/knowledge/base`
- `/knowledge/document`
- `/system/user`
- `/system/dept`
- `/system/post`
- `/system/role`
- `/system/menu`
- `/system/logs/login`
- `/system/logs/operation`
- `/system/setting`

## 开发约定

- 页面层不直接写假数据
- 所有假数据统一放在 `mock/` 和 `src/mock-data/`
- 页面层只调用 `src/services/api/*`
- 接口统一使用 `/api/v1`
- 问答页首版先做非流式，后续再切 SSE

## 启动命令

推荐：

```bash
pnpm install
pnpm dev
```

备用：

```bash
npm install
npm run dev
```

## 当前文档

- 总方案：[`氢枫企业管理AI系统前端可落地技术架构方案.md`](D:\workspace\氢枫企业管理AI系统前端可落地技术架构方案.md)
- 接口与 Mock 约定：[`API_MOCK_约定.md`](D:\workspace\admin\docs\API_MOCK_约定.md)

## 下一步建议

如果要继续往下做，建议优先补这几类能力：

- `system` 和 `knowledge` 的增删改弹窗表单
- `PermissionButton` 的页面级接入
- 知识问答的流式 SSE 切换
- 登录登出与企业 SSO 对接
- 表单校验和错误边界
