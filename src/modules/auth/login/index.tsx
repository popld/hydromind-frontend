import { history, useModel } from '@umijs/max';
import { Button, Card, Form, Input, Typography, message } from 'antd';
import { login, getCurrentUser } from '@/services/api/auth';
import { useAuthStore } from '@/stores/auth.store';
import type { InitialState, LoginPayload } from '@/types/app';

export default function LoginPage() {
  const { setInitialState } = useModel('@@initialState');

  const handleSubmit = async (values: LoginPayload) => {
    const result = await login(values);
    useAuthStore.getState().setToken(result.accessToken);
    const currentUser = await getCurrentUser();
    await setInitialState((state: InitialState | undefined) => ({ ...(state ?? {}), currentUser }));
    message.success('登录成功');
    history.push('/dashboard');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #eef5ff 0%, #f8fafc 100%)',
        padding: 24,
      }}
    >
      <Card style={{ width: 420, borderRadius: 16 }}>
        <Typography.Title level={3} style={{ marginBottom: 8 }}>
          氢枫企业管理 AI 系统
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 24 }}>
          当前为 toB 管理后台启动版，使用 Mock 接口驱动开发。
        </Typography.Paragraph>
        <Form<LoginPayload>
          layout="vertical"
          initialValues={{ username: 'admin', password: '123456' }}
          onFinish={handleSubmit}
        >
          <Form.Item label="用户名" name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            登录系统
          </Button>
        </Form>
      </Card>
    </div>
  );
}
