/**
 * face-api.js singleton loader + face detect & crop utility
 */
import * as faceapi from 'face-api.js';

let modelsLoaded = false;
let loading = false;
let loadCallbacks: Array<() => void> = [];

export async function loadFaceModels(): Promise<void> {
  if (modelsLoaded) return;
  if (loading) {
    return new Promise((resolve) => {
      loadCallbacks.push(resolve);
    });
  }

  loading = true;
  const MODEL_URL = '/models';

  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
  ]);

  modelsLoaded = true;
  loading = false;
  loadCallbacks.forEach((cb) => cb());
  loadCallbacks = [];
}

export interface DetectionResult {
  canvas: HTMLCanvasElement;
  confidence: number;
  faceBox: { x: number; y: number; width: number; height: number };
  cropBox: { x: number; y: number; width: number; height: number };
}

/**
 * Detect face and return a cropped passport-sized canvas (413×531 px = 35×45 mm @ 300 DPI)
 * Falls back to SsdMobilenetv1 if TinyFaceDetector confidence < 0.6
 */
export async function detectAndCropFace(
  imageEl: HTMLImageElement | HTMLCanvasElement,
  customBox?: { x: number; y: number; width: number; height: number }
): Promise<DetectionResult | null> {
  await loadFaceModels();

  const imgW = 'naturalWidth' in imageEl ? imageEl.naturalWidth : imageEl.width;
  const imgH = 'naturalHeight' in imageEl ? imageEl.naturalHeight : imageEl.height;

  let detection: faceapi.FaceDetection | undefined;
  let confidence = 0;

  if (!customBox) {
    // Try TinyFaceDetector first
    const tinyResult = await faceapi.detectSingleFace(
      imageEl as HTMLImageElement,
      new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.3 })
    );

    if (tinyResult && tinyResult.score >= 0.6) {
      detection = tinyResult;
      confidence = tinyResult.score;
    } else {
      // Fallback to SsdMobilenetv1
      const ssdResult = await faceapi.detectSingleFace(
        imageEl as HTMLImageElement,
        new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 })
      );
      if (ssdResult) {
        detection = ssdResult;
        confidence = ssdResult.score;
      }
    }

    if (!detection) return null;
  }

  // Calculate crop region
  const faceBox = customBox ?? {
    x: detection!.box.x,
    y: detection!.box.y,
    width: detection!.box.width,
    height: detection!.box.height,
  };

  // 1. Calculate deterministic crop dimensions
  const targetFaceRatio = 0.75;
  const targetAspect = 35 / 45;

  let cropH = faceBox.height / targetFaceRatio;
  let cropW = cropH * targetAspect;

  // 2. Find face center
  const faceCenterX = faceBox.x + faceBox.width / 2;
  const faceCenterY = faceBox.y + faceBox.height / 2;

  // 3. Shift crop box down slightly so the face appears higher in the frame
  const verticalShift = faceBox.height * 0.08;

  // 4. Initial crop coordinates
  let sx = faceCenterX - (cropW / 2);
  let sy = faceCenterY - (cropH / 2) + verticalShift;

  // 5. Safe bounds clamping preserving aspect ratio
  if (cropW > imgW || cropH > imgH) {
    const scale = Math.min(imgW / cropW, imgH / cropH);
    cropW *= scale;
    cropH *= scale;
    sx = faceCenterX - (cropW / 2);
    sy = faceCenterY - (cropH / 2) + verticalShift * scale;
  }

  // 6. Clamp to image edges (guarantees no out-of-bounds, might slightly un-center)
  if (sx < 0) sx = 0;
  if (sy < 0) sy = 0;
  if (sx + cropW > imgW) sx = imgW - cropW;
  if (sy + cropH > imgH) sy = imgH - cropH;

  // Draw crop to 413×531 canvas (35×45 mm @ 300 DPI)
  const PASSPORT_W = 413;
  const PASSPORT_H = 531;
  const out = document.createElement('canvas');
  out.width = PASSPORT_W;
  out.height = PASSPORT_H;
  const ctx = out.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(imageEl, sx, sy, cropW, cropH, 0, 0, PASSPORT_W, PASSPORT_H);

  return {
    canvas: out,
    confidence,
    faceBox,
    cropBox: { x: sx, y: sy, width: cropW, height: cropH }
  };
}
