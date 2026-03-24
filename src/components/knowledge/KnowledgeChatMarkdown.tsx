import { Button, message } from 'antd';
import { memo, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './KnowledgeChatMarkdown.module.less';

const CODE_COLLAPSE_THRESHOLD = 14;

type KnowledgeChatMarkdownProps = {
  content: string;
  isStreaming?: boolean;
};

function normalizeStreamingMarkdown(markdown: string) {
  const content = markdown || '';
  const codeFenceCount = (content.match(/```/g) ?? []).length;

  if (codeFenceCount % 2 === 1) {
    return `${content}\n\`\`\``;
  }

  return content;
}

function extractCodeLanguage(className?: string) {
  return className?.replace('language-', '').trim() || 'text';
}

async function copyCode(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    message.success('代码已复制');
  } catch {
    message.error('复制失败，请手动复制');
  }
}

const CodeBlock = memo(function CodeBlock({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const codeValue = String(children ?? '').replace(/\n$/, '');
  const language = extractCodeLanguage(className);
  const codeLines = codeValue.split('\n');
  const lineCount = codeLines.length;
  const canExpand = lineCount > CODE_COLLAPSE_THRESHOLD;

  return (
    <div className={styles.codeBlock}>
      <div className={styles.codeHeader}>
        <span className={styles.codeLanguage}>{language}</span>
        <span className={styles.codeSummary}>{lineCount} 行代码</span>
        <div className={styles.codeActions}>
          {canExpand ? (
            <Button
              type="text"
              size="small"
              className={styles.codeButton}
              onClick={() => setExpanded((current) => !current)}
            >
              {expanded ? '收起' : '展开'}
            </Button>
          ) : null}
          <Button
            type="text"
            size="small"
            className={styles.codeButton}
            onClick={() => copyCode(codeValue)}
          >
            复制
          </Button>
        </div>
      </div>
      <pre className={`${styles.codePre} ${canExpand && !expanded ? styles.codeCollapsed : ''}`}>
        <code className={styles.codeInner}>
          {codeLines.map((line, index) => (
            <span key={`${language}-${index + 1}`} className={styles.codeLine}>
              <span className={styles.codeLineNumber}>{index + 1}</span>
              <span className={styles.codeLineContent}>{line || ' '}</span>
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
});

export default memo(function KnowledgeChatMarkdown({
  content,
  isStreaming = false,
}: KnowledgeChatMarkdownProps) {
  const markdownContent = useMemo(
    () => (isStreaming ? normalizeStreamingMarkdown(content) : content),
    [content, isStreaming],
  );

  if (!content && isStreaming) {
    return (
      <div className={`${styles.markdown} ${styles.markdownStreaming} ${styles.streamingPlaceholder}`}>
        <div className={styles.streamingLines}>
          <span className={`${styles.streamingLine} ${styles.streamingLineLong}`} />
          <span className={`${styles.streamingLine} ${styles.streamingLineShort}`} />
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.markdown} ${isStreaming ? styles.markdownStreaming : ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a({ href, children, ...props }) {
            return (
              <a
                {...props}
                href={href}
                target="_blank"
                rel="noreferrer"
                className={styles.link}
              >
                {children}
              </a>
            );
          },
          code({ inline, className, children, ...props }: any) {
            if (inline) {
              return (
                <code {...props} className={styles.inlineCode}>
                  {children}
                </code>
              );
            }

            return <CodeBlock className={className}>{children}</CodeBlock>;
          },
        }}
      >
        {markdownContent}
      </ReactMarkdown>
    </div>
  );
});
