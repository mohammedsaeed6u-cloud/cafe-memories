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

export const RealOutsourcedQr: React.FC<RealOutsourcedQrProps> = ({
  value,
  size = 200,
  className = '',
  alt = 'Scan QR Code',
  onDataUrlReady,
}) => {
  // 1. Primary: Established high-speed outsourced QR API
  const outsourcedApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
    value
  )}&margin=1&format=svg`;

  const [currentSrc, setCurrentSrc] = useState<string>(outsourcedApiUrl);
  const [hasError, setHasError] = useState(false);

  // 2. Client-side local fallback generation with npm 'qrcode' (Zero-fail offline resilience)
  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#18181B',
        light: '#FFFFFF',
      },
    })
      .then((dataUrl) => {
        if (isMounted) {
          onDataUrlReady?.(dataUrl);
          // If the external network failed, switch to the locally generated dataUrl
          if (hasError) {
            setCurrentSrc(dataUrl);
          }
        }
      })
      .catch((err) => {
        console.warn('Local QR fallback generation note:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [value, size, hasError, onDataUrlReady]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={currentSrc}
      alt={alt}
      width={size}
      height={size}
      onError={() => {
        setHasError(true);
        // Fallback to local DataURL
        QRCode.toDataURL(value, { width: size, margin: 1, errorCorrectionLevel: 'H' })
          .then((localUrl) => setCurrentSrc(localUrl))
          .catch(() => {});
      }}
      className={`block object-contain transition-opacity duration-200 ${className}`}
      style={{ imageRendering: 'pixelated' }}
    />
  );
};
