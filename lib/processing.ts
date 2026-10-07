/**
 * Pure canvas processing functions — all image operations live here.
 * Each function takes a canvas and options, returns a new canvas.
 * Nothing runs on the main thread for heavy ops (delegated to worker).
 */

export interface FilterOptions {
  brightness: number;   // 0-200, default 100
  contrast: number;     // 0-200, default 100
  saturation: number;   // 0-200, default 100
  sharpness: number;    // 0-10, default 0
  warmth: number;       // -50 to 50, default 0
}

export interface BorderOptions {
  width: number;        // px
  color: string;        // CSS color
  style: 'solid' | 'dashed' | 'double';
}

export interface PrintLayoutOptions {
  dpi: 96 | 300;
  photoWidthMm: number;    // default 35
  photoHeightMm: number;   // default 45
  marginMm: number;        // default 5
  gapMm: number;           // default 2
}

export const PASSPORT_WIDTH_PX_96 = 132;   // 35mm @ 96 DPI
export const PASSPORT_HEIGHT_PX_96 = 170;  // 45mm @ 96 DPI
export const PASSPORT_WIDTH_PX_300 = 413;  // 35mm @ 300 DPI
export const PASSPORT_HEIGHT_PX_300 = 531; // 45mm @ 300 DPI
export const A4_WIDTH_96 = 794;
export const A4_HEIGHT_96 = 1123;
export const A4_WIDTH_300 = 2480;
export const A4_HEIGHT_300 = 3508;

function mmToPx(mm: number, dpi: number): number {
  return Math.round((mm / 25.4) * dpi);
}

/**
 * Apply visual filters to a canvas
 */
export function applyFilters(
  sourceCanvas: HTMLCanvasElement,
  opts: FilterOptions
): HTMLCanvasElement {
  const out = document.createElement('canvas');
  out.width = sourceCanvas.width;
  out.height = sourceCanvas.height;
  const ctx = out.getContext('2d')!;

  // Apply CSS-based filters for brightness/contrast/saturation
  ctx.filter = [
    `brightness(${opts.brightness}%)`,
    `contrast(${opts.contrast}%)`,
    `saturate(${opts.saturation}%)`,
  ].join(' ');
  ctx.drawImage(sourceCanvas, 0, 0);
  ctx.filter = 'none';

  // Apply warmth as a color overlay
  if (opts.warmth !== 0) {
    const warmthCanvas = applyWarmth(out, opts.warmth);
    return opts.sharpness > 0 ? applyUnsharpMask(warmthCanvas, opts.sharpness) : warmthCanvas;
  }

  return opts.sharpness > 0 ? applyUnsharpMask(out, opts.sharpness) : out;
}

function applyWarmth(canvas: HTMLCanvasElement, warmth: number): HTMLCanvasElement {
  const out = document.createElement('canvas');
  out.width = canvas.width;
  out.height = canvas.height;
  const ctx = out.getContext('2d')!;
  ctx.drawImage(canvas, 0, 0);

  if (warmth === 0) return out;

  const imageData = ctx.getImageData(0, 0, out.width, out.height);
  const data = imageData.data;
  const rShift = warmth > 0 ? Math.round(warmth * 0.8) : 0;
  const bShift = warmth < 0 ? Math.round(-warmth * 0.8) : 0;
  const rReduce = warmth < 0 ? Math.round(-warmth * 0.5) : 0;
  const bReduce = warmth > 0 ? Math.round(warmth * 0.5) : 0;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, data[i] + rShift - rReduce);     // R
    data[i + 2] = Math.min(255, data[i + 2] + bShift - bReduce); // B
  }

  ctx.putImageData(imageData, 0, 0);
  return out;
}

function applyUnsharpMask(canvas: HTMLCanvasElement, amount: number): HTMLCanvasElement {
  const out = document.createElement('canvas');
  out.width = canvas.width;
  out.height = canvas.height;
  const ctx = out.getContext('2d')!;

  // Create blurred version
  const blurred = document.createElement('canvas');
  blurred.width = canvas.width;
  blurred.height = canvas.height;
  const bCtx = blurred.getContext('2d')!;
  bCtx.filter = `blur(${Math.max(0.5, amount * 0.3)}px)`;
  bCtx.drawImage(canvas, 0, 0);
  bCtx.filter = 'none';

  const origData = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height);
  const blurData = bCtx.getImageData(0, 0, canvas.width, canvas.height);
  const outData = ctx.createImageData(canvas.width, canvas.height);

  const factor = amount / 10;
  for (let i = 0; i < origData.data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const diff = origData.data[i + c] - blurData.data[i + c];
      outData.data[i + c] = Math.min(255, Math.max(0, origData.data[i + c] + factor * diff * 2));
    }
    outData.data[i + 3] = origData.data[i + 3];
  }

  ctx.putImageData(outData, 0, 0);
  return out;
}

/**
 * Add border to a canvas (returns new canvas with border padding)
 */
export function addBorder(
  sourceCanvas: HTMLCanvasElement,
  opts: BorderOptions
): HTMLCanvasElement {
  if (opts.width === 0) return sourceCanvas;

  const out = document.createElement('canvas');
  out.width = sourceCanvas.width + opts.width * 2;
  out.height = sourceCanvas.height + opts.width * 2;
  const ctx = out.getContext('2d')!;

  // Clear background
  ctx.clearRect(0, 0, out.width, out.height);

  if (opts.style === 'double') {
    ctx.fillStyle = opts.color;
    ctx.fillRect(0, 0, out.width, out.height);
    
    const innerPadding = Math.max(1, Math.floor(opts.width * 0.3));
    ctx.fillStyle = '#fff';
    ctx.fillRect(innerPadding, innerPadding, out.width - innerPadding * 2, out.height - innerPadding * 2);
    
    ctx.fillStyle = opts.color;
    ctx.fillRect(innerPadding * 2, innerPadding * 2, out.width - innerPadding * 4, out.height - innerPadding * 4);
    
    ctx.drawImage(sourceCanvas, opts.width, opts.width);
  } else if (opts.style === 'dashed') {
    // Draw photo first
    ctx.drawImage(sourceCanvas, opts.width, opts.width);
    
    // Then draw dashed border on top/around
    ctx.setLineDash([8, 4]);
    ctx.strokeStyle = opts.color;
    ctx.lineWidth = opts.width;
    ctx.strokeRect(opts.width / 2, opts.width / 2, out.width - opts.width, out.height - opts.width);
  } else {
    // Solid
    ctx.fillStyle = opts.color;
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(sourceCanvas, opts.width, opts.width);
  }

  return out;
}

/**
 * Fill transparent background with solid color
 */
export function fillBackground(
  sourceCanvas: HTMLCanvasElement,
  color: string
): HTMLCanvasElement {
  const out = document.createElement('canvas');
  out.width = sourceCanvas.width;
  out.height = sourceCanvas.height;
  const ctx = out.getContext('2d')!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(sourceCanvas, 0, 0);
  return out;
}

/**
 * Resize canvas to passport dimensions
 */
export function resizeToPassport(
  sourceCanvas: HTMLCanvasElement,
  dpi: 96 | 300 = 300
): HTMLCanvasElement {
  const w = dpi === 300 ? PASSPORT_WIDTH_PX_300 : PASSPORT_WIDTH_PX_96;
  const h = dpi === 300 ? PASSPORT_HEIGHT_PX_300 : PASSPORT_HEIGHT_PX_96;

  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const ctx = out.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(sourceCanvas, 0, 0, w, h);
  return out;
}

/**
 * Compose A4 print sheet from array of passport photo canvases
 */
export function composeA4Sheet(
  photos: HTMLCanvasElement[],
  opts: PrintLayoutOptions
): HTMLCanvasElement {
  const sheets = composeA4Sheets(photos, opts);
  return sheets[0] || document.createElement('canvas');
}

/**
 * Compose multiple A4 print sheets from array of passport photo canvases
 */
export function composeA4Sheets(
  photos: HTMLCanvasElement[],
  opts: PrintLayoutOptions
): HTMLCanvasElement[] {
  const dpi = opts.dpi;
  const marginPx = mmToPx(opts.marginMm, dpi);
  const gapPx = mmToPx(opts.gapMm, dpi);
  const photoW = mmToPx(opts.photoWidthMm, dpi);
  const photoH = mmToPx(opts.photoHeightMm, dpi);
  const a4W = dpi === 300 ? A4_WIDTH_300 : A4_WIDTH_96;
  const a4H = dpi === 300 ? A4_HEIGHT_300 : A4_HEIGHT_96;

  const cols = Math.floor((a4W - 2 * marginPx + gapPx) / (photoW + gapPx));
  const rows = Math.floor((a4H - 2 * marginPx + gapPx) / (photoH + gapPx));
  const photosPerSheet = cols * rows;
  
  const totalPhotos = photos.length;
  const numSheets = Math.max(1, Math.ceil(totalPhotos / photosPerSheet));
  const sheets: HTMLCanvasElement[] = [];

  for (let s = 0; s < numSheets; s++) {
    const out = document.createElement('canvas');
    out.width = a4W;
    out.height = a4H;
    const ctx = out.getContext('2d')!;

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, a4W, a4H);

    const startIdx = s * photosPerSheet;
    const endIdx = Math.min(startIdx + photosPerSheet, totalPhotos);

    for (let i = startIdx; i < endIdx; i++) {
      const localIdx = i - startIdx;
      const col = localIdx % cols;
      const row = Math.floor(localIdx / cols);
      const x = marginPx + col * (photoW + gapPx);
      const y = marginPx + row * (photoH + gapPx);
      const photo = photos[i];

      ctx.drawImage(photo, x, y, photoW, photoH);
    }
    sheets.push(out);
  }

  return sheets;
}

/**
 * Clone a canvas
 */
export function cloneCanvas(src: HTMLCanvasElement): HTMLCanvasElement {
  const out = document.createElement('canvas');
  out.width = src.width;
  out.height = src.height;
  out.getContext('2d')!.drawImage(src, 0, 0);
  return out;
}

/**
 * Canvas → data URL
 */
export function canvasToDataURL(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png');
}
