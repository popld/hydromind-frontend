import { useEffect } from 'react';
import { useAccess } from '@umijs/max';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Form, Input, Select, Switch, message } from 'antd';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import PermissionButton from '@/components/common/PermissionButton';
import { useKnowledgeBases } from '@/queries/knowledge.query';
import { queryKeys } from '@/queries/keys';
import { useSystemSettings } from '@/queries/system.query';
import { updateSystemSettings } from '@/services/api/system';
import type { SystemSettings } from '@/types/system';

export default function SystemSettingPage() {
  const access = useAccess() as any;
  const [form] = Form.useForm<SystemSettings>();
  const queryClient = useQueryClient();
  const { data, isLoading } = useSystemSettings();
  const { data: basePage } = useKnowledgeBases();

  useEffect(() => {
    if (data) {
      form.setFieldsValue(data);
    }
  }, [data, form]);

  const mutation = useMutation({
    mutationFn: updateSystemSettings,
    onSuccess: async () => {
      message.success('系统设置已更新');
      await queryClient.invalidateQueries({ queryKey: queryKeys.system.settings });
    },
  });

  return (
    <PageContainer title="系统设置" subTitle="已接入按钮级权限和更细的表单校验。">
      <ProCard loading={isLoading}>
        <Form<SystemSettings> form={form} layout="vertical" onFinish={(values) => mutation.mutate(values)} disabled={!access.hasPermission('system:setting:update')}>
          <Form.Item label="系统名称" name="appName" rules={[{ required: true, message: '请输入系统名称' }, { min: 2, max: 30, message: '系统名称长度需在 2 到 30 位之间' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="默认知识库" name="defaultKnowledgeBaseId" rules={[{ required: true, message: '请选择默认知识库' }]}>
            <Select options={(basePage?.list ?? []).map((item) => ({ label: item.name, value: item.id }))} />
          </Form.Item>
          <Form.Item label="启用知识问答" name="enableKnowledgeQa" valuePropName="checked"><Switch /></Form.Item>
          <Form.Item label="启用操作日志" name="enableOperationLog" valuePropName="checked"><Switch /></Form.Item>
          <Form.Item label="启用登录验证码" name="enableLoginCaptcha" valuePropName="checked"><Switch /></Form.Item>
          <PermissionButton permission="system:setting:update" type="primary" htmlType="submit" loading={mutation.isPending}>保存设置</PermissionButton>
        </Form>
      </ProCard>
    </PageContainer>
  );
}
