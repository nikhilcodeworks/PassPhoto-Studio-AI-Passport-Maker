'use client';

import React, { useState, useCallback, useMemo } from 'react';
import styles from './studio.module.css';
import Uploader, { ProcessedFile } from '@/components/Uploader';
import FaceCropper from '@/components/FaceCropper';
import BackgroundRemover from '@/components/BackgroundRemover';
import Enhancer from '@/components/Enhancer';
import BorderEditor from '@/components/BorderEditor';
import PrintLayout from '@/components/PrintLayout';
import { initSegmenter } from '@/lib/backgroundRemoval';
import { addBorder, BorderOptions } from '@/lib/processing';

// Helper for file processing (copied logic for header accessibility)
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp', 'image/heic', 'image/heif'];

const PHOTO_PRESETS = [
  { id: 'in_uk', label: 'India / UK (35×45 mm)', aspect: 35 / 45, width: 413, height: 531, description: 'Standard 3.5x4.5 cm' },
  { id: 'us', label: 'US (2×2 inch)', aspect: 1, width: 600, height: 600, description: 'Square 5x5 cm' },
  { id: 'cn', label: 'China (33×48 mm)', aspect: 33 / 48, width: 390, height: 567, description: '3.3x4.8 cm' },
  { id: 'custom', label: 'Custom / Free', aspect: undefined, width: 0, height: 0, description: 'Free-form crop' }
];

const STEPS = [
  { 
    id: 'upload', 
    label: 'Upload', 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" y1="3" x2="12" y2="15"></line>
      </svg>
    )
  },
  { 
    id: 'crop', 
    label: 'Manual Crop', 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6.13 1L6 16a2 2 0 0 0 2 2h15"></path>
        <path d="M1 6.13L16 6a2 2 0 0 1 2 2v15"></path>
      </svg>
    )
  },
  { 
    id: 'background', 
    label: 'Background', 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
      </svg>
    )
  },
  { 
    id: 'enhance', 
    label: 'Enhance', 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
      </svg>
    )
  },
  { 
    id: 'border', 
    label: 'Border', 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      </svg>
    )
  },
  { 
    id: 'print', 
    label: 'Print Layout', 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 6 2 18 2 18 9"></polyline>
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
        <rect x="6" y="14" width="12" height="8"></rect>
      </svg>
    )
  },
];

interface FileProcessingState {
  cropped: HTMLCanvasElement | null;
  bgRemoved: HTMLCanvasElement | null;
  enhanced: HTMLCanvasElement | null;
  bordered: HTMLCanvasElement | null;
}

export default function StudioPage() {
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Pre-load AI models in background as soon as user enters studio
  React.useEffect(() => {
    setMounted(true);
    initSegmenter().catch(console.error);
  }, []);
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState(PHOTO_PRESETS[0].id);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // State for all files
  const [fileStates, setFileStates] = useState<Record<string, FileProcessingState>>({});

  // Final canvases for print layout
  const [finalCanvases, setFinalCanvases] = useState<HTMLCanvasElement[]>([]);

  const currentFile = useMemo(() => files.find(f => f.id === selectedFileId) || files[0], [files, selectedFileId]);
  const currentState = useMemo(() => (selectedFileId ? fileStates[selectedFileId] : null) || {
    cropped: null,
    bgRemoved: null,
    enhanced: null,
    bordered: null
  }, [fileStates, selectedFileId]);

  const handleFilesReady = useCallback((pf: ProcessedFile[]) => {
    setFiles(pf);
    if (!selectedFileId && pf.length > 0) {
      setSelectedFileId(pf[0].id);
    }
    
    setFileStates(prevStates => {
      const updatedStates = { ...prevStates };
      pf.forEach((f) => {
        if (!updatedStates[f.id]) {
          updatedStates[f.id] = { cropped: null, bgRemoved: null, enhanced: null, bordered: null };
        }
      });
      return updatedStates;
    });
  }, [selectedFileId]);

  // Header Add More Logic
  const handleHeaderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = Array.from(e.target.files ?? []);
    if (rawFiles.length === 0) return;

    const results: ProcessedFile[] = [];
    for (const file of rawFiles) {
      if (!ACCEPTED_TYPES.includes(file.type) && !file.name.match(/\.(heic|heif)$/i)) continue;

      let blob: Blob = file;
      if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.match(/\.(heic|heif)$/i)) {
        const heic2any = (await import('heic2any')).default;
        blob = (await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.95 })) as Blob;
      }

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

    const updated = [...files, ...results];
    handleFilesReady(updated);
    if (e.target) e.target.value = '';
    
    // Switch to step 0 to see the new files
    if (currentStep !== 0) setCurrentStep(0);
  };

  const updateCurrentFileState = useCallback((key: keyof FileProcessingState, canvas: HTMLCanvasElement) => {
    if (!selectedFileId) return;
    setFileStates(prev => ({
      ...prev,
      [selectedFileId]: {
        ...(prev[selectedFileId] || { cropped: null, bgRemoved: null, enhanced: null, bordered: null }),
        [key]: canvas
      }
    }));
  }, [selectedFileId]);

  const handleCropReady = useCallback((canvas: HTMLCanvasElement) => updateCurrentFileState('cropped', canvas), [updateCurrentFileState]);
  const handleBgResult = useCallback((canvas: HTMLCanvasElement) => updateCurrentFileState('bgRemoved', canvas), [updateCurrentFileState]);
  const handleEnhanceResult = useCallback((canvas: HTMLCanvasElement) => updateCurrentFileState('enhanced', canvas), [updateCurrentFileState]);
  const handleBorderResult = useCallback((canvas: HTMLCanvasElement) => updateCurrentFileState('bordered', canvas), [updateCurrentFileState]);

  const handleRemoveFile = useCallback((id: string) => {
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== id);
      if (updated.length === 0) {
        setCurrentStep(0);
        setSelectedFileId(null);
      } else if (selectedFileId === id) {
        const idx = prev.findIndex(f => f.id === id);
        const nextFile = updated[idx] || updated[idx - 1];
        setSelectedFileId(nextFile.id);
      }
      return updated;
    });
    
    setFileStates(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, [selectedFileId]);

  const goToStep = (idx: number) => {
    if (idx >= 1 && files.length === 0) return;
    
    // Enforcement: Must crop ALL photos before going to Background Removal (Step 2)
    const allCropped = files.length > 0 && files.every(f => fileStates[f.id]?.cropped);
    if (idx >= 2 && !allCropped) {
      alert("Please crop all uploaded photos first.");
      return;
    }
    // Reset to first image when entering background step
    if (idx === 2 && files.length > 0) setSelectedFileId(files[0].id);
    setCurrentStep(idx);
  };

  const nextStep = () => {
    if (currentStep === 1) {
      const allCropped = files.length > 0 && files.every(f => fileStates[f.id]?.cropped);
      if (!allCropped) {
        // Find first uncropped file
        const firstUncropped = files.find(f => !fileStates[f.id]?.cropped);
        if (firstUncropped) {
          setSelectedFileId(firstUncropped.id);
          alert("Please crop all photos before proceeding. Switched to next uncropped photo.");
        }
        return;
      }
      // Reset to first image when entering background or enhance step
      if (files.length > 0) setSelectedFileId(files[0].id);
    }

    if (currentStep === 4) {
      const final: HTMLCanvasElement[] = [];
      files.forEach((f) => {
        const s = fileStates[f.id];
        if (s) {
          const canvas = s.bordered ?? s.enhanced ?? s.bgRemoved ?? s.cropped;
          if (canvas) final.push(canvas);
        }
      });
      setFinalCanvases(final);
    }
    setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 0));

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <Uploader onFilesReady={handleFilesReady} initialFiles={files} />;
      case 1:
        return currentFile ? (
          <FaceCropper
            key={`crop-${currentFile.id}-${selectedPresetId}`}
            imageFile={currentFile.file}
            onCropReady={handleCropReady}
            onDone={nextStep}
            presetId={selectedPresetId}
            imageIndex={files.findIndex(f => f.id === currentFile.id)}
            totalImages={files.length}
            hasNextImage={files.findIndex(f => f.id === currentFile.id) < files.length - 1}
            onNextImage={() => {
              const idx = files.findIndex(f => f.id === currentFile.id);
              const nextFile = files[idx + 1];
              if (nextFile) setSelectedFileId(nextFile.id);
            }}
          />
        ) : <div className={styles.noFile}>No file selected</div>;
      case 2:
        return currentState.cropped ? (
          <BackgroundRemover
            key={`bg-${currentFile.id}`}
            sourceCanvas={currentState.cropped}
            onResult={handleBgResult}
            imageIndex={files.findIndex(f => f.id === currentFile.id)}
            totalImages={files.length}
            hasPrevImage={files.findIndex(f => f.id === currentFile.id) > 0}
            hasNextImage={files.findIndex(f => f.id === currentFile.id) < files.length - 1}
            onPrevImage={() => {
              const idx = files.findIndex(f => f.id === currentFile.id);
              const prevFile = files[idx - 1];
              if (prevFile) setSelectedFileId(prevFile.id);
            }}
            onNextImage={() => {
              const idx = files.findIndex(f => f.id === currentFile.id);
              const nextFile = files[idx + 1];
              if (nextFile) setSelectedFileId(nextFile.id);
            }}
            onSkipAll={() => {
              files.forEach(f => {
                const s = fileStates[f.id];
                if (s?.cropped && !s.bgRemoved) {
                  setFileStates(prev => ({
                    ...prev,
                    [f.id]: { ...prev[f.id], bgRemoved: s.cropped! }
                  }));
                }
              });
              setCurrentStep(3);
            }}
            onReCrop={() => { setCurrentStep(1); }}
          />
        ) : <div className={styles.noFile}>Please crop this photo first</div>;
      case 3:
        const sourceForEnhance = currentState.bgRemoved ?? currentState.cropped;
        return sourceForEnhance ? (
          <Enhancer
            key={`enhance-${currentFile.id}`}
            sourceCanvas={sourceForEnhance}
            onResult={handleEnhanceResult}
            imageIndex={files.findIndex(f => f.id === currentFile.id)}
            totalImages={files.length}
            hasPrevImage={files.findIndex(f => f.id === currentFile.id) > 0}
            hasNextImage={files.findIndex(f => f.id === currentFile.id) < files.length - 1}
            onPrevImage={() => {
              const idx = files.findIndex(f => f.id === currentFile.id);
              const prevFile = files[idx - 1];
              if (prevFile) setSelectedFileId(prevFile.id);
            }}
            onNextImage={() => {
              const idx = files.findIndex(f => f.id === currentFile.id);
              const nextFile = files[idx + 1];
              if (nextFile) setSelectedFileId(nextFile.id);
            }}
            onSkipAll={() => setCurrentStep(4)}
          />
        ) : <div className={styles.noFile}>Complete previous steps first</div>;
      case 4:
        const sourceForBorder = currentState.enhanced ?? currentState.bgRemoved ?? currentState.cropped;
        return sourceForBorder ? (
          <BorderEditor
            key={`border-${currentFile.id}`}
            sourceCanvas={sourceForBorder}
            onResult={handleBorderResult}
            imageIndex={files.findIndex(f => f.id === currentFile.id)}
            totalImages={files.length}
            hasPrevImage={files.findIndex(f => f.id === currentFile.id) > 0}
            hasNextImage={files.findIndex(f => f.id === currentFile.id) < files.length - 1}
            onPrevImage={() => {
              const idx = files.findIndex(f => f.id === currentFile.id);
              const prevFile = files[idx - 1];
              if (prevFile) setSelectedFileId(prevFile.id);
            }}
            onNextImage={() => {
              const idx = files.findIndex(f => f.id === currentFile.id);
              const nextFile = files[idx + 1];
              if (nextFile) setSelectedFileId(nextFile.id);
            }}
            onApplyToAll={(opts) => {
              // Apply this border to all files then advance
              files.forEach(f => {
                const s = fileStates[f.id];
                const src = s?.enhanced ?? s?.bgRemoved ?? s?.cropped;
                if (src) {
                  const result = addBorder(src, opts);
                  setFileStates(prev => ({
                    ...prev,
                    [f.id]: { ...prev[f.id], bordered: result }
                  }));
                }
              });
              setCurrentStep(5);
            }}
          />
        ) : <div className={styles.noFile}>Complete previous steps first</div>;
      case 5:
        return <PrintLayout photoCanvases={finalCanvases.length > 0 ? finalCanvases : Object.values(fileStates).map(s => s.bordered ?? s.enhanced ?? s.bgRemoved ?? s.cropped).filter((c): c is HTMLCanvasElement => !!c)} />;
      default:
        return null;
    }
  };

  if (!mounted) return <div className={styles.studioPage} style={{ opacity: 0 }} />;

  return (
    <div className={styles.studioPage}>
      {/* Step indicators removed as requested */}

      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        multiple 
        accept=".jpg,.jpeg,.png,.webp,.bmp,.heic,.heif"
        onChange={handleHeaderUpload}
      />

      {/* Switch User section removed as requested */}

      {/* Switch User section removed as requested */}

      {/* Main content */}
      <div className={styles.stepContent}>
        <div className={styles.stepHeader}>
          <div className={styles.stepHeaderMain}>
            <h2 className={styles.stepTitle}>
              {STEPS[currentStep].icon} {STEPS[currentStep].label}
            </h2>
          </div>

          <div className={styles.headerActions}>
            {/* Format Selector in Header (only for Crop step) */}
            {currentStep === 1 && (
              <div className={styles.formatSelectorHeader}>
                <select 
                  className={styles.headerSelect}
                  value={selectedPresetId}
                  onChange={(e) => setSelectedPresetId(e.target.value)}
                >
                  {PHOTO_PRESETS.map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Add More — only show on Upload step */}
            {currentStep === 0 && (
              <button 
                className={styles.headerAddMoreBtn}
                onClick={() => fileInputRef.current?.click()}
                title="Upload more photos"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>Add More</span>
              </button>
            )}
          </div>
        </div>
        <div className={[1,2,3,4].includes(currentStep) ? styles.stepBodyCrop : styles.stepBody}>{renderStep()}</div>
        
        {/* File Navigation moved below stepBody */}
        {currentStep === 1 && files.length > 1 && (
          <div className={styles.fileCropNav}>
            <div className={styles.fileCropScroll}>
              {files.map((f) => (
                <button
                  key={f.id}
                  className={`${styles.fileCropBtn} ${selectedFileId === f.id ? styles.fileCropBtnActive : ''} ${fileStates[f.id]?.cropped ? styles.fileCropBtnDone : ''}`}
                  onClick={() => setSelectedFileId(f.id)}
                >
                  <div className={styles.fileCropThumb}>
                    <img src={f.preview} alt="" />
                    {fileStates[f.id]?.cropped && <div className={styles.checkBadge}>✓</div>}
                  </div>
                  <span className={styles.fileCropName}>{f.name.substring(0, 8)}...</span>
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div className={styles.navBlock}>
          <div className={styles.nav}>
            <button
              id="prev-step-btn"
              className={styles.navBtn}
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              ← <span>Previous</span>
            </button>

            <div className={styles.stepDots}>
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`${styles.dot} ${i === currentStep ? styles.dotActive : ''} ${i < currentStep ? styles.dotDone : ''}`}
                  onClick={() => goToStep(i)}
                  style={{ cursor: 'pointer' }}
                />
              ))}
            </div>

            <button
              id="next-step-btn"
              className={`${styles.navBtn} ${styles.navBtnNext}`}
              onClick={nextStep}
              disabled={currentStep === STEPS.length - 1}
            >
              <span>{currentStep === 4 ? 'Finalize & Print' : 'Next'}</span> →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
