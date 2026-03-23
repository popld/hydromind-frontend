import { Button } from 'antd';
import { useAccess } from '@umijs/max';
import type { ButtonProps } from 'antd';
import type { PropsWithChildren } from 'react';

interface PermissionButtonProps extends PropsWithChildren, ButtonProps {
  permission?: string;
}

export default function PermissionButton({ permission, children, ...rest }: PermissionButtonProps) {
  const access = useAccess();
  if (permission && !access.hasPermission(permission)) {
    return null;
  }
  return <Button {...rest}>{children}</Button>;
}
