import type { NormalizedRect } from "@/lib/objectContain";

type DetectOptions = {
  maxDimension?: number;
  saturationThreshold?: number;
  minChannelThreshold?: number;
  minFillRatio?: number;
  minRectPx?: number;
};

type RectPx = { x0: number; y0: number; x1: number; y1: number; area: number; fillRatio: number };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

const loadImage = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "use-credentials";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load layout image for detection"));
    img.src = url;
  });

const dilate3x3 = (mask: Uint8Array, w: number, h: number) => {
  const out = new Uint8Array(mask.length);
  for (let y = 0; y < h; y += 1) {
    const y0 = Math.max(0, y - 1);
    const y1 = Math.min(h - 1, y + 1);
    for (let x = 0; x < w; x += 1) {
      const x0 = Math.max(0, x - 1);
      const x1 = Math.min(w - 1, x + 1);
      let on = 0;
      for (let yy = y0; yy <= y1 && !on; yy += 1) {
        const row = yy * w;
        for (let xx = x0; xx <= x1; xx += 1) {
          if (mask[row + xx]) {
            on = 1;
            break;
          }
        }
      }
      out[y * w + x] = on;
    }
  }
  return out;
};

const erode3x3 = (mask: Uint8Array, w: number, h: number) => {
  const out = new Uint8Array(mask.length);
  for (let y = 0; y < h; y += 1) {
    const y0 = Math.max(0, y - 1);
    const y1 = Math.min(h - 1, y + 1);
    for (let x = 0; x < w; x += 1) {
      const x0 = Math.max(0, x - 1);
      const x1 = Math.min(w - 1, x + 1);
      let on = 1;
      for (let yy = y0; yy <= y1 && on; yy += 1) {
        const row = yy * w;
        for (let xx = x0; xx <= x1; xx += 1) {
          if (!mask[row + xx]) {
            on = 0;
            break;
          }
        }
      }
      out[y * w + x] = on;
    }
  }
  return out;
};

const iou = (a: RectPx, b: RectPx) => {
  const ix0 = Math.max(a.x0, b.x0);
  const iy0 = Math.max(a.y0, b.y0);
  const ix1 = Math.min(a.x1, b.x1);
  const iy1 = Math.min(a.y1, b.y1);
  if (ix1 <= ix0 || iy1 <= iy0) return 0;
  const inter = (ix1 - ix0) * (iy1 - iy0);
  const union = a.area + b.area - inter;
  return union > 0 ? inter / union : 0;
};

const mergeRects = (rects: RectPx[]) => {
  const sorted = [...rects].sort((a, b) => b.area - a.area);
  const out: RectPx[] = [];

  for (const rect of sorted) {
    let merged = false;
    for (let i = 0; i < out.length; i += 1) {
      const other = out[i];
      if (iou(rect, other) > 0.25) {
        const x0 = Math.min(rect.x0, other.x0);
        const y0 = Math.min(rect.y0, other.y0);
        const x1 = Math.max(rect.x1, other.x1);
        const y1 = Math.max(rect.y1, other.y1);
        const area = (x1 - x0) * (y1 - y0);
        out[i] = { x0, y0, x1, y1, area, fillRatio: Math.max(rect.fillRatio, other.fillRatio) };
        merged = true;
        break;
      }
    }
    if (!merged) out.push(rect);
  }

  return out;
};

export const detectPlotRectanglesFromLayoutImage = async (
  layoutUrl: string,
  options: DetectOptions = {}
): Promise<NormalizedRect[]> => {
  const img = await loadImage(layoutUrl);
  const maxDimension = options.maxDimension ?? 1000;
  const saturationThreshold = options.saturationThreshold ?? 35;
  const minChannelThreshold = options.minChannelThreshold ?? 70;
  const minFillRatio = options.minFillRatio ?? 0.55;
  const minRectPx = options.minRectPx ?? 18;

  const scale = Math.min(1, maxDimension / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
  const w = Math.max(1, Math.floor((img.naturalWidth || 1) * scale));
  const h = Math.max(1, Math.floor((img.naturalHeight || 1) * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(img, 0, 0, w, h);

  const image = ctx.getImageData(0, 0, w, h);
  const data = image.data;

  const mask = new Uint8Array(w * h);
  for (let i = 0, p = 0; i < mask.length; i += 1, p += 4) {
    const r = data[p];
    const g = data[p + 1];
    const b = data[p + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max - min;
    mask[i] = sat >= saturationThreshold && max >= minChannelThreshold ? 1 : 0;
  }

  // Close small gaps: dilate then erode.
  let closed = dilate3x3(mask, w, h);
  closed = dilate3x3(closed, w, h);
  closed = erode3x3(closed, w, h);
  closed = erode3x3(closed, w, h);

  const visited = new Uint8Array(w * h);
  const rects: RectPx[] = [];

  const minArea = Math.max(420, Math.floor(w * h * 0.00005));

  const stack: number[] = [];
  for (let i = 0; i < closed.length; i += 1) {
    if (!closed[i] || visited[i]) continue;

    visited[i] = 1;
    stack.length = 0;
    stack.push(i);

    let area = 0;
    let minX = w, minY = h, maxX = 0, maxY = 0;

    while (stack.length) {
      const idx = stack.pop() as number;
      area += 1;
      const y = Math.floor(idx / w);
      const x = idx - y * w;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;

      const pushIf = (ni: number) => {
        if (ni < 0 || ni >= closed.length) return;
        if (!closed[ni] || visited[ni]) return;
        visited[ni] = 1;
        stack.push(ni);
      };

      // 4-neighborhood for speed.
      pushIf(idx - 1);
      pushIf(idx + 1);
      pushIf(idx - w);
      pushIf(idx + w);
    }

    if (area < minArea) continue;
    const bw = maxX - minX + 1;
    const bh = maxY - minY + 1;
    if (bw < minRectPx || bh < minRectPx) continue;

    const bboxArea = bw * bh;
    const fillRatio = bboxArea > 0 ? area / bboxArea : 0;
    if (fillRatio < minFillRatio) continue;

    const aspect = bw / bh;
    if (aspect < 0.25 || aspect > 4.0) continue;

    rects.push({ x0: minX, y0: minY, x1: maxX + 1, y1: maxY + 1, area: bboxArea, fillRatio });
  }

  const merged = mergeRects(rects)
    .filter((r) => r.area > minArea)
    // Remove huge regions (usually parks/overall colored blocks).
    .filter((r) => (r.x1 - r.x0) / w < 0.7 && (r.y1 - r.y0) / h < 0.7);

  const normalized = merged
    .map((r) => ({
      x: clamp01(r.x0 / w),
      y: clamp01(r.y0 / h),
      width: clamp01((r.x1 - r.x0) / w),
      height: clamp01((r.y1 - r.y0) / h)
    }))
    .sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y));

  return normalized;
};

