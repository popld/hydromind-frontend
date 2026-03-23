import { useMemo, useState } from 'react';
import { useAccess } from '@umijs/max';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Input, Popconfirm, Select, Tag, message } from 'antd';
import { ModalForm, PageContainer, ProFormSelect, ProFormText, ProFormTextArea, ProTable } from '@ant-design/pro-components';
import type { Key, ReactNode } from 'react';
import PermissionButton from '@/components/common/PermissionButton';
import { queryKeys } from '@/queries/keys';
import { useKnowledgeBases } from '@/queries/knowledge.query';
import { createKnowledgeBase, deleteKnowledgeBase, updateKnowledgeBase } from '@/services/api/knowledge';
import type { KnowledgeBaseFormPayload, KnowledgeBaseItem } from '@/types/knowledge';

export default function KnowledgeBasePage() {
  const access = useAccess() as any;
  const queryClient = useQueryClient();
  const [editingRecord, setEditingRecord] = useState<KnowledgeBaseItem | undefined>();
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const { data, isLoading } = useKnowledgeBases();

  const scopedData = useMemo(() => access.applyDataScope?.(data?.list ?? []) ?? (data?.list ?? []), [access, data?.list]);
  const filteredData = useMemo(() => scopedData.filter((item: KnowledgeBaseItem) => (!keyword || [item.name, item.description || '', item.ownerUsername || ''].some((text) => text.toLowerCase().includes(keyword.toLowerCase()))) && (statusFilter === 'all' || item.status === statusFilter)), [keyword, scopedData, statusFilter]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: [...queryKeys.knowledge.bases(''), 'all'] });
  const saveMutation = useMutation({ mutationFn: async (values: KnowledgeBaseFormPayload) => editingRecord ? updateKnowledgeBase(editingRecord.id, values) : createKnowledgeBase(values), onSuccess: async () => { message.success(editingRecord ? '知识库已更新' : '知识库已创建'); setOpen(false); setEditingRecord(undefined); await refresh(); } });
  const deleteMutation = useMutation({ mutationFn: deleteKnowledgeBase, onSuccess: async () => { message.success('知识库已删除'); await refresh(); } });
  const batchDeleteMutation = useMutation({ mutationFn: async (ids: Key[]) => Promise.all(ids.map((id) => deleteKnowledgeBase(String(id)))), onSuccess: async () => { message.success('批量删除完成'); setSelectedRowKeys([]); await refresh(); } });

  return (
    <PageContainer title="知识库管理" subTitle="已补齐搜索、筛选、批量删除、表单校验和按钮级权限。">
      <ProTable<KnowledgeBaseItem>
        rowKey="id"
        search={false}
        loading={isLoading}
        dataSource={filteredData}
        rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
        toolBarRender={() => [
          <Input key="keyword" allowClear placeholder="搜索知识库名称/描述/负责人" style={{ width: 240 }} value={keyword} onChange={(event) => setKeyword(event.target.value)} />,
          <Select key="status" value={statusFilter} style={{ width: 140 }} options={[{ label: '全部状态', value: 'all' }, { label: '启用', value: 'enabled' }, { label: '禁用', value: 'disabled' }]} onChange={setStatusFilter} />,
          <PermissionButton key="batch-delete" permission="knowledge:base:delete" danger disabled={!selectedRowKeys.length} onClick={() => batchDeleteMutation.mutate(selectedRowKeys)}>批量删除</PermissionButton>,
          <PermissionButton key="create" permission="knowledge:base:create" type="primary" onClick={() => { setEditingRecord(undefined); setOpen(true); }}>新增知识库</PermissionButton>,
        ]}
        columns={[
          { title: '知识库名称', dataIndex: 'name' },
          { title: '描述', dataIndex: 'description', ellipsis: true },
          { title: '负责人', dataIndex: 'ownerUsername', width: 120 },
          { title: '文档数', dataIndex: 'documentCount', width: 100 },
          { title: '状态', dataIndex: 'status', render: (_, record) => <Tag color={record.status === 'enabled' ? 'green' : 'default'}>{record.status}</Tag> },
          { title: '更新时间', dataIndex: 'updatedAt', width: 180 },
          {
            title: '操作', valueType: 'option', render: (_, record) => {
              const actions = [] as ReactNode[];
              if (access.hasPermission('knowledge:base:update')) actions.push(<a key="edit" onClick={() => { setEditingRecord(record); setOpen(true); }}>编辑</a>);
              if (access.hasPermission('knowledge:base:delete')) actions.push(<Popconfirm key="delete" title="确认删除该知识库？其下文档也会一并删除。" onConfirm={() => deleteMutation.mutate(record.id)}><a>删除</a></Popconfirm>);
              return actions;
            }
          },
        ]}
        pagination={{ pageSize: 10 }}
      />
      <ModalForm<KnowledgeBaseFormPayload>
        title={editingRecord ? '编辑知识库' : '新增知识库'}
        open={open}
        modalProps={{ destroyOnClose: true, onCancel: () => { setOpen(false); setEditingRecord(undefined); } }}
        initialValues={editingRecord ? { name: editingRecord.name, description: editingRecord.description, status: editingRecord.status } : { status: 'enabled' }}
        onFinish={async (values) => { await saveMutation.mutateAsync(values); return true; }}
      >
        <ProFormText name="name" label="知识库名称" rules={[{ required: true, message: '请输入知识库名称' }, { min: 2, max: 30, message: '知识库名称长度需在 2 到 30 位之间' }, { validator: async (_, value) => { if (!value) return Promise.resolve(); if ((data?.list ?? []).some((item) => item.name === value && item.id !== editingRecord?.id)) return Promise.reject(new Error('知识库名称已存在')); return Promise.resolve(); } }]} />
        <ProFormTextArea name="description" label="描述" rules={[{ max: 200, message: '描述不能超过 200 字' }]} />
        <ProFormSelect name="status" label="状态" options={[{ label: '启用', value: 'enabled' }, { label: '禁用', value: 'disabled' }]} rules={[{ required: true, message: '请选择状态' }]} />
      </ModalForm>
    </PageContainer>
  );
}
