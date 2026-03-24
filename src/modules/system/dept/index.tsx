import { useMemo, useState } from 'react';
import { useAccess } from '@umijs/max';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Descriptions, Empty, Input, Popconfirm, Space, Tree, message } from 'antd';
import type { EventDataNode } from 'antd/es/tree';
import { ModalForm, PageContainer, ProCard, ProFormSelect, ProFormText } from '@ant-design/pro-components';
import PermissionButton from '@/components/common/PermissionButton';
import { queryKeys } from '@/queries/keys';
import { useDeptTree } from '@/queries/system.query';
import { createDept, deleteDept, updateDept } from '@/services/api/system';
import type { DeptFormPayload, DeptTreeItem } from '@/types/system';

function flattenTree(source: DeptTreeItem[]): DeptTreeItem[] {
  return source.flatMap((item) => [item, ...(item.children ? flattenTree(item.children) : [])]);
}

export default function SystemDeptPage() {
  const access = useAccess() as any;
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string>();
  const [editingRecord, setEditingRecord] = useState<DeptTreeItem | undefined>();
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const { data, isLoading } = useDeptTree();
  const flat = useMemo(() => flattenTree(data ?? []), [data]);
  const filteredFlat = useMemo(() => flat.filter((item) => !keyword || item.name.includes(keyword)), [flat, keyword]);
  const selected = filteredFlat.find((item) => item.id === selectedId) ?? flat.find((item) => item.id === selectedId);
  const parentOptions = flat.map((item) => ({ label: item.name, value: item.id }));
  const matchTreeNode = (node: EventDataNode<any>) => !keyword || String(node.title ?? '').includes(keyword);

  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.system.deptTree });

  const saveMutation = useMutation({
    mutationFn: async (values: DeptFormPayload) => editingRecord ? updateDept(editingRecord.id, values) : createDept(values),
    onSuccess: async () => {
      message.success(editingRecord ? '部门已更新' : '部门已创建');
      setOpen(false);
      setEditingRecord(undefined);
      await refresh();
    },
  });

  const deleteMutation = useMutation({ mutationFn: deleteDept, onSuccess: async () => { message.success('部门已删除'); setSelectedId(undefined); await refresh(); } });

  return (
    <PageContainer title="部门管理" subTitle="已补齐部门搜索和表单校验，支持按钮权限控制。">
      <ProCard split="vertical">
        <ProCard
          colSpan="45%"
          title="部门树"
          loading={isLoading}
          extra={
            <Space>
              <Input allowClear placeholder="搜索部门" value={keyword} onChange={(event) => setKeyword(event.target.value)} style={{ width: 180 }} />
              <PermissionButton permission="system:dept:create" type="primary" size="small" onClick={() => { setEditingRecord(undefined); setOpen(true); }}>
                新增部门
              </PermissionButton>
            </Space>
          }
        >
          {data?.length ? <Tree treeData={data as any} fieldNames={{ title: 'name', key: 'id', children: 'children' }} defaultExpandAll filterTreeNode={matchTreeNode} onSelect={(keys) => setSelectedId(keys[0] as string)} /> : <Empty description="暂无部门数据" />}
        </ProCard>
        <ProCard title="部门详情">
          {selected ? (
            <Space direction="vertical" style={{ width: '100%' }} size={16}>
              <Descriptions column={1} bordered>
                <Descriptions.Item label="部门名称">{selected.name}</Descriptions.Item>
                <Descriptions.Item label="父级部门">{flat.find((item) => item.id === selected.parentId)?.name || '-'}</Descriptions.Item>
              </Descriptions>
              <Space>
                <PermissionButton permission="system:dept:create" type="primary" onClick={() => { setEditingRecord(undefined); setOpen(true); }}>新增子部门</PermissionButton>
                {access.hasPermission('system:dept:update') ? <Button onClick={() => { setEditingRecord(selected); setOpen(true); }}>编辑</Button> : null}
                {selected.id !== 'dept-root' && access.hasPermission('system:dept:delete') ? <Popconfirm title="确认删除该部门？" onConfirm={() => deleteMutation.mutate(selected.id)}><Button danger>删除</Button></Popconfirm> : null}
              </Space>
            </Space>
          ) : <Empty description="请选择一个部门节点" />}
        </ProCard>
      </ProCard>
      <ModalForm<DeptFormPayload>
        title={editingRecord ? '编辑部门' : '新增部门'}
        open={open}
        modalProps={{ destroyOnClose: true, onCancel: () => { setOpen(false); setEditingRecord(undefined); } }}
        initialValues={editingRecord ? { name: editingRecord.name, parentId: editingRecord.parentId } : { parentId: selected?.id }}
        onFinish={async (values) => { await saveMutation.mutateAsync(values); return true; }}
      >
        <ProFormText name="name" label="部门名称" rules={[{ required: true, message: '请输入部门名称' }, { min: 2, max: 30, message: '部门名称长度需在 2 到 30 位之间' }]} />
        <ProFormSelect name="parentId" label="父级部门" options={parentOptions} />
      </ModalForm>
    </PageContainer>
  );
}
