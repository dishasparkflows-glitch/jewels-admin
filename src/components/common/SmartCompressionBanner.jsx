import { useEffect, useState } from 'react';
import {
  DEFAULT_UPLOAD_COMPRESSION_SETTINGS,
  getUploadCompressionSettings,
} from '../../utils/uploadWithPresignedUrl';

function formatQualityPercent(rawQuality, fallbackQuality) {
  const num = Number(rawQuality);
  if (!Number.isFinite(num) || num <= 0) return fallbackQuality;
  return num <= 1 ? Math.round(num * 100) : Math.round(num);
}

function getFormatLabel(format = 'image/webp') {
  if (format === 'image/jpeg' || format === 'image/jpg') return 'JPEG';
  if (format === 'image/png') return 'PNG';
  return 'WebP';
}

export default function SmartCompressionBanner({
  enabled,
  format,
  quality,
  className = '',
}) {
  const [policy, setPolicy] = useState(DEFAULT_UPLOAD_COMPRESSION_SETTINGS);

  useEffect(() => {
    if (enabled !== undefined && quality !== undefined) return undefined;
    let active = true;
    getUploadCompressionSettings().then((settings) => {
      if (active && settings) {
        setPolicy(settings);
      }
    });
    return () => {
      active = false;
    };
  }, [enabled, quality]);

  const isEnabled = enabled !== undefined ? enabled !== false : policy.enabled !== false;
  const resolvedFormat = format || policy.format || 'image/webp';
  const resolvedQuality = formatQualityPercent(
    quality !== undefined ? quality : policy.quality,
    DEFAULT_UPLOAD_COMPRESSION_SETTINGS.quality
  );
  const formatLabel = getFormatLabel(resolvedFormat);

  return (
    <div
      className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-[11px] shadow-2xs ${
        isEnabled
          ? 'border-emerald-200/90 bg-emerald-50/70 text-emerald-900'
          : 'border-stone-200 bg-stone-50/80 text-stone-700'
      } ${className}`}
    >
      <div
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg font-bold text-[11px] shadow-2xs ${
          isEnabled ? 'bg-emerald-600 text-white' : 'bg-stone-400 text-white'
        }`}
      >
        ⚡
      </div>
      <div className="flex-1 flex items-center gap-2 flex-wrap">
        <span className={`font-bold ${isEnabled ? 'text-emerald-950' : 'text-stone-800'}`}>
          {isEnabled ? 'Smart Image Compression Active' : 'Image Compression Inactive'}
        </span>
        {isEnabled ? (
          <span className="inline-flex items-center rounded-md bg-emerald-200/60 px-1.5 py-0.5 text-[9.5px] font-semibold text-emerald-800">
            Auto {formatLabel} · ~{resolvedQuality}% Quality
          </span>
        ) : (
          <span className="inline-flex items-center rounded-md bg-stone-200/70 px-1.5 py-0.5 text-[9.5px] font-semibold text-stone-600">
            Uploading Original Size
          </span>
        )}
      </div>
    </div>
  );
}
