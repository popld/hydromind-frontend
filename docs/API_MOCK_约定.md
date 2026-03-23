# API 与 Mock 约定

## 1. 目标

当前没有后端，因此前端按“正式接口 + 本地 Mock”开发：

- 页面只依赖接口函数
- 接口函数只依赖统一请求层
- Mock 与真实后端保持同一 URL 和同一响应结构

## 2. 统一响应结构

```ts
export interface ApiResponse<T> {
  code: number;
  message: string;
  success: boolean;
  data: T;
  traceId: string;
}

export interface PageResult<T> {
  list: T[];
  total: number;
  pageNum: number;
  pageSize: number;
}
```

成功示例：

```json
{
  "code": 0,
  "message": "ok",
  "success": true,
  "data": {},
  "traceId": "mock-trace-001"
}
```

## 3. 请求前缀

统一前缀：

```text
/api/v1
```

## 4. 首期接口清单

### 4.1 认证

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/current-user`

### 4.2 工作台

- `GET /api/v1/dashboard/overview`

### 4.3 用户与组织

- `GET /api/v1/system/users`
- `POST /api/v1/system/users`
- `PUT /api/v1/system/users/:id`
- `DELETE /api/v1/system/users/:id`

- `GET /api/v1/system/depts/tree`
- `POST /api/v1/system/depts`
- `PUT /api/v1/system/depts/:id`
- `DELETE /api/v1/system/depts/:id`

- `GET /api/v1/system/posts`
- `POST /api/v1/system/posts`
- `PUT /api/v1/system/posts/:id`
- `DELETE /api/v1/system/posts/:id`

- `GET /api/v1/system/roles`
- `POST /api/v1/system/roles`
- `PUT /api/v1/system/roles/:id`
- `DELETE /api/v1/system/roles/:id`

- `GET /api/v1/system/menus/tree`
- `POST /api/v1/system/menus`
- `PUT /api/v1/system/menus/:id`
- `DELETE /api/v1/system/menus/:id`

### 4.4 日志与设置

- `GET /api/v1/system/logs/login`
- `GET /api/v1/system/logs/operation`
- `GET /api/v1/system/settings`
- `PUT /api/v1/system/settings`

### 4.5 知识中心

- `GET /api/v1/knowledge/bases`
- `POST /api/v1/knowledge/bases`
- `PUT /api/v1/knowledge/bases/:id`
- `DELETE /api/v1/knowledge/bases/:id`

- `GET /api/v1/knowledge/documents`
- `POST /api/v1/knowledge/documents`
- `PUT /api/v1/knowledge/documents/:id`
- `DELETE /api/v1/knowledge/documents/:id`

- `GET /api/v1/knowledge/conversations`
- `POST /api/v1/knowledge/conversations`
- `GET /api/v1/knowledge/conversations/:id/messages`
- `POST /api/v1/knowledge/conversations/:id/messages`

- `POST /api/v1/knowledge/qa`
- `POST /api/v1/knowledge/qa/stream`

## 5. Mock 文件拆分

```text
mock/
  auth.ts
  dashboard.ts
  knowledge.ts
  system.ts

src/mock-data/
  auth.ts
  dashboard.ts
  users.ts
  roles.ts
  menus.ts
  knowledge-bases.ts
  conversations.ts
```

## 6. 类型建议

### 用户

```ts
export interface UserItem {
  id: string;
  username: string;
  nickname: string;
  deptId: string;
  postIds: string[];
  roleIds: string[];
  status: 'enabled' | 'disabled';
  createdAt: string;
}
```

### 角色

```ts
export interface RoleItem {
  id: string;
  name: string;
  code: string;
  permissions: string[];
  status: 'enabled' | 'disabled';
}
```

### 菜单

```ts
export interface MenuItem {
  id: string;
  parentId?: string;
  name: string;
  path: string;
  component?: string;
  icon?: string;
  permission?: string;
  children?: MenuItem[];
}
```

### 知识库

```ts
export interface KnowledgeBaseItem {
  id: string;
  name: string;
  description?: string;
  documentCount: number;
  status: 'enabled' | 'disabled';
  updatedAt: string;
}
```

### 问答结果

```ts
export interface KnowledgeAnswer {
  answerId: string;
  content: string;
  references: Array<{
    id: string;
    title: string;
    sourceType: 'document' | 'knowledge_base';
    snippet: string;
  }>;
  relatedBaseIds: string[];
}
```

## 7. 问答页实现约束

首版页面可以先不做流式，但要保持结构兼容流式：

- 输入区提交问题
- 立即插入一条用户消息
- 请求 `POST /api/v1/knowledge/qa`
- 返回后插入一条助手消息
- 同步展示 `references`

后续切换到流式时：

- 保留同样的消息结构
- 只把请求方法替换为 SSE 消费
- 页面组件不需要推翻重写

## 8. 切换真实后端时只改哪里

理论上只改三处：

1. `request.ts` 中的 `baseURL`
2. 鉴权头写法
3. 某些字段名与后端真实返回不一致的地方

页面层、组件层、列表层、表单层都不应该因为后端接入而重构。
