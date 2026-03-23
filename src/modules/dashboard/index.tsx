import { PageContainer, ProCard } from '@ant-design/pro-components';
import { Button, Col, List, Row, Skeleton, Statistic, Typography } from 'antd';
import { history } from '@umijs/max';
import ReactECharts from 'echarts-for-react';
import { useDashboardOverview } from '@/queries/dashboard.query';

export default function DashboardPage() {
  const { data, isLoading } = useDashboardOverview();

  const chartOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['问答次数', '活跃用户'] },
    xAxis: { type: 'category', data: data?.trend.map((item) => item.date) ?? [] },
    yAxis: { type: 'value' },
    series: [
      {
        name: '问答次数',
        type: 'line',
        smooth: true,
        data: data?.trend.map((item) => item.qaCount) ?? [],
      },
      {
        name: '活跃用户',
        type: 'line',
        smooth: true,
        data: data?.trend.map((item) => item.activeUsers) ?? [],
      },
    ],
  };

  return (
    <PageContainer title="经营总览" subTitle="首版工作台，聚焦指标卡、趋势图和快捷入口。">
      <Skeleton loading={isLoading} active>
        <Row gutter={[16, 16]}>
          {data?.metrics.map((metric) => (
            <Col xs={24} sm={12} lg={6} key={metric.key}>
              <ProCard>
                <Statistic
                  title={metric.label}
                  value={metric.value}
                  suffix={metric.unit}
                  precision={0}
                />
                <Typography.Text type="secondary">较上周 {metric.trend}%</Typography.Text>
              </ProCard>
            </Col>
          ))}
        </Row>
        <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
          <Col xs={24} xl={16}>
            <ProCard title="近 7 日使用趋势">
              <ReactECharts option={chartOption} style={{ height: 320 }} />
            </ProCard>
          </Col>
          <Col xs={24} xl={8}>
            <ProCard title="快捷入口">
              <List
                dataSource={data?.quickLinks ?? []}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button key={item.path} type="link" onClick={() => history.push(item.path)}>
                        进入
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta title={item.name} description={item.description} />
                  </List.Item>
                )}
              />
            </ProCard>
          </Col>
        </Row>
        <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
          <Col span={24}>
            <ProCard title="最近动态">
              <List
                dataSource={data?.activities ?? []}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta title={item.title} description={`${item.description} · ${item.createdAt}`} />
                  </List.Item>
                )}
              />
            </ProCard>
          </Col>
        </Row>
      </Skeleton>
    </PageContainer>
  );
}
