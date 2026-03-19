import test from 'node:test';
import assert from 'node:assert/strict';
import type { BatchableWsEvent } from './ws-batcher';
import { WsEventBatcher } from './ws-batcher';

function flushMicroBatch(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 25));
}

test('merges adjacent token events for the same chat and agent', async () => {
  const events: BatchableWsEvent[] = [];
  const batcher = new WsEventBatcher((event) => events.push(event), 10);

  batcher.push({ type: 'token', chat_id: 'chat-1', agent_id: 'default', delta: 'Hel' });
  batcher.push({ type: 'token', chat_id: 'chat-1', agent_id: 'default', delta: 'lo' });

  await flushMicroBatch();
  batcher.dispose();

  assert.deepEqual(events, [
    { type: 'token', chat_id: 'chat-1', agent_id: 'default', delta: 'Hello' },
  ]);
});

test('flushes buffered token text before non-text events', () => {
  const events: BatchableWsEvent[] = [];
  const batcher = new WsEventBatcher((event) => events.push(event), 50);

  batcher.push({ type: 'token', chat_id: 'chat-1', agent_id: 'default', delta: 'partial ' });
  batcher.push({ type: 'message_done', chat_id: 'chat-1', agent_id: 'default', content: 'done' });
  batcher.dispose();

  assert.deepEqual(events, [
    { type: 'token', chat_id: 'chat-1', agent_id: 'default', delta: 'partial ' },
    { type: 'message_done', chat_id: 'chat-1', agent_id: 'default', content: 'done' },
  ]);
});

test('does not merge text events across different event types', async () => {
  const events: BatchableWsEvent[] = [];
  const batcher = new WsEventBatcher((event) => events.push(event), 10);

  batcher.push({ type: 'token', chat_id: 'chat-1', agent_id: 'default', delta: 'a' });
  batcher.push({ type: 'thinking', chat_id: 'chat-1', agent_id: 'default', content: 'b' });

  await flushMicroBatch();
  batcher.dispose();

  assert.deepEqual(events, [
    { type: 'token', chat_id: 'chat-1', agent_id: 'default', delta: 'a' },
    { type: 'thinking', chat_id: 'chat-1', agent_id: 'default', content: 'b' },
  ]);
});
