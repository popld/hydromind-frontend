import { useEffect, useMemo, useRef, useState } from 'react';
import { useAccess, useLocation } from '@umijs/max';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Dropdown,
  List,
  Modal,
  Select,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import type { InputRef, MenuProps } from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { ModalForm, PageContainer, ProFormText } from '@ant-design/pro-components';
import PermissionButton from '@/components/common/PermissionButton';
import KnowledgeChatComposer from '@/components/knowledge/KnowledgeChatComposer';
import KnowledgeChatMessageList from '@/components/knowledge/KnowledgeChatMessageList';
import KnowledgeReferencePreviewModal from '@/components/knowledge/KnowledgeReferencePreviewModal';
import { useKnowledgeQaChat } from '@/hooks/useKnowledgeQaChat';
import {
  useConversationMessages,
  useKnowledgeBases,
  useKnowledgeConversations,
} from '@/queries/knowledge.query';
import { queryKeys } from '@/queries/keys';
import { deleteConversation, renameConversation } from '@/services/api/knowledge';
import type { ConversationMessage, ConversationSummary, KnowledgeReference } from '@/types/knowledge';
import { readKnowledgeChatSession, writeKnowledgeChatSession } from '@/utils/knowledgeChatSession';
import styles from './index.module.less';

const PAGE_SESSION_KEY = 'HF_KNOWLEDGE_QA_PAGE_SESSION';

const REFERENCE_TYPE_LABELS: Record<KnowledgeReference['sourceType'], string> = {
  document: '文档',
  knowledge_base: '知识库',
};

export default function KnowledgeQaPage() {
  const access = useAccess() as any;
  const location = useLocation();
  const queryClient = useQueryClient();
  const restoredSessionRef = useRef(readKnowledgeChatSession(PAGE_SESSION_KEY));
  const initialParamsRef = useRef(new URLSearchParams(location.search));
  const inputRef = useRef<InputRef | null>(null);
  const restoreToastShownRef = useRef(false);
  const submitFromDraftRef = useRef(false);
  const initialParams = initialParamsRef.current;
  const restoredConversationId = restoredSessionRef.current?.conversationId;
  const restoredBaseIds = restoredSessionRef.current?.selectedBaseIds ?? [];
  const initialKeyword = initialParams.get('keyword') || restoredSessionRef.current?.draftQuestion || '';
  const initialConversationId = initialParams.get('conversationId') || restoredConversationId || undefined;

  const [question, setQuestion] = useState(initialKeyword);
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>(
    initialConversationId,
  );
  const [selectedBaseIds, setSelectedBaseIds] = useState<string[]>(
    initialParams.get('baseId') ? [initialParams.get('baseId') as string] : restoredBaseIds,
  );
  const [isDraftConversation, setIsDraftConversation] = useState(
    Boolean(!initialParams.get('conversationId') && !restoredConversationId && initialKeyword),
  );
  const [hiddenConversationId, setHiddenConversationId] = useState<string | undefined>();
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameTargetId, setRenameTargetId] = useState<string | undefined>(initialConversationId);
  const [referenceOpen, setReferenceOpen] = useState(false);
  const [activeReference, setActiveReference] = useState<KnowledgeReference | undefined>();
  const [editingMessageState, setEditingMessageState] = useState<{
    messageId: string;
    restoreQuestion: string;
  }>();
  const [restoredFromSession] = useState(
    Boolean(
      !initialParams.get('conversationId') &&
        !initialParams.get('keyword') &&
        (restoredSessionRef.current?.conversationId ||
          restoredSessionRef.current?.draftQuestion ||
          restoredBaseIds.length),
    ),
  );

  const { data: conversations = [], isLoading: conversationsLoading } = useKnowledgeConversations();
  const { data: messageList = [] } = useConversationMessages(activeConversationId);
  const { data: basePage } = useKnowledgeBases();

  const visibleConversations = useMemo(
    () => conversations.filter((item) => item.id !== hiddenConversationId),
    [conversations, hiddenConversationId],
  );

  const currentConversation = conversations.find((item) => item.id === activeConversationId);
  const renameTargetConversation = conversations.find((item) => item.id === renameTargetId);
  const stopIcon = (
    <span className={styles.stopGlyph} aria-hidden="true">
      <span className={styles.stopGlyphInner} />
    </span>
  );

  const {
    isStreaming,
    mergedMessages,
    lastAssistantMessage,
    errorMessage,
    runAsk,
    retryLastQuestion,
    stopStreaming,
  } = useKnowledgeQaChat({
    activeConversationId,
    selectedBaseIds,
    messageList,
    onConversationChange: (conversationId) => {
      setActiveConversationId(conversationId);
      setRenameTargetId(conversationId);

      if (submitFromDraftRef.current) {
        setHiddenConversationId(conversationId);
      }
    },
    onConversationPersisted: (conversationId) => {
      setActiveConversationId(conversationId);
      setRenameTargetId(conversationId);
      setIsDraftConversation(false);
      setHiddenConversationId((current) => (current === conversationId ? undefined : current));
      submitFromDraftRef.current = false;
    },
  });

  useEffect(() => {
    const conversationId = new URLSearchParams(location.search).get('conversationId');
    if (conversationId) {
      setActiveConversationId(conversationId);
      setRenameTargetId(conversationId);
      setIsDraftConversation(false);
      setHiddenConversationId(undefined);
      setEditingMessageState(undefined);
    }
  }, [location.search]);

  useEffect(() => {
    if (!activeConversationId && visibleConversations.length > 0 && !isDraftConversation) {
      const nextConversationId = visibleConversations[0].id;
      setActiveConversationId(nextConversationId);
      setRenameTargetId(nextConversationId);
    }
  }, [activeConversationId, isDraftConversation, visibleConversations]);

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

      const queryBaseId = new URLSearchParams(location.search).get('baseId');
      if (queryBaseId && availableBaseIds.has(queryBaseId)) {
        return [queryBaseId];
      }

      return [basePage.list[0].id];
    });
  }, [basePage?.list, location.search]);

  useEffect(() => {
    const keyword = new URLSearchParams(location.search).get('keyword') || '';
    if (keyword) {
      setQuestion(keyword);
      setActiveConversationId(undefined);
      setRenameTargetId(undefined);
      setIsDraftConversation(true);
      setHiddenConversationId(undefined);
      setEditingMessageState(undefined);
    }
  }, [location.search]);

  useEffect(() => {
    writeKnowledgeChatSession(PAGE_SESSION_KEY, {
      conversationId: isDraftConversation ? undefined : activeConversationId,
      selectedBaseIds,
      draftQuestion: question,
    });
  }, [activeConversationId, isDraftConversation, selectedBaseIds, question]);

  useEffect(() => {
    if (!restoredFromSession || restoreToastShownRef.current) {
      return;
    }

    restoreToastShownRef.current = true;
    message.success({
      content: '已恢复上次未完成内容',
      duration: 2.5,
    });
  }, [restoredFromSession]);

  const renameMutation = useMutation({
    mutationFn: async (title: string) => renameConversation(renameTargetId as string, title),
    onSuccess: async () => {
      message.success('会话名称已更新');
      setRenameOpen(false);
      await queryClient.invalidateQueries({ queryKey: queryKeys.knowledge.conversations });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteConversation,
    onSuccess: async (_, conversationId) => {
      const remainingConversations = visibleConversations.filter((item) => item.id !== conversationId);

      if (conversationId === activeConversationId) {
        if (remainingConversations.length > 0) {
          const nextConversationId = remainingConversations[0].id;
          setActiveConversationId(nextConversationId);
          setRenameTargetId(nextConversationId);
          setIsDraftConversation(false);
        } else {
          setActiveConversationId(undefined);
          setRenameTargetId(undefined);
          setIsDraftConversation(true);
          setQuestion('');
        }
      }

      setEditingMessageState(undefined);
      message.success('会话已删除');

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.knowledge.conversations }),
        queryClient.invalidateQueries({ queryKey: queryKeys.knowledge.messages(conversationId) }),
      ]);
    },
  });

  const focusInput = () => {
    window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleCreateConversation = () => {
    const isAlreadyLatest = isDraftConversation && mergedMessages.length === 0 && !question.trim();
    if (isAlreadyLatest) {
      message.info('已是最新会话');
      focusInput();
      return;
    }

    submitFromDraftRef.current = false;
    setActiveConversationId(undefined);
    setRenameTargetId(undefined);
    setIsDraftConversation(true);
    setHiddenConversationId(undefined);
    setEditingMessageState(undefined);
    setQuestion('');
    setReferenceOpen(false);
    setActiveReference(undefined);
    focusInput();
  };

  const handleSelectConversation = (conversationId: string) => {
    submitFromDraftRef.current = false;
    setActiveConversationId(conversationId);
    setRenameTargetId(conversationId);
    setIsDraftConversation(false);
    setHiddenConversationId(undefined);
    setEditingMessageState(undefined);
  };

  const handleSubmitQuestion = async () => {
    submitFromDraftRef.current = !activeConversationId || isDraftConversation;
    const sent = await runAsk(question);

    if (sent) {
      setEditingMessageState(undefined);
      setQuestion('');
      setIsDraftConversation(false);
      return;
    }

    submitFromDraftRef.current = false;
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

  const handleDeleteConversation = (conversationId: string) => {
    Modal.confirm({
      title: '确认删除该会话？',
      content: '删除后将无法恢复当前问答记录。',
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        await deleteMutation.mutateAsync(conversationId);
      },
    });
  };

  const buildConversationMenu = (item: ConversationSummary): MenuProps => ({
    items: [
      {
        key: 'rename',
        icon: <EditOutlined />,
        label: '重命名',
      },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: '删除',
        danger: true,
      },
    ],
    onClick: ({ key, domEvent }) => {
      domEvent.stopPropagation();

      if (key === 'rename') {
        setRenameTargetId(item.id);
        setRenameOpen(true);
      }

      if (key === 'delete') {
        handleDeleteConversation(item.id);
      }
    },
  });

  return (
    <PageContainer
      className={styles.page}
      title="项目执行知识问答"
      subTitle="面向任务、审批、材料等项目执行信息查询"
    >
      <div className={styles.board}>
        <section className={`${styles.panel} ${styles.sessionPanel}`}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>会话列表</span>
          </div>
          <div className={styles.panelBody}>
            <PermissionButton
              permission="knowledge:qa:use"
              type="primary"
              block
              icon={<PlusOutlined />}
              className={styles.leftAction}
              onClick={handleCreateConversation}
            >
              新建会话
            </PermissionButton>
            <div className={styles.panelScroll}>
              <List
                loading={conversationsLoading}
                dataSource={visibleConversations}
                renderItem={(item) => {
                  const isActive = item.id === activeConversationId;
                  const canOperate = access.hasPermission('knowledge:conversation:update');

                  return (
                    <List.Item
                      className={`${styles.conversationItem} ${
                        isActive ? styles.conversationItemActive : ''
                      }`}
                      onClick={() => handleSelectConversation(item.id)}
                      actions={
                        canOperate
                          ? [
                              <Dropdown
                                key="more"
                                trigger={['click']}
                                menu={buildConversationMenu(item)}
                              >
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<MoreOutlined />}
                                  className={styles.conversationAction}
                                  onClick={(event) => event.stopPropagation()}
                                />
                              </Dropdown>,
                            ]
                          : []
                      }
                    >
                      <div className={styles.conversationMeta}>
                        <span className={styles.conversationTitle}>{item.title}</span>
                        <span className={styles.conversationTime}>{item.updatedAt}</span>
                      </div>
                    </List.Item>
                  );
                }}
              />
            </div>
          </div>
        </section>

        <section className={`${styles.panel} ${styles.chatPanel}`}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>对话区</span>
          </div>
          <div className={styles.panelBody}>
            <div className={styles.chatBody}>
              <Select
                mode="multiple"
                style={{ width: '100%' }}
                value={selectedBaseIds}
                placeholder="选择知识范围"
                options={(basePage?.list ?? []).map((item) => ({ label: item.name, value: item.id }))}
                onChange={setSelectedBaseIds}
              />
              {errorMessage ? (
                <Alert
                  type="error"
                  showIcon
                  message={errorMessage}
                  action={
                    <Button size="small" type="link" onClick={() => retryLastQuestion()}>
                      重新提问
                    </Button>
                  }
                />
              ) : null}
              <div className={styles.chatViewport}>
                <KnowledgeChatMessageList
                  messages={mergedMessages}
                  isStreaming={isStreaming}
                  variant="page"
                  emptyDescription="请输入问题，回答完成后会展示引用来源。"
                  viewportStyle={{ minHeight: 0, height: '100%' }}
                  showReferences
                  showUserActions
                  onReferenceClick={(reference) => {
                    setActiveReference(reference);
                    setReferenceOpen(true);
                  }}
                  onEditMessage={handleEditMessage}
                />
              </div>
              <div className={styles.inputArea}>
                {isStreaming ? (
                  <div className={styles.stopBar}>
                    <Button
                      type="default"
                      shape="round"
                      icon={stopIcon}
                      className={styles.stopFloatingButton}
                      onClick={stopStreaming}
                    >
                      停止回答
                    </Button>
                  </div>
                ) : null}
                <KnowledgeChatComposer
                  inputRef={inputRef}
                  value={question}
                  placeholder="请输入项目执行相关问题"
                  variant="page"
                  minRows={4}
                  maxRows={6}
                  permission="knowledge:qa:use"
                  disabled={selectedBaseIds.length === 0}
                  loading={isStreaming}
                  editingLabel={editingMessageState ? '修改重发' : undefined}
                  onChange={setQuestion}
                  onSubmit={handleSubmitQuestion}
                  onCancelEdit={editingMessageState ? handleCancelEdit : undefined}
                />
              </div>
            </div>
          </div>
        </section>

        <section className={`${styles.panel} ${styles.referencePanel}`}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>引用来源</span>
          </div>
          <div className={styles.panelBody}>
            {!lastAssistantMessage?.references?.length ? (
              <div className={styles.referenceEmpty}>
                <Typography.Text type="secondary" className={styles.referenceHint}>
                  {isStreaming ? '回答完成后显示引用来源。' : '暂无引用来源。'}
                </Typography.Text>
              </div>
            ) : (
              <div className={styles.referenceList}>
                <List
                  dataSource={lastAssistantMessage.references}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <a
                          key="preview"
                          onClick={() => {
                            setActiveReference(item);
                            setReferenceOpen(true);
                          }}
                        >
                          查看摘录
                        </a>,
                      ]}
                    >
                      <List.Item.Meta
                        title={
                          <Space>
                            <Typography.Text strong>{item.title}</Typography.Text>
                            <Tag>{REFERENCE_TYPE_LABELS[item.sourceType]}</Tag>
                          </Space>
                        }
                        description={item.snippet}
                      />
                    </List.Item>
                  )}
                />
              </div>
            )}
          </div>
        </section>
      </div>

      <ModalForm<{ title: string }>
        key={renameTargetId || 'draft'}
        title="重命名会话"
        open={renameOpen}
        modalProps={{
          destroyOnClose: true,
          onCancel: () => setRenameOpen(false),
        }}
        initialValues={{ title: renameTargetConversation?.title || currentConversation?.title }}
        onFinish={async (values) => {
          await renameMutation.mutateAsync(values.title);
          return true;
        }}
      >
        <ProFormText
          name="title"
          label="会话标题"
          rules={[
            { required: true, message: '请输入会话标题' },
            { min: 2, max: 30, message: '会话标题长度需要在 2 到 30 个字符之间' },
          ]}
        />
      </ModalForm>

      <KnowledgeReferencePreviewModal
        open={referenceOpen}
        reference={activeReference}
        onClose={() => setReferenceOpen(false)}
      />
    </PageContainer>
  );
}
