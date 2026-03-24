import {
  conversationMessages,
  conversations,
  knowledgeBases,
  knowledgeDocuments,
} from '../src/mock-data/knowledge';
import type { KnowledgeBaseItem, KnowledgeDocumentItem, KnowledgeReference } from '../src/types/knowledge';
import { buildPageResult, buildResponse, keywordFilter } from './_utils';

function nowText() {
  return new Date().toISOString().slice(0, 16).replace('T', ' ');
}

function buildAnswer(question: string) {
  const references: KnowledgeReference[] = [
    {
      id: 'ref-auto-1',
      title: '员工请假管理制度',
      sourceType: 'document',
      snippet: '请假流程通常由申请、直属上级审批、HR 备案组成。',
    },
    {
      id: 'ref-auto-2',
      title: '企业制度库',
      sourceType: 'knowledge_base',
      snippet: '当前回答参考了企业制度库与流程规范库中的相关条目。',
    },
  ];

  const content = `这是 Mock 流式回答。针对你的问题“${question}”，当前系统会先结合制度流程、角色权限和知识库引用逐段生成答案，并在结束时返回证据引用。后续这里可以直接替换为真实大模型与 RAG 检索链路。`;

  return { content, references };
}

function ensureConversation(conversationId: string | undefined, question: string) {
  if (conversationId) {
    return conversationId;
  }

  const nextConversationId = `conv-${Date.now()}`;
  const conversation = {
    id: nextConversationId,
    title: question.slice(0, 12) || '新会话',
    updatedAt: nowText(),
  };

  conversations.unshift(conversation);
  conversationMessages[nextConversationId] = [];

  return nextConversationId;
}

function writeSseEvent(res: any, event: string, data: Record<string, unknown>) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function splitStreamingContent(content: string) {
  const normalizedContent = content.trim();
  if (!normalizedContent) {
    return [''];
  }

  const chunks: string[] = [];
  let currentChunk = '';

  for (const char of normalizedContent) {
    currentChunk += char;

    if (/[，。！？；：,.!?;:]/.test(char) || currentChunk.length >= 2) {
      chunks.push(currentChunk);
      currentChunk = '';
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

function appendMessages(conversationId: string, question: string, answer: string, references: KnowledgeReference[]) {
  const now = nowText();
  const userMessage = {
    id: `msg-user-${Date.now()}`,
    role: 'user' as const,
    content: question,
    createdAt: now,
  };
  const assistantMessage = {
    id: `msg-assistant-${Date.now() + 1}`,
    role: 'assistant' as const,
    content: answer,
    createdAt: now,
    references,
  };

  if (!conversationMessages[conversationId]) {
    conversationMessages[conversationId] = [];
  }

  conversationMessages[conversationId].push(userMessage, assistantMessage);
  const conversation = conversations.find((item) => item.id === conversationId);
  if (conversation) {
    conversation.updatedAt = now;
    conversation.title = question.slice(0, 12);
  }

  return assistantMessage;
}

function syncBaseDocumentCount(baseId: string) {
  const base = knowledgeBases.find((item) => item.id === baseId);
  if (base) {
    base.documentCount = knowledgeDocuments.filter((item) => item.baseId === baseId).length;
    base.updatedAt = nowText();
  }
}

function getFilteredBases(query: any) {
  const { keyword, status } = query || {};
  let filtered = keywordFilter(knowledgeBases, keyword, ['name', 'description', 'ownerUsername']);
  if (status) {
    filtered = filtered.filter((item) => item.status === status);
  }
  return filtered;
}

function getFilteredDocuments(query: any) {
  const { keyword, status, baseId } = query || {};
  let filtered = keywordFilter(knowledgeDocuments, keyword, ['title', 'baseName', 'ownerUsername']);
  if (status) {
    filtered = filtered.filter((item) => item.status === status);
  }
  if (baseId) {
    filtered = filtered.filter((item) => item.baseId === baseId);
  }
  return filtered;
}

export default {
  'GET /api/v1/knowledge/bases': (req: any, res: any) => {
    const { pageNum = 1, pageSize = 10 } = req.query || {};
    const filtered = getFilteredBases(req.query);
    res.send(buildResponse(buildPageResult(filtered, Number(pageNum), Number(pageSize))));
  },
  'POST /api/v1/knowledge/bases': (req: any, res: any) => {
    const item: KnowledgeBaseItem = {
      id: `kb-${Date.now()}`,
      name: req.body?.name,
      description: req.body?.description,
      status: req.body?.status || 'enabled',
      documentCount: 0,
      ownerUsername: 'admin',
      updatedAt: nowText(),
    };
    knowledgeBases.unshift(item);
    res.send(buildResponse(item));
  },
  'PUT /api/v1/knowledge/bases/:id': (req: any, res: any) => {
    const item = knowledgeBases.find((record) => record.id === req.params.id);
    Object.assign(item || {}, req.body || {}, { updatedAt: nowText() });
    res.send(buildResponse(item));
  },
  'DELETE /api/v1/knowledge/bases/:id': (req: any, res: any) => {
    const index = knowledgeBases.findIndex((record) => record.id === req.params.id);
    if (index >= 0) {
      knowledgeBases.splice(index, 1);
    }
    for (let i = knowledgeDocuments.length - 1; i >= 0; i -= 1) {
      if (knowledgeDocuments[i].baseId === req.params.id) {
        knowledgeDocuments.splice(i, 1);
      }
    }
    res.send(buildResponse(true));
  },
  'GET /api/v1/knowledge/documents': (req: any, res: any) => {
    const { pageNum = 1, pageSize = 10 } = req.query || {};
    const filtered = getFilteredDocuments(req.query);
    res.send(buildResponse(buildPageResult(filtered, Number(pageNum), Number(pageSize))));
  },
  'POST /api/v1/knowledge/documents': (req: any, res: any) => {
    const base = knowledgeBases.find((item) => item.id === req.body?.baseId);
    const item: KnowledgeDocumentItem = {
      id: `doc-${Date.now()}`,
      title: req.body?.title,
      baseId: req.body?.baseId,
      baseName: base?.name || '未归档知识库',
      ownerUsername: 'admin',
      status: req.body?.status || 'draft',
      updatedAt: nowText(),
    };
    knowledgeDocuments.unshift(item);
    if (base) {
      syncBaseDocumentCount(base.id);
    }
    res.send(buildResponse(item));
  },
  'PUT /api/v1/knowledge/documents/:id': (req: any, res: any) => {
    const item = knowledgeDocuments.find((record) => record.id === req.params.id);
    if (item) {
      const previousBaseId = item.baseId;
      const nextBase = knowledgeBases.find((base) => base.id === req.body?.baseId);
      Object.assign(item, req.body || {}, {
        baseName: nextBase?.name || item.baseName,
        updatedAt: nowText(),
      });
      syncBaseDocumentCount(previousBaseId);
      syncBaseDocumentCount(item.baseId);
    }
    res.send(buildResponse(item));
  },
  'DELETE /api/v1/knowledge/documents/:id': (req: any, res: any) => {
    const index = knowledgeDocuments.findIndex((record) => record.id === req.params.id);
    if (index >= 0) {
      const baseId = knowledgeDocuments[index].baseId;
      knowledgeDocuments.splice(index, 1);
      syncBaseDocumentCount(baseId);
    }
    res.send(buildResponse(true));
  },
  'GET /api/v1/knowledge/conversations': (_req: any, res: any) => {
    res.send(buildResponse(conversations));
  },
  'POST /api/v1/knowledge/conversations': (req: any, res: any) => {
    const title = req.body?.title || '新会话';
    const conversation = {
      id: `conv-${Date.now()}`,
      title,
      updatedAt: nowText(),
    };
    conversations.unshift(conversation);
    conversationMessages[conversation.id] = [];
    res.send(buildResponse(conversation));
  },
  'PUT /api/v1/knowledge/conversations/:id': (req: any, res: any) => {
    const conversation = conversations.find((item) => item.id === req.params.id);
    if (conversation) {
      conversation.title = req.body?.title || conversation.title;
      conversation.updatedAt = nowText();
    }
    res.send(buildResponse(conversation));
  },
  'DELETE /api/v1/knowledge/conversations/:id': (req: any, res: any) => {
    const index = conversations.findIndex((item) => item.id === req.params.id);
    if (index >= 0) {
      conversations.splice(index, 1);
    }
    delete conversationMessages[req.params.id];
    res.send(buildResponse(true));
  },
  'GET /api/v1/knowledge/conversations/:id/messages': (req: any, res: any) => {
    const list = conversationMessages[req.params.id] || [];
    res.send(buildResponse(list));
  },
  'POST /api/v1/knowledge/qa': (req: any, res: any) => {
    const { conversationId, question, baseIds } = req.body || {};
    const resolvedConversationId = ensureConversation(conversationId, question);
    const { content, references } = buildAnswer(question);
    const assistantMessage = appendMessages(resolvedConversationId, question, content, references);

    res.send(
      buildResponse({
        answerId: assistantMessage.id,
        conversationId: resolvedConversationId,
        content,
        references,
        relatedBaseIds: baseIds?.length ? baseIds : knowledgeBases.slice(0, 1).map((item) => item.id),
      }),
    );
  },
  'POST /api/v1/knowledge/qa/stream': (req: any, res: any) => {
    const { conversationId, question, baseIds } = req.body || {};
    const resolvedConversationId = ensureConversation(conversationId, question);
    const { content, references } = buildAnswer(question);
    const chunks = splitStreamingContent(content);
    const answerId = `msg-assistant-${Date.now()}`;

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.setHeader('Transfer-Encoding', 'chunked');
    if (typeof res.flushHeaders === 'function') {
      res.flushHeaders();
    }
    writeSseEvent(res, 'start', { answerId, conversationId: resolvedConversationId });

    let index = 0;
    const timer = setInterval(() => {
      if (index < chunks.length) {
        writeSseEvent(res, 'delta', { content: chunks[index] });
        index += 1;
        return;
      }

      clearInterval(timer);
      appendMessages(resolvedConversationId, question, content, references);
      writeSseEvent(res, 'references', {
        references,
        relatedBaseIds: baseIds?.length ? baseIds : knowledgeBases.slice(0, 1).map((item) => item.id),
      });
      writeSseEvent(res, 'done', { answerId, conversationId: resolvedConversationId });
      res.end();
    }, 45);

    res.on('close', () => {
      clearInterval(timer);
    });
  },
};
