'use client';

import React, { useState } from 'react';
import { MessageCircle, X, Send, Mail, Calendar, PhoneCall } from 'lucide-react';
import { OutboundLink } from './OutboundLink';

export function FloatingContactButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-40 print:hidden font-cairo">
      {/* Expanded Concierge Drawer */}
      {isOpen && (
        <div
          className="mb-3 w-80 rounded-3xl bg-white dark:bg-[#20304E] border border-[#EADDC4] dark:border-[#3D2314]/30] shadow-2xl p-5 text-right animate-in slide-in-from-bottom-5 duration-200"
          role="dialog"
          aria-label="خيارات التواصل السريع"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#EADDC4] dark:border-[#3D2314]/30]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-[#3D2314] dark:text-[#FAF5EB]">
                كونسيرج stampy. متاح
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="إغلاق نافذة التواصل"
              className="p-1 rounded-full text-[#3D2314]/60 dark:text-[#FAF5EB]/60 hover:text-[#3D2314] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-[#3D2314]/75 dark:text-[#FAF5EB]/75 my-3 leading-relaxed">
            نسعد بمساعدتك في اختيار الباقة المناسبة، ربط شاشات صالتك، أو تخصيص هوية كروت الولاء.
          </p>

          <div className="space-y-2">
            {/* WhatsApp */}
            <OutboundLink
              href="https://wa.me/201000000000?text=مرحبا،%20أود%20الاستفسار%20عن%20منظومة%20stampy."
              utmParams={{ source: 'stampy_saas', medium: 'whatsapp_concierge', campaign: 'lead' }}
              className="w-full py-2.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-between shadow-xs transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                <span>محادثة واتساب فورية</span>
              </span>
              <span className="text-[10px] opacity-80">WhatsApp</span>
            </OutboundLink>

            {/* Email */}
            <a
              href="mailto:concierge@stampy.app?subject=استفسار%20بشأن%20منظومة%20stampy."
              className="w-full py-2.5 px-3.5 rounded-xl bg-[#FAF5EB] dark:bg-[#3D2314] border border-[#EADDC4] dark:border-[#3D2314]/30] text-[#3D2314] dark:text-[#FAF5EB] hover:bg-[#EADDC4]/50 text-xs font-bold flex items-center justify-between transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#B83A26]" />
                <span>إرسال بريد إلكتروني</span>
              </span>
              <span className="text-[10px] font-mono opacity-70">Email</span>
            </a>

            {/* Consultation */}
            <a
              href="#contact"
              onClick={() => setIsOpen(false)}
              className="w-full py-2.5 px-3.5 rounded-xl bg-[#3D2314] hover:bg-[#20304E] text-[#FAF5EB] text-xs font-bold flex items-center justify-between transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#B83A26]" />
                <span>حجز استشارة لمنشأتك</span>
              </span>
              <span className="text-[10px] opacity-80">VIP</span>
            </a>
          </div>
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'إغلاق الكونسيرج' : 'تواصل مع فريق stampy.'}
        title="تواصل معنا"
        className="w-13 h-13 rounded-full bg-[#3D2314] hover:bg-[#20304E] text-[#FAF5EB] border-2 border-[#FAF5EB] dark:border-[#3D2314]/30] shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer relative group"
      >
        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#B83A26] border-2 border-white flex items-center justify-center text-[8px] text-white font-bold">
          
        </div>
        {isOpen ? (
          <X className="w-6 h-6 text-[#FAF5EB]" />
        ) : (
          <MessageCircle className="w-6 h-6 text-[#FAF5EB] group-hover:rotate-12 transition-transform" />
        )}
      </button>
    </div>
  );
}
