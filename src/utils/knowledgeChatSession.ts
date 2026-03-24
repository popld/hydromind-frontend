export type KnowledgeChatSessionSnapshot = {
  conversationId?: string;
  selectedBaseIds: string[];
  draftQuestion?: string;
  updatedAt: number;
};

type StoredSnapshot = Partial<KnowledgeChatSessionSnapshot>;

export function readKnowledgeChatSession(
  storageKey: string,
): KnowledgeChatSessionSnapshot | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  try {
    const rawValue = window.localStorage.getItem(storageKey);
    if (!rawValue) {
      return undefined;
    }

    const parsedValue = JSON.parse(rawValue) as StoredSnapshot;

    return {
      conversationId:
        typeof parsedValue.conversationId === 'string'
          ? parsedValue.conversationId
          : undefined,
      selectedBaseIds: Array.isArray(parsedValue.selectedBaseIds)
        ? parsedValue.selectedBaseIds.filter(
            (item): item is string => typeof item === 'string' && item.length > 0,
          )
        : [],
      draftQuestion:
        typeof parsedValue.draftQuestion === 'string' ? parsedValue.draftQuestion : '',
      updatedAt: typeof parsedValue.updatedAt === 'number' ? parsedValue.updatedAt : 0,
    };
  } catch {
    return undefined;
  }
}

export function writeKnowledgeChatSession(
  storageKey: string,
  snapshot: Omit<KnowledgeChatSessionSnapshot, 'updatedAt'>,
) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        ...snapshot,
        updatedAt: Date.now(),
      }),
    );
  } catch {
    // Ignore storage failures and keep the chat usable.
  }
}
