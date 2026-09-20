'use client';

import React, { useState, useEffect } from 'react';
import { BusinessSettings, PhotoboothFrame, CustomerPersonaKey } from '@/types/photobooth';
import { BusinessSettingsService } from '@/lib/services/business-settings.service';
import { CUSTOMER_PERSONAS } from '@/lib/constants/photobooth-presets';
import { CameraViewfinder } from '@/components/photobooth/CameraViewfinder';
import { PhotoboothStripCard } from '@/components/photobooth/PhotoboothStripCard';
import { FrameSelector } from '@/components/photobooth/FrameSelector';
import { PrintGiftModal } from '@/components/photobooth/PrintGiftModal';
import {
  Sparkles,
  Camera,
  Gift,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

export function CustomerClient({ cafeSlug }: { cafeSlug: string }) {
  // Business settings state
  const [settings, setSettings] = useState<BusinessSettings>(() =>
    BusinessSettingsService.getSettings(cafeSlug)
  );

  const [selectedFrame, setSelectedFrame] = useState<PhotoboothFrame>(() => {
    return (
      settings.frames.find((f) => f.id === settings.activeFrameId) ||
      settings.frames[0]
    );
  });

  // Photobooth state
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isPrintGiftModalOpen, setIsPrintGiftModalOpen] = useState(false);
  const [giftCode, setGiftCode] = useState('');

  // Customer profile form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerRole, setCustomerRole] = useState<CustomerPersonaKey>('coffee_lover');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync settings when updated in storage or another tab
  useEffect(() => {
    const handleSettingsUpdate = (e: any) => {
      if (e.detail) {
        setSettings(e.detail);
        const match = e.detail.frames?.find((f: PhotoboothFrame) => f.id === e.detail.activeFrameId);
        if (match) setSelectedFrame(match);
      }
    };

    window.addEventListener('memories-settings-updated', handleSettingsUpdate);
    return () => window.removeEventListener('memories-settings-updated', handleSettingsUpdate);
  }, []);

  // When capture sequence finishes
  const handleCaptureComplete = (photos: string[]) => {
    setCapturedPhotos(photos);
  };

  // Open Lead intake modal
  const handleProceedToGift = () => {
    setIsLeadModalOpen(true);
  };

  // Submit Lead & Link Memory to Visit
  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone) return;

    setIsSubmitting(true);
    const code = `GIFT-${Math.floor(1000 + Math.random() * 9000)}`;
    setGiftCode(code);

    try {
      await fetch('/api/v1/photobooth/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            name: customerName,
            phone: customerPhone,
            role: customerRole,
          },
          photos: capturedPhotos,
          cafeSlug,
          frameId: selectedFrame.id,
          giftCode: code,
          visitId: `vis_${Date.now()}`,
        }),
      });
    } catch (err) {
      console.warn('Could not sync with Supabase, proceeding locally', err);
    } finally {
      setIsSubmitting(false);
      setIsLeadModalOpen(false);
      setIsPrintGiftModalOpen(true);
    }
  };

  const selectedPersonaInfo = CUSTOMER_PERSONAS.find((p) => p.key === customerRole);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col items-center selection:bg-amber-100">
      {/* Top Porcelain Header */}
      <header className="w-full bg-white/85 backdrop-blur-md border-b border-stone-200/80 sticky top-0 z-40 py-3.5 px-4 shadow-xs">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {settings.branding.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settings.branding.logoUrl}
                alt={settings.branding.name}
                className="h-8 object-contain"
              />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 text-white flex items-center justify-center font-black text-sm shadow-sm">
                M
              </div>
            )}
            <div>
              <h1 className="font-extrabold text-sm sm:text-base text-stone-900 leading-tight">
                {settings.branding.name || 'Memories • موميريز'}
              </h1>
              <p className="text-[10px] text-stone-500 font-medium">
                كبينة تصوير الذكريات والهدايا الفورية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 rounded-full border border-amber-200 text-xs font-bold">
            <Gift className="w-3.5 h-3.5 text-amber-600" />
            <span>هدية فورية مع كل شريط</span>
          </div>
        </div>
      </header>

      {/* Main Flow Container */}
      <main className="w-full max-w-xl mx-auto p-4 sm:p-6 flex-1 flex flex-col items-center">
        {/* Step Indicator */}
        <div className="w-full flex items-center justify-between mb-6 px-2">
          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                capturedPhotos.length === 0
                  ? 'bg-amber-600 text-white'
                  : 'bg-emerald-500 text-white'
              }`}
            >
              {capturedPhotos.length === 0 ? '1' : '✓'}
            </span>
            <span className="text-xs font-bold text-stone-700">التصوير الحي</span>
          </div>

          <div className="h-[2px] w-12 bg-stone-200" />

          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                capturedPhotos.length > 0 && !giftCode
                  ? 'bg-amber-600 text-white'
                  : giftCode
                  ? 'bg-emerald-500 text-white'
                  : 'bg-stone-200 text-stone-600'
              }`}
            >
              2
            </span>
            <span className="text-xs font-bold text-stone-700">تخصيص الشريط</span>
          </div>

          <div className="h-[2px] w-12 bg-stone-200" />

          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                giftCode ? 'bg-amber-600 text-white' : 'bg-stone-200 text-stone-600'
              }`}
            >
              3
            </span>
            <span className="text-xs font-bold text-stone-700">الهدية والطباعة</span>
          </div>
        </div>

        {/* Phase 1: Strict Live Camera (No upload allowed!) */}
        {capturedPhotos.length === 0 ? (
          <div className="w-full animate-in fade-in">
            <div className="text-center mb-4">
              <h2 className="text-xl font-black text-stone-900">
                التقط شريط ذكرياتك الآن 📸
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                الكاميرا ستلتقط {selectedFrame.shotCount} لقطات متتالية مع عد تنازلي وفلاش واقعي
              </p>
            </div>

            <CameraViewfinder
              targetShotCount={selectedFrame.shotCount}
              onCaptureComplete={handleCaptureComplete}
              brandName={settings.branding.name}
            />
          </div>
        ) : (
          /* Phase 2: Frame Selection & Strip Preview */
          <div className="w-full space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                  <span>معاينة شريط ذكرياتك</span>
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  اختر الإطار المفضل والمزين بإيموجي الزوايا
                </p>
              </div>

              <button
                onClick={() => setCapturedPhotos([])}
                className="px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة التصوير</span>
              </button>
            </div>

            {/* Realistic Photobooth Strip Preview */}
            <div className="flex justify-center py-2">
              <PhotoboothStripCard
                photos={capturedPhotos}
                frame={selectedFrame}
                branding={settings.branding}
                giftCode="MEMO-GIFT"
              />
            </div>

            {/* Frame Selector */}
            <FrameSelector
              frames={settings.frames}
              selectedFrameId={selectedFrame.id}
              onSelectFrame={(frame) => setSelectedFrame(frame)}
            />

            {/* CTA: Proceed to Lead Form & Print */}
            <button
              onClick={handleProceedToGift}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-base shadow-xl hover:shadow-2xl transition flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              <Gift className="w-5 h-5" />
              <span>متابعة للحصول على هديتي وطباعة شريطي</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>

      {/* Customer Lead Profile Modal (CRM Intake) */}
      {isLeadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md bg-[#FAF8F5] rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200 text-stone-900">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 mb-2">
                <Gift className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-stone-900">
                تسجيل العضوية واستلام الهدية
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                سجل بياناتك لربط زيارتك بشريط الصور واستلام هديتك الفورية
              </p>
            </div>

            <form onSubmit={handleLeadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  الاسم الكريم
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="مثال: أحمد سامي"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  رقم الموبايل (لاستلام كود الهدية)
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="01012345678"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono text-left"
                />
              </div>

              {/* Persona / Role Selector */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  مجالك أو اهتمامك (Persona):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CUSTOMER_PERSONAS.map((persona) => {
                    const isSelected = customerRole === persona.key;
                    return (
                      <button
                        type="button"
                        key={persona.key}
                        onClick={() => setCustomerRole(persona.key)}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition ${
                          isSelected
                            ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                            : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-200'
                        }`}
                      >
                        <span>{persona.icon}</span>
                        <span className="truncate">{persona.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-2xl bg-stone-900 hover:bg-black text-white font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>جاري التوثيق وتوليد الكود...</span>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>تأكيد واستلام كود الهدية والطباعة</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>خصوصيتك محمية 100% ولا نشارك بياناتك</span>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print & Gift Modal */}
      <PrintGiftModal
        isOpen={isPrintGiftModalOpen}
        onClose={() => setIsPrintGiftModalOpen(false)}
        photos={capturedPhotos}
        frame={selectedFrame}
        branding={settings.branding}
        freeGiftOffer={settings.freeGiftOffer}
        giftCode={giftCode}
        customerName={customerName}
        customerRoleLabel={selectedPersonaInfo?.label}
        onPrintStrip={() => window.print()}
      />
    </div>
  );
}
