import { useEffect, useRef, useState } from 'react';

const STICKY_THRESHOLD = 48;

export function useStickyAutoScroll(trigger: unknown) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const shouldStickRef = useRef(true);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const updateStickyState = () => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }

    const distanceToBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
    const nextIsAtBottom = distanceToBottom <= STICKY_THRESHOLD;

    shouldStickRef.current = nextIsAtBottom;
    setIsAtBottom((current) => (current === nextIsAtBottom ? current : nextIsAtBottom));
  };

  const stickToBottom = () => {
    const element = scrollRef.current;
    if (!element || !shouldStickRef.current) {
      return;
    }

    element.scrollTop = element.scrollHeight;
    shouldStickRef.current = true;
    setIsAtBottom(true);
  };

  const handleScroll = () => {
    updateStickyState();
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }

    element.scrollTo({
      top: element.scrollHeight,
      behavior,
    });

    shouldStickRef.current = true;
    setIsAtBottom(true);
  };

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      stickToBottom();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [trigger]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      const frameId = window.requestAnimationFrame(() => {
        if (shouldStickRef.current) {
          stickToBottom();
        } else {
          updateStickyState();
        }
      });

      void frameId;
    });

    resizeObserver.observe(element);

    Array.from(element.children).forEach((child) => {
      resizeObserver.observe(child);
    });

    const frameId = window.requestAnimationFrame(() => {
      updateStickyState();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
    };
  }, []);

  return {
    scrollRef,
    handleScroll,
    isAtBottom,
    scrollToBottom,
  };
}
