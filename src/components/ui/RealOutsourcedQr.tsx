'use client';

import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

interface RealOutsourcedQrProps {
  value: string;
  size?: number;
  className?: string;
  alt?: string;
  onDataUrlReady?: (dataUrl: string) => void;
}

/**
 * QR renderer.
 *
 * The QR is generated locally with the `qrcode` package. Nothing about the
 * venue or customer URL leaves the browser, the code still renders when a
 * third-party service is down, and the same data URL can be downloaded for
 * print.
 */
export const RealOutsourcedQr: React.FC<RealOutsourcedQrProps> = ({
  value,
  size = 200,
  className = '',
  alt = 'Scan QR Code',
  onDataUrlReady,
}) => {
  const [generated, setGenerated] = useState<{ value: string; src: string } | null>(null);
  const [failedValue, setFailedValue] = useState<string | null>(null);
  const onReadyRef = useRef(onDataUrlReady);

  useEffect(() => {
    onReadyRef.current = onDataUrlReady;
  }, [onDataUrlReady]);

  // Derive the visible state from the current value instead of clearing it with
  // a synchronous setState at the start of the generation effect.
  const src = generated?.value === value ? generated.src : null;
  const failed = failedValue === value;

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      errorCorrectionLevel: 'H',
      color: { dark: '#18181B', light: '#FFFFFF' },
    })
      .then((dataUrl) => {
        if (cancelled) return;
        setGenerated({ value, src: dataUrl });
        setFailedValue(null);
        onReadyRef.current?.(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setFailedValue(value);
      });
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center rounded-md border border-dashed border-stone-400 text-center text-[10px] text-stone-500 ${className}`}
        style={{ width: size, height: size }}
      >
        تعذر إنشاء رمز QR
      </div>
    );
  }

  if (!src) {
    return (
      <div
        className={`animate-pulse rounded-md bg-stone-200 ${className}`}
        style={{ width: size, height: size }}
        aria-label="جاري إنشاء رمز QR"
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`block object-contain ${className}`}
    />
  );
};
