'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

/** Render a real, branch-specific QR from a DB-created slug (not a browser identifier). */
export function BranchQr({ slug }: { slug: string }) {
  const [image, setImage] = useState('');
  useEffect(() => {
    const url = `${window.location.origin}/go/${encodeURIComponent(slug)}`;
    QRCode.toDataURL(url, { width: 256, margin: 2, errorCorrectionLevel: 'M', color: {
      dark: '#141313', light: '#FBF9F5',
    } }).then(setImage).catch(() => setImage(''));
  }, [slug]);
  if (!image) return null;
  // This local data URL contains only the public QR link, not guest data or secrets.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={image} alt={`رمز QR للفرع: /go/${slug}`} className="w-40 h-40 rounded-lg bg-white" />;
}
