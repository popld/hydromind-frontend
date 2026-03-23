import { useMemo, useState } from 'react';
import { useAccess } from '@umijs/max';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Input, Popconfirm, Select, Tag, message } from 'antd';
import { ModalForm, PageContainer, ProFormSelect, ProFormText, ProTable } from '@ant-design/pro-components';
import type { Key, ReactNode } from 'react';
import PermissionButton from '@/components/common/PermissionButton';
import { queryKeys } from '@/queries/keys';
import { usePostPage } from '@/queries/system.query';
import { createPost, deletePost, updatePost } from '@/services/api/system';
import type { PostFormPayload, PostItem } from '@/types/system';

export default function SystemPostPage() {
  const access = useAccess() as any;
  const queryClient = useQueryClient();
  const [editingRecord, setEditingRecord] = useState<PostItem | undefined>();
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const { data, isLoading } = usePostPage();
  const filteredData = useMemo(() => (data?.list ?? []).filter((item) => (!keyword || [item.name, item.code].some((text) => text.toLowerCase().includes(keyword.toLowerCase()))) && (statusFilter === 'all' || item.status === statusFilter)), [data?.list, keyword, statusFilter]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.system.posts('') });
  const saveMutation = useMutation({ mutationFn: async (values: PostFormPayload) => editingRecord ? updatePost(editingRecord.id, values) : createPost(values), onSuccess: async () => { message.success(editingRecord ? '岗位已更新' : '岗位已创建'); setOpen(false); setEditingRecord(undefined); await refresh(); } });
  const deleteMutation = useMutation({ mutationFn: deletePost, onSuccess: async () => { message.success('岗位已删除'); await refresh(); } });
  const batchDeleteMutation = useMutation({ mutationFn: async (ids: Key[]) => Promise.all(ids.map((id) => deletePost(String(id)))), onSuccess: async () => { message.success('批量删除完成'); setSelectedRowKeys([]); await refresh(); } });

  return (
    <PageContainer title="岗位管理" subTitle="岗位页已补齐搜索、筛选、批量删除和表单校验。">
      <ProTable<PostItem>
        rowKey="id"
        search={false}
        loading={isLoading}
        dataSource={filteredData}
        rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
        toolBarRender={() => [
          <Input key="keyword" allowClear placeholder="搜索岗位名称/编码" style={{ width: 220 }} value={keyword} onChange={(event) => setKeyword(event.target.value)} />,
          <Select key="status" value={statusFilter} style={{ width: 140 }} options={[{ label: '全部状态', value: 'all' }, { label: '启用', value: 'enabled' }, { label: '禁用', value: 'disabled' }]} onChange={setStatusFilter} />,
          <PermissionButton key="batch-delete" permission="system:post:delete" danger disabled={!selectedRowKeys.length} onClick={() => batchDeleteMutation.mutate(selectedRowKeys)}>批量删除</PermissionButton>,
          <PermissionButton key="create" permission="system:post:create" type="primary" onClick={() => { setEditingRecord(undefined); setOpen(true); }}>新增岗位</PermissionButton>,
        ]}
        columns={[
          { title: '岗位名称', dataIndex: 'name' },
          { title: '岗位编码', dataIndex: 'code' },
          { title: '状态', dataIndex: 'status', render: (_, record) => <Tag color={record.status === 'enabled' ? 'green' : 'default'}>{record.status}</Tag> },
          { title: '操作', valueType: 'option', render: (_, record) => {
            const actions = [] as ReactNode[];
            if (access.hasPermission('system:post:update')) actions.push(<a key="edit" onClick={() => { setEditingRecord(record); setOpen(true); }}>编辑</a>);
            if (access.hasPermission('system:post:delete')) actions.push(<Popconfirm key="delete" title="确认删除该岗位？" onConfirm={() => deleteMutation.mutate(record.id)}><a>删除</a></Popconfirm>);
            return actions;
          }},
        ]}
        pagination={{ pageSize: 10 }}
      />
      <ModalForm<PostFormPayload>
        title={editingRecord ? '编辑岗位' : '新增岗位'}
        open={open}
        modalProps={{ destroyOnClose: true, onCancel: () => { setOpen(false); setEditingRecord(undefined); } }}
        initialValues={editingRecord ?? { status: 'enabled' }}
        onFinish={async (values) => { await saveMutation.mutateAsync(values); return true; }}
      >
        <ProFormText name="name" label="岗位名称" rules={[{ required: true, message: '请输入岗位名称' }, { min: 2, max: 20, message: '岗位名称长度需在 2 到 20 位之间' }]} />
        <ProFormText name="code" label="岗位编码" rules={[{ required: true, message: '请输入岗位编码' }, { pattern: /^[a-z0-9_]+$/i, message: '岗位编码只能包含字母、数字和下划线' }, { validator: async (_, value) => { if (!value) return Promise.resolve(); if ((data?.list ?? []).some((item) => item.code === value && item.id !== editingRecord?.id)) return Promise.reject(new Error('岗位编码已存在')); return Promise.resolve(); } }]} />
        <ProFormSelect name="status" label="状态" options={[{ label: '启用', value: 'enabled' }, { label: '禁用', value: 'disabled' }]} rules={[{ required: true, message: '请选择状态' }]} />
      </ModalForm>
    </PageContainer>
  );
}
