// src/lib/virtual-list.test.ts
import test from "node:test";
import assert from "node:assert/strict";

// src/lib/virtual-list.ts
function computeVirtualWindow(itemHeights, scrollTop, viewportHeight, overscanPx) {
  const count = itemHeights.length;
  const offsets = new Array(count);
  let totalHeight = 0;
  for (let i = 0; i < count; i += 1) {
    offsets[i] = totalHeight;
    totalHeight += itemHeights[i];
  }
  if (count === 0) {
    return {
      startIndex: 0,
      endIndex: -1,
      paddingTop: 0,
      paddingBottom: 0,
      totalHeight: 0,
      offsets
    };
  }
  if (viewportHeight <= 0) {
    const endIndex2 = Math.min(count - 1, 20);
    const visibleHeight = offsets[endIndex2] + itemHeights[endIndex2];
    return {
      startIndex: 0,
      endIndex: endIndex2,
      paddingTop: 0,
      paddingBottom: Math.max(0, totalHeight - visibleHeight),
      totalHeight,
      offsets
    };
  }
  const windowTop = Math.max(0, scrollTop - overscanPx);
  const windowBottom = scrollTop + viewportHeight + overscanPx;
  let startIndex = 0;
  while (startIndex < count - 1 && offsets[startIndex] + itemHeights[startIndex] <= windowTop) {
    startIndex += 1;
  }
  let endIndex = startIndex;
  while (endIndex < count - 1 && offsets[endIndex] < windowBottom) {
    endIndex += 1;
  }
  const lastVisibleBottom = offsets[endIndex] + itemHeights[endIndex];
  return {
    startIndex,
    endIndex,
    paddingTop: offsets[startIndex],
    paddingBottom: Math.max(0, totalHeight - lastVisibleBottom),
    totalHeight,
    offsets
  };
}

// src/lib/virtual-list.test.ts
test("computeVirtualWindow returns empty range for no items", () => {
  const result = computeVirtualWindow([], 0, 400, 200);
  assert.deepEqual(result, {
    startIndex: 0,
    endIndex: -1,
    paddingTop: 0,
    paddingBottom: 0,
    totalHeight: 0,
    offsets: []
  });
});
test("computeVirtualWindow finds visible range without overscan", () => {
  const result = computeVirtualWindow([100, 100, 100, 100], 120, 100, 0);
  assert.equal(result.startIndex, 1);
  assert.equal(result.endIndex, 3);
  assert.equal(result.paddingTop, 100);
  assert.equal(result.paddingBottom, 0);
  assert.equal(result.totalHeight, 400);
  assert.deepEqual(result.offsets, [0, 100, 200, 300]);
});
test("computeVirtualWindow extends the range with overscan", () => {
  const result = computeVirtualWindow([100, 100, 100, 100], 120, 100, 120);
  assert.equal(result.startIndex, 0);
  assert.equal(result.endIndex, 3);
  assert.equal(result.paddingTop, 0);
  assert.equal(result.paddingBottom, 0);
});
test("computeVirtualWindow renders an initial slice before viewport is measured", () => {
  const heights = new Array(40).fill(60);
  const result = computeVirtualWindow(heights, 0, 0, 200);
  assert.equal(result.startIndex, 0);
  assert.equal(result.endIndex, 20);
  assert.equal(result.paddingTop, 0);
  assert.equal(result.paddingBottom, (40 - 21) * 60);
  assert.equal(result.totalHeight, 2400);
});
