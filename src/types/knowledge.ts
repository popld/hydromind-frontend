export interface KnowledgeBaseItem {
  id: string;
  name: string;
  description?: string;
  ownerUsername?: string;
  documentCount: number;
  status: 'enabled' | 'disabled';
  updatedAt: string;
}

export interface KnowledgeBaseFormPayload {
  name: string;
  description?: string;
  status: 'enabled' | 'disabled';
}

export interface KnowledgeDocumentItem {
  id: string;
  title: string;
  baseId: string;
  baseName: string;
  ownerUsername?: string;
  status: 'indexed' | 'draft';
  updatedAt: string;
}

export interface KnowledgeDocumentFormPayload {
  title: string;
  baseId: string;
  status: 'indexed' | 'draft';
}

export interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: string;
}

export interface KnowledgeReference {
  id: string;
  title: string;
  sourceType: 'document' | 'knowledge_base';
  snippet: string;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  references?: KnowledgeReference[];
}

export interface KnowledgeAnswer {
  answerId: string;
  conversationId: string;
  content: string;
  references: KnowledgeReference[];
  relatedBaseIds: string[];
}

export interface AskKnowledgePayload {
  conversationId: string;
  question: string;
  baseIds: string[];
}

export type KnowledgeStreamEvent =
  | { type: 'start'; answerId: string; conversationId: string }
  | { type: 'delta'; content: string }
  | { type: 'references'; references: KnowledgeReference[]; relatedBaseIds: string[] }
  | { type: 'done'; answerId: string; conversationId: string };
