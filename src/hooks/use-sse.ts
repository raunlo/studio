import { useEffect, useRef } from 'react';

export type SseEvent = {
  type: string;
  payload?: any;
  checklistId?: number;
  clientId?: string;
  id?: number | null;
};

type SSEMessageHandler = (data: SseEvent) => void;

export function useSSE(onMessage: SSEMessageHandler) {
  const esRef = useRef<EventSource | null>(null);
  // allow duplicate ids; do not dedupe by id on client

  useEffect(() => {
    const url = `${process.env.NEXT_PUBLIC_BACKEND_URL || ''}/events`;
    if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
      // Only log connection attempts when debugging is enabled
      // Helps reduce console noise in normal runs
      // eslint-disable-next-line no-console
      console.debug('SSE connecting to', url);
    }
    const es = new EventSource(url);
    esRef.current = es;

    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data) as SseEvent;
        onMessage(data);
        return true;
      } catch (err) {
        console.error('SSE parse error', err);
      }
    };

    es.onerror = (err) => {
      console.error('SSE error', err);
      // EventSource will auto-reconnect by default
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [onMessage]);
}
