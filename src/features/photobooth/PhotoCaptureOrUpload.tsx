'use client';

import React, { useRef } from 'react';
import { Camera, Image as ImageIcon, Sparkles } from 'lucide-react';

interface PhotoCaptureOrUploadProps {
  canShoot: boolean;
  onOpenLiveCamera: () => void;
  onUploadPhoto: (base64: string) => void;
  className?: string;
}

export const PhotoCaptureOrUpload: React.FC<PhotoCaptureOrUploadProps> = ({
  canShoot,
  onOpenLiveCamera,
  onUploadPhoto,
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        onUploadPhoto(result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className={`w-full max-w-md mx-auto space-y-2.5 ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={onOpenLiveCamera}
        className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:from-amber-500 hover:to-amber-700 text-white font-black text-sm sm:text-base shadow-lg shadow-amber-900/15 transition-all flex items-center justify-center gap-2.5 active:scale-[0.98] cursor-pointer"
      >
        <Camera className="w-5 h-5 text-amber-200" />
        <span>توثيق لقطة زيارة اليوم بالكاميرا</span>
      </button>

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="w-full py-3 px-4 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 font-bold text-xs shadow-2xs transition flex items-center justify-center gap-2 cursor-pointer"
      >
        <ImageIcon className="w-4 h-4 text-stone-600" />
        <span>اختيار صورة من استوديو الهاتف</span>
      </button>
    </div>
  );
};