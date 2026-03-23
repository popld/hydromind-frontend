import { useMemo, useState } from 'react';
import { useAccess } from '@umijs/max';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Input, Popconfirm, Select, Space, Tag, message } from 'antd';
import { ModalForm, PageContainer, ProFormSelect, ProFormText, ProTable } from '@ant-design/pro-components';
import type { Key, ReactNode } from 'react';
import PermissionButton from '@/components/common/PermissionButton';
import { queryKeys } from '@/queries/keys';
import { useDeptTree, usePostPage, useRolePage, useUserPage } from '@/queries/system.query';
import { createUser, deleteUser, updateUser } from '@/services/api/system';
import type { DeptTreeItem, RoleItem, UserFormPayload, UserItem } from '@/types/system';

function flattenDeptTree(source: DeptTreeItem[]): DeptTreeItem[] {
  return source.flatMap((item) => [item, ...(item.children ? flattenDeptTree(item.children) : [])]);
}

export default function SystemUserPage() {
  const access = useAccess() as any;
  const queryClient = useQueryClient();
  const [editingRecord, setEditingRecord] = useState<UserItem | undefined>();
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const { data, isLoading } = useUserPage();
  const { data: deptTree } = useDeptTree();
  const { data: postPage } = usePostPage();
  const { data: rolePage } = useRolePage();

  const scopedData = useMemo(() => access.applyDataScope?.(data?.list ?? []) ?? (data?.list ?? []), [access, data?.list]);
  const filteredData = useMemo(() => {
    return scopedData.filter((item: UserItem) => {
      const matchesKeyword = !keyword || [item.username, item.nickname, item.deptName].some((text) => text.toLowerCase().includes(keyword.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesKeyword && matchesStatus;
    });
  }, [keyword, scopedData, statusFilter]);

  const deptOptions = useMemo(
    () => flattenDeptTree(deptTree ?? []).filter((item) => item.id !== 'dept-root').map((item) => ({ label: item.name, value: item.name })),
    [deptTree],
  );
  const postOptions = useMemo(() => (postPage?.list ?? []).map((item) => ({ label: item.name, value: item.name })), [postPage?.list]);
  const roleOptions = useMemo(() => (rolePage?.list ?? []).map((item: RoleItem) => ({ label: item.name, value: item.name })), [rolePage?.list]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.system.users('') });

  const saveMutation = useMutation({
    mutationFn: async (values: UserFormPayload) => (editingRecord ? updateUser(editingRecord.id, values) : createUser(values)),
    onSuccess: async () => {
      message.success(editingRecord ? '用户已更新' : '用户已创建');
      setOpen(false);
      setEditingRecord(undefined);
      await refresh();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: async () => {
      message.success('用户已删除');
      await refresh();
    },
  });

  const batchDeleteMutation = useMutation({
    mutationFn: async (ids: Key[]) => Promise.all(ids.map((id) => deleteUser(String(id)))),
    onSuccess: async () => {
      message.success('批量删除完成');
      setSelectedRowKeys([]);
      await refresh();
    },
  });

  return (
    <PageContainer title="用户管理" subTitle="已补齐搜索、筛选、批量操作、表单校验、按钮权限和数据范围。">
      <ProTable<UserItem>
        rowKey="id"
        search={false}
        loading={isLoading}
        dataSource={filteredData}
        rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
        toolBarRender={() => [
          <Input key="keyword" allowClear placeholder="搜索用户名/昵称/部门" style={{ width: 220 }} value={keyword} onChange={(event) => setKeyword(event.target.value)} />,
          <Select
            key="status"
            value={statusFilter}
            style={{ width: 140 }}
            options={[{ label: '全部状态', value: 'all' }, { label: '启用', value: 'enabled' }, { label: '禁用', value: 'disabled' }]}
            onChange={setStatusFilter}
          />,
          <PermissionButton
            key="batch-delete"
            permission="system:user:delete"
            danger
            disabled={!selectedRowKeys.length}
            onClick={() => batchDeleteMutation.mutate(selectedRowKeys)}
          >
            批量删除
          </PermissionButton>,
          <PermissionButton
            key="create"
            permission="system:user:create"
            type="primary"
            onClick={() => {
              setEditingRecord(undefined);
              setOpen(true);
            }}
          >
            新增用户
          </PermissionButton>,
        ]}
        columns={[
          { title: '用户名', dataIndex: 'username', width: 140 },
          { title: '昵称', dataIndex: 'nickname', width: 140 },
          { title: '部门', dataIndex: 'deptName', width: 180 },
          { title: '岗位', dataIndex: 'postNames', render: (_, record) => <Space wrap>{record.postNames.map((item) => <Tag key={item}>{item}</Tag>)}</Space> },
          { title: '角色', dataIndex: 'roleNames', render: (_, record) => <Space wrap>{record.roleNames.map((item) => <Tag color="blue" key={item}>{item}</Tag>)}</Space> },
          { title: '状态', dataIndex: 'status', render: (_, record) => <Tag color={record.status === 'enabled' ? 'green' : 'default'}>{record.status}</Tag> },
          { title: '创建时间', dataIndex: 'createdAt', width: 180 },
          {
            title: '操作',
            valueType: 'option',
            width: 180,
            render: (_, record) => {
              const actions = [] as ReactNode[];
              if (access.hasPermission('system:user:update')) {
                actions.push(<a key="edit" onClick={() => { setEditingRecord(record); setOpen(true); }}>编辑</a>);
              }
              if (access.hasPermission('system:user:delete')) {
                actions.push(
                  <Popconfirm key="delete" title="确认删除该用户？" onConfirm={() => deleteMutation.mutate(record.id)}>
                    <a>删除</a>
                  </Popconfirm>,
                );
              }
              return actions;
            },
          },
        ]}
        pagination={{ pageSize: 10 }}
      />
      <ModalForm<UserFormPayload>
        title={editingRecord ? '编辑用户' : '新增用户'}
        open={open}
        modalProps={{ destroyOnClose: true, onCancel: () => { setOpen(false); setEditingRecord(undefined); } }}
        initialValues={editingRecord ? { username: editingRecord.username, nickname: editingRecord.nickname, deptName: editingRecord.deptName, postNames: editingRecord.postNames, roleNames: editingRecord.roleNames, status: editingRecord.status } : { status: 'enabled', postNames: [], roleNames: [] }}
        onFinish={async (values) => {
          await saveMutation.mutateAsync(values);
          return true;
        }}
      >
        <ProFormText
          name="username"
          label="用户名"
          disabled={Boolean(editingRecord)}
          rules={[
            { required: true, message: '请输入用户名' },
            { min: 4, max: 20, message: '用户名长度需在 4 到 20 位之间' },
            { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线' },
            {
              validator: async (_, value) => {
                if (!value || editingRecord) return Promise.resolve();
                if (scopedData.some((item: UserItem) => item.username === value)) {
                  return Promise.reject(new Error('用户名已存在'));
                }
                return Promise.resolve();
              },
            },
          ]}
        />
        <ProFormText name="nickname" label="昵称" rules={[{ required: true, message: '请输入昵称' }, { min: 2, max: 20, message: '昵称长度需在 2 到 20 位之间' }]} />
        <ProFormSelect name="deptName" label="部门" options={deptOptions} rules={[{ required: true, message: '请选择部门' }]} />
        <ProFormSelect name="postNames" label="岗位" mode="multiple" options={postOptions} rules={[{ required: true, message: '请至少选择一个岗位' }]} />
        <ProFormSelect name="roleNames" label="角色" mode="multiple" options={roleOptions} rules={[{ required: true, message: '请至少选择一个角色' }]} />
        <ProFormSelect name="status" label="状态" options={[{ label: '启用', value: 'enabled' }, { label: '禁用', value: 'disabled' }]} rules={[{ required: true, message: '请选择状态' }]} />
      </ModalForm>
    </PageContainer>
  );
}
