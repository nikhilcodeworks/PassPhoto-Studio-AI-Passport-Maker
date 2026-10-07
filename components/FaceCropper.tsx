'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Cropper, CropperRef } from 'react-advanced-cropper';
import 'react-advanced-cropper/dist/style.css';
import styles from './FaceCropper.module.css';

interface FaceCropperProps {
  imageFile: File;
  onCropReady: (canvas: HTMLCanvasElement) => void;
  onDone?: () => void;
  onNextImage?: () => void;
  hasNextImage?: boolean;
  presetId?: string;
  imageIndex?: number;
  totalImages?: number;
}

interface Preset {
  id: string;
  label: string;
  aspect: number;
  width: number;
  height: number;
  description: string;
}

const PRESETS: Preset[] = [
  { id: 'in_uk', label: 'India / UK (35×45 mm)', aspect: 35 / 45, width: 413, height: 531, description: 'Standard 3.5x4.5 cm' },
  { id: 'us', label: 'US (2×2 inch)', aspect: 1, width: 600, height: 600, description: 'Square 5x5 cm' },
  { id: 'cn', label: 'China (33×48 mm)', aspect: 33 / 48, width: 390, height: 567, description: '3.3x4.8 cm' },
];

export default function FaceCropper({ imageFile, onCropReady, onDone, onNextImage, hasNextImage, presetId, imageIndex = 0, totalImages = 1 }: FaceCropperProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [view, setView] = useState<'crop' | 'preview'>('crop');
  const [confirmed, setConfirmed] = useState(false);

  // Initialize preset from prop or default
  const computeInitialPreset = (): Preset | { id: 'custom'; label: string; aspect: undefined } => {
    const p = PRESETS.find(p => p.id === presetId);
    if (p) return p;
    if (presetId === 'custom') return { id: 'custom' as const, label: 'Custom / Free', aspect: undefined };
    return PRESETS[0];
  };

  const [selectedPreset] = useState<Preset | { id: 'custom'; label: string; aspect: undefined }>(computeInitialPreset);
  const cropperRef = useRef<CropperRef>(null);
  const [croppedDataUrl, setCroppedDataUrl] = useState<string | null>(null);

  const isCustom = selectedPreset.id === 'custom';

  useEffect(() => {
    const url = URL.createObjectURL(imageFile);
    setImgSrc(url);
    setView('crop');
    setConfirmed(false);
    setCroppedDataUrl(null);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  // Removed manual onImageLoad since react-advanced-cropper handles initialization

  const applyCrop = useCallback(() => {
    if (cropperRef.current) {
      const croppedCanvas = cropperRef.current.getCanvas();
      if (!croppedCanvas) return null;

      const canvas = document.createElement('canvas');
      const targetWidth = isCustom ? croppedCanvas.width : (selectedPreset as Preset).width;
      const targetHeight = isCustom ? croppedCanvas.height : (selectedPreset as Preset).height;
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(croppedCanvas, 0, 0, targetWidth, targetHeight);
      
      const dataUrl = canvas.toDataURL('image/png');
      setCroppedDataUrl(dataUrl);
      onCropReady(canvas);
      return canvas;
    }
    return null;
  }, [onCropReady, selectedPreset, isCustom]);

  const handleConfirmAndPreview = () => {
    applyCrop();
    setConfirmed(true);
    setView('preview');
  };

  const handleBackToAdjust = () => {
    setView('crop');
  };

  const handleNextImage = () => {
    if (onNextImage) onNextImage();
  };

  return (
    <div className={styles.wrapper}>
      {/* Top action bar */}
      <div className={styles.actionBar}>
        {view === 'crop' ? (
          <>
            <button
              className={styles.centerBtn}
              onClick={() => {
                if (cropperRef.current) {
                  cropperRef.current.reset();
                }
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>
              Center / Reset
            </button>
            <span className={styles.cropHint}>Drag corners to adjust</span>
            <button className={styles.confirmBtn} onClick={handleConfirmAndPreview}>
              Confirm & Preview ✓
            </button>
          </>
        ) : (
          <>
            <button className={styles.backBtn} onClick={handleBackToAdjust}>
              ← Adjust
            </button>
            <span className={styles.previewLabel}>
              {confirmed ? '✓ Cropped' : 'Preview'}
            </span>
            {hasNextImage ? (
              <button className={styles.nextImageBtn} onClick={handleNextImage}>
                Next Photo →
              </button>
            ) : (
              <div style={{ width: 80 }} />
            )}
          </>
        )}
      </div>

      {/* Main content */}
      {view === 'crop' ? (
        <div className={styles.cropArea}>
          {imgSrc && (
            <div className={styles.cropperContainer}>
              <Cropper
                ref={cropperRef}
                src={imgSrc}
                className={styles.advancedCropper}
                stencilProps={{
                  aspectRatio: isCustom ? undefined : (selectedPreset as Preset).aspect,
                  grid: true
                }}
                backgroundWrapperProps={{
                  scaleImage: true
                }}
              />
            </div>
          )}
        </div>
      ) : (
        <div className={styles.previewArea}>
          {croppedDataUrl ? (
            <div className={styles.previewImgWrap}>
              <img
                src={croppedDataUrl}
                alt="Passport Preview"
                className={styles.previewImg}
              />
            </div>
          ) : (
            <div className={styles.placeholder}>
              <span>Confirming crop…</span>
            </div>
          )}
          {totalImages > 1 && (
            <div className={styles.progressInfo}>
              Photo {imageIndex + 1} of {totalImages}
              {confirmed && ' ✓'}
            </div>
          )}
          <div className={styles.previewNote}>
            Ensure face is centered and occupies 70–80% of the frame
          </div>
        </div>
      )}
    </div>
  );
}
