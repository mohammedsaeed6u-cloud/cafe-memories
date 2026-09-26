'use client';

import React, { useState } from 'react';
import { CUSTOMER_PERSONAS } from '@/lib/constants/photobooth-presets';
import { CustomerPersonaKey } from '@/types/photobooth';
import { CooldownService } from '@/lib/services/cooldown.service';
import {
  Users,
  Coffee,
  Plus,
  Search,
  Download,
  Copy,
  MessageCircle,
  Phone,
  Image as ImageIcon,
  Check,
  Calendar,
  Unlock,
  Sparkles,
} from 'lucide-react';

export interface CustomerVisitRecord {
  id: string;
  name: string;
  phone: string;
  role: CustomerPersonaKey;
  totalVisits: number;
  lastVisit: string;
  giftCode?: string;
  photoStripUrl?: string;
  photos?: string[];
}

interface CustomerCRMTabProps {
  customers: CustomerVisitRecord[];
  onExportCsv: () => void;
  brandName?: string;
  cafeSlug?: string;
}

export const CustomerCRMTab: React.FC<CustomerCRMTabProps> = ({
  customers,
  onExportCsv,
  brandName = 'Memories',
  cafeSlug = 'memories',
}) => {
  const [selectedPersona, setSelectedPersona] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [unlockedNotice, setUnlockedNotice] = useState<string | null>(null);
  const [selectedStripModal, setSelectedStripModal] = useState<CustomerVisitRecord | null>(null);
  const [orderModalCustomer, setOrderModalCustomer] = useState<CustomerVisitRecord | null>(null);
  const [shotsToAdd, setShotsToAdd] = useState<number>(1);
  const [quickPhone, setQuickPhone] = useState<string>('');
  const [quickShots, setQuickShots] = useState<number>(1);

  // Filter customers by persona and search query
  const filteredCustomers = customers.filter((c) => {
    const matchesPersona =
      selectedPersona === 'all' || c.role === selectedPersona;
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery);
    return matchesPersona && matchesSearch;
  });

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  // Add order-based extra shots to customer
  const handleAddOrderShots = (phone: string, customerName: string, count: number) => {
    if (!phone) return;
    const newTotal = CooldownService.addOrderShots(phone, count, 1, cafeSlug);
    setUnlockedNotice(`تم شحن ${count} صورة إضافية بنجاح للعميل (${customerName}) بناءً على طلب الأوردرات! (الرصيد المتاح: ${newTotal})`);
    setOrderModalCustomer(null);
    setTimeout(() => setUnlockedNotice(null), 5000);
  };

  const handleQuickAddShots = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPhone.trim()) return;
    const targetCustomer = customers.find(c => c.phone.includes(quickPhone.trim())) || { name: quickPhone, phone: quickPhone };
    handleAddOrderShots(quickPhone.trim(), targetCustomer.name, quickShots);
    setQuickPhone('');
  };

  // Barista unlocks customer's 24h cooldown
  const handleUnlockCustomer = (customer: CustomerVisitRecord) => {
    CooldownService.unlockForCustomer(customer.phone, cafeSlug);
    setUnlockedNotice(`تم فك قفل الـ 24 ساعة للعميل (${customer.name}) بنجاح! يمكنه التصوير فوراً.`);
    setTimeout(() => setUnlockedNotice(null), 4000);
  };

  const getPersonaBadge = (roleKey: string) => {
    const persona = CUSTOMER_PERSONAS.find((p) => p.key === roleKey || p.label === roleKey);
    if (persona) {
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${persona.badgeColor}`}
        >
          <span>{persona.icon}</span>
          <span>{persona.label}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border bg-[#1C1B1B] text-[#FBF9F5] border-white/10">
        <span className="text-[10px] font-mono text-[#A19E9B]">STAR</span>
        <span>{roleKey || 'زائر مميز'}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Analytics Summary */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#141212] p-6 rounded-2xl border border-white/10 shadow-xl">
        <div>
          <h3 className="text-lg font-bold text-[#FBF9F5] flex items-center gap-2 font-serif">
            <Users className="w-5 h-5 text-[#DD0200]" />
            <span>سجل العملاء والـ CRM المربوط بالصور</span>
          </h3>
          <p className="text-xs text-[#A19E9B] mt-1">
            إجمالي {customers.length} عميل تم بناء بروفايلهم وتوثيق زياراتهم بالصور
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onExportCsv}
            className="px-4 py-2.5 rounded-xl bg-[#DD0200] hover:bg-[#B50200] text-[#FBF9F5] text-xs font-bold flex items-center gap-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>تصدير Excel / CSV مع التصنيف</span>
          </button>
        </div>
      </div>

      {unlockedNotice && (
        <div className="p-4 bg-[#55100D]/40 border border-[#DD0200]/40 text-[#FBF9F5] rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in shadow-sm">
          <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{unlockedNotice}</span>
        </div>
      )}

      {/* Cashier / Manager Quick Order Shots Charger */}
      <div className="p-5 bg-[#141212] rounded-2xl border border-white/10 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#DD0200] to-[#55100D] text-white flex items-center justify-center font-bold shadow-md border border-white/10">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-[#FBF9F5] text-sm flex items-center gap-2 font-serif">
                <span>شاحن لقطات الأوردرات السريع (الكاشير / المدير)</span>
                <span className="text-[10px] bg-[#55100D] text-[#FBF9F5] px-2 py-0.5 rounded-full font-bold border border-[#DD0200]/30">كل أوردر = لقطة إضافية</span>
              </h4>
              <p className="text-[11px] text-[#A19E9B] mt-0.5">
                إذا طلب العميل أكثر من مشروب أو أوردر، اشحن له صوراً إضافية فوراً لتضاف لكارته
              </p>
            </div>
          </div>

          <form onSubmit={handleQuickAddShots} className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <input
              type="tel"
              placeholder="رقم موبايل العميل..."
              value={quickPhone}
              onChange={(e) => setQuickPhone(e.target.value)}
              className="px-3.5 py-2 text-xs rounded-xl border border-white/10 bg-[#0B0A0A] text-[#FBF9F5] placeholder-[#A19E9B]/50 font-mono focus:ring-1 focus:ring-[#DD0200] focus:outline-none w-36 sm:w-44"
            />
            <div className="flex items-center gap-1 bg-[#0B0A0A] border border-white/10 rounded-xl px-2 py-1">
              <span className="text-[11px] font-bold text-[#A19E9B]">+</span>
              <input
                type="number"
                min="1"
                max="10"
                value={quickShots}
                onChange={(e) => setQuickShots(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-12 text-center text-xs font-bold font-mono text-[#FBF9F5] bg-transparent focus:outline-none"
              />
              <span className="text-[10px] text-[#A19E9B] font-bold">صور</span>
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#DD0200] hover:bg-[#B50200] text-[#FBF9F5] text-xs font-bold flex items-center gap-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>شحن اللقطات فوراً</span>
            </button>
          </form>
        </div>
      </div>

      {/* Filter Bar: Search + Persona Chips */}
      <div className="bg-[#141212] p-5 rounded-2xl border border-white/10 shadow-xl space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute right-4 top-3.5 w-4 h-4 text-[#A19E9B]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم أو برقم الموبايل..."
            className="w-full pr-11 pl-4 py-2.5 rounded-xl border border-white/10 bg-[#0B0A0A] text-sm text-[#FBF9F5] placeholder-[#A19E9B]/50 focus:ring-1 focus:ring-[#DD0200] focus:outline-none"
          />
        </div>

        {/* Persona Chips */}
        <div>
          <label className="block text-xs font-bold text-[#A19E9B] mb-2">
            تصفية حسب تصنيف العميل (Persona):
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedPersona('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer ${
                selectedPersona === 'all'
                  ? 'bg-[#DD0200] text-[#FBF9F5] border-[#DD0200] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
                  : 'bg-[#1C1B1B] hover:bg-[#252424] text-[#A19E9B] hover:text-[#FBF9F5] border-white/10'
              }`}
            >
              الكل ({customers.length})
            </button>
            {CUSTOMER_PERSONAS.map((p) => {
              const count = customers.filter((c) => c.role === p.key).length;
              return (
                <button
                  key={p.key}
                  onClick={() => setSelectedPersona(p.key)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                    selectedPersona === p.key
                      ? 'bg-[#DD0200] text-[#FBF9F5] border-[#DD0200] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
                      : 'bg-[#1C1B1B] hover:bg-[#252424] text-[#A19E9B] hover:text-[#FBF9F5] border-white/10'
                  }`}
                >
                  <span>{p.icon}</span>
                  <span>{p.label}</span>
                  <span className="opacity-70 text-[10px]">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Customers Table / Cards */}
      <div className="bg-[#141212] rounded-2xl border border-white/10 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-[#1C1B1B] text-[11px] font-bold uppercase text-[#A19E9B] tracking-wider">
                <th className="py-4 px-5">العميل</th>
                <th className="py-4 px-5">التصنيف / المجال</th>
                <th className="py-4 px-5">رقم الموبايل والتواصل</th>
                <th className="py-4 px-5">الزيارات والصورة</th>
                <th className="py-4 px-5">آخر زيارة</th>
                <th className="py-4 px-5">فك قفل 24h</th>
                <th className="py-4 px-5">الإجراء السريع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#A19E9B]">
                    لا يوجد عملاء يطابقون هذا البحث والتصنيف
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-white/[0.03] transition">
                    {/* Customer Name */}
                    <td className="py-4 px-5 font-bold text-[#FBF9F5]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-[#1C1B1B] text-[#FBF9F5] border border-white/10 font-bold flex items-center justify-center text-xs">
                          {customer.name.slice(0, 2)}
                        </div>
                        <div>
                          <p className="leading-tight">{customer.name}</p>
                          <p className="text-[10px] text-[#A19E9B] font-mono mt-0.5">
                            ID: {customer.id.slice(0, 8)}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Persona Badge */}
                    <td className="py-4 px-5">{getPersonaBadge(customer.role)}</td>

                    {/* Phone & Direct Contact */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2 font-mono text-xs text-[#FBF9F5]">
                        <span>{customer.phone}</span>
                        <button
                          onClick={() => handleCopyPhone(customer.phone)}
                          className="text-[#A19E9B] hover:text-[#FBF9F5] transition cursor-pointer"
                          title="نسخ الرقم"
                        >
                          {copiedPhone === customer.phone ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Visits & Linked Strip Preview */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-[#FBF9F5]">
                            {customer.totalVisits} زيارة
                          </span>
                          {customer.totalVisits >= 5 ? (
                            <span className="px-2 py-0.5 rounded-full bg-[#55100D] text-[#FBF9F5] border border-[#DD0200]/40 font-bold text-[9px] shadow-sm flex items-center gap-0.5">
                              <span className="text-[10px] font-mono">VIP</span>
                              <span>VIP ذهبي</span>
                            </span>
                          ) : customer.totalVisits >= 3 ? (
                            <span className="px-2 py-0.5 rounded-full bg-[#1C1B1B] text-[#FBF9F5] border border-white/10 text-[9px] font-bold">
                              ⭐ مميز
                            </span>
                          ) : null}
                        </div>

                        {customer.photoStripUrl ? (
                          <button
                            onClick={() => setSelectedStripModal(customer)}
                            className="flex items-center gap-1 text-xs text-[#FBF9F5] hover:text-white font-bold bg-[#1C1B1B] hover:bg-[#252424] px-2.5 py-1 rounded-lg border border-white/10 transition cursor-pointer"
                          >
                            <ImageIcon className="w-3.5 h-3.5 text-[#DD0200]" />
                            <span>عرض الشريط</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-[#A19E9B]/60">بدون شريط</span>
                        )}
                      </div>
                    </td>

                    {/* Last Visit */}
                    <td className="py-4 px-5 text-xs text-[#A19E9B]">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#A19E9B]" />
                        <span>
                          {new Date(customer.lastVisit).toLocaleDateString('ar-EG', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </td>

                    {/* Barista Order Shots & Unlock */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setOrderModalCustomer(customer);
                            setShotsToAdd(1);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-[#DD0200] hover:bg-[#B50200] text-[#FBF9F5] text-xs font-bold flex items-center gap-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition cursor-pointer"
                          title="شحن لقطات إضافية بناءً على طلب الأوردرات"
                        >
                          <Coffee className="w-3.5 h-3.5 text-white/90" />
                          <span>+ صور أوردر</span>
                        </button>

                        <button
                          onClick={() => handleUnlockCustomer(customer)}
                          className="px-2.5 py-1.5 rounded-xl bg-[#1C1B1B] hover:bg-[#252424] text-[#FBF9F5] text-xs font-bold border border-white/10 flex items-center gap-1.5 transition cursor-pointer"
                          title="السماح للعميل بجلسة تصوير إضافية اليوم"
                        >
                          <Unlock className="w-3.5 h-3.5 text-[#A19E9B]" />
                          <span>فك القيد</span>
                        </button>
                      </div>
                    </td>

                    {/* Direct Marketing Action Buttons */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        {/* WhatsApp */}
                        {(() => {
                          const digits = customer.phone.replace(/[^0-9]/g, '');
                          const waPhone = digits.startsWith('0') ? `2${digits}` : digits;
                          return (
                            <a
                              href={`https://wa.me/${waPhone}?text=${encodeURIComponent(
                                `أهلاً يا ${customer.name}! يسعدنا دائماً زيارتك في ${brandName}.`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-8 h-8 rounded-xl bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 hover:bg-emerald-900/50 flex items-center justify-center transition"
                              title="مراسلة عبر واتساب"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          );
                        })()}

                        {/* Call */}
                        <a
                          href={`tel:${customer.phone}`}
                          className="w-8 h-8 rounded-xl bg-[#1C1B1B] text-[#FBF9F5] hover:bg-[#252424] border border-white/10 flex items-center justify-center transition"
                          title="اتصال هاتفي"
                        >
                          <Phone className="w-4 h-4 text-[#A19E9B]" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Order Shots */}
      {orderModalCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative bg-[#141212] rounded-2xl p-6 sm:p-7 max-w-md w-full text-[#FBF9F5] shadow-2xl border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#DD0200] to-[#55100D] text-white flex items-center justify-center border border-white/10 shadow-md">
                <Coffee className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-base text-[#FBF9F5] font-serif">
                  شحن صور إضافية للأوردرات
                </h4>
                <p className="text-xs text-[#A19E9B]">
                  العميل: <span className="font-bold text-[#FBF9F5]">{orderModalCustomer.name}</span> ({orderModalCustomer.phone})
                </p>
              </div>
            </div>

            <p className="text-xs text-[#A19E9B] mb-4 leading-relaxed">
              حدد عدد الصور الإضافية التي يستحقها العميل بحسب عدد المشروبات أو الطلبات التي طلبها:
            </p>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {[1, 2, 3].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setShotsToAdd(num)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                    shotsToAdd === num
                      ? 'border-[#DD0200] bg-[#55100D]/50 text-[#FBF9F5] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
                      : 'border-white/10 bg-[#1C1B1B] hover:bg-[#252424] text-[#A19E9B] hover:text-[#FBF9F5]'
                  }`}
                >
                  <span className="text-base font-black">+{num}</span>
                  <span className="text-[10px]">
                    {num === 1 ? 'أوردر واحد' : num === 2 ? 'أوردرين' : '3 أوردرات'}
                  </span>
                </button>
              ))}
            </div>

            <div className="mb-5">
              <label className="block text-[11px] font-bold text-[#A19E9B] mb-1">
                أو اكتب عدد الصور المخصصة:
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={shotsToAdd}
                onChange={(e) => setShotsToAdd(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-4 py-2 rounded-xl border border-white/10 bg-[#0B0A0A] text-center font-bold text-lg font-mono text-[#FBF9F5] focus:ring-1 focus:ring-[#DD0200] focus:outline-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleAddOrderShots(orderModalCustomer.phone, orderModalCustomer.name, shotsToAdd)}
                className="flex-1 py-3 rounded-xl bg-[#DD0200] hover:bg-[#B50200] text-[#FBF9F5] text-xs font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>تأكيد وشحن {shotsToAdd} صور فوراً</span>
              </button>
              <button
                type="button"
                onClick={() => setOrderModalCustomer(null)}
                className="py-3 px-5 rounded-xl bg-[#1C1B1B] hover:bg-[#252424] text-[#A19E9B] hover:text-[#FBF9F5] text-xs font-bold transition border border-white/10 cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Strip Photo Preview Modal */}
      {selectedStripModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative bg-[#141212] rounded-2xl p-6 max-w-sm w-full text-[#FBF9F5] text-center shadow-2xl border border-white/10">
            <h4 className="font-bold text-base mb-1 font-serif text-[#FBF9F5]">
              شريط ذكريات: {selectedStripModal.name}
            </h4>
            <div className="text-xs text-[#A19E9B] mb-4 flex justify-center">
              {getPersonaBadge(selectedStripModal.role)}
            </div>

            <div className="max-h-[70vh] overflow-y-auto flex justify-center py-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedStripModal.photoStripUrl}
                alt="Customer Strip"
                className="max-h-[500px] object-contain rounded-xl shadow-lg border border-white/10"
              />
            </div>

            <button
              onClick={() => setSelectedStripModal(null)}
              className="mt-5 w-full py-2.5 rounded-xl bg-[#1C1B1B] text-[#FBF9F5] text-xs font-bold hover:bg-[#252424] border border-white/10 transition cursor-pointer"
            >
              إغلاق المعاينة
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
