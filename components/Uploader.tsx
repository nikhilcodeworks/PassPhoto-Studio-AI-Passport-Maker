'use client';

import React, { useCallback, useRef, useState } from 'react';
import styles from './Uploader.module.css';

interface UploaderProps {
  onFilesReady: (files: ProcessedFile[]) => void;
  initialFiles?: ProcessedFile[];
}

export interface ProcessedFile {
  id: string;
  file: File;
  preview: string;
  name: string;
  width: number;
  height: number;
  sizeKB: number;
}

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp', 'image/heic', 'image/heif'];

export default function Uploader({ onFilesReady, initialFiles = [] }: UploaderProps) {
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [previews, setPreviews] = useState<ProcessedFile[]>(initialFiles);
  const inputRef = useRef<HTMLInputElement>(null);
  const addMoreRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(async (rawFiles: File[]) => {
    setProcessing(true);
    const results: ProcessedFile[] = [];

    for (const file of rawFiles) {
      if (!ACCEPTED.includes(file.type) && !file.name.match(/\.(heic|heif)$/i)) continue;

      let blob: Blob = file;

      // Convert HEIC → JPEG
      if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.match(/\.(heic|heif)$/i)) {
        const heic2any = (await import('heic2any')).default;
        blob = (await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.95 })) as Blob;
      }

      // Strip EXIF
      const { stripExif, blobToImage } = await import('@/lib/exif');
      const cleanBlob = await stripExif(blob);
      const img = await blobToImage(cleanBlob);

      const preview = URL.createObjectURL(cleanBlob);
      results.push({
        id: Math.random().toString(36).substring(2, 11) + Date.now().toString(36),
        file: new File([cleanBlob], file.name, { type: cleanBlob.type }),
        preview,
        name: file.name,
        width: img.naturalWidth,
        height: img.naturalHeight,
        sizeKB: Math.round(cleanBlob.size / 1024),
      });
    }

    const updated = [...previews, ...results];
    setPreviews(updated);
    onFilesReady(updated);
    setProcessing(false);
  }, [onFilesReady, previews]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const files = Array.from(e.dataTransfer.files);
      processFiles(files);
    },
    [processFiles]
  );

  const handleRemove = useCallback((id: string) => {
    const updated = previews.filter(p => p.id !== id);
    setPreviews(updated);
    onFilesReady(updated);
  }, [onFilesReady, previews]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      processFiles(files);
      // Reset input so same file can be uploaded again if needed
      if (e.target) e.target.value = '';
    },
    [processFiles]
  );

  return (
    <div className={styles.wrapper}>
      {previews.length === 0 ? (
        <div
          className={`${styles.dropZone} ${dragging ? styles.dragging : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          id="uploader-dropzone"
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.webp,.bmp,.heic,.heif"
            className={styles.hiddenInput}
            onChange={handleChange}
            id="uploader-file-input"
          />

          <div className={styles.icon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>

          <h3 className={styles.title}>
            {processing ? 'Processing…' : dragging ? 'Drop here!' : 'Upload Photos'}
          </h3>
          <p className={styles.subtitle}>
            Drag & drop or click — JPG, PNG, WebP, BMP, HEIC
          </p>
          <p className={styles.hint}>Multiple files supported</p>
        </div>
      ) : (
        <div className={styles.previewContainer}>
          <div className={styles.previewGrid}>
            {previews.map((pf) => (
              <div key={pf.id} className={styles.previewCard}>
                <button 
                  className={styles.removeBtn} 
                  onClick={() => handleRemove(pf.id)}
                  title="Remove photo"
                >
                  ✕
                </button>
                <img src={pf.preview} alt={pf.name} className={styles.previewImg} />
                <div className={styles.previewMeta}>
                  <span className={styles.fileName}>{pf.name}</span>
                  <span className={styles.fileSize}>{pf.sizeKB} KB</span>
                </div>
              </div>
            ))}
          </div>
          
          <div 
            className={styles.addMoreHorizontal} 
            onClick={() => addMoreRef.current?.click()}
            id="add-more-btn-horizontal"
          >
            <input
              ref={addMoreRef}
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp,.bmp,.heic,.heif"
              className={styles.hiddenInput}
              onChange={handleChange}
            />
            <div className={styles.addMoreIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </div>
            <span>Add More Photos</span>
          </div>
        </div>
      )}
    </div>
  );
}
