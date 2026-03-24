import { CopyOutlined, EditOutlined } from '@ant-design/icons';
import { memo, useEffect, useRef } from 'react';
import { Button, Empty, List, Tooltip, Typography, message as antdMessage } from 'antd';
import { useStickyAutoScroll } from '@/hooks/useStickyAutoScroll';
import type { ConversationMessage, KnowledgeReference } from '@/types/knowledge';
import KnowledgeChatMarkdown from './KnowledgeChatMarkdown';
import styles from './KnowledgeChatMessageList.module.less';

type Variant = 'page' | 'floating';

type KnowledgeChatMessageListProps = {
  messages: ConversationMessage[];
  isStreaming: boolean;
  variant: Variant;
  emptyDescription: string;
  viewportStyle?: React.CSSProperties;
  showReferences?: boolean;
  onReferenceClick?: (reference: KnowledgeReference) => void;
  showUserActions?: boolean;
  onEditMessage?: (message: ConversationMessage) => void;
};

type MessageRowProps = {
  message: ConversationMessage;
  isStreamingMessage: boolean;
  variant: Variant;
  showReferences: boolean;
  onReferenceClick?: (reference: KnowledgeReference) => void;
  showUserActions: boolean;
  onEditMessage?: (message: ConversationMessage) => void;
};

const REFERENCE_TYPE_LABELS: Record<KnowledgeReference['sourceType'], string> = {
  document: '文档',
  knowledge_base: '知识库',
};

const MessageRow = memo(function MessageRow({
  message,
  isStreamingMessage,
  variant,
  showReferences,
  onReferenceClick,
  showUserActions,
  onEditMessage,
}: MessageRowProps) {
  const assistantShellClassName =
    variant === 'floating'
      ? `${styles.assistantShell} ${styles.assistantShellFloating}`
      : `${styles.assistantShell} ${styles.assistantShellPage}`;
  const assistantHeaderClassName =
    variant === 'floating'
      ? `${styles.assistantHeader} ${styles.assistantHeaderFloating}`
      : `${styles.assistantHeader} ${styles.assistantHeaderPage}`;
  const userMessageBlockClassName =
    variant === 'floating'
      ? `${styles.userMessageBlock} ${styles.userMessageBlockFloating}`
      : `${styles.userMessageBlock} ${styles.userMessageBlockPage}`;
  const shouldShowAssistantIdentity = variant === 'floating';
  const shouldShowAssistantHeader = shouldShowAssistantIdentity || isStreamingMessage;

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      antdMessage.success('已复制');
    } catch {
      antdMessage.error('复制失败');
    }
  };

  if (message.role === 'assistant' && isStreamingMessage && !message.content) {
    return (
      <List.Item className={styles.item} style={{ justifyContent: 'flex-start' }}>
        <div className={assistantShellClassName}>
          <div className={styles.searchingBlock}>
            {/* <div className={assistantHeaderClassName}>
              {shouldShowAssistantIdentity ? (
                <>
                  <span className={styles.assistantBadge}>AI</span>
                  <span className={styles.assistantName}>知识助手</span>
                </>
              ) : null}
              <span className={styles.assistantStatus}>检索中</span>
            </div> */}
            <div className={styles.searchingText}>正在检索项目资料并生成回答...</div>
            <div className={styles.searchingLines}>
              <span className={`${styles.searchingLine} ${styles.searchingLineLong}`} />
              <span className={`${styles.searchingLine} ${styles.searchingLineMid}`} />
              <span className={`${styles.searchingLine} ${styles.searchingLineShort}`} />
            </div>
          </div>
        </div>
      </List.Item>
    );
  }

  if (message.role === 'assistant') {
    const answerClassName =
      variant === 'floating'
        ? `${styles.assistantAnswer} ${styles.assistantAnswerFloating}`
        : `${styles.assistantAnswer} ${styles.assistantAnswerPage}`;

    return (
      <List.Item className={styles.item} style={{ justifyContent: 'flex-start' }}>
        <div className={assistantShellClassName}>
          {/* {shouldShowAssistantHeader ? (
            <div className={assistantHeaderClassName}>
              {shouldShowAssistantIdentity ? (
                <>
                  <span className={styles.assistantBadge}>AI</span>
                  <span className={styles.assistantName}>知识助手</span>
                </>
              ) : null}
              {isStreamingMessage ? <span className={styles.assistantStatus}>生成中</span> : null}
            </div>
          ) : null} */}
          <div
            className={`${answerClassName} ${
              isStreamingMessage && variant === 'page' ? styles.assistantAnswerStreamingPage : ''
            }`}
          >
            <KnowledgeChatMarkdown content={message.content} isStreaming={isStreamingMessage} />
          </div>
          {showReferences && !isStreamingMessage && message.references?.length ? (
            <div className={styles.referenceSection}>
              <div className={styles.referenceSectionTitle}>引用来源</div>
              <div className={styles.references}>
                {message.references.slice(0, 3).map((reference, index) => {
                  const content = (
                    <div className={styles.referenceHeader}>
                      <span className={styles.referenceIndex}>[{index + 1}]</span>
                      <span className={styles.referenceTitle}>{reference.title}</span>
                      <span className={styles.referenceType}>
                        {REFERENCE_TYPE_LABELS[reference.sourceType]}
                      </span>
                    </div>
                  );

                  if (!onReferenceClick) {
                    return <div key={reference.id} className={styles.referenceCard}>{content}</div>;
                  }

                  return (
                    <button
                      key={reference.id}
                      type="button"
                      className={styles.referenceItem}
                      onClick={() => onReferenceClick(reference)}
                    >
                      {content}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </List.Item>
    );
  }

  const userBubbleClass =
    variant === 'floating' ? styles.userBubbleFloating : styles.userBubblePage;

  return (
    <List.Item className={styles.item} style={{ justifyContent: 'flex-end' }}>
      <div className={userMessageBlockClassName}>
        <div className={`${styles.bubble} ${userBubbleClass}`}>
          <Typography.Text className={styles.userText}>{message.content}</Typography.Text>
        </div>
        {showUserActions ? (
          <div className={styles.userActions}>
            <Tooltip title="修改">
              <Button
                type="text"
                size="small"
                shape="circle"
                icon={<EditOutlined />}
                className={styles.userActionButton}
                onClick={() => onEditMessage?.(message)}
              />
            </Tooltip>
            <Tooltip title="复制">
              <Button
                type="text"
                size="small"
                shape="circle"
                icon={<CopyOutlined />}
                className={styles.userActionButton}
                onClick={handleCopyMessage}
              />
            </Tooltip>
          </div>
        ) : null}
      </div>
    </List.Item>
  );
});

export default function KnowledgeChatMessageList({
  messages,
  isStreaming,
  variant,
  emptyDescription,
  viewportStyle,
  showReferences = false,
  onReferenceClick,
  showUserActions = false,
  onEditMessage,
}: KnowledgeChatMessageListProps) {
  const { scrollRef, handleScroll, scrollToBottom } = useStickyAutoScroll(messages);
  const streamingMessageId =
    isStreaming && messages.length > 0 ? messages[messages.length - 1].id : undefined;
  const listClassName =
    variant === 'page' && isStreaming
      ? `${styles.list} ${styles.listPageStreaming}`
      : styles.list;
  const previousStreamingRef = useRef(isStreaming);

  useEffect(() => {
    if (!previousStreamingRef.current && isStreaming) {
      scrollToBottom('auto');
    }

    previousStreamingRef.current = isStreaming;
  }, [isStreaming, scrollToBottom]);

  return (
    <div ref={scrollRef} className={styles.viewport} style={viewportStyle} onScroll={handleScroll}>
      {messages.length === 0 ? (
        <div
          className={`${styles.empty} ${variant === 'page' ? styles.emptyPage : styles.emptyFloating}`}
        >
          <Empty description={emptyDescription} />
        </div>
      ) : (
        <List
          className={listClassName}
          dataSource={messages}
          renderItem={(message) => (
            <MessageRow
              key={message.id}
              message={message}
              isStreamingMessage={message.id === streamingMessageId && message.role === 'assistant'}
              variant={variant}
              showReferences={showReferences}
              onReferenceClick={onReferenceClick}
              showUserActions={showUserActions}
              onEditMessage={onEditMessage}
            />
          )}
        />
      )}
    </div>
  );
}
