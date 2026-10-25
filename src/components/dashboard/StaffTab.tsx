'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  UserCog,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Trash2,
  KeyRound,
  RefreshCw,
  ShieldCheck,
  X,
  Save,
} from 'lucide-react';

interface BranchOption {
  id: string;
  name: string;
}

interface StaffMember {
  id: string;
  userId: string;
  displayName: string | null;
  email: string | null;
  role: 'owner' | 'admin' | 'manager' | 'staff';
  branchId: string | null;
  staffCode: string | null;
  hasPin: boolean;
  createdAt: string;
}

interface StaffTabProps {
  branches: BranchOption[];
  currentMemberId: string | null;
  canManage: boolean;
}

interface StaffFormState {
  email: string;
  displayName: string;
  role: 'staff' | 'manager';
  branchId: string;
  staffCode: string;
  pin: string;
}

const EMPTY_FORM: StaffFormState = {
  email: '',
  displayName: '',
  role: 'staff',
  branchId: '',
  staffCode: '',
  pin: '',
};

const ROLE_LABELS: Record<string, string> = {
  owner: 'المالك',
  admin: 'مدير النظام',
  manager: 'مدير',
  staff: 'موظف',
};

export const StaffTab: React.FC<StaffTabProps> = ({ branches, currentMemberId, canManage }) => {
  const [members, setMembers] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<StaffFormState>(EMPTY_FORM);

  const [pinTarget, setPinTarget] = useState<StaffMember | null>(null);
  const [newPin, setNewPin] = useState('');

  const branchName = useCallback(
    (branchId: string | null) =>
      branchId ? branches.find((branch) => branch.id === branchId)?.name ?? 'فرع محذوف' : 'كل الفروع',
    [branches]
  );

  const load = useCallback(async () => {
    setIsLoading(true);
    setListError(null);
    try {
      const response = await fetch('/api/v1/merchant/staff', { cache: 'no-store' });
      if (response.status === 401) {
        window.location.assign('/login');
        return;
      }
      const body = (await response.json().catch(() => ({}))) as {
        members?: StaffMember[];
        error?: string;
      };
      if (!response.ok) throw new Error(body.error || 'تعذر تحميل فريق العمل');
      setMembers(body.members ?? []);
    } catch (error) {
      setListError(error instanceof Error ? error.message : 'تعذر تحميل فريق العمل');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      await load();
    };
    void run();
  }, [load]);

  const createMember = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setActionError(null);
    setNotice(null);
    try {
      const response = await fetch('/api/v1/merchant/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          displayName: form.displayName.trim(),
          role: form.role,
          branchId: form.branchId || null,
          staffCode: form.staffCode.trim(),
          pin: form.pin.trim(),
        }),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(body.error || 'تعذر إضافة الموظف');
      setNotice('تمت إضافة الموظف بنجاح');
      setForm(EMPTY_FORM);
      setShowCreate(false);
      await load();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'تعذر إضافة الموظف');
    } finally {
      setIsSaving(false);
    }
  };

  const resetPin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!pinTarget) return;
    setIsSaving(true);
    setActionError(null);
    setNotice(null);
    try {
      const response = await fetch('/api/v1/merchant/staff', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: pinTarget.id, pin: newPin.trim() }),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(body.error || 'تعذر تحديث رمز الدخول');
      setNotice('تم تحديث رمز الدخول');
      setPinTarget(null);
      setNewPin('');
      await load();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'تعذر تحديث رمز الدخول');
    } finally {
      setIsSaving(false);
    }
  };

  const removeMember = async (member: StaffMember) => {
    if (
      !window.confirm(
        `إزالة ${member.displayName || member.email || 'الموظف'} من الفريق؟ لن يستطيع الدخول إلى محطة الكاونتر بعد ذلك.`
      )
    ) {
      return;
    }
    setActionError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/v1/merchant/staff?id=${encodeURIComponent(member.id)}`, {
        method: 'DELETE',
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(body.error || 'تعذر حذف الموظف');
      setNotice('تمت إزالة الموظف');
      await load();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'تعذر حذف الموظف');
    }
  };

  const activeCount = useMemo(() => members.filter((member) => member.hasPin).length, [members]);

  return (
    <div className="space-y-6">
      {notice && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-4 text-xs font-bold text-emerald-200">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}
      {actionError && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-950/40 p-4 text-xs font-bold text-rose-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-white/10 bg-[#141212] p-6 shadow-xl md:flex-row md:items-center">
        <div>
          <h3 className="flex items-center gap-2 font-serif text-base font-bold text-[#FAF5EB]">
            <UserCog className="h-5 w-5 text-[#DFAB56]" />
            <span>فريق العمل ومحطة الكاونتر</span>
          </h3>
          <p className="mt-1 max-w-2xl text-xs text-[#A19E9B]">
            لكل موظف رمز دخول قصير (4–8 أرقام) يُستخدم على جهاز الكاونتر. الصلاحيات الحقيقية تأتي من
            جلسة الدخول الموقّعة، والرمز مجرد بوابة سريعة على الجهاز المشترك.
          </p>
          <div className="mt-2 flex flex-wrap gap-2 font-mono text-[10px] text-[#A19E9B]">
            <span className="rounded-md border border-white/10 bg-[#1C1B1B] px-2 py-0.5">
              {members.length} عضو
            </span>
            <span className="rounded-md border border-white/10 bg-[#1C1B1B] px-2 py-0.5">
              {activeCount} لديه رمز
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#1C1B1B] px-3 py-2 text-xs font-bold text-[#FAF5EB] hover:bg-[#211F1F]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            تحديث
          </button>
          {canManage && (
            <button
              type="button"
              onClick={() => setShowCreate((previous) => !previous)}
              className="flex items-center gap-1.5 rounded-lg bg-[#DFAB56] px-4 py-2 text-xs font-bold text-[#12100E] hover:bg-[#C99645]"
            >
              {showCreate ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {showCreate ? 'إلغاء' : 'إضافة موظف'}
            </button>
          )}
        </div>
      </div>

      {showCreate && canManage && (
        <form
          onSubmit={createMember}
          className="space-y-4 rounded-2xl border border-white/10 bg-[#141212] p-6 shadow-xl"
        >
          <h4 className="border-b border-white/10 pb-2 text-sm font-bold text-[#FAF5EB]">
            موظف جديد
          </h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#A19E9B]">الاسم</label>
              <input
                required
                value={form.displayName}
                onChange={(event) => setForm({ ...form, displayName: event.target.value })}
                className="w-full rounded-xl border border-white/10 bg-[#1C1B1B] px-3.5 py-2.5 text-xs text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#A19E9B]">البريد الإلكتروني</label>
              <input
                required
                type="email"
                dir="ltr"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                className="w-full rounded-xl border border-white/10 bg-[#1C1B1B] px-3.5 py-2.5 text-xs text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#A19E9B]">الدور</label>
              <select
                value={form.role}
                onChange={(event) =>
                  setForm({ ...form, role: event.target.value as 'staff' | 'manager' })
                }
                className="w-full rounded-xl border border-white/10 bg-[#1C1B1B] px-3.5 py-2.5 text-xs text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none"
              >
                <option value="staff">موظف</option>
                <option value="manager">مدير</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#A19E9B]">الفرع</label>
              <select
                value={form.branchId}
                onChange={(event) => setForm({ ...form, branchId: event.target.value })}
                className="w-full rounded-xl border border-white/10 bg-[#1C1B1B] px-3.5 py-2.5 text-xs text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none"
              >
                <option value="">كل الفروع</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#A19E9B]">
                رمز الموظف (للدخول السريع)
              </label>
              <input
                required
                dir="ltr"
                value={form.staffCode}
                onChange={(event) => setForm({ ...form, staffCode: event.target.value })}
                placeholder="SARA-01"
                className="w-full rounded-xl border border-white/10 bg-[#1C1B1B] px-3.5 py-2.5 text-xs text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#A19E9B]">
                رمز الدخول PIN (4–8 أرقام)
              </label>
              <input
                required
                dir="ltr"
                inputMode="numeric"
                autoComplete="new-password"
                value={form.pin}
                onChange={(event) =>
                  setForm({ ...form, pin: event.target.value.replace(/\D/g, '').slice(0, 8) })
                }
                className="w-full rounded-xl border border-white/10 bg-[#1C1B1B] px-3.5 py-2.5 font-mono text-xs tracking-widest text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 rounded-lg bg-[#DFAB56] px-5 py-2.5 text-xs font-bold text-[#12100E] hover:bg-[#C99645] disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            حفظ الموظف
          </button>
        </form>
      )}

      {pinTarget && (
        <form
          onSubmit={resetPin}
          className="space-y-3 rounded-2xl border border-[#DFAB56]/40 bg-[#3D2314]/30 p-5 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <h4 className="flex items-center gap-2 text-sm font-bold text-[#FAF5EB]">
              <KeyRound className="h-4 w-4 text-[#DFAB56]" />
              رمز دخول جديد — {pinTarget.displayName || pinTarget.email}
            </h4>
            <button
              type="button"
              onClick={() => {
                setPinTarget(null);
                setNewPin('');
              }}
              className="rounded-lg border border-white/10 p-1.5 text-[#FAF5EB]"
              aria-label="إلغاء"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <input
            required
            dir="ltr"
            inputMode="numeric"
            autoComplete="new-password"
            value={newPin}
            onChange={(event) => setNewPin(event.target.value.replace(/\D/g, '').slice(0, 8))}
            placeholder="••••"
            className="w-full max-w-xs rounded-xl border border-white/10 bg-[#1C1B1B] px-3.5 py-2.5 font-mono text-lg tracking-[0.4em] text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none"
          />
          <button
            type="submit"
            disabled={isSaving || newPin.length < 4}
            className="flex items-center gap-2 rounded-lg bg-[#DFAB56] px-5 py-2.5 text-xs font-bold text-[#12100E] hover:bg-[#C99645] disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            تحديث الرمز
          </button>
        </form>
      )}

      <div className="rounded-2xl border border-white/10 bg-[#141212] p-4 shadow-xl sm:p-6">
        {listError ? (
          <p className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-4 text-center text-xs text-rose-200">
            {listError}
          </p>
        ) : isLoading ? (
          <div className="flex items-center justify-center gap-2 p-8 text-xs text-[#A19E9B]">
            <Loader2 className="h-4 w-4 animate-spin" />
            جاري تحميل الفريق...
          </div>
        ) : members.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/15 bg-[#1C1B1B] p-6 text-center text-xs text-[#A19E9B]">
            لا يوجد أعضاء بعد.
          </p>
        ) : (
          <ul className="space-y-2">
            {members.map((member) => {
              const isSelf = member.id === currentMemberId;
              return (
                <li
                  key={member.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#1C1B1B] p-3.5 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#DFAB56]/30 bg-[#3D2314]/60 font-bold text-[#DFAB56]">
                      {(member.displayName || member.email || '?').slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 font-bold text-[#FAF5EB]">
                        <span>{member.displayName || 'بدون اسم'}</span>
                        <span className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-[#A19E9B]">
                          {ROLE_LABELS[member.role] ?? member.role}
                        </span>
                        {isSelf && (
                          <span className="rounded-md bg-[#DFAB56] px-1.5 py-0.5 font-mono text-[10px] text-[#12100E]">
                            أنت
                          </span>
                        )}
                        {member.hasPin ? (
                          <span className="font-mono text-[10px] text-emerald-300">PIN ✓</span>
                        ) : (
                          <span className="font-mono text-[10px] text-[#A19E9B]">بدون PIN</span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 font-mono text-[10px] text-[#A19E9B]">
                        {member.email && <span dir="ltr">{member.email}</span>}
                        <span>{branchName(member.branchId)}</span>
                        {member.staffCode && <span dir="ltr">#{member.staffCode}</span>}
                      </div>
                    </div>
                  </div>

                  {canManage && member.role !== 'owner' && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPinTarget(member);
                          setNewPin('');
                        }}
                        className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#141212] px-3 py-1.5 text-[11px] font-bold text-[#FAF5EB] hover:bg-[#211F1F]"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                        تغيير الرمز
                      </button>
                      {!isSelf && (
                        <button
                          type="button"
                          onClick={() => void removeMember(member)}
                          className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-950/30 px-3 py-1.5 text-[11px] font-bold text-rose-200 hover:bg-rose-950/60"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          إزالة
                        </button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
