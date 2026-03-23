import { create } from 'zustand';

interface KnowledgeState {
  activeConversationId?: string;
  selectedBaseIds: string[];
  setActiveConversationId: (id?: string) => void;
  setSelectedBaseIds: (ids: string[]) => void;
}

export const useKnowledgeStore = create<KnowledgeState>((set) => ({
  activeConversationId: undefined,
  selectedBaseIds: [],
  setActiveConversationId: (id) => set({ activeConversationId: id }),
  setSelectedBaseIds: (ids) => set({ selectedBaseIds: ids }),
}));
