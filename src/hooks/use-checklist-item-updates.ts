import { EventEnvelopeType, EventEnvelope, ChecklistItemResponse, ChecklistItemRowDeletedEventPayload, ChecklistItemRowAddedEventPayload, ChecklistItemDeletedEventPayload, ChecklistItemReorderedEventPayload } from '@/api/checklistServiceV1.schemas';
import { getClientId } from '@/lib/axios';
import { useEffect, useRef } from 'react';
import { NEXT_PUBLIC_API_BASE_URL } from '@/lib/axios';
import { EventSource } from 'eventsource';

export type MessageHandlers = {
  itemUpdated: (data: ChecklistItemResponse) => void;
  itemDeleted: (data: ChecklistItemDeletedEventPayload) => void;
  itemCreated: (data: ChecklistItemResponse) => void;
  itemReordered: (data: ChecklistItemReorderedEventPayload) => void;
  itemRowAdded: (data: ChecklistItemRowAddedEventPayload) => void;
  itemRowDeleted: (data: ChecklistItemRowDeletedEventPayload) => void;
}


export function useSSE(messageHandlers: MessageHandlers, checklistId: number, deps: any[] = []) {
  const esRef = useRef<EventSource | null>(null);
  // allow duplicate ids; do not dedupe by id on client

  useEffect(() => {
  const base = `${NEXT_PUBLIC_API_BASE_URL|| ''}/v1/events/checklist-item-updates/${checklistId}`;
  const clientId = getClientId();
  
  // ⭐ SECURE: Authentication via httpOnly cookie, sent automatically by browser
  const url = `${base}?clientId=${encodeURIComponent(clientId)}`;
      // Only log connection attempts when debugging is enabled
      // Helps reduce console noise in normal runs
      // eslint-disable-next-line no-console
      console.debug('SSE connecting to', url);

    // ⭐ Cookies are sent automatically with credentials: 'include'
    const es = new EventSource(url, {
      fetch: (input: RequestInfo | URL, init?: RequestInit) => {
        console.log('SSE fetch with credentials');
        return fetch(input, {
          ...init,
          credentials: 'include', // ⭐ Automatically sends httpOnly cookies
          headers: {
            ...init?.headers,
            'X-Client-Id': clientId,
          },
        });
      },
    });
    esRef.current = es;

    es.onopen = () => {
      console.log('SSE connection opened');
    };

    es.close = () => {
      console.log('SSE connection closed by client');
     // EventSource.prototype.close.call(es);
    };

    es.onmessage = (ev) => {
      console.log('SSE message received:', ev.data);
      try {
        const data = JSON.parse(ev.data) as EventEnvelope;
        onMessage(data);
        return true;
      } catch (err) {
        console.error('SSE parse error', err);
      }
    };

    const onMessage = (data: EventEnvelope) => {
      if (data.type === EventEnvelopeType.checklistItemCreated) {
        messageHandlers.itemCreated(data.payload as ChecklistItemResponse);
      } else if (data.type === EventEnvelopeType.checklistItemUpdated) {
        messageHandlers.itemUpdated(data.payload as ChecklistItemResponse);
      } else if (data.type === EventEnvelopeType.checklistItemDeleted) {
        messageHandlers.itemDeleted(data.payload as ChecklistItemDeletedEventPayload);
      } else if (data.type === EventEnvelopeType.checklistItemReordered) {
        messageHandlers.itemReordered(data.payload as ChecklistItemReorderedEventPayload);
      } else if (data.type === EventEnvelopeType.checklistItemRowAdded) {
        messageHandlers.itemRowAdded(data.payload as ChecklistItemRowAddedEventPayload);
      } else if (data.type === EventEnvelopeType.checklistItemRowDeleted) {
        messageHandlers.itemRowDeleted(data.payload as ChecklistItemRowDeletedEventPayload);
      } else {
        console.error('Unknown SSE event type', data.type);
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
  }, deps);
}
