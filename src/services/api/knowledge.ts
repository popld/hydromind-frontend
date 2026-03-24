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

export async function deleteConversation(id: string) {
  return request<boolean>({
    url: `/v1/knowledge/conversations/${id}`,
    method: 'DELETE',
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
  const emitSseEvent = (rawBlock: string) => {
    const block = rawBlock.trim();
    if (!block) {
      return;
    }

    let eventName = 'message';
    const dataLines: string[] = [];

    for (const rawLine of block.split(/\r?\n/)) {
      const line = rawLine.trimEnd();
      if (!line || line.startsWith(':')) {
        continue;
      }

      const separatorIndex = line.indexOf(':');
      const field = separatorIndex >= 0 ? line.slice(0, separatorIndex) : line;
      let value = separatorIndex >= 0 ? line.slice(separatorIndex + 1) : '';
      if (value.startsWith(' ')) {
        value = value.slice(1);
      }

      if (field === 'event') {
        eventName = value || eventName;
      }
      if (field === 'data') {
        dataLines.push(value);
      }
    }

    if (dataLines.length === 0) {
      return;
    }

    const payload = JSON.parse(dataLines.join('\n')) as Record<string, unknown>;
    handlers.onEvent?.({
      type: eventName,
      ...payload,
    } as KnowledgeStreamEvent);
  };

  const response = await fetch(`${process.env.UMI_APP_API_BASE_URL || '/api'}/v1/knowledge/qa/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
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
      buffer += decoder.decode();
    } else {
      buffer += decoder.decode(value, { stream: true });
    }

    const chunks = buffer.split(/\r?\n\r?\n/);
    buffer = chunks.pop() ?? '';

    for (const chunk of chunks) {
      emitSseEvent(chunk);
    }

    if (done) {
      break;
    }
  }

  if (buffer.trim()) {
    emitSseEvent(buffer);
  }
}
