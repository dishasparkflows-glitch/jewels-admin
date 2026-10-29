import React, { useState, useEffect } from 'react';
import { getNoImageSvg } from '../../utils/imageFallback';

/**
 * Clean, luxury "No Img" placeholder box matching user design:
 * - Theme-colored border
 * - Subtle theme-tinted background
 * - Centered "No Img" in clean muted grey
 */
export function NoImagePlaceholder({
  className = 'w-full h-full min-h-[36px] min-w-[36px]',
  textClassName = 'text-[11px] font-semibold text-stone-400 select-none tracking-tight',
  rounded = 'rounded-xl',
  style = {},
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      className={`${className} ${rounded} flex items-center justify-center text-center p-1 overflow-hidden shrink-0 transition-colors`}
      style={{
        border: '1px solid var(--theme-primary, #8b6f4e)',
        backgroundColor: 'rgba(var(--theme-primary-rgb, 139, 111, 78), 0.08)',
        ...style,
      }}
      title="No image available"
    >
      <span className={textClassName}>No Img</span>
    </div>
  );
}

/**
 * Universal Admin Image with automatic fallback:
 * - If src is missing/empty/falsy -> renders NoImagePlaceholder directly
 * - If image fails to load (onError) -> renders NoImagePlaceholder seamlessly
 */
export default function AdminImage({
  src,
  alt = '',
  className = 'w-full h-full object-cover',
  containerClassName = 'w-full h-full flex items-center justify-center overflow-hidden',
  rounded = 'rounded-xl',
  textClassName,
  style = {},
  onClick,
  ...props
}) {
  const [failed, setFailed] = useState(!src);

  useEffect(() => {
    setFailed(!src);
  }, [src]);

  if (failed || !src) {
    return (
      <NoImagePlaceholder
        className={containerClassName || className}
        textClassName={textClassName}
        rounded={rounded}
        style={style}
        onClick={onClick}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`${className} ${rounded}`}
      style={style}
      onClick={onClick}
      onError={() => setFailed(true)}
      {...props}
    />
  );
}
