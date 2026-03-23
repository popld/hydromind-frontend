import { useQuery } from '@tanstack/react-query';
import {
  getConversationMessages,
  getConversations,
  getKnowledgeBases,
  getKnowledgeDocuments,
} from '@/services/api/knowledge';
import { queryKeys } from './keys';

export function useKnowledgeBases(keyword?: string, status?: string) {
  return useQuery({
    queryKey: [...queryKeys.knowledge.bases(keyword), status ?? 'all'],
    queryFn: () => getKnowledgeBases({ pageNum: 1, pageSize: 100, keyword, status }),
  });
}

export function useKnowledgeDocuments(keyword?: string, status?: string, baseId?: string) {
  return useQuery({
    queryKey: [...queryKeys.knowledge.documents(keyword), status ?? 'all', baseId ?? 'all'],
    queryFn: () => getKnowledgeDocuments({ pageNum: 1, pageSize: 100, keyword, status, baseId }),
  });
}

export function useKnowledgeConversations() {
  return useQuery({
    queryKey: queryKeys.knowledge.conversations,
    queryFn: getConversations,
  });
}

export function useConversationMessages(conversationId?: string) {
  return useQuery({
    queryKey: queryKeys.knowledge.messages(conversationId),
    queryFn: () => getConversationMessages(conversationId as string),
    enabled: Boolean(conversationId),
  });
}
