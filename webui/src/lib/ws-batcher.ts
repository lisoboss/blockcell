export interface BatchableWsEvent {
  type: string;
  agent_id?: string;
  chat_id?: string;
  delta?: string;
  content?: string;
}

function isBufferedTextEvent(event: BatchableWsEvent): boolean {
  return event.type === 'token' || event.type === 'thinking';
}

function canMergeBufferedEvent(current: BatchableWsEvent, next: BatchableWsEvent): boolean {
  return current.type === next.type
    && current.chat_id === next.chat_id
    && current.agent_id === next.agent_id;
}

export class WsEventBatcher<T extends BatchableWsEvent> {
  private pendingEvent: T | null = null;
  private flushTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly emit: (event: T) => void,
    private readonly delayMs = 16,
  ) {}

  push(event: T) {
    if (!isBufferedTextEvent(event)) {
      this.flush();
      this.emit(event);
      return;
    }

    if (this.pendingEvent && canMergeBufferedEvent(this.pendingEvent, event)) {
      if (this.pendingEvent.type === 'token') {
        this.pendingEvent = {
          ...this.pendingEvent,
          delta: `${this.pendingEvent.delta || ''}${event.delta || ''}`,
        } as T;
      } else {
        this.pendingEvent = {
          ...this.pendingEvent,
          content: `${this.pendingEvent.content || ''}${event.content || ''}`,
        } as T;
      }
      return;
    }

    this.flush();
    this.pendingEvent = { ...event };
    this.scheduleFlush();
  }

  flush() {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    if (!this.pendingEvent) {
      return;
    }

    this.emit(this.pendingEvent);
    this.pendingEvent = null;
  }

  dispose() {
    this.flush();
  }

  private scheduleFlush() {
    if (this.flushTimer) {
      return;
    }

    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      if (!this.pendingEvent) {
        return;
      }
      this.emit(this.pendingEvent);
      this.pendingEvent = null;
    }, this.delayMs);
  }
}
