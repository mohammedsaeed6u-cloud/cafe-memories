'use client';

import React, { useState } from 'react';
import { DigitalWalletModal } from './DigitalWalletModal';
import { type DigitalWalletPassData } from '@/lib/services/digital-wallet.service';

interface AddToWalletButtonsProps {
  passData: DigitalWalletPassData;
  className?: string;
}

export const AddToWalletButtons: React.FC<AddToWalletButtonsProps> = ({
  passData,
  className = '',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className={`flex flex-wrap items-center justify-center sm:justify-start gap-2.5 ${className}`}>
        {/* Apple Wallet Badge */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition shadow-xs cursor-pointer border border-stone-800"
          title="حفظ في Apple Wallet"
        >
          {/* Apple Logo */}
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 170 170">
            <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.66-7.79-11.9-14.24-6.42-9.87-11.45-21.36-15.08-34.46-3.64-13.1-5.46-24.81-5.46-35.13 0-14.28 3.58-25.99 10.74-35.13 7.16-9.14 16.27-13.82 27.32-14.05 4.88 0 10.23 1.25 16.06 3.75 5.83 2.5 9.77 3.86 11.83 4.08 1.84-.22 5.92-1.63 12.24-4.24 6.33-2.61 11.66-3.79 16.01-3.53 15.03.88 26.38 6.23 34.05 16.06-13.1 7.94-19.54 18.83-19.32 32.65.22 10.77 4.3 19.68 12.24 26.74 4.03 3.6 8.54 6.26 13.53 7.99-2.61 7.73-5.77 15.46-9.47 23.19zM119.22 31.84c0-7.72 2.77-15.01 8.31-21.87 5.54-6.85 12.35-11.08 20.43-12.69.87 8.05-1.52 15.56-7.18 22.52-5.65 6.96-12.83 11.16-21.56 12.04z" />
          </svg>
          <span>إضافة إلى Apple Wallet</span>
        </button>

        {/* Google Wallet Badge */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-stone-50 text-stone-900 text-xs font-bold transition shadow-xs cursor-pointer border border-stone-300"
          title="حفظ في Google Wallet"
        >
          {/* Google G Logo */}
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>حفظ في Google Wallet</span>
        </button>
      </div>

      <DigitalWalletModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        passData={passData}
      />
    </>
  );
};
