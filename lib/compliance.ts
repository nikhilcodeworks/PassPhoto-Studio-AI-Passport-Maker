/**
 * ICAO 9303 compliance validation
 * Checks that face occupies 70–80% of frame height
 */

export interface ICAOResult {
  pass: boolean;
  faceHeightRatio: number;  // 0–1
  message: string;
  direction?: 'move-closer' | 'move-farther' | 'tilt-left' | 'tilt-right';
}

/**
 * Validates face proportions on the cropped passport canvas.
 * faceBoxHeight = height of face bounding box in original image pixels
 * cropHeight = height of crop region in original image pixels
 */
export function validateICAO(
  faceBoxHeight: number,
  cropHeight: number
): ICAOResult {
  const ratio = faceBoxHeight / cropHeight;
  const ICAO_MIN = 0.70; // strictly 70%
  const ICAO_MAX = 0.80; // strictly 80%

  if (ratio >= ICAO_MIN && ratio <= ICAO_MAX) {
    return {
      pass: true,
      faceHeightRatio: ratio,
      message: `✓ ICAO compliant — face ${Math.round(ratio * 100)}% of frame`,
    };
  }

  if (ratio < ICAO_MIN) {
    return {
      pass: false,
      faceHeightRatio: ratio,
      message: `Face too small (${Math.round(ratio * 100)}%). Move closer.`,
      direction: 'move-closer',
    };
  }

  return {
    pass: false,
    faceHeightRatio: ratio,
    message: `Face too large (${Math.round(ratio * 100)}%). Move farther.`,
    direction: 'move-farther',
  };
}
