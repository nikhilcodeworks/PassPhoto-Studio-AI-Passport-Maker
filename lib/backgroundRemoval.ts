/**
 * Background removal using MediaPipe Image Segmentation (WASM)
 * Runs segmentation and returns canvas with transparent background
 */

let segmenterInstance: unknown = null;

export async function initSegmenter(): Promise<unknown> {
  if (segmenterInstance) return segmenterInstance;

  const vision = await import('@mediapipe/tasks-vision');
  const { ImageSegmenter, FilesetResolver } = vision;

  const filesetResolver = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
  );

  segmenterInstance = await ImageSegmenter.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/1/selfie_segmenter.tflite',
      delegate: 'GPU',
    },
    outputCategoryMask: false,
    outputConfidenceMasks: true,
    runningMode: 'IMAGE',
  });

  return segmenterInstance;
}

/**
 * Remove background from a canvas, returning new canvas with transparent BG
 */
export async function removeBackground(
  sourceCanvas: HTMLCanvasElement,
  onProgress?: (msg: string) => void
): Promise<HTMLCanvasElement> {
  onProgress?.('Loading segmentation model…');

  const segmenter = await initSegmenter() as any;

  onProgress?.('Running segmentation…');

  return new Promise((resolve) => {
    segmenter.segment(sourceCanvas, (result: any) => {
      // confidenceMasks[0] is background, [1] is person (typically for selfie segmenter)
      // If there's no [1], fallback to [0]
      let maskArray;
      if (result.confidenceMasks && result.confidenceMasks.length > 1) {
        maskArray = result.confidenceMasks[1].getAsFloat32Array();
      } else if (result.categoryMask) {
         maskArray = result.categoryMask.getAsFloat32Array();
      } else if (result.confidenceMasks && result.confidenceMasks.length === 1) {
         maskArray = result.confidenceMasks[0].getAsFloat32Array();
      }

      const out = document.createElement('canvas');
      out.width = sourceCanvas.width;
      out.height = sourceCanvas.height;
      const ctx = out.getContext('2d')!;
      ctx.drawImage(sourceCanvas, 0, 0);

      const imageData = ctx.getImageData(0, 0, out.width, out.height);
      const data = imageData.data;

      if (maskArray) {
        const len = maskArray.length;
        for (let i = 0; i < len; i++) {
          // Bitwise OR 0 is faster than Math.round for positive numbers
          data[i * 4 + 3] = (maskArray[i] * 255.0) | 0;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      onProgress?.('Done');
      resolve(out);
    });
  });
}
