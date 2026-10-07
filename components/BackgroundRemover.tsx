'use client';

import React, { useState, useCallback } from 'react';
import styles from './BackgroundRemover.module.css';
import { removeBackground } from '@/lib/backgroundRemoval';
import { fillBackground } from '@/lib/processing';

interface BackgroundRemoverProps {
  sourceCanvas: HTMLCanvasElement;
  onResult: (canvas: HTMLCanvasElement) => void;
  onNextImage?: () => void;
  onPrevImage?: () => void;
  onSkipAll?: () => void;
  onReCrop?: () => void;
  hasPrevImage?: boolean;
  hasNextImage?: boolean;
  imageIndex?: number;
  totalImages?: number;
}

const PRESET_COLORS = [
  { label: 'White', value: '#ffffff' },
  { label: 'Light Gray', value: '#f0f0f0' },
  { label: 'Light Blue', value: '#a8c4e0' },
  { label: 'Cream', value: '#fdf6e3' },
];

export default function BackgroundRemover({
  sourceCanvas,
  onResult,
  onNextImage,
  onPrevImage,
  onSkipAll,
  onReCrop,
  hasPrevImage,
  hasNextImage,
  imageIndex = 0,
  totalImages = 1,
}: BackgroundRemoverProps) {
  const [bgColor, setBgColor] = useState('#ffffff');
  const [progress, setProgress] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [removedCanvas, setRemovedCanvas] = useState<HTMLCanvasElement | null>(null);
  const [resultDataUrl, setResultDataUrl] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const sourceDataUrl = React.useMemo(() => sourceCanvas.toDataURL('image/png'), [sourceCanvas]);

  const handleRemove = useCallback(async () => {
    setIsRunning(true);
    setProgress('Analyzing…');
    const noBg = await removeBackground(sourceCanvas, (msg) => setProgress(msg));
    setRemovedCanvas(noBg);
    const withColor = fillBackground(noBg, bgColor);
    withColor.toBlob((blob) => {
      if (blob) {
        if (resultDataUrl?.startsWith('blob:')) URL.revokeObjectURL(resultDataUrl);
        setResultDataUrl(URL.createObjectURL(blob));
      }
    }, 'image/png');
    onResult(withColor);
    setIsRunning(false);
    setDone(true);
  }, [sourceCanvas, bgColor, onResult, resultDataUrl]);

  const handleColorChange = useCallback((color: string) => {
    setBgColor(color);
    if (removedCanvas) {
      const withColor = fillBackground(removedCanvas, color);
      withColor.toBlob((blob) => {
        if (blob) {
          if (resultDataUrl?.startsWith('blob:')) URL.revokeObjectURL(resultDataUrl);
          setResultDataUrl(URL.createObjectURL(blob));
        }
      }, 'image/png');
      onResult(withColor);
    }
  }, [removedCanvas, onResult, resultDataUrl]);

  const handleSkipThis = useCallback(() => {
    onResult(sourceCanvas);
    setDone(true);
    if (hasNextImage && onNextImage) onNextImage();
  }, [sourceCanvas, onResult, hasNextImage, onNextImage]);

  return (
    <div className={styles.wrapper}>

      {/* ── Top bar ── */}
      <div className={styles.actionBar}>
        <div className={styles.actionLeft}>
          {onReCrop && (
            <button className={styles.reCropBtn} onClick={onReCrop}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M6.13 1L6 16a2 2 0 0 0 2 2h15"/>
                <path d="M1 6.13L16 6a2 2 0 0 1 2 2v15"/>
              </svg>
              Re-crop
            </button>
          )}
        </div>
        <div className={styles.actionCenter}>
          {totalImages > 1 && (
            <span className={styles.photoCounter}>
              {imageIndex + 1} / {totalImages}{done ? ' ✓' : ''}
            </span>
          )}
        </div>
        <div className={styles.actionRight}>
          {onSkipAll && (
            <button className={styles.skipAllBtn} onClick={onSkipAll}>Skip All</button>
          )}
        </div>
      </div>

      {/* ── Side-by-side images with overlay arrows ── */}
      <div className={styles.imageSection}>
        {/* Prev arrow — left edge of section */}
        {hasPrevImage && onPrevImage && (
          <button className={`${styles.arrowBtn} ${styles.arrowLeft}`} onClick={onPrevImage}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
        )}

        <div className={styles.imagesRow}>
          {/* Original */}
          <div className={styles.imgCard}>
            <span className={styles.imgLabel}>Original</span>
            <div className={styles.imgWrap}>
              <img src={sourceDataUrl} alt="Original" className={styles.img} />
            </div>
          </div>

          {/* Result / placeholder */}
          <div className={styles.imgCard}>
            <span className={styles.imgLabel}>{done ? 'Result' : 'Preview'}</span>
            <div className={styles.imgWrap} style={{ background: done && resultDataUrl ? bgColor : 'var(--surface-3)' }}>
              {done && resultDataUrl ? (
                <img src={resultDataUrl} alt="Result" className={styles.img} />
              ) : (
                <div className={styles.placeholder}>
                  {isRunning ? (
                    <div className={styles.spinner} />
                  ) : (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
                      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
                    </svg>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Next arrow — right edge of section */}
        {hasNextImage && onNextImage && (
          <button className={`${styles.arrowBtn} ${styles.arrowRight}`} onClick={onNextImage}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        )}
      </div>

      {/* ── Controls ── */}
      <div className={styles.controls}>
        {/* Color row */}
        <div className={styles.colorRow}>
          <span className={styles.colorLabel}>BG:</span>
          <div className={styles.presets}>
            {PRESET_COLORS.map((p) => (
              <button
                key={p.value}
                className={`${styles.presetBtn} ${bgColor === p.value ? styles.active : ''}`}
                style={{ background: p.value }}
                onClick={() => handleColorChange(p.value)}
                title={p.label}
              />
            ))}
            <label className={styles.customColorWrap} title="Custom color">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className={styles.colorInput}
              />
              <span className={styles.customLabel}>Custom</span>
            </label>
          </div>
        </div>

        {/* Progress */}
        {isRunning && (
          <div className={styles.progressBar}>
            <div className={styles.progressFill} />
            <span className={styles.progressText}>{progress}</span>
          </div>
        )}

        {/* Buttons */}
        <div className={styles.btnRow}>
          <button className={styles.primaryBtn} onClick={handleRemove} disabled={isRunning} id="remove-bg-btn">
            {isRunning ? progress : done ? '↺ Re-process' : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
                </svg>
                Remove BG
              </>
            )}
          </button>

          {!done && (
            <button className={styles.skipBtn} onClick={handleSkipThis} disabled={isRunning}>Skip</button>
          )}

          {done && hasNextImage && onNextImage && (
            <button className={styles.nextBtn} onClick={onNextImage}>Next →</button>
          )}
        </div>

        <p className={styles.note}>🔒 Runs locally — no uploads</p>
      </div>
    </div>
  );
}
