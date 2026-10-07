'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import styles from './Enhancer.module.css';
import { applyFilters, FilterOptions, cloneCanvas } from '@/lib/processing';

interface EnhancerProps {
  sourceCanvas: HTMLCanvasElement;
  onResult: (canvas: HTMLCanvasElement) => void;
  onNextImage?: () => void;
  onPrevImage?: () => void;
  onSkipAll?: () => void;
  hasPrevImage?: boolean;
  hasNextImage?: boolean;
  imageIndex?: number;
  totalImages?: number;
}

const DEFAULT_FILTERS: FilterOptions = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  sharpness: 0,
  warmth: 0,
};

const PRESETS: { label: string; filters: FilterOptions }[] = [
  { label: 'Natural', filters: { brightness: 105, contrast: 105, saturation: 105, sharpness: 2, warmth: 5 } },
  { label: 'Crisp',   filters: { brightness: 110, contrast: 120, saturation: 100, sharpness: 5, warmth: 0 } },
  { label: 'Warm',    filters: { brightness: 105, contrast: 100, saturation: 110, sharpness: 1, warmth: 20 } },
  { label: 'Cool',    filters: { brightness: 100, contrast: 105, saturation: 95,  sharpness: 2, warmth: -15 } },
  { label: 'Vivid',   filters: { brightness: 108, contrast: 115, saturation: 130, sharpness: 4, warmth: 8 } },
  { label: 'Reset',   filters: DEFAULT_FILTERS },
];

const sliders: { key: keyof FilterOptions; label: string; min: number; max: number; step: number; unit: string }[] = [
  { key: 'brightness', label: 'Brightness', min: 50,  max: 150, step: 1,   unit: '%' },
  { key: 'contrast',   label: 'Contrast',   min: 50,  max: 200, step: 1,   unit: '%' },
  { key: 'saturation', label: 'Saturation', min: 0,   max: 200, step: 1,   unit: '%' },
  { key: 'sharpness',  label: 'Sharpness',  min: 0,   max: 10,  step: 0.5, unit: ''  },
  { key: 'warmth',     label: 'Warmth',     min: -50, max: 50,  step: 1,   unit: ''  },
];

export default function Enhancer({
  sourceCanvas,
  onResult,
  onNextImage,
  onPrevImage,
  onSkipAll,
  hasPrevImage,
  hasNextImage,
  imageIndex = 0,
  totalImages = 1,
}: EnhancerProps) {
  const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTERS);
  const [history, setHistory]   = useState<FilterOptions[]>([DEFAULT_FILTERS]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [showBefore, setShowBefore] = useState(false);
  const [resultDataUrl, setResultDataUrl] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sourceDataUrl = useMemo(() => sourceCanvas.toDataURL('image/png'), [sourceCanvas]);

  const apply = useCallback((f: FilterOptions) => {
    const result = applyFilters(sourceCanvas, f);
    result.toBlob((blob) => {
      if (blob) {
        if (resultDataUrl?.startsWith('blob:')) URL.revokeObjectURL(resultDataUrl);
        setResultDataUrl(URL.createObjectURL(blob));
      }
    }, 'image/png');
    onResult(result);
  }, [sourceCanvas, onResult, resultDataUrl]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => apply(filters), 60);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [filters, apply]);

  const pushHistory = useCallback((f: FilterOptions) => {
    setHistory((prev) => [...prev.slice(0, historyIdx + 1), f]);
    setHistoryIdx((i) => i + 1);
  }, [historyIdx]);

  const updateFilter = useCallback(<K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const commitFilter = useCallback(() => pushHistory(filters), [filters, pushHistory]);

  const undo = useCallback(() => {
    if (historyIdx > 0) { const i = historyIdx - 1; setHistoryIdx(i); setFilters(history[i]); }
  }, [history, historyIdx]);

  const redo = useCallback(() => {
    if (historyIdx < history.length - 1) { const i = historyIdx + 1; setHistoryIdx(i); setFilters(history[i]); }
  }, [history, historyIdx]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  const handleSkip = useCallback(() => {
    onResult(cloneCanvas(sourceCanvas));
    if (hasNextImage && onNextImage) onNextImage();
  }, [sourceCanvas, onResult, hasNextImage, onNextImage]);

  return (
    <div className={styles.wrapper}>

      {/* ── Top bar ── */}
      <div className={styles.actionBar}>
        <div className={styles.actionLeft}>
          <button className={styles.undoBtn} onClick={undo} disabled={historyIdx === 0}>↩</button>
          <button className={styles.undoBtn} onClick={redo} disabled={historyIdx >= history.length - 1}>↪</button>
        </div>
        <div className={styles.actionCenter}>
          {totalImages > 1 && (
            <span className={styles.photoCounter}>{imageIndex + 1} / {totalImages}</span>
          )}
        </div>
        <div className={styles.actionRight}>
          {onSkipAll && (
            <button className={styles.skipAllBtn} onClick={onSkipAll}>Skip All</button>
          )}
        </div>
      </div>

      {/* ── Image + arrows ── */}
      <div className={styles.imageSection}>
        {hasPrevImage && onPrevImage && (
          <button className={`${styles.arrowBtn} ${styles.arrowLeft}`} onClick={onPrevImage}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
        )}

        <div className={styles.imgWrap}>
          <img
            src={showBefore ? sourceDataUrl : (resultDataUrl ?? sourceDataUrl)}
            alt="Preview"
            className={styles.previewImg}
          />
          <button
            className={`${styles.baBtn} ${showBefore ? styles.baBtnActive : ''}`}
            onMouseDown={() => setShowBefore(true)}
            onMouseUp={() => setShowBefore(false)}
            onMouseLeave={() => setShowBefore(false)}
            onTouchStart={() => setShowBefore(true)}
            onTouchEnd={() => setShowBefore(false)}
          >
            {showBefore ? 'Before' : 'Hold: Compare'}
          </button>
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
        {/* Preset chips */}
        <div className={styles.presetsRow}>
          {PRESETS.map((p) => (
            <button
              key={p.label}
              className={styles.presetBtn}
              onClick={() => { setFilters(p.filters); pushHistory(p.filters); }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Sliders */}
        <div className={styles.sliders}>
          {sliders.map((s) => (
            <div key={s.key} className={styles.sliderRow}>
              <div className={styles.sliderMeta}>
                <span className={styles.sliderLabel}>{s.label}</span>
                <span className={styles.sliderValue}>
                  {s.key === 'warmth'
                    ? (filters[s.key] as number) > 0 ? `+${filters[s.key]}` : String(filters[s.key])
                    : `${filters[s.key]}${s.unit}`}
                </span>
              </div>
              <input
                type="range"
                min={s.min}
                max={s.max}
                step={s.step}
                value={filters[s.key] as number}
                className={styles.slider}
                onChange={(e) => updateFilter(s.key, parseFloat(e.target.value))}
                onMouseUp={commitFilter}
                onTouchEnd={commitFilter}
              />
            </div>
          ))}
        </div>

        {/* Bottom nav */}
        <div className={styles.bottomRow}>
          <button className={styles.skipBtn} onClick={handleSkip}>Skip</button>
          {hasNextImage && onNextImage && (
            <button className={styles.nextBtn} onClick={onNextImage}>Next Photo →</button>
          )}
        </div>
      </div>
    </div>
  );
}
