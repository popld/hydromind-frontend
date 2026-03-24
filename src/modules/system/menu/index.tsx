import { useMemo, useState } from 'react';
import { useAccess } from '@umijs/max';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Descriptions, Empty, Input, Popconfirm, Space, Tree, message } from 'antd';
import type { EventDataNode } from 'antd/es/tree';
import { ModalForm, PageContainer, ProCard, ProFormSelect, ProFormText } from '@ant-design/pro-components';
import PermissionButton from '@/components/common/PermissionButton';
import { queryKeys } from '@/queries/keys';
import { useMenuTree } from '@/queries/system.query';
import { createMenu, deleteMenu, updateMenu } from '@/services/api/system';
import type { MenuFormPayload, MenuItem } from '@/types/system';

function flattenMenus(source: MenuItem[]): MenuItem[] {
  return source.flatMap((item) => [item, ...(item.children ? flattenMenus(item.children) : [])]);
}

export default function SystemMenuPage() {
  const access = useAccess() as any;
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string>();
  const [editingRecord, setEditingRecord] = useState<MenuItem | undefined>();
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const { data, isLoading } = useMenuTree();
  const allMenus = useMemo(() => flattenMenus(data ?? []), [data]);
  const visibleTree = useMemo(() => data ?? [], [data]);
  const selected = allMenus.find((item) => item.id === selectedId);
  const parentOptions = allMenus.map((item) => ({ label: item.name, value: item.id }));
  const matchTreeNode = (node: EventDataNode<any>) => {
    if (!keyword) return false;
    const title = String(node.title ?? '');
    const path = String((node as EventDataNode<any> & { path?: string }).path ?? '');
    return title.includes(keyword) || path.includes(keyword);
  };

  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.system.menuTree });
  const saveMutation = useMutation({ mutationFn: async (values: MenuFormPayload) => editingRecord ? updateMenu(editingRecord.id, values) : createMenu(values), onSuccess: async () => { message.success(editingRecord ? '菜单已更新' : '菜单已创建'); setOpen(false); setEditingRecord(undefined); await refresh(); } });
  const deleteMutation = useMutation({ mutationFn: deleteMenu, onSuccess: async () => { message.success('菜单已删除'); setSelectedId(undefined); await refresh(); } });

  return (
    <PageContainer title="菜单管理" subTitle="菜单页已支持搜索、按钮权限和路径/权限码校验。">
      <ProCard split="vertical">
        <ProCard colSpan="42%" loading={isLoading} title="菜单树" extra={<Space><Input allowClear placeholder="搜索菜单" value={keyword} onChange={(event) => setKeyword(event.target.value)} style={{ width: 180 }} /><PermissionButton permission="system:menu:create" type="primary" size="small" onClick={() => { setEditingRecord(undefined); setOpen(true); }}>新增菜单</PermissionButton></Space>}>
          {visibleTree.length ? <Tree treeData={visibleTree as any} fieldNames={{ title: 'name', key: 'id', children: 'children' }} defaultExpandAll filterTreeNode={matchTreeNode} onSelect={(keys) => setSelectedId(keys[0] as string)} /> : <Empty description="暂无菜单数据" />}
        </ProCard>
        <ProCard title="菜单详情">
          {selected ? (
            <Space direction="vertical" style={{ width: '100%' }} size={16}>
              <Descriptions column={1} bordered>
                <Descriptions.Item label="名称">{selected.name}</Descriptions.Item>
                <Descriptions.Item label="路径">{selected.path}</Descriptions.Item>
                <Descriptions.Item label="父级菜单">{allMenus.find((item) => item.id === selected.parentId)?.name || '-'}</Descriptions.Item>
                <Descriptions.Item label="权限码">{selected.permission || '-'}</Descriptions.Item>
              </Descriptions>
              <Space>
                <PermissionButton permission="system:menu:create" type="primary" onClick={() => { setEditingRecord(undefined); setOpen(true); }}>新增子菜单</PermissionButton>
                {access.hasPermission('system:menu:update') ? <Button onClick={() => { setEditingRecord(selected); setOpen(true); }}>编辑</Button> : null}
                {access.hasPermission('system:menu:delete') ? <Popconfirm title="确认删除该菜单？" onConfirm={() => deleteMutation.mutate(selected.id)}><Button danger>删除</Button></Popconfirm> : null}
              </Space>
            </Space>
          ) : <Empty description="请在左侧选择一个菜单节点" />}
        </ProCard>
      </ProCard>
      <ModalForm<MenuFormPayload>
        title={editingRecord ? '编辑菜单' : '新增菜单'}
        open={open}
        modalProps={{ destroyOnClose: true, onCancel: () => { setOpen(false); setEditingRecord(undefined); } }}
        initialValues={editingRecord ? editingRecord : { parentId: selected?.id }}
        onFinish={async (values) => { await saveMutation.mutateAsync(values); return true; }}
      >
        <ProFormText name="name" label="菜单名称" rules={[{ required: true, message: '请输入菜单名称' }, { min: 2, max: 20, message: '菜单名称长度需在 2 到 20 位之间' }]} />
        <ProFormText name="path" label="菜单路径" rules={[{ required: true, message: '请输入菜单路径' }, { pattern: /^\//, message: '菜单路径必须以 / 开头' }]} />
        <ProFormSelect name="parentId" label="父级菜单" options={parentOptions} />
        <ProFormText name="permission" label="权限码" rules={[{ pattern: /^([a-z]+(:[a-z]+){1,2})?$/i, message: '权限码格式示例：system:user:view' }]} />
      </ModalForm>
    </PageContainer>
  );
}
