import test from 'node:test';
import assert from 'node:assert/strict';
import { computeVirtualWindow } from './virtual-list';

test('computeVirtualWindow returns empty range for no items', () => {
  const result = computeVirtualWindow([], 0, 400, 200);

  assert.deepEqual(result, {
    startIndex: 0,
    endIndex: -1,
    paddingTop: 0,
    paddingBottom: 0,
    totalHeight: 0,
    offsets: [],
  });
});

test('computeVirtualWindow finds visible range without overscan', () => {
  const result = computeVirtualWindow([100, 100, 100, 100], 120, 100, 0);

  assert.equal(result.startIndex, 1);
  assert.equal(result.endIndex, 3);
  assert.equal(result.paddingTop, 100);
  assert.equal(result.paddingBottom, 0);
  assert.equal(result.totalHeight, 400);
  assert.deepEqual(result.offsets, [0, 100, 200, 300]);
});

test('computeVirtualWindow extends the range with overscan', () => {
  const result = computeVirtualWindow([100, 100, 100, 100], 120, 100, 120);

  assert.equal(result.startIndex, 0);
  assert.equal(result.endIndex, 3);
  assert.equal(result.paddingTop, 0);
  assert.equal(result.paddingBottom, 0);
});

test('computeVirtualWindow renders an initial slice before viewport is measured', () => {
  const heights = new Array(40).fill(60);
  const result = computeVirtualWindow(heights, 0, 0, 200);

  assert.equal(result.startIndex, 0);
  assert.equal(result.endIndex, 20);
  assert.equal(result.paddingTop, 0);
  assert.equal(result.paddingBottom, (40 - 21) * 60);
  assert.equal(result.totalHeight, 2400);
});
