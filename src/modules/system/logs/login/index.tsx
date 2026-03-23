import { useMemo, useState } from 'react';
import { useAccess } from '@umijs/max';
import { Input, Select, Tag } from 'antd';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useLoginLogPage } from '@/queries/system.query';
import type { LoginLogItem } from '@/types/system';

export default function LoginLogPage() {
  const access = useAccess() as any;
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed'>('all');
  const { data, isLoading } = useLoginLogPage();
  const scopedData = useMemo(() => access.applyDataScope?.(data?.list ?? []) ?? (data?.list ?? []), [access, data?.list]);
  const filteredData = useMemo(() => scopedData.filter((item: LoginLogItem) => (!keyword || [item.username, item.ip, item.browser].some((text) => text.toLowerCase().includes(keyword.toLowerCase()))) && (statusFilter === 'all' || item.status === statusFilter)), [keyword, scopedData, statusFilter]);

  return (
    <PageContainer title="登录日志" subTitle="已接入数据范围和基础筛选。">
      <ProTable<LoginLogItem>
        rowKey="id"
        search={false}
        loading={isLoading}
        dataSource={filteredData}
        toolBarRender={() => [
          <Input key="keyword" allowClear placeholder="搜索用户名/IP/浏览器" style={{ width: 220 }} value={keyword} onChange={(event) => setKeyword(event.target.value)} />,
          <Select key="status" value={statusFilter} style={{ width: 140 }} options={[{ label: '全部结果', value: 'all' }, { label: '成功', value: 'success' }, { label: '失败', value: 'failed' }]} onChange={setStatusFilter} />,
        ]}
        columns={[
          { title: '用户名', dataIndex: 'username' },
          { title: 'IP', dataIndex: 'ip' },
          { title: '浏览器', dataIndex: 'browser' },
          { title: '结果', dataIndex: 'status', render: (_, record) => <Tag color={record.status === 'success' ? 'green' : 'red'}>{record.status}</Tag> },
          { title: '登录时间', dataIndex: 'loginAt', width: 180 },
        ]}
        pagination={{ pageSize: 10 }}
      />
    </PageContainer>
  );
}
