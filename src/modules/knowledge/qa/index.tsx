import { useEffect, useMemo, useRef, useState } from 'react';
import { history, useAccess, useLocation } from '@umijs/max';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Empty, Input, List, Modal, Select, Space, Tag, Typography, message } from 'antd';
import { EditOutlined, ReloadOutlined, StopOutlined } from '@ant-design/icons';
import { ModalForm, PageContainer, ProCard, ProFormText } from '@ant-design/pro-components';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import PermissionButton from '@/components/common/PermissionButton';
import { askKnowledge, askKnowledgeStream, createConversation, renameConversation } from '@/services/api/knowledge';
import { useConversationMessages, useKnowledgeBases, useKnowledgeConversations } from '@/queries/knowledge.query';
import { queryKeys } from '@/queries/keys';
import type { ConversationMessage, KnowledgeReference } from '@/types/knowledge';

const STREAMING_ENABLED = String(process.env.UMI_APP_ENABLE_STREAMING).toLowerCase() !== 'false';

export default function KnowledgeQaPage() {
  const access = useAccess() as any;
  const location = useLocation();
  const [question, setQuestion] = useState(new URLSearchParams(location.search).get('keyword') || '');
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>();
  const [selectedBaseIds, setSelectedBaseIds] = useState<string[]>([]);
  const [pendingUserMessage, setPendingUserMessage] = useState<ConversationMessage | undefined>();
  const [streamingMessage, setStreamingMessage] = useState<ConversationMessage | undefined>();
  const [renameOpen, setRenameOpen] = useState(false);
  const [referenceOpen, setReferenceOpen] = useState(false);
  const [activeReference, setActiveReference] = useState<KnowledgeReference | undefined>();
  const queryClient = useQueryClient();
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { data: conversations = [], isLoading: conversationsLoading } = useKnowledgeConversations();
  const { data: messageList = [], isLoading: messagesLoading } = useConversationMessages(activeConversationId);
  const { data: basePage } = useKnowledgeBases();
  const currentConversation = conversations.find((item) => item.id === activeConversationId);

  useEffect(() => {
    if (!activeConversationId && conversations.length > 0) {
      setActiveConversationId(conversations[0].id);
    }
  }, [activeConversationId, conversations]);

  useEffect(() => {
    const initialBaseId = new URLSearchParams(location.search).get('baseId');
    if (selectedBaseIds.length === 0 && basePage?.list.length) {
      setSelectedBaseIds(initialBaseId ? [initialBaseId] : [basePage.list[0].id]);
    }
  }, [basePage?.list, location.search, selectedBaseIds.length]);

  useEffect(() => {
    const keyword = new URLSearchParams(location.search).get('keyword') || '';
    if (keyword) {
      setQuestion(keyword);
    }
  }, [location.search]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messageList, pendingUserMessage, streamingMessage]);

  const mergedMessages = useMemo(() => {
    const items = [...messageList];
    if (pendingUserMessage) items.push(pendingUserMessage);
    if (streamingMessage) items.push(streamingMessage);
    return items;
  }, [messageList, pendingUserMessage, streamingMessage]);

  const lastAssistantMessage = useMemo(() => [...mergedMessages].reverse().find((item) => item.role === 'assistant'), [mergedMessages]);
  const lastUserMessage = useMemo(() => [...messageList].reverse().find((item) => item.role === 'user'), [messageList]);

  const stopStreaming = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsStreaming(false);
    setPendingUserMessage(undefined);
    setStreamingMessage(undefined);
    message.info('已停止生成');
  };

  const runAsk = async (rawQuestion: string) => {
    const content = rawQuestion.trim();
    if (!content || isStreaming) return;

    try {
      setIsStreaming(true);
      let conversationId = activeConversationId;
      if (!conversationId) {
        const conversation = await createConversation(content.slice(0, 12));
        conversationId = conversation.id;
        setActiveConversationId(conversationId);
      }

      const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
      setPendingUserMessage({ id: `temp-user-${Date.now()}`, role: 'user', content, createdAt: now });
      setStreamingMessage({ id: `temp-assistant-${Date.now() + 1}`, role: 'assistant', content: '', createdAt: now, references: [] });
      setQuestion('');

      if (STREAMING_ENABLED) {
        const controller = new AbortController();
        abortControllerRef.current = controller;
        let refs: KnowledgeReference[] = [];
        await askKnowledgeStream(
          { conversationId, question: content, baseIds: selectedBaseIds },
          {
            signal: controller.signal,
            onEvent: (event) => {
              if (event.type === 'delta') {
                setStreamingMessage((prev) => prev ? { ...prev, content: `${prev.content}${event.content}` } : prev);
              }
              if (event.type === 'references') {
                refs = event.references;
                setStreamingMessage((prev) => prev ? { ...prev, references: event.references } : prev);
              }
              if (event.type === 'done') {
                setStreamingMessage((prev) => prev ? { ...prev, references: refs } : prev);
              }
            },
          },
        );
      } else {
        const answer = await askKnowledge({ conversationId, question: content, baseIds: selectedBaseIds });
        setStreamingMessage((prev) => prev ? { ...prev, content: answer.content, references: answer.references } : prev);
      }

      abortControllerRef.current = null;
      setPendingUserMessage(undefined);
      setStreamingMessage(undefined);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.knowledge.conversations }),
        queryClient.invalidateQueries({ queryKey: queryKeys.knowledge.messages(conversationId) }),
      ]);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      message.error(error instanceof Error ? error.message : '提问失败');
    } finally {
      setIsStreaming(false);
    }
  };

  const renameMutation = useMutation({
    mutationFn: async (title: string) => renameConversation(activeConversationId as string, title),
    onSuccess: async () => {
      message.success('会话名称已更新');
      setRenameOpen(false);
      await queryClient.invalidateQueries({ queryKey: queryKeys.knowledge.conversations });
    },
  });

  return (
    <PageContainer title="知识问答" subTitle="已补齐停止生成、重新生成、引用跳转和会话重命名。">
      <ProCard split="vertical">
        <ProCard colSpan="24%" title="会话列表" loading={conversationsLoading} extra={<Tag color="blue">{STREAMING_ENABLED ? 'Streaming Mock' : 'Mock'}</Tag>}>
          <PermissionButton
            permission="knowledge:qa:use"
            type="primary"
            block
            style={{ marginBottom: 12 }}
            onClick={async () => {
              const conversation = await createConversation('新建会话');
              setActiveConversationId(conversation.id);
              await queryClient.invalidateQueries({ queryKey: queryKeys.knowledge.conversations });
            }}
          >
            新建会话
          </PermissionButton>
          <List
            dataSource={conversations}
            renderItem={(item) => (
              <List.Item
                actions={
                  access.hasPermission('knowledge:conversation:update')
                    ? [<Button key="rename" type="text" icon={<EditOutlined />} onClick={(event) => { event.stopPropagation(); setActiveConversationId(item.id); setRenameOpen(true); }} />]
                    : []
                }
                style={{ cursor: 'pointer', borderRadius: 8, paddingInline: 12, background: item.id === activeConversationId ? '#e6f4ff' : 'transparent' }}
                onClick={() => setActiveConversationId(item.id)}
              >
                <List.Item.Meta title={item.title} description={item.updatedAt} />
              </List.Item>
            )}
          />
        </ProCard>
        <ProCard colSpan="50%" title="对话区" loading={messagesLoading} extra={<Space>{isStreaming ? <Button icon={<StopOutlined />} onClick={stopStreaming}>停止生成</Button> : null}{lastUserMessage ? <Button icon={<ReloadOutlined />} onClick={() => runAsk(lastUserMessage.content)}>重新生成</Button> : null}</Space>}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Select mode="multiple" style={{ width: '100%' }} value={selectedBaseIds} placeholder="选择参与问答的知识库" options={(basePage?.list ?? []).map((item) => ({ label: item.name, value: item.id }))} onChange={setSelectedBaseIds} />
            <div style={{ minHeight: 360, maxHeight: 520, overflowY: 'auto', paddingRight: 8 }}>
              {mergedMessages.length === 0 ? <Empty description="先输入一个问题，生成首条问答记录" /> : <List dataSource={mergedMessages} renderItem={(item) => (<List.Item style={{ justifyContent: item.role === 'user' ? 'flex-end' : 'flex-start' }}><div style={{ maxWidth: '80%', padding: 12, borderRadius: 12, background: item.role === 'user' ? '#1677ff' : '#f5f5f5', color: item.role === 'user' ? '#fff' : 'inherit' }}>{item.role === 'assistant' ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.content || (isStreaming ? '生成中...' : '')}</ReactMarkdown> : <Typography.Text style={{ color: '#fff' }}>{item.content}</Typography.Text>}<div style={{ marginTop: 8, fontSize: 12, opacity: 0.72 }}>{item.createdAt}</div></div></List.Item>)} />}
              <div ref={messageEndRef} />
            </div>
            <Input.TextArea rows={4} value={question} placeholder="请输入问题，例如：请总结员工请假审批流程" onChange={(event) => setQuestion(event.target.value)} />
            <div style={{ textAlign: 'right' }}>
              <PermissionButton permission="knowledge:qa:use" type="primary" loading={isStreaming} disabled={!question.trim()} onClick={() => runAsk(question)}>
                {STREAMING_ENABLED ? '流式提问' : '提交问题'}
              </PermissionButton>
            </div>
          </Space>
        </ProCard>
        <ProCard colSpan="26%" title="知识引用">
          {!lastAssistantMessage?.references?.length ? <Empty description={isStreaming ? '答案生成结束后展示引用' : '暂无引用文档'} /> : <List dataSource={lastAssistantMessage.references} renderItem={(item) => (<List.Item actions={[<a key="preview" onClick={() => { setActiveReference(item); setReferenceOpen(true); }}>查看摘录</a>, <a key="jump" onClick={() => history.push(`/knowledge/document?keyword=${encodeURIComponent(item.title)}`)}>跳转文档</a>]}><List.Item.Meta title={<Space><Typography.Text strong>{item.title}</Typography.Text><Tag>{item.sourceType}</Tag></Space>} description={item.snippet} /></List.Item>)} />}
        </ProCard>
      </ProCard>
      <ModalForm<{ title: string }>
        title="重命名会话"
        open={renameOpen}
        modalProps={{ destroyOnClose: true, onCancel: () => setRenameOpen(false) }}
        initialValues={{ title: currentConversation?.title }}
        onFinish={async (values) => { await renameMutation.mutateAsync(values.title); return true; }}
      >
        <ProFormText name="title" label="会话标题" rules={[{ required: true, message: '请输入会话标题' }, { min: 2, max: 30, message: '会话标题长度需在 2 到 30 位之间' }]} />
      </ModalForm>
      <Modal title={activeReference?.title} open={referenceOpen} footer={null} onCancel={() => setReferenceOpen(false)}>
        <Typography.Paragraph>{activeReference?.snippet}</Typography.Paragraph>
      </Modal>
    </PageContainer>
  );
}
