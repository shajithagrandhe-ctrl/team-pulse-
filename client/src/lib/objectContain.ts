export type Size = { width: number; height: number };

export type Box = { x: number; y: number; width: number; height: number };

export type NormalizedRect = { x: number; y: number; width: number; height: number };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const clamp01 = (value: number) => clamp(value, 0, 1);

export const getObjectContainBox = (container: Size, media: Size | null): Box => {
  if (!(container.width > 0 && container.height > 0)) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  if (!media || !(media.width > 0 && media.height > 0)) {
    return { x: 0, y: 0, width: container.width, height: container.height };
  }

  const scale = Math.min(container.width / media.width, container.height / media.height);
  const width = media.width * scale;
  const height = media.height * scale;
  return {
    x: (container.width - width) / 2,
    y: (container.height - height) / 2,
    width,
    height
  };
};

export const boxToPercentStyle = (box: Box, container: Size) => {
  if (!(container.width > 0 && container.height > 0)) {
    return { left: "0%", top: "0%", width: "0%", height: "0%" };
  }
  return {
    left: `${(box.x / container.width) * 100}%`,
    top: `${(box.y / container.height) * 100}%`,
    width: `${(box.width / container.width) * 100}%`,
    height: `${(box.height / container.height) * 100}%`
  };
};

export const normalizedRectToPercentStyle = (rect: NormalizedRect, box: Box, container: Size) => {
  if (!(container.width > 0 && container.height > 0)) {
    return { left: "0%", top: "0%", width: "0%", height: "0%" };
  }

  const left = (box.x + rect.x * box.width) / container.width;
  const top = (box.y + rect.y * box.height) / container.height;
  const width = (rect.width * box.width) / container.width;
  const height = (rect.height * box.height) / container.height;

  return {
    left: `${left * 100}%`,
    top: `${top * 100}%`,
    width: `${width * 100}%`,
    height: `${height * 100}%`
  };
};

const clientToNormalizedPoint = (containerRect: DOMRect, box: Box, client: { x: number; y: number }) => {
  const localX = client.x - containerRect.left;
  const localY = client.y - containerRect.top;

  const xInBox = clamp(localX, box.x, box.x + box.width);
  const yInBox = clamp(localY, box.y, box.y + box.height);

  const x = box.width > 0 ? (xInBox - box.x) / box.width : 0;
  const y = box.height > 0 ? (yInBox - box.y) / box.height : 0;

  return { x: clamp01(x), y: clamp01(y) };
};

export const normalizedRectFromClientDrag = (
  containerRect: DOMRect,
  box: Box,
  startClient: { x: number; y: number },
  endClient: { x: number; y: number }
): NormalizedRect => {
  const a = clientToNormalizedPoint(containerRect, box, startClient);
  const b = clientToNormalizedPoint(containerRect, box, endClient);

  const left = Math.min(a.x, b.x);
  const top = Math.min(a.y, b.y);
  const right = Math.max(a.x, b.x);
  const bottom = Math.max(a.y, b.y);

  return {
    x: clamp01(left),
    y: clamp01(top),
    width: clamp01(right - left),
    height: clamp01(bottom - top)
  };
};

