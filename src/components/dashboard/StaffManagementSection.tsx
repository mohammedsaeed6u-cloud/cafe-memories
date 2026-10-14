'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Copy,
  Check,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { StaffMember, StaffRole, STAFF_ROLE_LABELS } from '@/types/staff';
import {
  getStaffMembersForCafe,
  addCustomStaffMember,
  deleteCustomStaffMember,
  getStaffPinForOwner,
} from '@/lib/services/staff-auth.service';

interface StaffManagementSectionProps {
  cafeSlug: string;
}

export function StaffManagementSection({ cafeSlug }: StaffManagementSectionProps) {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<StaffRole>('barista');
  const [createdResult, setCreatedResult] = useState<{ staff: StaffMember; pin: string } | null>(null);
  const [copiedPin, setCopiedPin] = useState(false);
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});

  const reloadStaff = () => {
    const list = getStaffMembersForCafe(cafeSlug);
    setStaffList(list);
  };

  useEffect(() => {
    reloadStaff();
  }, [cafeSlug]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim()) return;

    const res = addCustomStaffMember(cafeSlug, newStaffName.trim(), newStaffRole);
    setCreatedResult(res);
    setNewStaffName('');
    reloadStaff();
  };

  const handleDelete = (staffId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الموظف وإلغاء رمز الـ PIN الخاص به؟')) {
      deleteCustomStaffMember(cafeSlug, staffId);
      reloadStaff();
    }
  };

  const handleCopy = (pin: string) => {
    navigator.clipboard.writeText(pin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const toggleRevealPin = (staffId: string) => {
    setRevealedPins((prev) => ({ ...prev, [staffId]: !prev[staffId] }));
  };

  return (
    <div className="p-6 rounded-3xl bg-[#141212] border border-white/10 shadow-lg space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-xl bg-[#98183c]/40 text-[#c92a54] border border-[#c92a54]/30">
              <Users className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-[#FBF9F5] font-mono uppercase tracking-wider">
              STAFF & SECURE PIN ACCESS
            </span>
          </div>
          <h3 className="text-lg font-black text-[#FBF9F5]">
            إدارة طاقم العمل والـ PIN الآمن لنقاط البيع (POS)
          </h3>
          <p className="text-xs text-[#A19E9B] mt-0.5">
            أضف موظفي الكاونتر. لكل موظف كود PIN فريد ومشفر ومحمي تلقائياً ضد أي محاولات تخمين عشوائية.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setCreatedResult(null);
            setIsAddModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-[#c92a54] hover:bg-[#B50200] text-[#FBF9F5] text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
        >
          <UserPlus className="w-4 h-4 text-[#FBF9F5]" />
          <span>إضافة موظف وتوليد PIN</span>
        </button>
      </div>

      {/* Staff Roster List */}
      <div className="space-y-3">
        {staffList.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-[#0B0A0A] border border-dashed border-white/10">
            <Users className="w-8 h-8 text-[#A19E9B] mx-auto mb-2" />
            <p className="text-xs font-bold text-[#FBF9F5]">لا يوجد موظفون مضافون حالياً</p>
            <p className="text-[11px] text-[#A19E9B] mt-1">
              اضغط على "إضافة موظف وتوليد PIN" لإنشاء أول كود دخول محمي لكاشير الكاونتر.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {staffList.map((staff) => {
              const pin = getStaffPinForOwner(cafeSlug, staff.id) || '••••';
              const isRevealed = revealedPins[staff.id];

              return (
                <div
                  key={staff.id}
                  className="p-4 rounded-2xl bg-[#1C1B1B] border border-white/10 flex items-center justify-between gap-3 shadow-2xs hover:border-[#c92a54]/40 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {staff.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={staff.avatarUrl}
                        alt={staff.name}
                        className="w-10 h-10 rounded-full border border-white/10 bg-[#0B0A0A] shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#98183c]/50 text-[#FBF9F5] border border-[#c92a54]/40 flex items-center justify-center font-bold text-xs shrink-0">
                        {staff.name.charAt(0)}
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#FBF9F5] truncate block">
                          {staff.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0B0A0A] border border-white/10 text-[#A19E9B] font-bold shrink-0">
                          {STAFF_ROLE_LABELS[staff.role] || staff.role}
                        </span>
                      </div>

                      {/* PIN Box with Show/Hide */}
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-[10px] text-[#A19E9B] font-mono">PIN:</span>
                        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-lg bg-[#0B0A0A] border border-white/10 text-[#FBF9F5] tracking-widest shadow-2xs">
                          {isRevealed ? pin : '••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleRevealPin(staff.id)}
                          className="p-1 text-[#A19E9B] hover:text-[#FBF9F5] transition cursor-pointer"
                          title={isRevealed ? 'إخفاء الرمز' : 'إظهار الرمز'}
                        >
                          {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopy(pin)}
                          className="p-1 text-[#A19E9B] hover:text-[#c92a54] transition cursor-pointer"
                          title="نسخ الرمز"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <button
                    type="button"
                    onClick={() => handleDelete(staff.id)}
                    className="p-2 rounded-xl text-[#A19E9B] hover:text-rose-400 hover:bg-rose-950/40 transition cursor-pointer shrink-0"
                    title="حذف الموظف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Security Shield Note */}
      <div className="p-3.5 rounded-2xl bg-[#1C1B1B] border border-white/10 text-[#A19E9B] text-xs flex items-center gap-2.5">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="text-[11px] leading-relaxed">
          <strong className="text-[#FBF9F5]">حماية ضد التخمين الآلي:</strong> يتم إيقاف أي محاولات إدخال رموز عشوائية فوراً لمدة 30 إلى 60 ثانية بعد 3 محاولات غير صحيحة لمنع أي اختراق لمحطة الكاشير.
        </span>
      </div>

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#141212] rounded-3xl border border-white/10 shadow-2xl max-w-md w-full p-6 space-y-5 text-[#FBF9F5]">
            {!createdResult ? (
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                  <div className="p-2 rounded-xl bg-[#98183c]/50 text-[#c92a54] border border-[#c92a54]/30">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#FBF9F5]">إضافة موظف كاونتر جديد</h4>
                    <p className="text-[11px] text-[#A19E9B]">سيقوم النظام بتوليد كود PIN فريد ومحمي لهذا الموظف</p>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#A19E9B] block mb-1">اسم الموظف أو الكاشير:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: أحمد، سارة، كريم..."
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-white/10 bg-[#0B0A0A] text-[#FBF9F5] focus:border-[#c92a54] focus:outline-none font-bold placeholder:text-[#A19E9B]/40"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#A19E9B] block mb-1">الدور الوظيفي:</label>
                  <select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value as StaffRole)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-white/10 bg-[#0B0A0A] text-[#FBF9F5] focus:border-[#c92a54] focus:outline-none font-bold"
                  >
                    <option value="barista">باريستا (Barista)</option>
                    <option value="shift_lead">مشرف وردية (Shift Lead)</option>
                    <option value="manager">مدير فرع (Manager)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-[#A19E9B] hover:text-[#FBF9F5] text-xs font-bold cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#c92a54] hover:bg-[#B50200] text-[#FBF9F5] text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#FBF9F5]" />
                    <span>توليد الكود وإضافة الموظف</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>

                <div>
                  <h4 className="font-bold text-base text-[#FBF9F5]">
                    تمت إضافة الموظف ({createdResult.staff.name}) بنجاح!
                  </h4>
                  <p className="text-xs text-[#A19E9B] mt-1">
                    هذا هو كود الدخول السري المخصص له لمحطة الكاونتر:
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#0B0A0A] border border-[#c92a54]/40 flex flex-col items-center justify-center gap-2">
                  <span className="text-3xl font-black font-mono tracking-[0.4em] text-[#c92a54]">
                    {createdResult.pin}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(createdResult.pin)}
                    className="mt-1 px-3 py-1.5 rounded-lg bg-[#1C1B1B] border border-white/10 hover:bg-[#282727] text-[#FBF9F5] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    {copiedPin ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#A19E9B]" />}
                    <span>{copiedPin ? 'تم نسخ الكود!' : 'نسخ الكود'}</span>
                  </button>
                </div>

                <p className="text-[11px] text-[#A19E9B] leading-relaxed text-right">
                  ⚠️ <strong className="text-[#FBF9F5]">ملاحظة أمان:</strong> يرجى تسليم هذا الكود للموظف ليقوم باستخدامه عند فتح محطة الكاونتر <code>/terminal</code>. الرمز محمي ضد أي محاولات تخمين.
                </p>

                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-[#c92a54] hover:bg-[#B50200] text-[#FBF9F5] text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  تم، إغلاق النافذة
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
