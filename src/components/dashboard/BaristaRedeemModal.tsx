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
import { VoucherService, IssuedVoucher } from '@/lib/services/voucher.service';
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

  const cafeSlug = settings.cafeSlug || 'memories';
  const requiredVisits = settings.loyaltyMaxVisits || 5;
  const giftTitle = settings.freeGiftOffer?.title || 'هدية خاصة مجانية من اختيارك';

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
          role: direct.role || 'vip_guest',
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
        baristaName: activeStaff?.name || 'طاقم العمل المعتمد',
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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#141212] rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col text-right text-[#e6e1e1]">
        <div className="p-5 px-6 bg-[#1C1B1B] border-b border-white/10 text-[#FBF9F5] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#55100D] text-[#DD0200] flex items-center justify-center border border-[#DD0200]/40">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base font-serif text-[#FBF9F5]">صرف هدية الولاء من الكاونتر (Staff Claim)</h3>
              <p className="text-[11px] text-[#A19E9B]">التحقق الفوري من استحقاق الزائر وصرف الهدية مع حماية ضد التكرار</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-[#141212] hover:bg-[#211F1F] border border-white/10 flex items-center justify-center text-[#A19E9B] hover:text-[#FBF9F5] transition cursor-pointer">✕</button>
        </div>
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between text-xs bg-[#1C1B1B] border border-white/10 p-3 rounded-xl">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-[#FBF9F5]">طاقم العمل المعتمد: <strong className="text-[#DD0200]">{activeStaff?.name || 'طاقم العمل المناوب'}</strong></span>
            </div>
            <span className="text-[11px] font-mono text-[#A19E9B]">{cafeSlug}</span>
          </div>
          <form onSubmit={handleSearchSubmit} className="space-y-2">
            <label className="block text-xs font-bold text-[#A19E9B]">أدخل رقم هاتف العميل أو رمز الهدية (Phone / Code):</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#A19E9B]/60 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input type="text" placeholder="05XXXXXXXX" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); if (e.target.value.length >= 8) lookupCustomerData(e.target.value); }} className="w-full pr-10 pl-4 py-2.5 rounded-lg border border-white/10 text-xs font-bold font-mono focus:border-[#DD0200] focus:outline-none bg-[#0B0A0A] text-[#FBF9F5] placeholder:text-[#A19E9B]/40" dir="ltr" />
              </div>
              <button type="submit" className="px-4 py-2.5 rounded-lg bg-[#DD0200] hover:bg-[#B50200] text-[#FBF9F5] font-bold text-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition cursor-pointer">فحص الاستحقاق</button>
            </div>
          </form>
          {errorNotice && (
            <div className="p-3.5 rounded-xl bg-[#1A0706] border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorNotice}</span>
            </div>
          )}
          {successNotice && (
            <div className="p-4 rounded-xl bg-[#141212] border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-3 animate-in zoom-in-95 duration-200">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div><span className="block font-bold text-sm text-[#FBF9F5] font-serif">{successNotice}</span><span className="text-[11px] text-emerald-400 block font-normal">تم تسجيل صرف الهدية رسمياً في سجلات الكافيه وتحديث بطاقة العميل.</span></div>
            </div>
          )}
          {selectedCustomer && (
            <div className="p-5 rounded-xl bg-[#1C1B1B] border border-white/10 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#55100D] border border-[#DD0200]/40 text-[#FBF9F5] font-bold flex items-center justify-center text-sm shadow-md">{selectedCustomer.name.slice(0, 2)}</div>
                  <div><h4 className="font-bold text-sm text-[#FBF9F5] font-serif">{selectedCustomer.name}</h4><p className="text-[10px] font-mono text-[#A19E9B]">{selectedCustomer.phone}</p></div>
                </div>
                <span className={'px-3 py-1 rounded-md text-xs font-bold font-mono ' + (isEligible ? 'bg-[#55100D]/70 text-emerald-400 border border-emerald-500/30' : 'bg-[#0B0A0A] text-[#A19E9B] border border-white/10')}>{isEligible ? 'مؤهل للصرف فوراً 🎁' : 'غير مؤهل حالياً'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-lg bg-[#0B0A0A] border border-white/10"><span className="text-[10px] text-[#A19E9B] block font-bold">الزيارات الموثقة</span><strong className="text-base font-bold font-mono text-[#FBF9F5]">{totalVisits}</strong></div>
                <div className="p-2.5 rounded-lg bg-[#0B0A0A] border border-white/10"><span className="text-[10px] text-[#A19E9B] block font-bold">المطلوب للهدية</span><strong className="text-base font-bold font-mono text-[#DD0200]">{requiredVisits}</strong></div>
                <div className="p-2.5 rounded-lg bg-[#0B0A0A] border border-white/10"><span className="text-[10px] text-[#A19E9B] block font-bold">هدايا جاهزة للصرف</span><strong className="text-base font-bold font-mono text-[#FBF9F5]">{availableToClaim}</strong></div>
              </div>
              <div className="p-3.5 rounded-lg bg-[#0B0A0A] border border-white/10 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-[#DD0200]" />
                  <span className="font-bold text-[#A19E9B]">الهدية المستحقة:</span>
                </div>
                <strong className="text-[#FBF9F5] font-bold font-serif">{giftTitle}</strong>
              </div>
              {isEligible ? (
                <button type="button" onClick={handleConfirmRedemption} disabled={isRedeeming} className="w-full py-3 rounded-lg bg-[#DD0200] hover:bg-[#B50200] text-[#FBF9F5] font-bold text-xs transition shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] flex items-center justify-center gap-2 cursor-pointer">
                  <Check className="w-4 h-4" />
                  <span>{isRedeeming ? 'جاري تسجيل الصرف...' : 'تأكيد صرف الهدية للعميل الآن'}</span>
                </button>
              ) : (
                <p className="text-[11px] text-[#A19E9B] text-center font-bold">يحتاج العميل إلى ({requiredVisits - (totalVisits % requiredVisits)}) زيارة إضافية لفتح الهدية التالية.</p>
              )}
            </div>
          )}
        </div>
        <div className="p-4 px-6 bg-[#141212] border-t border-white/10 flex items-center justify-between text-xs text-[#A19E9B]">
          <span>Memories Counter Security • Anti-Fraud Protection</span>
          <button onClick={onClose} className="text-[#A19E9B] hover:text-[#FBF9F5] font-bold cursor-pointer">إغلاق</button>
        </div>
      </div>
    </div>
  );
}
