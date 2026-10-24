'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  KeyRound,
  Shield,
  Check,
  Trash2,
  Lock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  Award,
  BarChart2,
} from 'lucide-react';
import { TicketButton } from '@/components/ui/TicketButton';

export interface StaffPermissions {
  can_stamp: boolean;
  can_redeem: boolean;
  can_view_crm: boolean;
  can_manage_card: boolean;
  can_view_analytics: boolean;
}

export interface StaffAccount {
  id: string;
  name: string;
  role: string;
  pin: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  permissions: StaffPermissions;
  createdAt: string;
  lastActive?: string;
}

const DEFAULT_STAFF: StaffAccount[] = [
  {
    id: 'staff-1',
    name: 'أحمد محمود',
    role: 'كاشير الكاونتر',
    pin: '1234',
    phone: '0501112233',
    isActive: true,
    permissions: {
      can_stamp: true,
      can_redeem: true,
      can_view_crm: false,
      can_manage_card: false,
      can_view_analytics: false,
    },
    createdAt: '2026-10-01',
    lastActive: 'منذ 10 دقائق',
  },
  {
    id: 'staff-2',
    name: 'سارة خالد',
    role: 'مشرفة الفرع',
    pin: '5678',
    email: 'sara@business.com',
    isActive: true,
    permissions: {
      can_stamp: true,
      can_redeem: true,
      can_view_crm: true,
      can_manage_card: true,
      can_view_analytics: false,
    },
    createdAt: '2026-10-05',
    lastActive: 'منذ ساعة',
  },
];

export function StaffManagementTab({ businessSlug = 'store' }: { businessSlug?: string }) {
  const [staffList, setStaffList] = useState<StaffAccount[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`stampy_staff_${businessSlug}`);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return DEFAULT_STAFF;
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('كاشير الكاونتر');
  const [newPin, setNewPin] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [permissions, setPermissions] = useState<StaffPermissions>({
    can_stamp: true,
    can_redeem: true,
    can_view_crm: false,
    can_manage_card: false,
    can_view_analytics: false,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const saveList = (updated: StaffAccount[]) => {
    setStaffList(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`stampy_staff_${businessSlug}`, JSON.stringify(updated));
    }
  };

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPin) {
      setFormError('يرجى إدخال اسم الموظف ورمز الـ PIN المكون من 4 أرقام.');
      return;
    }
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setFormError('رمز الـ PIN يجب أن يتكون من 4 أرقام بالضبط (مثال: 1234).');
      return;
    }

    const created: StaffAccount = {
      id: `staff-${Date.now()}`,
      name: newName,
      role: newRole,
      pin: newPin,
      phone: newPhone || undefined,
      email: newEmail || undefined,
      isActive: true,
      permissions: { ...permissions },
      createdAt: new Date().toISOString().split('T')[0],
      lastActive: 'جديد',
    };

    const updated = [created, ...staffList];
    saveList(updated);
    setIsAddModalOpen(false);
    setNewName('');
    setNewPin('');
    setNewPhone('');
    setNewEmail('');
    setFormError(null);
    setToastMsg(`تم إضافة الموظف "${created.name}" بنجاح وتعيين رمز الـ PIN.`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleDeleteStaff = (id: string, name: string) => {
    if (confirm(`هل أنت متأكد من حذف حساب الموظف "${name}"؟`)) {
      const updated = staffList.filter((s) => s.id !== id);
      saveList(updated);
      setToastMsg(`تم حذف حساب "${name}".`);
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  const handleToggleActive = (id: string) => {
    const updated = staffList.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s));
    saveList(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border-2 border-[#3D2314] rounded-2xl p-5 sm:p-6 shadow-stamp-resting">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#B83A26] uppercase">
            <Shield className="w-4 h-4" />
            <span>ROLE-BASED ACCESS CONTROL (RBAC)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#3D2314] mt-1">
            إدارة حسابات فريق العمل والصلاحيات
          </h2>
          <p className="text-xs text-[#3D2314]/70 mt-1">
            إنشاء حسابات الموظفين وتخصيص رموز PIN لدخول شاشة الكاونتر وتحديد ما يمكن لكل موظف الاطلاع عليه.
          </p>
        </div>
        <TicketButton
          variant="primary"
          size="md"
          onClick={() => {
            setFormError(null);
            setIsAddModalOpen(true);
          }}
          className="shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>إضافة موظف جديد</span>
        </TicketButton>
      </div>

      {/* Toast Alert */}
      {toastMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-600 text-emerald-900 text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border-2 border-[#3D2314] rounded-xl p-4 shadow-stamp-resting flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#3D2314]/60 block">إجمالي فريق العمل</span>
            <span className="text-2xl font-black text-[#3D2314]">{staffList.length}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FAF5EB] border border-[#3D2314] flex items-center justify-center text-[#3D2314]">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border-2 border-[#3D2314] rounded-xl p-4 shadow-stamp-resting flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#3D2314]/60 block">حسابات نشطة على الوردية</span>
            <span className="text-2xl font-black text-[#527E78]">
              {staffList.filter((s) => s.isActive).length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-600 flex items-center justify-center text-emerald-700">
            <Check className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border-2 border-[#3D2314] rounded-xl p-4 shadow-stamp-resting flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#3D2314]/60 block">أمان رموز PIN</span>
            <span className="text-xs font-mono font-bold text-[#B83A26]">4-Digit Encrypted</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FAF5EB] border border-[#3D2314] flex items-center justify-center text-[#B83A26]">
            <KeyRound className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Staff Roster Table / Cards */}
      <div className="bg-white border-2 border-[#3D2314] rounded-2xl shadow-stamp-resting overflow-hidden">
        <div className="p-4 sm:p-5 border-b-2 border-[#3D2314] flex items-center justify-between bg-[#FAF5EB]">
          <h3 className="font-bold text-sm text-[#3D2314] flex items-center gap-2">
            <Users className="w-4 h-4 text-[#B83A26]" />
            <span>قائمة الموظفين والصلاحيات المعينة</span>
          </h3>
          <span className="text-[10px] font-mono font-bold bg-white px-2.5 py-1 rounded border border-[#3D2314]/20">
            {staffList.length} أعضاء
          </span>
        </div>

        <div className="divide-y divide-[#EADDC4]">
          {staffList.map((member) => (
            <div
              key={member.id}
              className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#FAF5EB]/40 transition"
            >
              {/* Member Info */}
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-[#E5A836] border-2 border-[#3D2314] flex items-center justify-center font-black text-base text-[#3D2314] shadow-stamp-resting shrink-0">
                  {member.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-sm text-[#3D2314]">{member.name}</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF5EB] border border-[#3D2314]/20 text-[#3D2314]">
                      {member.role}
                    </span>
                    {!member.isActive && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-300">
                        معطل
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#3D2314]/60 mt-1 font-mono">
                    <span className="flex items-center gap-1">
                      <KeyRound className="w-3.5 h-3.5 text-[#B83A26]" />
                      PIN: •••• ({member.pin})
                    </span>
                    {member.phone && <span>الهاتف: {member.phone}</span>}
                    {member.lastActive && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        آخر نشاط: {member.lastActive}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Granular Permissions Badges */}
              <div className="flex flex-wrap items-center gap-1.5 md:max-w-md">
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-md border flex items-center gap-1 ${
                    member.permissions.can_stamp
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-800'
                      : 'bg-stone-50 border-stone-300 text-stone-400'
                  }`}
                >
                  <Check className="w-3 h-3" />
                  ختم الكروت
                </span>

                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-md border flex items-center gap-1 ${
                    member.permissions.can_redeem
                      ? 'bg-[#E5A836]/20 border-[#3D2314] text-[#3D2314]'
                      : 'bg-stone-50 border-stone-300 text-stone-400'
                  }`}
                >
                  <Award className="w-3 h-3" />
                  صرف المكافآت
                </span>

                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-md border flex items-center gap-1 ${
                    member.permissions.can_view_crm
                      ? 'bg-[#527E78]/20 border-[#527E78] text-[#527E78]'
                      : 'bg-stone-50 border-stone-300 text-stone-400'
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  رؤية الـ CRM
                </span>

                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-md border flex items-center gap-1 ${
                    member.permissions.can_view_analytics
                      ? 'bg-indigo-50 border-indigo-400 text-indigo-700'
                      : 'bg-stone-50 border-stone-300 text-stone-400'
                  }`}
                >
                  <BarChart2 className="w-3 h-3" />
                  التقارير
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 md:pt-0">
                <button
                  type="button"
                  onClick={() => handleToggleActive(member.id)}
                  className="px-2.5 py-1.5 rounded-lg border border-[#3D2314]/30 text-xs font-bold text-[#3D2314] hover:bg-white transition cursor-pointer"
                >
                  {member.isActive ? 'تعطيل' : 'تفعيل'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteStaff(member.id, member.name)}
                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition cursor-pointer"
                  title="حذف الموظف"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#3D2314]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#3D2314] rounded-2xl p-6 sm:p-7 max-w-lg w-full shadow-stamp-hover relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#EADDC4] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#E5A836] border border-[#3D2314] flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4 text-[#3D2314]" />
                </div>
                <h3 className="font-black text-base text-[#3D2314]">إضافة موظف جديد للمنشأة</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-lg border border-[#3D2314]/20 flex items-center justify-center font-bold text-[#3D2314] hover:bg-[#FAF5EB]"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 mb-4">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#3D2314] mb-1">
                  اسم الموظف الكامل:
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: يوسف إبراهيم"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#EADDC4] bg-[#FAF5EB]/50 text-xs text-[#3D2314] focus:border-[#B83A26] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#3D2314] mb-1">
                    المسمى الوظيفي:
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#EADDC4] bg-[#FAF5EB]/50 text-xs text-[#3D2314] focus:border-[#B83A26] focus:bg-white focus:outline-none"
                  >
                    <option value="كاشير الكاونتر">كاشير الكاونتر</option>
                    <option value="مشرف وردية">مشرف وردية</option>
                    <option value="مدير فرع">مدير فرع</option>
                    <option value="طاقم الخدمة">طاقم الخدمة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#3D2314] mb-1">
                    رمز PIN للكاونتر (4 أرقام):
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    placeholder="1234"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#EADDC4] bg-[#FAF5EB]/50 text-xs text-[#3D2314] focus:border-[#B83A26] focus:bg-white focus:outline-none font-mono text-center tracking-widest text-base"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#3D2314] mb-1">
                    رقم الجوال (اختياري):
                  </label>
                  <input
                    type="tel"
                    placeholder="05xxxxxxxx"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#EADDC4] bg-[#FAF5EB]/50 text-xs text-[#3D2314] focus:border-[#B83A26] focus:bg-white focus:outline-none font-mono"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#3D2314] mb-1">
                    البريد (اختياري):
                  </label>
                  <input
                    type="email"
                    placeholder="staff@store.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#EADDC4] bg-[#FAF5EB]/50 text-xs text-[#3D2314] focus:border-[#B83A26] focus:bg-white focus:outline-none font-mono"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Granular Permissions Section */}
              <div className="pt-2 border-t border-[#EADDC4]">
                <label className="block text-xs font-black text-[#3D2314] mb-2">
                  تحديد الصلاحيات الدقيقة لهذا الموظف (Granular Permissions):
                </label>
                <div className="space-y-2 bg-[#FAF5EB] p-3 rounded-xl border border-[#EADDC4]">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#3D2314]">
                    <input
                      type="checkbox"
                      checked={permissions.can_stamp}
                      onChange={(e) =>
                        setPermissions((prev) => ({ ...prev, can_stamp: e.target.checked }))
                      }
                      className="w-4 h-4 accent-[#B83A26] rounded"
                    />
                    <span>إمكانية ختم كروت العملاء في شاشة الكاونتر</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#3D2314]">
                    <input
                      type="checkbox"
                      checked={permissions.can_redeem}
                      onChange={(e) =>
                        setPermissions((prev) => ({ ...prev, can_redeem: e.target.checked }))
                      }
                      className="w-4 h-4 accent-[#B83A26] rounded"
                    />
                    <span>إمكانية صرف وتوثيق استبدال المكافآت المكتملة</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#3D2314]">
                    <input
                      type="checkbox"
                      checked={permissions.can_view_crm}
                      onChange={(e) =>
                        setPermissions((prev) => ({ ...prev, can_view_crm: e.target.checked }))
                      }
                      className="w-4 h-4 accent-[#B83A26] rounded"
                    />
                    <span>الاطلاع على سجل العملاء وقاعدة بيانات الـ CRM</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#3D2314]">
                    <input
                      type="checkbox"
                      checked={permissions.can_manage_card}
                      onChange={(e) =>
                        setPermissions((prev) => ({ ...prev, can_manage_card: e.target.checked }))
                      }
                      className="w-4 h-4 accent-[#B83A26] rounded"
                    />
                    <span>تعديل إعدادات كرت الأختام والهوية البصرية</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#3D2314]">
                    <input
                      type="checkbox"
                      checked={permissions.can_view_analytics}
                      onChange={(e) =>
                        setPermissions((prev) => ({ ...prev, can_view_analytics: e.target.checked }))
                      }
                      className="w-4 h-4 accent-[#B83A26] rounded"
                    />
                    <span>الاطلاع على التقارير المالية والإحصائيات الحساسة</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <TicketButton
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-1/3"
                >
                  إلغاء
                </TicketButton>
                <TicketButton type="submit" variant="primary" size="md" className="w-2/3">
                  حفظ وتفعيل الحساب
                </TicketButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
