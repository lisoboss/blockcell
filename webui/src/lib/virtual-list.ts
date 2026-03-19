export interface VirtualWindow {
  startIndex: number;
  endIndex: number;
  paddingTop: number;
  paddingBottom: number;
  totalHeight: number;
  offsets: number[];
}

export function computeVirtualWindow(
  itemHeights: number[],
  scrollTop: number,
  viewportHeight: number,
  overscanPx: number,
): VirtualWindow {
  const count = itemHeights.length;
  const offsets = new Array<number>(count);
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
      offsets,
    };
  }

  if (viewportHeight <= 0) {
    const endIndex = Math.min(count - 1, 20);
    const visibleHeight = offsets[endIndex] + itemHeights[endIndex];
    return {
      startIndex: 0,
      endIndex,
      paddingTop: 0,
      paddingBottom: Math.max(0, totalHeight - visibleHeight),
      totalHeight,
      offsets,
    };
  }

  const windowTop = Math.max(0, scrollTop - overscanPx);
  const windowBottom = scrollTop + viewportHeight + overscanPx;

  let startIndex = 0;
  while (
    startIndex < count - 1
    && offsets[startIndex] + itemHeights[startIndex] <= windowTop
  ) {
    startIndex += 1;
  }

  let endIndex = startIndex;
  while (
    endIndex < count - 1
    && offsets[endIndex] < windowBottom
  ) {
    endIndex += 1;
  }

  const lastVisibleBottom = offsets[endIndex] + itemHeights[endIndex];

  return {
    startIndex,
    endIndex,
    paddingTop: offsets[startIndex],
    paddingBottom: Math.max(0, totalHeight - lastVisibleBottom),
    totalHeight,
    offsets,
  };
}
