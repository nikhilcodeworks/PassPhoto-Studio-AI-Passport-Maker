'use client';

import React, { useState, useCallback, useEffect } from 'react';
import styles from './BorderEditor.module.css';
import { addBorder, BorderOptions } from '@/lib/processing';

interface BorderEditorProps {
  sourceCanvas: HTMLCanvasElement;
  onResult: (canvas: HTMLCanvasElement) => void;
  onApplyToAll?: (opts: BorderOptions) => void;
  onNextImage?: () => void;
  onPrevImage?: () => void;
  hasPrevImage?: boolean;
  hasNextImage?: boolean;
  imageIndex?: number;
  totalImages?: number;
}

const PRESET_COLORS = [
  { label: 'White', value: '#ffffff' },
  { label: 'Black', value: '#000000' },
  { label: 'Navy',  value: '#1a237e' },
  { label: 'Gold',  value: '#b8860b' },
  { label: 'Gray',  value: '#9e9e9e' },
];

export default function BorderEditor({
  sourceCanvas,
  onResult,
  onApplyToAll,
  onNextImage,
  onPrevImage,
  hasPrevImage,
  hasNextImage,
  imageIndex = 0,
  totalImages = 1,
}: BorderEditorProps) {
  const [borderOpts, setBorderOpts] = useState<BorderOptions>({ width: 1, color: '#000000', style: 'solid' });
  const [resultDataUrl, setResultDataUrl] = useState<string>(sourceCanvas.toDataURL('image/png'));

  const applyBorder = useCallback((opts: BorderOptions) => {
    const result = addBorder(sourceCanvas, opts);
    setResultDataUrl(result.toDataURL('image/png'));
    onResult(result);
  }, [sourceCanvas, onResult]);

  useEffect(() => { applyBorder(borderOpts); }, [borderOpts, applyBorder]);

  const update = <K extends keyof BorderOptions>(key: K, value: BorderOptions[K]) => {
    setBorderOpts((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyToAll = () => {
    if (onApplyToAll) onApplyToAll(borderOpts);
  };

  return (
    <div className={styles.wrapper}>

      {/* ── Top bar ── */}
      <div className={styles.actionBar}>
        <div className={styles.actionLeft}>
          {totalImages > 1 && (
            <span className={styles.photoCounter}>{imageIndex + 1} / {totalImages}</span>
          )}
        </div>
        <div className={styles.actionRight}>
          {onApplyToAll && totalImages > 1 && (
            <button className={styles.applyAllBtn} onClick={handleApplyToAll}>
              Apply to All ✓
            </button>
          )}
        </div>
      </div>

      {/* ── Image preview + arrows ── */}
      <div className={styles.imageSection}>
        {hasPrevImage && onPrevImage && (
          <button className={`${styles.arrowBtn} ${styles.arrowLeft}`} onClick={onPrevImage}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
        )}

        <div className={styles.imgWrap}>
          <img src={resultDataUrl} alt="Border preview" className={styles.img} />
        </div>

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

        {/* Width */}
        <div className={styles.controlGroup}>
          <div className={styles.controlMeta}>
            <span className={styles.label}>Border Width</span>
            <span className={styles.value}>{borderOpts.width}px</span>
          </div>
          <input
            id="border-width"
            type="range"
            min={0}
            max={20}
            step={1}
            value={borderOpts.width}
            className={styles.slider}
            onChange={(e) => update('width', parseInt(e.target.value))}
          />
        </div>

        {/* Style */}
        <div className={styles.controlGroup}>
          <span className={styles.label}>Style</span>
          <div className={styles.styleRow}>
            {(['solid', 'dashed', 'double'] as const).map((s) => (
              <button
                key={s}
                className={`${styles.styleBtn} ${borderOpts.style === s ? styles.active : ''}`}
                onClick={() => update('style', s)}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Color */}
        <div className={styles.controlGroup}>
          <span className={styles.label}>Color</span>
          <div className={styles.colorRow}>
            {PRESET_COLORS.map((c) => (
              <button
                key={c.value}
                className={`${styles.colorDot} ${borderOpts.color === c.value ? styles.activeDot : ''}`}
                style={{ background: c.value, border: c.value === '#ffffff' ? '1px solid #555' : 'none' }}
                onClick={() => update('color', c.value)}
                title={c.label}
              />
            ))}
            <label className={styles.customWrap}>
              <input
                type="color"
                value={borderOpts.color}
                onChange={(e) => update('color', e.target.value)}
                className={styles.colorInput}
              />
              <span className={styles.customLabel}>Custom</span>
            </label>
          </div>
        </div>

        {borderOpts.width === 0 && (
          <p className={styles.hint}>Set width &gt; 0 to add a border</p>
        )}
      </div>
    </div>
  );
}
