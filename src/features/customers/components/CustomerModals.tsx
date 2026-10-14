'use client';

import React from 'react';
import { X, Plus, Sparkles, Send, Sliders } from 'lucide-react';
import { CustomerRecord, CARD_THEME_PRESETS, STAMP_ICONS } from '../types';

export function AddCustomerModal({
  isOpen,
  onClose,
  phone,
  setPhone,
  name,
  setName,
  role,
  setRole,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  phone: string;
  setPhone: (p: string) => void;
  name: string;
  setName: (n: string) => void;
  role: string;
  setRole: (r: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#141212] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-[rgba(255,255,255,0.1)]">
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.1)]">
          <h4 className="text-sm font-black text-[#FBF9F5]">إضافة عميل جديد يدوياً</h4>
          <button type="button" onClick={onClose} className="p-1 rounded-xl hover:bg-stone-100 text-stone-500 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-[#FBF9F5] mb-1">رقم الهاتف *</label>
            <input
              type="tel"
              dir="ltr"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05XXXXXXXX"
              className="w-full px-3 py-2 text-xs rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#141212] text-[#FBF9F5] focus:border-[#c92a54] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#FBF9F5] mb-1">اسم العميل (اختياري)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="محمد أحمد"
              className="w-full px-3 py-2 text-xs rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#141212] text-[#FBF9F5] focus:border-[#c92a54] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#FBF9F5] mb-1">الفئة / الاهتمام</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#141212] text-[#FBF9F5] focus:border-[#c92a54] focus:outline-none"
            >
              <option value="coffee_lover">عشاق القهوة</option>
              <option value="daily_visitor">زائر يومي</option>
              <option value="laptop_worker">رواد أعمال ولابتوب</option>
              <option value="vip">عميل VIP متميز</option>
              <option value="friend_group">مجموعات وأصدقاء</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#FBF9F5] hover:bg-[#382D27] text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              حفظ العميل
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CustomerCardCustomizerModal({
  customer,
  onClose,
  editStampsCount,
  setEditStampsCount,
  editGiftTitle,
  setEditGiftTitle,
  editColorHex,
  setEditColorHex,
  editStampIcon,
  setEditStampIcon,
  editPushMessage,
  setEditPushMessage,
  isPushingCard,
  onSave,
}: {
  customer: CustomerRecord | null;
  onClose: () => void;
  editStampsCount: number;
  setEditStampsCount: (n: number) => void;
  editGiftTitle: string;
  setEditGiftTitle: (g: string) => void;
  editColorHex: string;
  setEditColorHex: (c: string) => void;
  editStampIcon: string;
  setEditStampIcon: (i: string) => void;
  editPushMessage: string;
  setEditPushMessage: (m: string) => void;
  isPushingCard: boolean;
  onSave: () => void;
}) {
  if (!customer) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#141212] rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-[rgba(255,255,255,0.1)]">
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.1)]">
          <div>
            <h4 className="text-sm font-black text-[#FBF9F5]">
              تخصيص كارت محفظة العميل: {customer.displayName}
            </h4>
            <p className="text-[10px] text-stone-500 font-mono" dir="ltr">{customer.phone}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-xl hover:bg-stone-100 text-stone-500 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-[#FBF9F5] mb-1">
              عدد الأختام الحالي على الكارت:
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setEditStampsCount(val)}
                  className={`w-10 h-10 rounded-xl text-xs font-mono font-black border transition cursor-pointer ${
                    editStampsCount === val
                      ? 'bg-[#FBF9F5] text-white border-stone-800 shadow-xs'
                      : 'bg-[#0B0A0A] text-stone-700 border-[rgba(255,255,255,0.1)] hover:bg-white'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#FBF9F5] mb-1">أيقونة الختم:</label>
            <div className="flex items-center gap-2">
              {STAMP_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setEditStampIcon(icon)}
                  className={`w-9 h-9 rounded-xl text-sm border flex items-center justify-center transition cursor-pointer ${
                    editStampIcon === icon ? 'bg-amber-100 border-amber-400 shadow-xs' : 'bg-[#0B0A0A] border-[rgba(255,255,255,0.1)]'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#FBF9F5] mb-1">لون بطاقة المحفظة:</label>
            <div className="grid grid-cols-3 gap-2">
              {CARD_THEME_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setEditColorHex(preset.hex)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold text-white transition cursor-pointer flex items-center justify-center gap-1 ${
                    editColorHex === preset.hex ? 'ring-2 ring-offset-1 ring-[#c92a54]' : 'opacity-85'
                  }`}
                  style={{ backgroundColor: preset.hex }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#FBF9F5] mb-1">
              رسالة شاشة القفل عند التحديث (Push Notification):
            </label>
            <input
              type="text"
              value={editPushMessage}
              onChange={(e) => setEditPushMessage(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#141212] text-[#FBF9F5] focus:border-[#c92a54] focus:outline-none"
              placeholder="اكتب الإشعار هنا..."
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[rgba(255,255,255,0.1)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="button"
            disabled={isPushingCard}
            onClick={onSave}
            className="px-5 py-2 rounded-xl bg-[#c92a54] hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Send className={`w-3.5 h-3.5 ${isPushingCard ? 'animate-bounce' : ''}`} />
            <span>{isPushingCard ? 'جاري البث للمحفظة...' : 'حفظ وبث التحديث للمحفظة 📱'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function BulkBroadcastModal({
  isOpen,
  onClose,
  message,
  setMessage,
  isSending,
  onSend,
}: {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  setMessage: (m: string) => void;
  isSending: boolean;
  onSend: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#141212] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-[rgba(255,255,255,0.1)]">
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.1)]">
          <h4 className="text-sm font-black text-[#FBF9F5]">بث إشعار فوري لكافة حاملي الكروت</h4>
          <button type="button" onClick={onClose} className="p-1 rounded-xl hover:bg-stone-100 text-stone-500 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-stone-500 leading-relaxed">
            سيصل هذا الإشعار مباشرة إلى شاشة قفل كافة الزبائن الذين أضافوا الكارت في Apple Wallet أو Google Wallet.
          </p>

          <textarea
            rows={3}
            maxLength={160}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="اكتب رسالة الإشعار الترويجي هنا (مثال: قهوتك اليوم علينا! خصم 20% لفترة محدودة ☕)..."
            className="w-full p-3 text-xs rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#141212] text-[#FBF9F5] focus:border-[#c92a54] focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="button"
            disabled={isSending || !message.trim()}
            onClick={onSend}
            className="px-5 py-2 rounded-xl bg-[#c92a54] hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Send className={`w-3.5 h-3.5 ${isSending ? 'animate-bounce' : ''}`} />
            <span>{isSending ? 'جاري البث...' : 'بث الإشعار الآن 🚀'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
