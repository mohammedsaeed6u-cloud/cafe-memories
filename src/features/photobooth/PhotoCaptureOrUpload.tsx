'use client';

import React, { useRef } from 'react';
import { Camera, Image as ImageIcon, Sparkles } from 'lucide-react';

interface PhotoCaptureOrUploadProps {
  canShoot: boolean;
  onOpenLiveCamera: () => void;
  onUploadPhoto: (base64: string) => void;
  onQuickSampleShot?: () => void;
  className?: string;
}

export const PhotoCaptureOrUpload: React.FC<PhotoCaptureOrUploadProps> = ({
  canShoot,
  onOpenLiveCamera,
  onUploadPhoto,
  onQuickSampleShot,
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
        className="w-full py-4 px-6 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm sm:text-base shadow-md transition flex items-center justify-center gap-2.5 active:scale-[0.98] cursor-pointer"
      >
        <Camera className="w-5 h-5 text-amber-400" />
        <span>توثيق لقطة زيارة اليوم بالكاميرا</span>
      </button>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="py-2.5 px-3 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 font-bold text-xs shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <ImageIcon className="w-4 h-4 text-stone-600" />
          <span>اختيار من الاستوديو</span>
        </button>
        {onQuickSampleShot && (
          <button
            type="button"
            onClick={onQuickSampleShot}
            className="py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-800 font-bold text-xs shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>تجربة لقطة فورية</span>
          </button>
        )}
      </div>
    </div>
  );
};