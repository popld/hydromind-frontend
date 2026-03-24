# 知识问答接口对接文档  
 
## 当前对接的接口主要是 2.8 流式问答

## 1. 目标

知识问答页面与悬浮助手共用同一套会话与消息接口。

流式问答接口统一采用：

- `POST` 请求
- `text/event-stream` 标准 SSE 响应
- 事件语义化输出：`start`、`delta`、`references`、`done`

## 2. 接口清单

### 2.1 获取知识库列表

- Method: `GET`
- URL: `/v1/knowledge/bases`

Query 参数：

```json
{
  "pageNum": 1,
  "pageSize": 100,
  "keyword": "",
  "status": ""
}
```

响应示例：

```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "id": "kb-1",
        "name": "企业制度库",
        "description": "企业制度汇总",
        "ownerUsername": "admin",
        "documentCount": 12,
        "status": "enabled",
        "updatedAt": "2026-03-24 15:00"
      }
    ],
    "total": 1,
    "pageNum": 1,
    "pageSize": 100
  }
}
```

### 2.2 获取会话列表

- Method: `GET`
- URL: `/v1/knowledge/conversations`

响应示例：

```json
{
  "code": 0,
  "data": [
    {
      "id": "conv-1",
      "title": "员工请假审批流程",
      "updatedAt": "2026-03-24 15:10"
    }
  ]
}
```

### 2.3 新建会话

- Method: `POST`
- URL: `/v1/knowledge/conversations`

请求体：

```json
{
  "title": "员工请假审批流程"
}
```

响应示例：

```json
{
  "code": 0,
  "data": {
    "id": "conv-1",
    "title": "员工请假审批流程",
    "updatedAt": "2026-03-24 15:10"
  }
}
```

### 2.4 重命名会话

- Method: `PUT`
- URL: `/v1/knowledge/conversations/{id}`

请求体：

```json
{
  "title": "新的会话标题"
}
```

### 2.5 删除会话

- Method: `DELETE`
- URL: `/v1/knowledge/conversations/{id}`

响应示例：

```json
{
  "code": 0,
  "data": true
}
```

### 2.6 获取会话消息

- Method: `GET`
- URL: `/v1/knowledge/conversations/{id}/messages`

响应示例：

```json
{
  "code": 0,
  "data": [
    {
      "id": "msg-user-1",
      "role": "user",
      "content": "员工请假审批流程是什么？",
      "createdAt": "2026-03-24 15:10"
    },
    {
      "id": "msg-assistant-1",
      "role": "assistant",
      "content": "请假流程通常由申请、直属上级审批、HR 备案组成。",
      "createdAt": "2026-03-24 15:10",
      "references": [
        {
          "id": "ref-1",
          "title": "员工请假管理制度",
          "sourceType": "document",
          "snippet": "请假流程通常由申请、直属上级审批、HR 备案组成。"
        }
      ]
    }
  ]
}
```

### 2.7 非流式问答

- Method: `POST`
- URL: `/v1/knowledge/qa`

请求体：

```json
{
  "conversationId": "conv-1",
  "question": "员工请假审批流程是什么？",
  "baseIds": ["kb-1", "kb-2"]
}
```

响应示例：

```json
{
  "code": 0,
  "data": {
    "answerId": "msg-assistant-1",
    "conversationId": "conv-1",
    "content": "请假流程通常由申请、直属上级审批、HR 备案组成。",
    "references": [
      {
        "id": "ref-1",
        "title": "员工请假管理制度",
        "sourceType": "document",
        "snippet": "请假流程通常由申请、直属上级审批、HR 备案组成。"
      }
    ],
    "relatedBaseIds": ["kb-1", "kb-2"]
  }
}
```

### 2.8 流式问答

- Method: `POST`
- URL: `/v1/knowledge/qa/stream`
- Request Header:
  - `Content-Type: application/json`
  - `Accept: text/event-stream`

请求体：

```json
{
  "conversationId": "conv-1",
  "question": "员工请假审批流程是什么？",
  "baseIds": ["kb-1", "kb-2"]
}
```

响应头：

```http
Content-Type: text/event-stream; charset=utf-8
Cache-Control: no-cache
Connection: keep-alive
X-Accel-Buffering: no
Transfer-Encoding: chunked
```

## 3. SSE 事件格式

服务端必须返回标准 SSE 块，事件块之间使用空行分隔。

### 3.1 start

```txt
event: start
data: {"answerId":"msg-assistant-1","conversationId":"conv-1"}

```

### 3.2 delta

```txt
event: delta
data: {"content":"请假流程通常由"}

```

### 3.3 references

```txt
event: references
data: {"references":[{"id":"ref-1","title":"员工请假管理制度","sourceType":"document","snippet":"请假流程通常由申请、直属上级审批、HR 备案组成。"}],"relatedBaseIds":["kb-1","kb-2"]}

```

### 3.4 done

```txt
event: done
data: {"answerId":"msg-assistant-1","conversationId":"conv-1"}

```

### 3.5 推荐补充 error

前端当前主链路未强依赖，但建议后端补充：

```txt
event: error
data: {"message":"问答生成失败"}

```

## 4. 字段定义

### 4.1 ConversationSummary

```json
{
  "id": "string",
  "title": "string",
  "updatedAt": "yyyy-MM-dd HH:mm"
}
```

### 4.2 KnowledgeReference

```json
{
  "id": "string",
  "title": "string",
  "sourceType": "document | knowledge_base",
  "snippet": "string"
}
```

### 4.3 ConversationMessage

```json
{
  "id": "string",
  "role": "user | assistant",
  "content": "string",
  "createdAt": "yyyy-MM-dd HH:mm",
  "references": []
}
```

## 5. 对接约束

- 前端会先创建会话，再调用问答接口。
- `conversationId` 目前为必传。
- `baseIds` 目前为数组，至少会有一个知识库 id。
- 流式回答完成后，后端应保证消息已经持久化，随后前端会刷新：
  - 会话列表
  - 当前会话消息列表
- 用户点击“停止回答”时，前端会中断请求；后端应允许连接被主动关闭。

## 6. 当前前端消费逻辑

前端流式消费顺序：

1. 收到 `start`，记录 `conversationId`
2. 收到多个 `delta`，逐段拼接答案
3. 收到 `references`，更新引用卡片
4. 收到 `done`，结束流式展示并刷新会话数据

## 7. 推荐实现建议

- 不要返回 NDJSON
- 不要把多个 JSON 直接按换行输出
- 必须按标准 SSE 输出 `event:` 和 `data:`
- 每个事件块后必须跟一个空行
- 编码使用 UTF-8
- 如果网关有缓冲，务必关闭缓冲
