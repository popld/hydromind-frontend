import { request } from '@/services/request';
import type { PageParams, PageResult } from '@/types/api';
import type {
  AskKnowledgePayload,
  ConversationMessage,
  ConversationSummary,
  KnowledgeAnswer,
  KnowledgeBaseFormPayload,
  KnowledgeBaseItem,
  KnowledgeDocumentFormPayload,
  KnowledgeDocumentItem,
  KnowledgeStreamEvent,
} from '@/types/knowledge';

export async function getKnowledgeBases(params?: PageParams) {
  return request<PageResult<KnowledgeBaseItem>>({
    url: '/v1/knowledge/bases',
    method: 'GET',
    params,
  });
}

export async function createKnowledgeBase(data: KnowledgeBaseFormPayload) {
  return request<KnowledgeBaseItem>({
    url: '/v1/knowledge/bases',
    method: 'POST',
    data,
  });
}

export async function updateKnowledgeBase(id: string, data: KnowledgeBaseFormPayload) {
  return request<KnowledgeBaseItem>({
    url: `/v1/knowledge/bases/${id}`,
    method: 'PUT',
    data,
  });
}

export async function deleteKnowledgeBase(id: string) {
  return request<boolean>({
    url: `/v1/knowledge/bases/${id}`,
    method: 'DELETE',
  });
}

export async function getKnowledgeDocuments(params?: PageParams) {
  return request<PageResult<KnowledgeDocumentItem>>({
    url: '/v1/knowledge/documents',
    method: 'GET',
    params,
  });
}

export async function createKnowledgeDocument(data: KnowledgeDocumentFormPayload) {
  return request<KnowledgeDocumentItem>({
    url: '/v1/knowledge/documents',
    method: 'POST',
    data,
  });
}

export async function updateKnowledgeDocument(id: string, data: KnowledgeDocumentFormPayload) {
  return request<KnowledgeDocumentItem>({
    url: `/v1/knowledge/documents/${id}`,
    method: 'PUT',
    data,
  });
}

export async function deleteKnowledgeDocument(id: string) {
  return request<boolean>({
    url: `/v1/knowledge/documents/${id}`,
    method: 'DELETE',
  });
}

export async function getConversations() {
  return request<ConversationSummary[]>({
    url: '/v1/knowledge/conversations',
    method: 'GET',
  });
}

export async function createConversation(title: string) {
  return request<ConversationSummary>({
    url: '/v1/knowledge/conversations',
    method: 'POST',
    data: { title },
  });
}

export async function renameConversation(id: string, title: string) {
  return request<ConversationSummary>({
    url: `/v1/knowledge/conversations/${id}`,
    method: 'PUT',
    data: { title },
  });
}

export async function getConversationMessages(conversationId: string) {
  return request<ConversationMessage[]>({
    url: `/v1/knowledge/conversations/${conversationId}/messages`,
    method: 'GET',
  });
}

export async function askKnowledge(data: AskKnowledgePayload) {
  return request<KnowledgeAnswer>({
    url: '/v1/knowledge/qa',
    method: 'POST',
    data,
  });
}

export async function askKnowledgeStream(
  data: AskKnowledgePayload,
  handlers: {
    onEvent?: (event: KnowledgeStreamEvent) => void;
    signal?: AbortSignal;
  },
) {
  const response = await fetch(`${process.env.UMI_APP_API_BASE_URL || '/api'}/v1/knowledge/qa/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    signal: handlers.signal,
  });

  if (!response.ok || !response.body) {
    throw new Error('流式问答请求失败');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }
      handlers.onEvent?.(JSON.parse(trimmed) as KnowledgeStreamEvent);
    }
  }

  if (buffer.trim()) {
    handlers.onEvent?.(JSON.parse(buffer.trim()) as KnowledgeStreamEvent);
  }
}
