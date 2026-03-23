import { useEffect, useMemo, useState } from 'react';
import { history, useAccess, useLocation } from '@umijs/max';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Input, Popconfirm, Select, Tag, message } from 'antd';
import { ModalForm, PageContainer, ProFormSelect, ProFormText, ProTable } from '@ant-design/pro-components';
import type { Key, ReactNode } from 'react';
import PermissionButton from '@/components/common/PermissionButton';
import { queryKeys } from '@/queries/keys';
import { useKnowledgeBases, useKnowledgeDocuments } from '@/queries/knowledge.query';
import { createKnowledgeDocument, deleteKnowledgeDocument, updateKnowledgeDocument } from '@/services/api/knowledge';
import type { KnowledgeDocumentFormPayload, KnowledgeDocumentItem } from '@/types/knowledge';

export default function KnowledgeDocumentPage() {
  const access = useAccess() as any;
  const location = useLocation();
  const queryClient = useQueryClient();
  const initialKeyword = useMemo(() => new URLSearchParams(location.search).get('keyword') || '', [location.search]);
  const initialBaseId = useMemo(() => new URLSearchParams(location.search).get('baseId') || undefined, [location.search]);
  const [editingRecord, setEditingRecord] = useState<KnowledgeDocumentItem | undefined>();
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState(initialKeyword);
  const [statusFilter, setStatusFilter] = useState<'all' | 'indexed' | 'draft'>('all');
  const [baseFilter, setBaseFilter] = useState<string | undefined>(initialBaseId);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const { data, isLoading } = useKnowledgeDocuments();
  const { data: basePage } = useKnowledgeBases();

  useEffect(() => {
    setKeyword(initialKeyword);
    setBaseFilter(initialBaseId);
  }, [initialBaseId, initialKeyword]);

  const scopedData = useMemo(() => access.applyDataScope?.(data?.list ?? []) ?? (data?.list ?? []), [access, data?.list]);
  const filteredData = useMemo(() => scopedData.filter((item: KnowledgeDocumentItem) => (!keyword || [item.title, item.baseName, item.ownerUsername || ''].some((text) => text.toLowerCase().includes(keyword.toLowerCase()))) && (statusFilter === 'all' || item.status === statusFilter) && (!baseFilter || item.baseId === baseFilter)), [baseFilter, keyword, scopedData, statusFilter]);
  const baseOptions = useMemo(() => (basePage?.list ?? []).map((item) => ({ label: item.name, value: item.id })), [basePage?.list]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: [...queryKeys.knowledge.documents(''), 'all', 'all'] });
  const saveMutation = useMutation({ mutationFn: async (values: KnowledgeDocumentFormPayload) => editingRecord ? updateKnowledgeDocument(editingRecord.id, values) : createKnowledgeDocument(values), onSuccess: async () => { message.success(editingRecord ? '文档已更新' : '文档已创建'); setOpen(false); setEditingRecord(undefined); await Promise.all([refresh(), queryClient.invalidateQueries({ queryKey: [...queryKeys.knowledge.bases(''), 'all'] })]); } });
  const deleteMutation = useMutation({ mutationFn: deleteKnowledgeDocument, onSuccess: async () => { message.success('文档已删除'); await Promise.all([refresh(), queryClient.invalidateQueries({ queryKey: [...queryKeys.knowledge.bases(''), 'all'] })]); } });
  const batchDeleteMutation = useMutation({ mutationFn: async (ids: Key[]) => Promise.all(ids.map((id) => deleteKnowledgeDocument(String(id)))), onSuccess: async () => { message.success('批量删除完成'); setSelectedRowKeys([]); await Promise.all([refresh(), queryClient.invalidateQueries({ queryKey: [...queryKeys.knowledge.bases(''), 'all'] })]); } });

  return (
    <PageContainer title="文档管理" subTitle="已补齐 CRUD、搜索筛选、引用跳转承接和按钮权限。">
      <ProTable<KnowledgeDocumentItem>
        rowKey="id"
        search={false}
        loading={isLoading}
        dataSource={filteredData}
        rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
        toolBarRender={() => [
          <Input key="keyword" allowClear placeholder="搜索文档标题/知识库/负责人" style={{ width: 240 }} value={keyword} onChange={(event) => setKeyword(event.target.value)} />,
          <Select key="base" allowClear value={baseFilter} placeholder="所属知识库" style={{ width: 180 }} options={baseOptions} onChange={setBaseFilter} />,
          <Select key="status" value={statusFilter} style={{ width: 140 }} options={[{ label: '全部状态', value: 'all' }, { label: '已索引', value: 'indexed' }, { label: '草稿', value: 'draft' }]} onChange={setStatusFilter} />,
          <PermissionButton key="batch-delete" permission="knowledge:document:delete" danger disabled={!selectedRowKeys.length} onClick={() => batchDeleteMutation.mutate(selectedRowKeys)}>批量删除</PermissionButton>,
          <PermissionButton key="create" permission="knowledge:document:create" type="primary" onClick={() => { setEditingRecord(undefined); setOpen(true); }}>新增文档</PermissionButton>,
        ]}
        columns={[
          { title: '文档标题', dataIndex: 'title' },
          { title: '所属知识库', dataIndex: 'baseName' },
          { title: '负责人', dataIndex: 'ownerUsername', width: 100 },
          { title: '索引状态', dataIndex: 'status', render: (_, record) => <Tag color={record.status === 'indexed' ? 'green' : 'orange'}>{record.status}</Tag> },
          { title: '更新时间', dataIndex: 'updatedAt', width: 180 },
          {
            title: '操作', valueType: 'option', render: (_, record) => {
              const actions = [<a key="jump" onClick={() => history.push(`/knowledge/qa?keyword=${encodeURIComponent(record.title)}`)}>去问答引用</a>] as ReactNode[];
              if (access.hasPermission('knowledge:document:update')) actions.push(<a key="edit" onClick={() => { setEditingRecord(record); setOpen(true); }}>编辑</a>);
              if (access.hasPermission('knowledge:document:delete')) actions.push(<Popconfirm key="delete" title="确认删除该文档？" onConfirm={() => deleteMutation.mutate(record.id)}><a>删除</a></Popconfirm>);
              return actions;
            }
          },
        ]}
        pagination={{ pageSize: 10 }}
      />
      <ModalForm<KnowledgeDocumentFormPayload>
        title={editingRecord ? '编辑文档' : '新增文档'}
        open={open}
        modalProps={{ destroyOnClose: true, onCancel: () => { setOpen(false); setEditingRecord(undefined); } }}
        initialValues={editingRecord ? { title: editingRecord.title, baseId: editingRecord.baseId, status: editingRecord.status } : { status: 'draft' }}
        onFinish={async (values) => { await saveMutation.mutateAsync(values); return true; }}
      >
        <ProFormText name="title" label="文档标题" rules={[{ required: true, message: '请输入文档标题' }, { min: 2, max: 50, message: '文档标题长度需在 2 到 50 位之间' }]} />
        <ProFormSelect name="baseId" label="所属知识库" options={baseOptions} rules={[{ required: true, message: '请选择所属知识库' }]} />
        <ProFormSelect name="status" label="索引状态" options={[{ label: '已索引', value: 'indexed' }, { label: '草稿', value: 'draft' }]} rules={[{ required: true, message: '请选择索引状态' }]} />
      </ModalForm>
    </PageContainer>
  );
}
