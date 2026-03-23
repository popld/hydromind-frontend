import { useMemo, useState } from 'react';
import { useAccess } from '@umijs/max';
import { Input, Select, Tag } from 'antd';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useOperationLogPage } from '@/queries/system.query';
import type { OperationLogItem } from '@/types/system';

export default function OperationLogPage() {
  const access = useAccess() as any;
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed'>('all');
  const { data, isLoading } = useOperationLogPage();
  const scopedData = useMemo(() => access.applyDataScope?.(data?.list ?? []) ?? (data?.list ?? []), [access, data?.list]);
  const filteredData = useMemo(() => scopedData.filter((item: OperationLogItem) => (!keyword || [item.operator, item.action, item.target].some((text) => text.toLowerCase().includes(keyword.toLowerCase()))) && (statusFilter === 'all' || item.status === statusFilter)), [keyword, scopedData, statusFilter]);

  return (
    <PageContainer title="操作日志" subTitle="已接入数据范围和基础筛选。">
      <ProTable<OperationLogItem>
        rowKey="id"
        search={false}
        loading={isLoading}
        dataSource={filteredData}
        toolBarRender={() => [
          <Input key="keyword" allowClear placeholder="搜索操作人/动作/目标对象" style={{ width: 240 }} value={keyword} onChange={(event) => setKeyword(event.target.value)} />,
          <Select key="status" value={statusFilter} style={{ width: 140 }} options={[{ label: '全部结果', value: 'all' }, { label: '成功', value: 'success' }, { label: '失败', value: 'failed' }]} onChange={setStatusFilter} />,
        ]}
        columns={[
          { title: '操作人', dataIndex: 'operator', width: 140 },
          { title: '动作', dataIndex: 'action', width: 180 },
          { title: '目标对象', dataIndex: 'target' },
          { title: '结果', dataIndex: 'status', render: (_, record) => <Tag color={record.status === 'success' ? 'green' : 'red'}>{record.status}</Tag> },
          { title: '操作时间', dataIndex: 'createdAt', width: 180 },
        ]}
        pagination={{ pageSize: 10 }}
      />
    </PageContainer>
  );
}
