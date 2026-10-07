'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import styles from './PrintLayout.module.css';
import { composeA4Sheet, composeA4Sheets, PrintLayoutOptions } from '@/lib/processing';
import { canvasToBlob } from '@/lib/exif';
import { PDFDocument } from 'pdf-lib';

interface PrintLayoutProps {
  photoCanvases: HTMLCanvasElement[];
}

const COUNTRY_PRESETS = [
  { label: '🇮🇳 India', widthMm: 35, heightMm: 45, bg: '#ffffff' },
  { label: '🇺🇸 US', widthMm: 51, heightMm: 51, bg: '#ffffff' },
  { label: '🇬🇧 UK', widthMm: 35, heightMm: 45, bg: '#ffffff' },
  { label: '🇪🇺 Schengen', widthMm: 35, heightMm: 45, bg: '#ffffff' },
  { label: '🌍 Custom', widthMm: 35, heightMm: 45, bg: '#ffffff' },
];

export default function PrintLayout({ photoCanvases }: PrintLayoutProps) {
  const [photoCounts, setPhotoCounts] = useState<number[]>([]);
  const [preset, setPreset] = useState(0);
  const [previewDataUrls, setPreviewDataUrls] = useState<string[]>([]);
  const [estimatedKB, setEstimatedKB] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Initialize counts when canvases change
  useEffect(() => {
    if (photoCanvases.length > 0 && (photoCounts.length !== photoCanvases.length)) {
      // Default: distribute 30 photos among available users
      const perUser = Math.floor(30 / photoCanvases.length);
      const initial = photoCanvases.map((_, i) => 
        i === 0 ? 30 - (perUser * (photoCanvases.length - 1)) : perUser
      );
      setPhotoCounts(initial);
    }
  }, [photoCanvases]);

  const updateCount = (idx: number, val: number) => {
    const newCounts = [...photoCounts];
    newCounts[idx] = Math.max(0, val);
    setPhotoCounts(newCounts);
  };

  const getExpandedCanvases = useCallback(() => {
    return photoCanvases.flatMap((canvas, i) => 
      Array(photoCounts[i] || 0).fill(canvas)
    );
  }, [photoCanvases, photoCounts]);

  const getLayoutOpts = useCallback((dpi: 96 | 300): PrintLayoutOptions => {
    const p = COUNTRY_PRESETS[preset];
    return {
      dpi,
      photoWidthMm: p.widthMm,
      photoHeightMm: p.heightMm,
      marginMm: 5,
      gapMm: 2,
    };
  }, [preset]);

  const generatePreview = useCallback(async () => {
    if (photoCanvases.length === 0 || photoCounts.length === 0) return;
    setIsGenerating(true);

    const expanded = getExpandedCanvases();
    if (expanded.length === 0) {
      setPreviewDataUrls([]);
      setIsGenerating(false);
      return;
    }

    // Screen preview at 96 DPI
    const opts96 = getLayoutOpts(96);
    const sheets96 = composeA4Sheets(expanded, opts96);
    setPreviewDataUrls(sheets96.map(s => s.toDataURL('image/png')));

    // Estimate export size (300 DPI)
    const opts300 = getLayoutOpts(300);
    const sheets300 = composeA4Sheets(expanded, opts300);
    let totalSize = 0;
    for (const sheet of sheets300) {
      const blob = await canvasToBlob(sheet, 'image/png');
      totalSize += blob.size;
    }
    setEstimatedKB(Math.round(totalSize / 1024));

    setIsGenerating(false);
  }, [photoCanvases, photoCounts, getLayoutOpts, getExpandedCanvases]);

  useEffect(() => {
    generatePreview();
  }, [generatePreview]);

  const downloadPNG = useCallback(async () => {
    setIsGenerating(true);
    const expanded = getExpandedCanvases();
    const opts = getLayoutOpts(300);
    const sheets = composeA4Sheets(expanded, opts);
    
    for (let i = 0; i < sheets.length; i++) {
      const blob = await canvasToBlob(sheets[i], 'image/png');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `passport-photos-page-${i + 1}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setIsGenerating(false);
  }, [getExpandedCanvases, getLayoutOpts]);

  const downloadPDF = useCallback(async () => {
    setIsGenerating(true);

    const expanded = getExpandedCanvases();
    const opts = getLayoutOpts(300);
    const sheets = composeA4Sheets(expanded, opts);
    
    const pdfDoc = await PDFDocument.create();

    for (const sheet of sheets) {
      const blob = await canvasToBlob(sheet, 'image/png');
      const pngBytes = new Uint8Array(await blob.arrayBuffer());
      const pngImage = await pdfDoc.embedPng(pngBytes);
      const page = pdfDoc.addPage([595.28, 841.89]);
      page.drawImage(pngImage, {
        x: 0,
        y: 0,
        width: 595.28,
        height: 841.89,
      });
    }

    const pdfBytes = await pdfDoc.save();
    const pdfBlob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'passport-photos-multi.pdf';
    a.click();
    URL.revokeObjectURL(url);
    setIsGenerating(false);
  }, [getExpandedCanvases, getLayoutOpts]);

  const handlePrint = useCallback(async () => {
    const expanded = getExpandedCanvases();
    const opts = getLayoutOpts(300);
    const sheets = composeA4Sheets(expanded, opts);
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write('<html><head><title>Print Photos</title><style>body{margin:0;padding:0;} img{width:100%; height:auto; display:block; page-break-after:always;}</style></head><body>');
    
    sheets.forEach((sheet) => {
      const dataUrl = sheet.toDataURL('image/png');
      printWindow.document.write(`<img src="${dataUrl}" />`);
    });

    printWindow.document.write('</body></html>');
    printWindow.document.close();
    
    printWindow.onload = () => {
      printWindow.print();
      // printWindow.close(); // Optional: close after printing
    };
  }, [getExpandedCanvases, getLayoutOpts]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.controls}>
        {/* Country preset */}
        <div className={styles.controlGroup}>
          <label className={styles.label}>Country / Size Preset</label>
          <div className={styles.presetRow}>
            {COUNTRY_PRESETS.map((p, i) => (
              <button
                key={p.label}
                id={`country-preset-${i}`}
                className={`${styles.presetBtn} ${preset === i ? styles.active : ''}`}
                onClick={() => setPreset(i)}
              >
                {p.label}
                <span className={styles.presetSize}>{p.widthMm}×{p.heightMm}mm</span>
              </button>
            ))}
          </div>
        </div>

        {/* Manual Quantity per Photo */}
        <div className={styles.controlGroup}>
          <label className={styles.label}>Quantities per Photo</label>
          <div className={styles.quantityGrid}>
            {photoCanvases.map((canvas, i) => (
              <div key={i} className={styles.quantityItem}>
                <div className={styles.thumbWrap}>
                  <img src={canvas.toDataURL()} alt={`User ${i + 1}`} className={styles.thumb} />
                  <span className={styles.thumbLabel}>User {i + 1}</span>
                </div>
                <div className={styles.inputWrap}>
                  <button className={styles.stepBtn} onClick={() => updateCount(i, (photoCounts[i] || 0) - 1)}>−</button>
                  <input
                    type="number"
                    className={styles.qtyInput}
                    value={photoCounts[i] || 0}
                    onChange={(e) => updateCount(i, parseInt(e.target.value) || 0)}
                  />
                  <button className={styles.stepBtn} onClick={() => updateCount(i, (photoCounts[i] || 0) + 1)}>+</button>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.totalBadge}>
            Total: {photoCounts.reduce((a, b) => a + b, 0)} photos ({previewDataUrls.length} sheet{previewDataUrls.length > 1 ? 's' : ''})
          </div>
        </div>

        {estimatedKB !== null && (
          <div className={styles.sizeEstimate}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
            <span>Estimated export size: <strong>{estimatedKB > 1024 ? `${(estimatedKB / 1024).toFixed(1)} MB` : `${estimatedKB} KB`}</strong></span>
          </div>
        )}

        {/* Download buttons */}
        <div className={styles.downloadRow}>
          <button
            id="print-btn"
            className={`${styles.downloadBtn} ${styles.printMainBtn}`}
            onClick={handlePrint}
            disabled={isGenerating || previewDataUrls.length === 0}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            Print Now
          </button>
          <button
            id="download-pdf-btn"
            className={`${styles.downloadBtn} ${styles.pdfBtn}`}
            onClick={downloadPDF}
            disabled={isGenerating || previewDataUrls.length === 0}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            Download PDF
          </button>
          <button
            id="download-png-btn"
            className={styles.downloadBtn}
            onClick={downloadPNG}
            disabled={isGenerating || previewDataUrls.length === 0}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            Download PNGs
          </button>
        </div>
      </div>

      {/* A4 Preview */}
      <div className={styles.sheetPreview}>
        <h4 className={styles.previewLabel}>Sheet Preview ({previewDataUrls.length} page{previewDataUrls.length > 1 ? 's' : ''})</h4>
        {isGenerating && (
          <div className={styles.generating}>
            <div className={styles.spinner} />
            <span>Generating layout…</span>
          </div>
        )}
        <div className={styles.previewScroll}>
          {previewDataUrls.map((url, i) => (
            <div key={i} className={styles.a4Wrap}>
              <span className={styles.pageNumber}>Page {i + 1}</span>
              <img src={url} alt={`A4 sheet preview page ${i + 1}`} className={styles.a4Img} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
