import type { PropsWithChildren } from 'react';
import FloatingAiAssistant from '@/components/common/FloatingAiAssistant';

export default function BasicLayout({ children }: PropsWithChildren) {
  return (
    <>
      {children}
      <FloatingAiAssistant />
    </>
  );
}
