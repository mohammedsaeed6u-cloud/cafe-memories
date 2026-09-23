'use client';

import React, { useState } from 'react';
import {
  Gift,
  Search,
  CheckCircle2,
  X,
  ShieldCheck,
  Coffee,
  Sparkles,
  AlertTriangle,
  Check,
} from 'lucide-react';
import { CustomerRegistryService, RegisteredCustomer } from '@/lib/services/customer-registry.service';
import { BusinessSettings } from '@/types/photobooth';
import { StaffMember } from '@/types/staff';

interface BaristaRedeemModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: BusinessSettings;
  activeStaff?: StaffMember | null;
  onRedeemSuccess?: () => void;
}

export function BaristaRedeemModal({
  isOpen,
  onClose,
  settings,
  activeStaff,
  onRedeemSuccess,
}: BaristaRedeemModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<RegisteredCustomer | null>(null);
  const [totalVisits, setTotalVisits] = useState(0);
  const [redeemedCount, setRedeemedCount] = useState(0);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const cafeSlug = settings.cafeSlug || 'espresso-lab';
  const requiredVisits = (settings as any).loyaltyMaxVisits || 5;
  const giftTitle = settings.freeGiftOffer?.title || 'كوب سبيشالتي مجاني من اختيارك';

  const getRedemptionsKey = (phone: string) => `memories_redemptions_${cafeSlug}_${phone}`;

  const lookupCustomerData = (query: string) => {
    setErrorNotice(null);
    setSuccessNotice(null);
    const clean = query.trim().replace(/[^0-9]/g, '');

    if (!clean || clean.length < 6) {
      setSelectedCustomer(null);
      return;
    }

    const customers = CustomerRegistryService.getRegisteredCustomers(cafeSlug);
    const found = customers.find(c => c.phone.includes(clean) || clean.includes(c.phone));

    if (found) {
      setSelectedCustomer(found);
      setTotalVisits(found.totalVisits || 1);
      try {
        const stored = localStorage.getItem(getRedemptionsKey(found.phone));
        setRedeemedCount(stored ? Number(stored) : 0);
      } catch {
        setRedeemedCount(0);
      }
    } else {
      const direct = CustomerRegistryService.lookupCustomer(clean, cafeSlug);
      if (direct.exists && direct.name) {
        const cust: RegisteredCustomer = {
          phone: clean,
          name: direct.name,
          role: direct.role || 'coffee_lover',
          registeredAt: new Date().toISOString(),
          lastVisit: new Date().toISOString(),
          totalVisits: direct.totalVisits || 1,
        };
        setSelectedCustomer(cust);
        setTotalVisits(direct.totalVisits || 1);
        try {
          const stored = localStorage.getItem(getRedemptionsKey(clean));
          setRedeemedCount(stored ? Number(stored) : 0);
        } catch {
          setRedeemedCount(0);
        }
      } else {
        setSelectedCustomer(null);
        setErrorNotice('لم يتم العثور على عميل مسجل بهذا الرقم.');
      }
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    lookupCustomerData(searchQuery);
  };

  const totalEligible = Math.floor(totalVisits / requiredVisits);
  const availableToClaim = Math.max(0, totalEligible - redeemedCount);
  const isEligible = availableToClaim > 0;

  const handleConfirmRedemption = () => {
    if (!selectedCustomer || !isEligible) return;

    setIsRedeeming(true);
    try {
      const nextRedeemed = redeemedCount + 1;
      localStorage.setItem(getRedemptionsKey(selectedCustomer.phone), String(nextRedeemed));
      setRedeemedCount(nextRedeemed);

      const logKey = `memories_redemption_log_${cafeSlug}`;
      const prevLog = localStorage.getItem(logKey);
      const logs = prevLog ? JSON.parse(prevLog) : [];
      logs.unshift({
        phone: selectedCustomer.phone,
        name: selectedCustomer.name,
        giftTitle,
        baristaName: activeStaff?.name || 'الباريستا المناوب',
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem(logKey, JSON.stringify(logs.slice(0, 50)));

      setSuccessNotice(`تم صرف (${giftTitle}) للعميل (${selectedCustomer.name}) بنجاح!`);
      if (onRedeemSuccess) onRedeemSuccess();
    } catch (err: any) {
      setErrorNotice('حدث خطأ أثناء تسجيل الصرف.');
    } finally {
      setIsRedeeming(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 font-cairo">
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-stone-200 shadow-2xl overflow-hidden flex flex-col text-right">
        <div className="p-5 px-6 bg-gradient-to-r from-stone-900 to-stone-850 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base">صرف هدية الولاء من الكاونتر (Barista Claim)</h3>
              <p className="text-[11px] text-stone-300">التحقق الفوري من استحقاق الزائر وصرف الهدية مع حماية ضد التكرار</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-stone-400 hover:text-white transition cursor-pointer">✕</button>
        </div>
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between text-xs bg-amber-50/80 border border-amber-200/80 p-3 rounded-2xl">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-stone-800">الباريستا المعتمد: <strong className="text-amber-900">{activeStaff?.name || 'الباريستا المناوب'}</strong></span>
            </div>
            <span className="text-[11px] font-mono text-stone-500">{cafeSlug}</span>
          </div>
          <form onSubmit={handleSearchSubmit} className="space-y-2">
            <label className="block text-xs font-bold text-stone-700">أدخل رقم هاتف العميل أو رمز الهدية (Phone / Code):</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input type="text" placeholder="05XXXXXXXX" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); if (e.target.value.length >= 8) lookupCustomerData(e.target.value); }} className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-stone-300 text-xs font-bold font-mono focus:border-amber-500 focus:outline-none bg-stone-50" dir="ltr" />
              </div>
              <button type="submit" className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-2xs transition cursor-pointer">فحص الاستحقاق</button>
            </div>
          </form>
          {errorNotice && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorNotice}</span>
            </div>
          )}
          {successNotice && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-bold flex items-center gap-3 animate-in zoom-in-95 duration-200">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div><span className="block font-black text-sm">{successNotice}</span><span className="text-[11px] text-emerald-700 block font-normal">تم تسجيل صرف الهدية رسمياً في سجلات الكافيه وتحديث بطاقة العميل.</span></div>
            </div>
          )}
          {selectedCustomer && (
            <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-900 font-bold flex items-center justify-center text-sm shadow-2xs">{selectedCustomer.name.slice(0, 2)}</div>
                  <div><h4 className="font-black text-sm text-stone-900">{selectedCustomer.name}</h4><p className="text-[10px] font-mono text-stone-500">{selectedCustomer.phone}</p></div>
                </div>
                <span className={'px-3 py-1 rounded-full text-xs font-bold ' + (isEligible ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-stone-200 text-stone-700')}>{isEligible ? 'مؤهل للصرف فوراً 🎁' : 'غير مؤهل حالياً'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-white border border-stone-200/80"><span className="text-[10px] text-stone-500 block font-bold">الزيارات الموثقة</span><strong className="text-base font-black font-mono text-stone-900">{totalVisits}</strong></div>
                <div className="p-2.5 rounded-xl bg-white border border-stone-200/80"><span className="text-[10px] text-stone-500 block font-bold">المطلوب للهدية</span><strong className="text-base font-black font-mono text-amber-700">{requiredVisits}</strong></div>
                <div className="p-2.5 rounded-xl bg-white border border-stone-200/80"><span className="text-[10px] text-stone-500 block font-bold">هدايا جاهزة للصرف</span><strong className="text-base font-black font-mono text-purple-700">{availableToClaim}</strong></div>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-amber-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-amber-600" />
                  <span className="font-bold text-stone-900">الهدية المستحقة:</span>
                </div>
                <strong className="text-amber-800 font-black">{giftTitle}</strong>
              </div>
              {isEligible ? (
                <button type="button" onClick={handleConfirmRedemption} disabled={isRedeeming} className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition shadow-xs flex items-center justify-center gap-2 cursor-pointer">
                  <Check className="w-4 h-4" />
                  <span>{isRedeeming ? 'جاري تسجيل الصرف...' : 'تأكيد صرف الهدية للعميل الآن'}</span>
                </button>
              ) : (
                <p className="text-[11px] text-stone-500 text-center font-bold">يحتاج العميل إلى ({requiredVisits - (totalVisits % requiredVisits)}) زيارة إضافية لفتح الهدية التالية.</p>
              )}
            </div>
          )}
        </div>
        <div className="p-4 px-6 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
          <span>Memories Counter Security • Anti-Fraud Protection</span>
          <button onClick={onClose} className="text-stone-600 hover:text-stone-900 font-bold">إغلاق</button>
        </div>
      </div>
    </div>
  );
}
