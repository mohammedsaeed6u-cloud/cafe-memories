'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

interface RealOutsourcedQrProps {
  value: string;
  size?: number;
  className?: string;
  alt?: string;
  onDataUrlReady?: (dataUrl: string) => void;
}

// Global in-memory cache so once a QR is generated, it renders in 0ms instantly
const qrMemoryCache = new Map<string, string>();

export const RealOutsourcedQr: React.FC<RealOutsourcedQrProps> = ({
  value,
  size = 200,
  className = '',
  alt = 'Scan QR Code',
  onDataUrlReady,
}) => {
  const cacheKey = `${value}___${size}`;
  const [dataUrl, setDataUrl] = useState<string>(() => qrMemoryCache.get(cacheKey) || '');

  useEffect(() => {
    let isMounted = true;
    if (qrMemoryCache.has(cacheKey)) {
      const cached = qrMemoryCache.get(cacheKey)!;
      setDataUrl(cached);
      onDataUrlReady?.(cached);
      return;
    }

    // Zero-network instant local generation
    QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#141212',
        light: '#FFFFFF',
      },
    })
      .then((url) => {
        qrMemoryCache.set(cacheKey, url);
        if (isMounted) {
          setDataUrl(url);
          onDataUrlReady?.(url);
        }
      })
      .catch((err) => {
        console.warn('QR generation note:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [value, size, cacheKey, onDataUrlReady]);

  if (!dataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`flex items-center justify-center bg-white/5 rounded-lg animate-pulse ${className}`}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dataUrl}
      alt={alt}
      width={size}
      height={size}
      className={`block object-contain ${className}`}
      style={{ imageRendering: 'pixelated' }}
    />
  );
};
