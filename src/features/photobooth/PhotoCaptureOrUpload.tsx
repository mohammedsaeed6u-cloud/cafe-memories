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
        className="w-full py-3.5 px-6 rounded-lg bg-[#DD0200] hover:bg-[#B50200] text-[#FBF9F5] font-bold text-sm sm:text-base shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_10px_25px_-5px_rgba(221,2,0,0.4)] transition-all flex items-center justify-center gap-2.5 active:scale-[0.98] cursor-pointer"
      >
        <Camera className="w-5 h-5 text-[#FBF9F5]" />
        <span>التقاط صورة بكاميرا الهاتف</span>
      </button>

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="w-full py-2.5 px-4 rounded-lg bg-[#141212] hover:bg-[#1C1B1B] border border-white/10 hover:border-white/20 text-[#e6e1e1] font-medium text-xs shadow-xl transition flex items-center justify-center gap-2 cursor-pointer"
      >
        <ImageIcon className="w-4 h-4 text-[#A19E9B]" />
        <span>اختيار صورة من استوديو الهاتف</span>
      </button>
    </div>
  );
};