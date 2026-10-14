'use client';

import React from 'react';
import { X } from 'lucide-react';
import { CameraViewfinder } from '@/components/photobooth/CameraViewfinder';

interface CustomerCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandName: string;
  visitNumber: number;
  onCaptureComplete: (photoBase64: string) => void;
}

/** Full-screen live camera capture modal for the customer studio. */
export const CustomerCameraModal: React.FC<CustomerCameraModalProps> = ({
  isOpen,
  onClose,
  brandName,
  visitNumber,
  onCaptureComplete,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-[#141212] rounded-3xl p-4 overflow-hidden border border-[rgba(255,255,255,0.1)] shadow-2xl relative text-[#FBF9F5]">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 z-30 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-stone-700 flex items-center justify-center transition cursor-pointer border border-[rgba(255,255,255,0.1)]"
        >
          <X className="w-4 h-4" />
        </button>
        <CameraViewfinder
          brandName={brandName}
          visitNumber={visitNumber}
          onCaptureComplete={(photo: string) => onCaptureComplete(photo)}
        />
      </div>
    </div>
  );
};
