import { EventEnvelopeType, EventEnvelope, ChecklistItemResponse, ChecklistItemRowDeletedEventPayload, ChecklistItemRowAddedEventPayload, ChecklistItemDeletedEventPayload, ChecklistItemReorderedEventPayload } from '@/api/checklistServiceV1.schemas';
import { getClientId } from '@/lib/axios';
import { useEffect, useRef } from 'react';


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
  const base = `${process.env.NEXT_PUBLIC_BACKEND_URL || ''}/v1/events/checklist-item-updates/${checklistId}`;
  const clientId = getClientId();
  const url = `${base}?clientId=${encodeURIComponent(clientId)}`;
      // Only log connection attempts when debugging is enabled
      // Helps reduce console noise in normal runs
      // eslint-disable-next-line no-console
      console.debug('SSE connecting to', url);
    
    const es = new EventSource(url);
    esRef.current = es;

    es.onmessage = (ev) => {
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
