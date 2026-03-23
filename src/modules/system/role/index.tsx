import { useMemo, useState } from 'react';
import { useAccess } from '@umijs/max';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Input, Popconfirm, Select, Space, Tag, message } from 'antd';
import { ModalForm, PageContainer, ProFormSelect, ProFormText, ProTable } from '@ant-design/pro-components';
import type { Key, ReactNode } from 'react';
import PermissionButton from '@/components/common/PermissionButton';
import { queryKeys } from '@/queries/keys';
import { useRolePage } from '@/queries/system.query';
import { createRole, deleteRole, updateRole } from '@/services/api/system';
import type { RoleFormPayload, RoleItem } from '@/types/system';

export default function SystemRolePage() {
  const access = useAccess() as any;
  const queryClient = useQueryClient();
  const [editingRecord, setEditingRecord] = useState<RoleItem | undefined>();
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const { data, isLoading } = useRolePage();
  const filteredData = useMemo(() => (data?.list ?? []).filter((item) => (!keyword || [item.name, item.code, item.permissions.join(',')].some((text) => text.toLowerCase().includes(keyword.toLowerCase()))) && (statusFilter === 'all' || item.status === statusFilter)), [data?.list, keyword, statusFilter]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.system.roles('') });
  const saveMutation = useMutation({ mutationFn: async (values: RoleFormPayload) => editingRecord ? updateRole(editingRecord.id, values) : createRole(values), onSuccess: async () => { message.success(editingRecord ? '角色已更新' : '角色已创建'); setOpen(false); setEditingRecord(undefined); await refresh(); } });
  const deleteMutation = useMutation({ mutationFn: deleteRole, onSuccess: async () => { message.success('角色已删除'); await refresh(); } });
  const batchDeleteMutation = useMutation({ mutationFn: async (ids: Key[]) => Promise.all(ids.map((id) => deleteRole(String(id)))), onSuccess: async () => { message.success('批量删除完成'); setSelectedRowKeys([]); await refresh(); } });

  return (
    <PageContainer title="角色管理" subTitle="角色页已支持搜索、筛选、批量操作和权限码校验。">
      <ProTable<RoleItem>
        rowKey="id"
        search={false}
        loading={isLoading}
        dataSource={filteredData}
        rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
        toolBarRender={() => [
          <Input key="keyword" allowClear placeholder="搜索角色名称/编码/权限" style={{ width: 240 }} value={keyword} onChange={(event) => setKeyword(event.target.value)} />,
          <Select key="status" value={statusFilter} style={{ width: 140 }} options={[{ label: '全部状态', value: 'all' }, { label: '启用', value: 'enabled' }, { label: '禁用', value: 'disabled' }]} onChange={setStatusFilter} />,
          <PermissionButton key="batch-delete" permission="system:role:delete" danger disabled={!selectedRowKeys.length} onClick={() => batchDeleteMutation.mutate(selectedRowKeys)}>批量删除</PermissionButton>,
          <PermissionButton key="create" permission="system:role:create" type="primary" onClick={() => { setEditingRecord(undefined); setOpen(true); }}>新增角色</PermissionButton>,
        ]}
        columns={[
          { title: '角色名称', dataIndex: 'name', width: 180 },
          { title: '角色编码', dataIndex: 'code', width: 180 },
          { title: '权限', dataIndex: 'permissions', render: (_, record) => <Space wrap>{record.permissions.map((item) => <Tag key={item}>{item}</Tag>)}</Space> },
          { title: '状态', dataIndex: 'status', render: (_, record) => <Tag color={record.status === 'enabled' ? 'green' : 'default'}>{record.status}</Tag> },
          { title: '操作', valueType: 'option', render: (_, record) => {
            const actions = [] as ReactNode[];
            if (access.hasPermission('system:role:update')) actions.push(<a key="edit" onClick={() => { setEditingRecord(record); setOpen(true); }}>编辑</a>);
            if (access.hasPermission('system:role:delete')) actions.push(<Popconfirm key="delete" title="确认删除该角色？" onConfirm={() => deleteMutation.mutate(record.id)}><a>删除</a></Popconfirm>);
            return actions;
          }},
        ]}
        pagination={{ pageSize: 10 }}
      />
      <ModalForm<RoleFormPayload>
        title={editingRecord ? '编辑角色' : '新增角色'}
        open={open}
        modalProps={{ destroyOnClose: true, onCancel: () => { setOpen(false); setEditingRecord(undefined); } }}
        initialValues={editingRecord ?? { status: 'enabled', permissions: [] }}
        onFinish={async (values) => { await saveMutation.mutateAsync({ ...values, permissions: [...new Set(values.permissions)] }); return true; }}
      >
        <ProFormText name="name" label="角色名称" rules={[{ required: true, message: '请输入角色名称' }, { min: 2, max: 20, message: '角色名称长度需在 2 到 20 位之间' }]} />
        <ProFormText name="code" label="角色编码" rules={[{ required: true, message: '请输入角色编码' }, { pattern: /^[a-z0-9_]+$/i, message: '角色编码只能包含字母、数字和下划线' }, { validator: async (_, value) => { if (!value) return Promise.resolve(); if ((data?.list ?? []).some((item) => item.code === value && item.id !== editingRecord?.id)) return Promise.reject(new Error('角色编码已存在')); return Promise.resolve(); } }]} />
        <ProFormSelect name="permissions" label="权限码" mode="tags" fieldProps={{ tokenSeparators: [',', ' '] }} rules={[{ required: true, message: '请至少填写一个权限码' }]} />
        <ProFormSelect name="status" label="状态" options={[{ label: '启用', value: 'enabled' }, { label: '禁用', value: 'disabled' }]} rules={[{ required: true, message: '请选择状态' }]} />
      </ModalForm>
    </PageContainer>
  );
}
