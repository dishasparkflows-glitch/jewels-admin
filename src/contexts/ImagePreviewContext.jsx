import React, { createContext, useContext, useState, useCallback } from 'react';
import ImagePreviewModal from '../components/common/ImagePreviewModal';

const ImagePreviewContext = createContext({
  openImagePreview: () => {},
  closeImagePreview: () => {},
});

/**
 * Universal Image Preview Provider for Admin Portal
 *
 * Usage:
 *   const { openImagePreview } = useImagePreview();
 *
 *   // 1. Single image
 *   openImagePreview('/path/to/img.jpg', { title: 'Category Banner' });
 *
 *   // 2. Image Gallery (with Previous / Next arrows)
 *   openImagePreview(currentUrl, {
 *     gallery: ['/img1.jpg', '/img2.jpg'],
 *     title: 'Product Variant Images'
 *   });
 */
export function ImagePreviewProvider({ children }) {
  const [previewState, setPreviewState] = useState({
    isOpen: false,
    imageUrl: '',
    gallery: [],
    title: '',
    initialIndex: 0,
  });

  const openImagePreview = useCallback((imageOrOptions, options = {}) => {
    if (!imageOrOptions) return;

    let imageUrl = '';
    let gallery = [];
    let title = options.title || '';
    let initialIndex = options.initialIndex ?? 0;

    if (typeof imageOrOptions === 'string') {
      imageUrl = imageOrOptions;
      gallery = options.gallery || [imageOrOptions];
      if (options.gallery && Array.isArray(options.gallery)) {
        const idx = options.gallery.indexOf(imageOrOptions);
        if (idx >= 0) initialIndex = idx;
      }
    } else if (Array.isArray(imageOrOptions)) {
      gallery = imageOrOptions;
      imageUrl = imageOrOptions[initialIndex] || imageOrOptions[0] || '';
    } else if (typeof imageOrOptions === 'object') {
      imageUrl = imageOrOptions.url || imageOrOptions.imageUrl || '';
      gallery = imageOrOptions.gallery || (imageUrl ? [imageUrl] : []);
      title = imageOrOptions.title || options.title || '';
      initialIndex = imageOrOptions.initialIndex ?? initialIndex;
      if (gallery.length > 0 && initialIndex === 0 && imageUrl) {
        const idx = gallery.indexOf(imageUrl);
        if (idx >= 0) initialIndex = idx;
      }
    }

    setPreviewState({
      isOpen: true,
      imageUrl,
      gallery,
      title,
      initialIndex,
    });
  }, []);

  const closeImagePreview = useCallback(() => {
    setPreviewState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return (
    <ImagePreviewContext.Provider value={{ openImagePreview, closeImagePreview }}>
      {children}
      <ImagePreviewModal
        isOpen={previewState.isOpen}
        imageUrl={previewState.imageUrl}
        gallery={previewState.gallery}
        title={previewState.title}
        initialIndex={previewState.initialIndex}
        onClose={closeImagePreview}
      />
    </ImagePreviewContext.Provider>
  );
}

export function useImagePreview() {
  const context = useContext(ImagePreviewContext);
  if (!context) {
    throw new Error('useImagePreview must be used within an ImagePreviewProvider');
  }
  return context;
}

