// src/lib/ws-batcher.test.ts
import test from "node:test";
import assert from "node:assert/strict";

// src/lib/ws-batcher.ts
function isBufferedTextEvent(event) {
  return event.type === "token" || event.type === "thinking";
}
function canMergeBufferedEvent(current, next) {
  return current.type === next.type && current.chat_id === next.chat_id && current.agent_id === next.agent_id;
}
var WsEventBatcher = class {
  constructor(emit, delayMs = 16) {
    this.emit = emit;
    this.delayMs = delayMs;
  }
  pendingEvent = null;
  flushTimer = null;
  push(event) {
    if (!isBufferedTextEvent(event)) {
      this.flush();
      this.emit(event);
      return;
    }
    if (this.pendingEvent && canMergeBufferedEvent(this.pendingEvent, event)) {
      if (this.pendingEvent.type === "token") {
        this.pendingEvent = {
          ...this.pendingEvent,
          delta: `${this.pendingEvent.delta || ""}${event.delta || ""}`
        };
      } else {
        this.pendingEvent = {
          ...this.pendingEvent,
          content: `${this.pendingEvent.content || ""}${event.content || ""}`
        };
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
  scheduleFlush() {
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
};

// src/lib/ws-batcher.test.ts
function flushMicroBatch() {
  return new Promise((resolve) => setTimeout(resolve, 25));
}
test("merges adjacent token events for the same chat and agent", async () => {
  const events = [];
  const batcher = new WsEventBatcher((event) => events.push(event), 10);
  batcher.push({ type: "token", chat_id: "chat-1", agent_id: "default", delta: "Hel" });
  batcher.push({ type: "token", chat_id: "chat-1", agent_id: "default", delta: "lo" });
  await flushMicroBatch();
  batcher.dispose();
  assert.deepEqual(events, [
    { type: "token", chat_id: "chat-1", agent_id: "default", delta: "Hello" }
  ]);
});
test("flushes buffered token text before non-text events", () => {
  const events = [];
  const batcher = new WsEventBatcher((event) => events.push(event), 50);
  batcher.push({ type: "token", chat_id: "chat-1", agent_id: "default", delta: "partial " });
  batcher.push({ type: "message_done", chat_id: "chat-1", agent_id: "default", content: "done" });
  batcher.dispose();
  assert.deepEqual(events, [
    { type: "token", chat_id: "chat-1", agent_id: "default", delta: "partial " },
    { type: "message_done", chat_id: "chat-1", agent_id: "default", content: "done" }
  ]);
});
test("does not merge text events across different event types", async () => {
  const events = [];
  const batcher = new WsEventBatcher((event) => events.push(event), 10);
  batcher.push({ type: "token", chat_id: "chat-1", agent_id: "default", delta: "a" });
  batcher.push({ type: "thinking", chat_id: "chat-1", agent_id: "default", content: "b" });
  await flushMicroBatch();
  batcher.dispose();
  assert.deepEqual(events, [
    { type: "token", chat_id: "chat-1", agent_id: "default", delta: "a" },
    { type: "thinking", chat_id: "chat-1", agent_id: "default", content: "b" }
  ]);
});
