import { CloseOutlined, MessageOutlined, PlusOutlined, RightOutlined } from '@ant-design/icons';
import { history, useLocation } from '@umijs/max';
import { Button, Empty, Space, Tooltip, Typography, message } from 'antd';
import type { InputRef } from 'antd';
import { useEffect, useRef, useState } from 'react';
import KnowledgeChatComposer from '@/components/knowledge/KnowledgeChatComposer';
import KnowledgeChatMessageList from '@/components/knowledge/KnowledgeChatMessageList';
import KnowledgeReferencePreviewModal from '@/components/knowledge/KnowledgeReferencePreviewModal';
import { useKnowledgeQaChat } from '@/hooks/useKnowledgeQaChat';
import { useConversationMessages, useKnowledgeBases } from '@/queries/knowledge.query';
import type { ConversationMessage, KnowledgeReference } from '@/types/knowledge';
import assistantLogo from '@/pic/logo.png';
import { readKnowledgeChatSession, writeKnowledgeChatSession } from '@/utils/knowledgeChatSession';
import styles from './FloatingAiAssistant.module.less';

const POSITION_STORAGE_KEY = 'HF_AI_ASSISTANT_POSITION';
const CHAT_SESSION_KEY = 'HF_AI_ASSISTANT_CHAT_SESSION';
const TRIGGER_SIZE = 78;
const SAFE_OFFSET = 24;

const featureCards = [
  {
    title: '任务问答',
    description: '查询任务、人员与里程碑信息',
    lines: ['支持多轮提问', '支持引用来源'],
  },
  {
    title: '流程查询',
    description: '查询审批、材料与执行流程',
    lines: ['输入关键词即可提问', '支持进入知识问答页'],
  },
];

const quickLinks = [{ label: '进入知识问答', linkOnly: true }];

const uiText = {
  alt: '项目执行智能助手',
  panelTitle: '项目执行智能助手',
  hello: '您好',
  subtitle: '我是项目执行知识助手',
  description: '可查询任务、审批、材料、纪要等项目执行信息。',
  inputPlaceholder: '请输入项目执行相关问题',
  emptyDescription: '从这里开始提问，首轮问答完成后可在知识问答页查看完整会话。',
  openKnowledgePage: '知识问答页',
  stop: '停止回答',
};

type Position = {
  x: number;
  y: number;
};

function getDefaultPosition(): Position {
  return {
    x: window.innerWidth - TRIGGER_SIZE - SAFE_OFFSET,
    y: window.innerHeight - TRIGGER_SIZE - SAFE_OFFSET,
  };
}

function clampPosition(position: Position): Position {
  const maxX = Math.max(SAFE_OFFSET, window.innerWidth - TRIGGER_SIZE - SAFE_OFFSET);
  const maxY = Math.max(SAFE_OFFSET, window.innerHeight - TRIGGER_SIZE - SAFE_OFFSET);

  return {
    x: Math.min(Math.max(SAFE_OFFSET, position.x), maxX),
    y: Math.min(Math.max(SAFE_OFFSET, position.y), maxY),
  };
}

function readStoredPosition(): Position | null {
  try {
    const rawValue = window.localStorage.getItem(POSITION_STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue) as Partial<Position>;
    if (typeof parsedValue.x !== 'number' || typeof parsedValue.y !== 'number') {
      return null;
    }

    return clampPosition({ x: parsedValue.x, y: parsedValue.y });
  } catch {
    return null;
  }
}

function writeStoredPosition(position: Position) {
  window.localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(position));
}

export default function FloatingAiAssistant() {
  const location = useLocation();
  const restoredSessionRef = useRef(readKnowledgeChatSession(CHAT_SESSION_KEY));
  const inputRef = useRef<InputRef | null>(null);
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState(restoredSessionRef.current?.draftQuestion || '');
  const [position, setPosition] = useState<Position | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>(
    restoredSessionRef.current?.conversationId,
  );
  const [selectedBaseIds, setSelectedBaseIds] = useState<string[]>(
    restoredSessionRef.current?.selectedBaseIds ?? [],
  );
  const [referenceOpen, setReferenceOpen] = useState(false);
  const [activeReference, setActiveReference] = useState<KnowledgeReference | undefined>();
  const [editingMessageState, setEditingMessageState] = useState<{
    messageId: string;
    restoreQuestion: string;
  }>();
  const positionRef = useRef<Position | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null);
  const movedRef = useRef(false);

  const { data: messageList = [] } = useConversationMessages(activeConversationId);
  const { data: basePage } = useKnowledgeBases();

  const { isStreaming, mergedMessages, errorMessage, runAsk, retryLastQuestion, stopStreaming } =
    useKnowledgeQaChat({
      activeConversationId,
      selectedBaseIds,
      messageList,
      onConversationChange: setActiveConversationId,
    });

  useEffect(() => {
    const initialPosition = readStoredPosition() || getDefaultPosition();
    positionRef.current = initialPosition;
    setPosition(initialPosition);
  }, []);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    if (!basePage?.list.length) {
      return;
    }

    const availableBaseIds = new Set(basePage.list.map((item) => item.id));

    setSelectedBaseIds((current) => {
      const nextSelectedBaseIds = current.filter((id) => availableBaseIds.has(id));
      if (nextSelectedBaseIds.length > 0) {
        return nextSelectedBaseIds;
      }

      return [basePage.list[0].id];
    });
  }, [basePage?.list]);

  useEffect(() => {
    const handleResize = () => {
      if (!positionRef.current) {
        return;
      }

      const nextPosition = clampPosition(positionRef.current);
      positionRef.current = nextPosition;
      setPosition(nextPosition);
      writeStoredPosition(nextPosition);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!dragStartRef.current) {
        return;
      }

      const nextPosition = clampPosition({
        x: dragStartRef.current.startX + (event.clientX - dragStartRef.current.x),
        y: dragStartRef.current.startY + (event.clientY - dragStartRef.current.y),
      });

      if (
        Math.abs(event.clientX - dragStartRef.current.x) > 4 ||
        Math.abs(event.clientY - dragStartRef.current.y) > 4
      ) {
        movedRef.current = true;
      }

      positionRef.current = nextPosition;
      setPosition(nextPosition);
    };

    const handlePointerUp = () => {
      if (positionRef.current) {
        writeStoredPosition(positionRef.current);
      }
      dragStartRef.current = null;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  useEffect(() => {
    setOpen(false);
    setEditingMessageState(undefined);
  }, [location.pathname, location.search]);

  useEffect(() => {
    writeKnowledgeChatSession(CHAT_SESSION_KEY, {
      conversationId: activeConversationId,
      selectedBaseIds,
      draftQuestion: question,
    });
  }, [activeConversationId, selectedBaseIds, question]);

  const jumpToKnowledgeQa = () => {
    const params = new URLSearchParams();

    if (activeConversationId) {
      params.set('conversationId', activeConversationId);
    } else if (question.trim()) {
      params.set('keyword', question.trim());
    }

    setOpen(false);
    history.push(`/knowledge/qa${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const hasMessages = mergedMessages.length > 0;
  const stopIcon = (
    <span className={styles.stopGlyph} aria-hidden="true">
      <span className={styles.stopGlyphInner} />
    </span>
  );
  const createConversationIcon = (
    <span className={styles.composeIcon} aria-hidden="true">
      <MessageOutlined className={styles.composeIconMain} />
      <span className={styles.composeIconBadge}>
        <PlusOutlined />
      </span>
    </span>
  );

  const focusInput = () => {
    window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleSubmitQuestion = async () => {
    const sent = await runAsk(question);
    if (sent) {
      setEditingMessageState(undefined);
      setQuestion('');
    }
  };

  const handleEditMessage = (messageItem: ConversationMessage) => {
    setEditingMessageState({
      messageId: messageItem.id,
      restoreQuestion: question,
    });
    setQuestion(messageItem.content);
    focusInput();
  };

  const handleCancelEdit = () => {
    setQuestion(editingMessageState?.restoreQuestion ?? '');
    setEditingMessageState(undefined);
    focusInput();
  };

  const handleCreateConversation = () => {
    if (isStreaming) {
      stopStreaming();
    }

    const isAlreadyLatest = !activeConversationId && mergedMessages.length === 0 && !question.trim();
    if (isAlreadyLatest) {
      message.info('已是最新会话');
      focusInput();
      return;
    }

    setActiveConversationId(undefined);
    setEditingMessageState(undefined);
    setQuestion('');
    setReferenceOpen(false);
    setActiveReference(undefined);
    focusInput();
  };

  if (location.pathname === '/login' || !position) {
    return null;
  }

  return (
    <>
      {!open ? (
        <button
          type="button"
          className={styles.trigger}
          style={{ left: position.x, top: position.y }}
          onPointerDown={(event) => {
            event.preventDefault();
            dragStartRef.current = {
              x: event.clientX,
              y: event.clientY,
              startX: position.x,
              startY: position.y,
            };
            movedRef.current = false;
          }}
          onClick={() => {
            if (movedRef.current) {
              movedRef.current = false;
              return;
            }
            setOpen(true);
          }}
        >
          <img src={assistantLogo} alt={uiText.alt} className={styles.triggerImage} />
        </button>
      ) : null}

      {open ? (
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>{uiText.panelTitle}</span>
            <div className={styles.panelActions}>
              <Space size={8}>
                  <Button
                    size="small"
                    type="text"
                    icon={createConversationIcon}
                    className={styles.headerIconButton}
                    onClick={handleCreateConversation}
                  />
                <Button
                  size="small"
                  type="link"
                  className={styles.knowledgeLink}
                  onClick={jumpToKnowledgeQa}
                >
                  {uiText.openKnowledgePage}
                </Button>
              </Space>
              <Button
                type="text"
                icon={<CloseOutlined />}
                className={styles.closeButton}
                onClick={() => setOpen(false)}
              />
            </div>
          </div>

          <div className={styles.body}>
            <div className={styles.scrollArea}>
              {!hasMessages ? (
                <>
                  <div className={styles.hero}>
                    <div className={styles.heroCopy}>
                      <Typography.Title level={2} className={styles.heroTitle}>
                        {uiText.hello}
                      </Typography.Title>
                      <div className={styles.heroSubtitle}>{uiText.subtitle}</div>
                      <Typography.Paragraph className={styles.heroText}>
                        {uiText.description}
                      </Typography.Paragraph>
                    </div>
                    <div className={styles.heroVisual}>
                      <img src={assistantLogo} alt={uiText.alt} className={styles.heroLogo} />
                    </div>
                  </div>

                  <div className={styles.featureGrid}>
                    {featureCards.map((item) => (
                      <div key={item.title} className={styles.featureCard}>
                        <div className={styles.featureTitleRow}>
                          <span className={styles.featureTitle}>{item.title}</span>
                          <RightOutlined className={styles.featureArrow} />
                        </div>
                        <div className={styles.featureDescription}>{item.description}</div>
                        <div className={styles.featureLines}>
                          {item.lines.map((line) => (
                            <span key={line}>{line}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className={styles.quickLinkRow}>
                    {quickLinks.map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        className={styles.quickLink}
                        onClick={() => {
                          if (item.linkOnly) {
                            jumpToKnowledgeQa();
                          }
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <div className={styles.emptyHelper}>
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={uiText.emptyDescription} />
                  </div>
                </>
              ) : (
                <KnowledgeChatMessageList
                  messages={mergedMessages}
                  isStreaming={isStreaming}
                  variant="floating"
                  emptyDescription={uiText.emptyDescription}
                  viewportStyle={{ height: '100%', paddingRight: 4 }}
                  showReferences
                  showUserActions
                  onReferenceClick={(reference) => {
                    setActiveReference(reference);
                    setReferenceOpen(true);
                  }}
                  onEditMessage={handleEditMessage}
                />
              )}
            </div>

            <div className={styles.footer}>
              {errorMessage ? (
                <div className={styles.errorBar}>
                  <span className={styles.errorText}>{errorMessage}</span>
                  <Button size="small" type="link" onClick={() => retryLastQuestion()}>
                    重新提问
                  </Button>
                </div>
              ) : null}

              {isStreaming ? (
                <div className={styles.stopBar}>
                  <Button
                    size="small"
                    icon={stopIcon}
                    className={styles.stopButton}
                    onClick={stopStreaming}
                  >
                    {uiText.stop}
                  </Button>
                </div>
              ) : null}

              <KnowledgeChatComposer
                inputRef={inputRef}
                value={question}
                placeholder={uiText.inputPlaceholder}
                variant="floating"
                minRows={3}
                maxRows={4}
                disabled={selectedBaseIds.length === 0}
                loading={isStreaming}
                editingLabel={editingMessageState ? '修改重发' : undefined}
                onChange={setQuestion}
                onSubmit={handleSubmitQuestion}
                onCancelEdit={editingMessageState ? handleCancelEdit : undefined}
              />
            </div>
          </div>
        </section>
      ) : null}

      <KnowledgeReferencePreviewModal
        open={referenceOpen}
        reference={activeReference}
        onClose={() => setReferenceOpen(false)}
      />
    </>
  );
}
