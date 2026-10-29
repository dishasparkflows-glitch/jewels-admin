import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  HiOutlineX,
  HiOutlinePlus,
  HiOutlineMinus,
  HiOutlineRefresh,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineExternalLink,
  HiOutlineDownload,
} from 'react-icons/hi';

/**
 * Universal Luxury Image Preview Modal
 * Full-featured lightbox with zoom (- / +), drag-to-pan, mouse wheel zoom,
 * double-click toggle, gallery navigation, and keyboard shortcuts.
 */
export default function ImagePreviewModal({
  isOpen,
  imageUrl,
  gallery = [],
  title = '',
  initialIndex = 0,
  onClose,
}) {
  // Normalize gallery list
  const normalizedGallery = React.useMemo(() => {
    if (Array.isArray(gallery) && gallery.length > 0) {
      return gallery.map((item) =>
        typeof item === 'string' ? { url: item, title } : item
      );
    }
    if (imageUrl) {
      return [{ url: imageUrl, title }];
    }
    return [];
  }, [gallery, imageUrl, title]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoomScale, setZoomScale] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Sync current index when modal opens
  useEffect(() => {
    if (isOpen) {
      const idx =
        initialIndex >= 0 && initialIndex < normalizedGallery.length
          ? initialIndex
          : 0;
      setCurrentIndex(idx);
      setZoomScale(1);
      setPanPosition({ x: 0, y: 0 });
      setIsDragging(false);
    }
  }, [isOpen, initialIndex, normalizedGallery.length]);

  const currentItem = normalizedGallery[currentIndex] || null;
  const currentUrl = currentItem?.url || imageUrl;
  const currentTitle = currentItem?.title || title || 'Image Preview';

  // Zoom handlers
  const handleZoomIn = (e) => {
    e?.stopPropagation?.();
    setZoomScale((prev) => Math.min(Number((prev + 0.25).toFixed(2)), 4));
  };

  const handleZoomOut = (e) => {
    e?.stopPropagation?.();
    setZoomScale((prev) => {
      const next = Math.max(Number((prev - 0.25).toFixed(2)), 0.5);
      if (next <= 1) setPanPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = (e) => {
    e?.stopPropagation?.();
    setZoomScale(1);
    setPanPosition({ x: 0, y: 0 });
  };

  // Gallery navigation
  const handlePrev = (e) => {
    e?.stopPropagation?.();
    if (normalizedGallery.length <= 1) return;
    const nextIdx =
      (currentIndex - 1 + normalizedGallery.length) % normalizedGallery.length;
    setCurrentIndex(nextIdx);
    setZoomScale(1);
    setPanPosition({ x: 0, y: 0 });
  };

  const handleNext = (e) => {
    e?.stopPropagation?.();
    if (normalizedGallery.length <= 1) return;
    const nextIdx = (currentIndex + 1) % normalizedGallery.length;
    setCurrentIndex(nextIdx);
    setZoomScale(1);
    setPanPosition({ x: 0, y: 0 });
  };

  // Drag & Pan handlers
  const handleMouseDown = (e) => {
    if (zoomScale <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - panPosition.x,
      y: e.clientY - panPosition.y,
    };
  };

  const handleMouseMove = (e) => {
    if (!isDragging || zoomScale <= 1) return;
    setPanPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Mouse wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoomScale((prev) => Math.min(Number((prev + 0.2).toFixed(2)), 4));
    } else {
      setZoomScale((prev) => {
        const next = Math.max(Number((prev - 0.2).toFixed(2)), 0.5);
        if (next <= 1) setPanPosition({ x: 0, y: 0 });
        return next;
      });
    }
  };

  // Double click toggle zoom
  const handleDoubleClick = (e) => {
    e.stopPropagation();
    if (zoomScale > 1) {
      handleResetZoom();
    } else {
      setZoomScale(2);
    }
  };

  // Keyboard navigation & controls
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      } else if (e.key === '0') {
        handleResetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, normalizedGallery.length]);

  if (!isOpen || !currentUrl) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center p-3 sm:p-6 bg-stone-950/85 backdrop-blur-md animate-fadeIn select-none"
      onClick={onClose}
    >
      {/* ─── Top Bar: Meta Info & Controls ─── */}
      <div
        className="w-full max-w-5xl flex items-center justify-between pb-3 text-white z-20 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-white/10 border border-white/15 backdrop-blur-md text-stone-200 shrink-0">
            {normalizedGallery.length > 1
              ? `Image ${currentIndex + 1} of ${normalizedGallery.length}`
              : 'Image Preview'}
          </span>
          {currentTitle && (
            <span className="text-xs font-semibold text-stone-300 truncate max-w-xs sm:max-w-md">
              {currentTitle}
            </span>
          )}
          <span className="text-xs text-stone-400 hidden md:inline">
            &bull; Scroll or use <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-stone-200 text-[11px]">-</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-stone-200 text-[11px]">+</kbd> to zoom &bull; Drag to pan
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Open full resolution in new tab */}
          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md shadow-lg border border-white/15"
            title="Open original image in new tab"
          >
            <HiOutlineExternalLink className="w-4 h-4" />
          </a>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md shadow-lg border border-white/15"
            title="Close (Esc)"
          >
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ─── Main Image Viewport ─── */}
      <div
        className="relative w-full max-w-5xl h-[72vh] sm:h-[78vh] flex items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/50 backdrop-blur-xs shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Navigation Arrow: Previous */}
        {normalizedGallery.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-stone-900/80 hover:bg-stone-900 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md shadow-xl border border-white/20 active:scale-95"
            title="Previous image (Left Arrow)"
          >
            <HiOutlineChevronLeft className="w-6 h-6 stroke-[2.2]" />
          </button>
        )}

        {/* Navigation Arrow: Next */}
        {normalizedGallery.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-stone-900/80 hover:bg-stone-900 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md shadow-xl border border-white/20 active:scale-95"
            title="Next image (Right Arrow)"
          >
            <HiOutlineChevronRight className="w-6 h-6 stroke-[2.2]" />
          </button>
        )}

        {/* Scaled & Panned Image */}
        <div
          style={{
            transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomScale})`,
            transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.2, 0, 0, 1)',
            cursor: zoomScale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
          }}
          onDoubleClick={handleDoubleClick}
          className="flex items-center justify-center max-w-full max-h-full"
        >
          <img
            src={currentUrl}
            alt={currentTitle}
            draggable={false}
            className="max-w-[85vw] max-h-[68vh] object-contain rounded-xl shadow-2xl pointer-events-none"
          />
        </div>

        {/* ─── Floating Zoom Control Bar ─── */}
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-stone-900/90 border border-white/15 text-white shadow-2xl backdrop-blur-md"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Zoom Out Button (-) */}
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoomScale <= 0.5}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            title="Zoom Out (-)"
          >
            <HiOutlineMinus className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* Reset / Percentage Display */}
          <button
            type="button"
            onClick={handleResetZoom}
            className="px-2.5 h-8 rounded-xl hover:bg-white/15 text-xs font-mono font-semibold text-stone-200 flex items-center justify-center cursor-pointer transition-colors"
            title="Click to reset (100%)"
          >
            {Math.round(zoomScale * 100)}%
          </button>

          {/* Zoom In Button (+) */}
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoomScale >= 4}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            title="Zoom In (+)"
          >
            <HiOutlinePlus className="w-4 h-4 stroke-[2.5]" />
          </button>

          <div className="w-[1px] h-4 bg-white/20 mx-1" />

          {/* Reset to 1:1 Icon */}
          <button
            type="button"
            onClick={handleResetZoom}
            className="p-1.5 rounded-xl hover:bg-white/15 text-stone-300 hover:text-white transition-colors cursor-pointer"
            title="Reset zoom to 100% (0)"
          >
            <HiOutlineRefresh className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

