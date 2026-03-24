import { useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { askKnowledge, askKnowledgeStream } from '@/services/api/knowledge';
import { queryKeys } from '@/queries/keys';
import type { ConversationMessage, KnowledgeReference } from '@/types/knowledge';

const STREAMING_ENABLED = String(process.env.UMI_APP_ENABLE_STREAMING).toLowerCase() !== 'false';
const STREAM_UPDATE_INTERVAL = 18;

export type KnowledgeQaRuntimeMetrics = {
  phase: 'idle' | 'submitting' | 'streaming' | 'success' | 'error' | 'stopped';
  question?: string;
  conversationId?: string;
  firstTokenLatencyMs?: number;
  durationMs?: number;
  referenceCount: number;
  errorMessage?: string;
  updatedAt?: number;
};

type UseKnowledgeQaChatOptions = {
  activeConversationId?: string;
  selectedBaseIds: string[];
  messageList: ConversationMessage[];
  onConversationChange?: (conversationId: string) => void;
  onConversationPersisted?: (conversationId: string) => void;
};

export function useKnowledgeQaChat({
  activeConversationId,
  selectedBaseIds,
  messageList,
  onConversationChange,
  onConversationPersisted,
}: UseKnowledgeQaChatOptions) {
  const queryClient = useQueryClient();
  const [isStreaming, setIsStreaming] = useState(false);
  const [pendingUserMessage, setPendingUserMessage] = useState<ConversationMessage | undefined>();
  const [streamingMessage, setStreamingMessage] = useState<ConversationMessage | undefined>();
  const [runtimeMetrics, setRuntimeMetrics] = useState<KnowledgeQaRuntimeMetrics>({
    phase: 'idle',
    referenceCount: 0,
  });
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const abortControllerRef = useRef<AbortController | null>(null);
  const flushTimerRef = useRef<number | null>(null);
  const pendingContentRef = useRef('');
  const fullContentRef = useRef('');
  const referenceRef = useRef<KnowledgeReference[]>([]);
  const requestStartedAtRef = useRef<number | null>(null);
  const firstTokenCapturedRef = useRef(false);
  const lastQuestionRef = useRef('');
  const activeConversationIdRef = useRef<string | undefined>(activeConversationId);
  const currentRequestConversationIdRef = useRef<string | undefined>(activeConversationId);
  const streamEndedRef = useRef(false);
  const drainResolverRef = useRef<(() => void) | null>(null);

  activeConversationIdRef.current = activeConversationId;

  const mergedMessages = useMemo(() => {
    const items = [...messageList];
    if (pendingUserMessage) items.push(pendingUserMessage);
    if (streamingMessage) items.push(streamingMessage);
    return items;
  }, [messageList, pendingUserMessage, streamingMessage]);

  const lastAssistantMessage = useMemo(
    () => [...mergedMessages].reverse().find((item) => item.role === 'assistant'),
    [mergedMessages],
  );

  const lastUserMessage = useMemo(
    () => [...messageList].reverse().find((item) => item.role === 'user'),
    [messageList],
  );

  const clearFlushTimer = () => {
    if (flushTimerRef.current !== null) {
      window.clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
  };

  const updateRuntimeMetrics = (patch: Partial<KnowledgeQaRuntimeMetrics>) => {
    setRuntimeMetrics((current) => ({
      ...current,
      ...patch,
      updatedAt: Date.now(),
    }));
  };

  const notifyConversationReady = (conversationId?: string) => {
    if (!conversationId) {
      return;
    }

    currentRequestConversationIdRef.current = conversationId;
    if (activeConversationIdRef.current !== conversationId) {
      onConversationChange?.(conversationId);
    }
  };

  const notifyConversationPersisted = (conversationId?: string) => {
    if (!conversationId) {
      return;
    }

    onConversationPersisted?.(conversationId);
  };

  const resolveStreamingDrain = () => {
    if (!streamEndedRef.current || pendingContentRef.current || flushTimerRef.current !== null) {
      return;
    }

    drainResolverRef.current?.();
    drainResolverRef.current = null;
  };

  const waitForStreamingDrain = async () => {
    if (!pendingContentRef.current && flushTimerRef.current === null) {
      return;
    }

    await new Promise<void>((resolve) => {
      drainResolverRef.current = resolve;
    });
  };

  const flushStreamingContent = (force = false) => {
    clearFlushTimer();
    if (!pendingContentRef.current) {
      resolveStreamingDrain();
      return;
    }

    const batchSize = force
      ? pendingContentRef.current.length
      : pendingContentRef.current.length > 48
        ? 4
        : pendingContentRef.current.length > 24
          ? 3
          : pendingContentRef.current.length > 8
            ? 2
            : 1;
    const nextChunk = pendingContentRef.current.slice(0, batchSize);

    pendingContentRef.current = pendingContentRef.current.slice(nextChunk.length);

    setStreamingMessage((current) =>
      current
        ? {
            ...current,
            content: `${current.content}${nextChunk}`,
            references: referenceRef.current,
          }
        : current,
    );

    if (!force && pendingContentRef.current) {
      flushTimerRef.current = window.setTimeout(() => {
        flushStreamingContent();
      }, STREAM_UPDATE_INTERVAL);
      return;
    }

    resolveStreamingDrain();
  };

  const scheduleStreamingFlush = () => {
    if (flushTimerRef.current !== null) {
      return;
    }

    flushTimerRef.current = window.setTimeout(() => {
      flushStreamingContent();
    }, STREAM_UPDATE_INTERVAL);
  };

  const resetStreamingRefs = () => {
    clearFlushTimer();
    pendingContentRef.current = '';
    fullContentRef.current = '';
    referenceRef.current = [];
    streamEndedRef.current = false;
    drainResolverRef.current = null;
  };

  const resetPendingState = () => {
    setPendingUserMessage(undefined);
    setStreamingMessage(undefined);
  };

  const resetRequestRuntime = () => {
    requestStartedAtRef.current = null;
    firstTokenCapturedRef.current = false;
    currentRequestConversationIdRef.current = activeConversationIdRef.current;
  };

  const completeRequest = (
    phase: KnowledgeQaRuntimeMetrics['phase'],
    conversationId?: string,
    patch?: Partial<KnowledgeQaRuntimeMetrics>,
  ) => {
    const durationMs =
      requestStartedAtRef.current === null
        ? undefined
        : Math.round(performance.now() - requestStartedAtRef.current);

    updateRuntimeMetrics({
      phase,
      conversationId,
      durationMs,
      referenceCount: referenceRef.current.length,
      ...patch,
    });
    resetRequestRuntime();
  };

  const markFirstToken = (conversationId?: string) => {
    if (firstTokenCapturedRef.current || requestStartedAtRef.current === null) {
      return;
    }

    firstTokenCapturedRef.current = true;
    updateRuntimeMetrics({
      phase: 'streaming',
      conversationId,
      firstTokenLatencyMs: Math.round(performance.now() - requestStartedAtRef.current),
    });
  };

  const persistPartialConversation = (conversationId?: string) => {
    if (!conversationId || !pendingUserMessage || !streamingMessage) {
      return;
    }

    const partialAssistantMessage: ConversationMessage = {
      ...streamingMessage,
      content: fullContentRef.current,
      references: referenceRef.current,
    };

    queryClient.setQueryData<ConversationMessage[]>(
      queryKeys.knowledge.messages(conversationId),
      (currentMessages = []) => [...currentMessages, pendingUserMessage, partialAssistantMessage],
    );
  };

  const stopStreaming = () => {
    flushStreamingContent(true);
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;

    const conversationId = currentRequestConversationIdRef.current ?? runtimeMetrics.conversationId;
    persistPartialConversation(conversationId);
    resetStreamingRefs();
    resetPendingState();
    completeRequest('stopped', conversationId);
    setIsStreaming(false);

    if (conversationId) {
      notifyConversationPersisted(conversationId);
      queryClient.invalidateQueries({ queryKey: queryKeys.knowledge.conversations });
    }

    message.info('已停止回答');
  };

  const runAsk = async (rawQuestion: string) => {
    const content = rawQuestion.trim();
    if (!content || isStreaming) {
      return false;
    }

    let conversationId = activeConversationIdRef.current;

    try {
      setIsStreaming(true);
      setErrorMessage(undefined);
      requestStartedAtRef.current = performance.now();
      firstTokenCapturedRef.current = false;
      currentRequestConversationIdRef.current = conversationId;
      lastQuestionRef.current = content;
      resetStreamingRefs();
      updateRuntimeMetrics({
        phase: 'submitting',
        question: content,
        conversationId,
        firstTokenLatencyMs: undefined,
        durationMs: undefined,
        referenceCount: 0,
        errorMessage: undefined,
      });

      const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
      const userMessage: ConversationMessage = {
        id: `temp-user-${Date.now()}`,
        role: 'user',
        content,
        createdAt: now,
      };
      const assistantMessage: ConversationMessage = {
        id: `temp-assistant-${Date.now() + 1}`,
        role: 'assistant',
        content: '',
        createdAt: now,
        references: [],
      };

      setPendingUserMessage(userMessage);
      setStreamingMessage(assistantMessage);
      streamEndedRef.current = false;

      if (STREAMING_ENABLED) {
        const controller = new AbortController();
        abortControllerRef.current = controller;

        await askKnowledgeStream(
          { conversationId, question: content, baseIds: selectedBaseIds },
          {
            signal: controller.signal,
            onEvent: (event) => {
              if (event.type === 'start') {
                conversationId = event.conversationId || conversationId;
                notifyConversationReady(conversationId);
                updateRuntimeMetrics({ conversationId });
              }

              if (event.type === 'delta') {
                markFirstToken(conversationId);
                pendingContentRef.current += event.content;
                fullContentRef.current += event.content;
                scheduleStreamingFlush();
              }

              if (event.type === 'references') {
                referenceRef.current = event.references;
                updateRuntimeMetrics({ referenceCount: event.references.length });
                setStreamingMessage((current) =>
                  current ? { ...current, references: event.references } : current,
                );
              }

              if (event.type === 'done') {
                conversationId = event.conversationId || conversationId;
                notifyConversationReady(conversationId);
                streamEndedRef.current = true;
                resolveStreamingDrain();
              }
            },
          },
        );

        await waitForStreamingDrain();
      } else {
        const answer = await askKnowledge({
          conversationId,
          question: content,
          baseIds: selectedBaseIds,
        });

        conversationId = answer.conversationId;
        notifyConversationReady(conversationId);
        markFirstToken(conversationId);
        fullContentRef.current = answer.content;
        referenceRef.current = answer.references;
        updateRuntimeMetrics({ referenceCount: answer.references.length });

        pendingContentRef.current = answer.content;
        streamEndedRef.current = true;
        scheduleStreamingFlush();
        setStreamingMessage((current) =>
          current ? { ...current, references: answer.references } : current,
        );

        await waitForStreamingDrain();
      }

      abortControllerRef.current = null;

      const finalAssistantMessage: ConversationMessage = {
        ...assistantMessage,
        content: fullContentRef.current,
        references: referenceRef.current,
      };

      queryClient.setQueryData<ConversationMessage[]>(
        queryKeys.knowledge.messages(conversationId),
        (currentMessages = []) => [...currentMessages, userMessage, finalAssistantMessage],
      );

      resetPendingState();
      completeRequest('success', conversationId);
      resetStreamingRefs();
      notifyConversationPersisted(conversationId);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.knowledge.conversations }),
        queryClient.invalidateQueries({ queryKey: queryKeys.knowledge.messages(conversationId) }),
      ]);

      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return false;
      }

      const nextErrorMessage = error instanceof Error ? error.message : '提问失败';
      setErrorMessage(nextErrorMessage);
      resetPendingState();
      completeRequest('error', conversationId, { errorMessage: nextErrorMessage });
      resetStreamingRefs();
      abortControllerRef.current = null;
      message.error(nextErrorMessage);
      return false;
    } finally {
      setIsStreaming(false);
    }
  };

  const retryLastQuestion = async () => {
    if (!lastQuestionRef.current) {
      return false;
    }

    return runAsk(lastQuestionRef.current);
  };

  return {
    isStreaming,
    mergedMessages,
    lastAssistantMessage,
    lastUserMessage,
    runtimeMetrics,
    errorMessage,
    runAsk,
    retryLastQuestion,
    stopStreaming,
  };
}
