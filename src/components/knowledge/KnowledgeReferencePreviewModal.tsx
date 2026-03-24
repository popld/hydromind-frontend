import { history } from '@umijs/max';
import { Button, Modal, Space, Tag, Typography } from 'antd';
import type { KnowledgeReference } from '@/types/knowledge';
import styles from './KnowledgeReferencePreviewModal.module.less';

type KnowledgeReferencePreviewModalProps = {
  open: boolean;
  reference?: KnowledgeReference;
  onClose: () => void;
};

const REFERENCE_TYPE_LABELS: Record<KnowledgeReference['sourceType'], string> = {
  document: '文档',
  knowledge_base: '知识库',
};

export default function KnowledgeReferencePreviewModal({
  open,
  reference,
  onClose,
}: KnowledgeReferencePreviewModalProps) {
  return (
    <Modal
      open={open}
      title={reference?.title || '引用预览'}
      onCancel={onClose}
      footer={
        <Space>
          <Button onClick={onClose}>关闭</Button>
          {reference ? (
            <Button
              type="primary"
              onClick={() => {
                onClose();
                history.push(`/knowledge/document?keyword=${encodeURIComponent(reference.title)}`);
              }}
            >
              跳转知识文档
            </Button>
          ) : null}
        </Space>
      }
    >
      {reference ? (
        <>
          <div className={styles.metaRow}>
            <Tag color="blue" className={styles.metaTag}>
              {REFERENCE_TYPE_LABELS[reference.sourceType]}
            </Tag>
            <Typography.Text type="secondary">引用 ID：{reference.id}</Typography.Text>
          </div>
          <div className={styles.snippetCard}>
            <div className={styles.snippetTitle}>命中片段</div>
            <Typography.Paragraph className={styles.snippetContent}>
              {reference.snippet}
            </Typography.Paragraph>
          </div>
        </>
      ) : null}
    </Modal>
  );
}
