import { CloseOutlined, EditOutlined, SendOutlined } from '@ant-design/icons';
import { Button, Input } from 'antd';
import type { InputRef } from 'antd';
import type { Ref } from 'react';
import PermissionButton from '@/components/common/PermissionButton';
import styles from './KnowledgeChatComposer.module.less';

type Variant = 'page' | 'floating';

type KnowledgeChatComposerProps = {
  value: string;
  placeholder: string;
  variant: Variant;
  disabled?: boolean;
  loading?: boolean;
  minRows?: number;
  maxRows?: number;
  permission?: string;
  inputRef?: Ref<InputRef>;
  editingLabel?: string;
  onChange: (value: string) => void;
  onSubmit: () => Promise<void> | void;
  onCancelEdit?: () => void;
};

export default function KnowledgeChatComposer({
  value,
  placeholder,
  variant,
  disabled = false,
  loading = false,
  minRows = 3,
  maxRows = 4,
  permission,
  inputRef,
  editingLabel,
  onChange,
  onSubmit,
  onCancelEdit,
}: KnowledgeChatComposerProps) {
  const sendDisabled = disabled || loading || !value.trim();
  const inputDisabled = disabled || loading;
  const rootClassName =
    variant === 'page'
      ? `${styles.root} ${styles.rootPage}`
      : `${styles.root} ${styles.rootFloating}`;

  const handleSubmit = async () => {
    if (sendDisabled || loading) {
      return;
    }

    await onSubmit();
  };

  return (
    <div className={rootClassName}>
      <div className={`${styles.inputWrap} ${editingLabel ? styles.inputWrapEditing : ''}`}>
        {editingLabel ? (
          <div className={styles.editBar}>
            <div className={styles.editLabel}>
              <EditOutlined className={styles.editIcon} />
              <span>{editingLabel}</span>
            </div>
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              className={styles.editClose}
              onClick={onCancelEdit}
            />
          </div>
        ) : null}
        <div className={styles.inputBody}>
          <Input.TextArea
            ref={inputRef}
            autoSize={{ minRows, maxRows }}
            value={value}
            placeholder={placeholder}
            variant="borderless"
            className={styles.input}
            disabled={inputDisabled}
            onChange={(event) => onChange(event.target.value)}
            onPressEnter={async (event) => {
              if (inputDisabled) {
                return;
              }
              if (event.shiftKey) {
                return;
              }
              event.preventDefault();
              await handleSubmit();
            }}
          />
          {permission ? (
            <PermissionButton
              permission={permission}
              type="primary"
              shape="circle"
              icon={<SendOutlined />}
              className={styles.sendButton}
              disabled={sendDisabled}
              loading={loading}
              onClick={handleSubmit}
            />
          ) : (
            <Button
              type="primary"
              shape="circle"
              icon={<SendOutlined />}
              className={styles.sendButton}
              disabled={sendDisabled}
              loading={loading}
              onClick={handleSubmit}
            />
          )}
        </div>
      </div>
    </div>
  );
}
