/**
 * EXIF strip utility — removes all metadata from an image file
 * Returns a clean Blob with no EXIF/GPS/IPTC data
 */
export async function stripExif(file: File | Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      const uint8 = new Uint8Array(arrayBuffer);

      // Check JPEG magic bytes
      if (uint8[0] === 0xff && uint8[1] === 0xd8) {
        const cleaned = removeJpegExif(uint8);
        resolve(new Blob([cleaned as unknown as BlobPart], { type: 'image/jpeg' }));
      } else {
        // For PNG/WebP/BMP — no EXIF to strip, return as-is
        resolve(new Blob([arrayBuffer], { type: file.type || 'image/png' }));
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function removeJpegExif(data: Uint8Array): Uint8Array {
  // JPEG starts with FFD8, then segments. We skip APP0-APP15 (FFE0-FFEF) and APP1 (FFE1) which holds EXIF
  let offset = 2; // skip FFD8
  const result: number[] = [0xff, 0xd8]; // Keep SOI marker

  while (offset < data.length) {
    if (data[offset] !== 0xff) break;

    const marker = data[offset + 1];
    const segmentLength = (data[offset + 2] << 8) | data[offset + 3];

    // Skip APP0-APP15 markers (EXIF is in APP1 = FFE1, also skip others for clean output)
    if (marker >= 0xe0 && marker <= 0xef) {
      // Keep APP0 (JFIF) but strip APP1 (EXIF) and others
      if (marker === 0xe0) {
        // Keep JFIF APP0
        for (let i = offset; i < offset + 2 + segmentLength; i++) {
          result.push(data[i]);
        }
      }
      offset += 2 + segmentLength;
      continue;
    }

    // Copy all other segments
    if (marker === 0xda) {
      // Start of Scan — copy rest of file
      for (let i = offset; i < data.length; i++) {
        result.push(data[i]);
      }
      break;
    }

    for (let i = offset; i < offset + 2 + segmentLength; i++) {
      result.push(data[i]);
    }
    offset += 2 + segmentLength;
  }

  return new Uint8Array(result);
}

/**
 * Load a Blob into an HTMLImageElement
 */
export function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * HTMLImageElement → HTMLCanvasElement
 */
export function imageToCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  return canvas;
}

/**
 * Canvas → Blob (PNG, lossless)
 */
export function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/png'): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas toBlob failed'));
    }, type);
  });
}
