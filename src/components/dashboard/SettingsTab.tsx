'use client';

import React, { useCallback, useRef, useState } from 'react';
import {
  Settings as SettingsIcon,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Save,
  Upload,
  Image as ImageIcon,
  Palette,
  Store,
  Clock,
  Trash2,
} from 'lucide-react';
import type { BusinessSettings, BusinessType } from '@/types/photobooth';

interface OrganizationSummary {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  tagline: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  frameStyle: string | null;
  walletColorPreset: string | null;
  socialLinks: Record<string, string> | null;
  timezone: string;
  currency: string;
}

interface SettingsTabProps {
  organization: OrganizationSummary;
  settings: BusinessSettings;
  canManage: boolean;
  onSaved: (settings: BusinessSettings) => void;
}

const BUSINESS_TYPES: Array<{ id: BusinessType; label: string }> = [
  { id: 'cafe', label: 'مقهى / محمصة' },
  { id: 'restaurant', label: 'مطعم' },
  { id: 'retail', label: 'متجر تجزئة' },
  { id: 'salon', label: 'صالون / عناية' },
  { id: 'entertainment', label: 'ترفيه' },
  { id: 'events', label: 'فعاليات' },
  { id: 'general', label: 'عام' },
];

const FRAME_STYLES = [
  { id: 'film', label: 'فيلم' },
  { id: 'polaroid', label: 'بولارويد' },
  { id: 'editorial', label: 'تحريري' },
] as const;

const WALLET_PRESETS = [
  { id: 'dark', label: 'داكن' },
  { id: 'blue', label: 'أزرق' },
  { id: 'green', label: 'أخضر' },
  { id: 'red', label: 'أحمر' },
  { id: 'purple', label: 'بنفسجي' },
  { id: 'orange', label: 'برتقالي' },
] as const;

const SOCIAL_FIELDS = [
  { id: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourcafe' },
  { id: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/yourcafe' },
  { id: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@yourcafe' },
  { id: 'x', label: 'X', placeholder: 'https://x.com/yourcafe' },
  { id: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@yourcafe' },
  { id: 'whatsapp', label: 'WhatsApp', placeholder: 'https://wa.me/9665xxxxxxxx' },
  { id: 'website', label: 'Website', placeholder: 'https://yourcafe.com' },
] as const;

type SocialPlatformId = (typeof SOCIAL_FIELDS)[number]['id'];

type FrameStyleId = (typeof FRAME_STYLES)[number]['id'];
type WalletPresetId = (typeof WALLET_PRESETS)[number]['id'];

/** Seed the social inputs from the saved brand record, defaulting to empty. */
function socialLinksFrom(
  links: Record<string, string> | null | undefined
): Record<SocialPlatformId, string> {
  const values = {} as Record<SocialPlatformId, string>;
  for (const field of SOCIAL_FIELDS) {
    const value = links?.[field.id];
    values[field.id] = typeof value === 'string' ? value : '';
  }
  return values;
}

function frameStyleFrom(value: string | null): FrameStyleId {
  return FRAME_STYLES.some((style) => style.id === value) ? (value as FrameStyleId) : 'film';
}

function walletPresetFrom(value: string | null): WalletPresetId {
  return WALLET_PRESETS.some((preset) => preset.id === value)
    ? (value as WalletPresetId)
    : 'green';
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  organization,
  settings,
  canManage,
  onSaved,
}) => {
  const [name, setName] = useState(organization.name);
  const [tagline, setTagline] = useState(organization.tagline ?? '');
  const [primaryColor, setPrimaryColor] = useState(
    organization.primaryColor ?? '#682025'
  );
  const [accentColor, setAccentColor] = useState(organization.secondaryColor ?? '#DFAB56');
  const [frameStyle, setFrameStyle] = useState<FrameStyleId>(() =>
    frameStyleFrom(organization.frameStyle)
  );
  const [walletPreset, setWalletPreset] = useState<WalletPresetId>(() =>
    walletPresetFrom(organization.walletColorPreset)
  );
  const [socialLinks, setSocialLinks] = useState<Record<SocialPlatformId, string>>(() =>
    socialLinksFrom(organization.socialLinks)
  );

  const [businessType, setBusinessType] = useState<BusinessType>(settings.businessType ?? 'cafe');
  const [shotCount, setShotCount] = useState(settings.defaultShotCount ?? 3);
  const [orientation, setOrientation] = useState<'vertical' | 'horizontal'>(
    settings.defaultOrientation ?? 'vertical'
  );
  const [frameShape, setFrameShape] = useState<'rounded' | 'sharp' | 'polaroid' | 'pill'>(
    settings.defaultFrameShape ?? 'rounded'
  );
  const [wallInterval, setWallInterval] = useState(
    settings.wallSettings?.slideIntervalSeconds ?? 8
  );
  const [wallMode, setWallMode] = useState<'board' | 'grid' | 'slideshow'>(
    settings.wallSettings?.mode ?? 'slideshow'
  );

  const [logoUrl, setLogoUrl] = useState<string | null>(organization.logoUrl);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Re-seed the form when a fresh organization/settings snapshot arrives. This
  // guarded render-phase update replaces the previous setState-in-effect sync.
  const [lastOrganization, setLastOrganization] = useState(organization);
  if (lastOrganization !== organization) {
    setLastOrganization(organization);
    setName(organization.name);
    setTagline(organization.tagline ?? '');
    setPrimaryColor(organization.primaryColor ?? '#682025');
    setAccentColor(organization.secondaryColor ?? '#DFAB56');
    setFrameStyle(frameStyleFrom(organization.frameStyle));
    setWalletPreset(walletPresetFrom(organization.walletColorPreset));
    setSocialLinks(socialLinksFrom(organization.socialLinks));
    setLogoUrl(organization.logoUrl);
  }

  const [lastSettings, setLastSettings] = useState(settings);
  if (lastSettings !== settings) {
    setLastSettings(settings);
    const wall = settings.wallSettings;
    if (wall) {
      setWallInterval(wall.slideIntervalSeconds ?? 8);
      setWallMode(wall.mode ?? 'slideshow');
    }
    setBusinessType(settings.businessType ?? 'cafe');
    setShotCount(settings.defaultShotCount ?? 3);
    setOrientation(settings.defaultOrientation ?? 'vertical');
    setFrameShape(settings.defaultFrameShape ?? 'rounded');
  }

  const uploadLogo = async (file: File) => {
    setIsUploadingLogo(true);
    setError(null);
    setNotice(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const response = await fetch(`/api/v1/brand/${organization.id}/logo`, {
        method: 'POST',
        body: form,
      });
      const body = (await response.json().catch(() => ({}))) as {
        logoUrl?: string;
        error?: string;
      };
      if (!response.ok || !body.logoUrl) {
        throw new Error(body.error || 'تعذر رفع الشعار');
      }
      setLogoUrl(body.logoUrl);
      setNotice('تم رفع الشعار بنجاح');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'تعذر رفع الشعار');
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canManage) return;
    setIsSaving(true);
    setNotice(null);
    setError(null);
    try {
      const cleanedSocialLinks: Record<string, string | null> = {};
      for (const field of SOCIAL_FIELDS) {
        const value = socialLinks[field.id].trim();
        cleanedSocialLinks[field.id] = value.length > 0 ? value : null;
      }

      const response = await fetch('/api/v1/merchant/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: {
            name: name.trim(),
            tagline: tagline.trim(),
            primaryColor,
            accentColor,
            frameStyle,
            walletColorPreset: walletPreset,
            socialLinks: cleanedSocialLinks,
          },
          settings: {
            businessType,
            shotCount,
            orientation,
            frameShape,
            wallSettings: {
              mode: wallMode,
              slideIntervalSeconds: wallInterval,
              blackout: settings.wallSettings?.blackout ?? false,
            },
          },
        }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        settings?: BusinessSettings;
        error?: string;
        message?: string;
      };
      if (!response.ok || !body.settings) {
        throw new Error(body.message || body.error || 'تعذر حفظ الإعدادات');
      }
      onSaved(body.settings);
      setNotice('تم حفظ الإعدادات وتطبيقها على كل الأجهزة');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'تعذر حفظ الإعدادات');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {notice && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-4 text-xs font-bold text-emerald-200">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-950/40 p-4 text-xs font-bold text-rose-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-white/10 bg-[#141212] p-6 shadow-xl md:flex-row md:items-center">
        <div>
          <h3 className="flex items-center gap-2 font-serif text-base font-bold text-[#FAF5EB]">
            <SettingsIcon className="h-5 w-5 text-[#DFAB56]" />
            <span>إعدادات المنشأة</span>
          </h3>
          <p className="mt-1 max-w-2xl text-xs text-[#A19E9B]">
            كل ما تحفظه هنا يُخزَّن على الخادم ويظهر فوراً في استوديو الزائر وشاشة الصالة ومحطة
            الكاونتر. لا يوجد أي إعداد محلي في المتصفح.
          </p>
        </div>
        <span className="rounded-md border border-white/10 bg-[#1C1B1B] px-2.5 py-1 font-mono text-[10px] text-[#A19E9B]" dir="ltr">
          /c/{organization.slug}
        </span>
      </div>

      <form onSubmit={save} className="space-y-6">
        <section className="space-y-4 rounded-2xl border border-white/10 bg-[#141212] p-6 shadow-xl">
          <h4 className="flex items-center gap-2 border-b border-white/10 pb-3 text-sm font-bold text-[#FAF5EB]">
            <Store className="h-4 w-4 text-[#DFAB56]" />
            الهوية
          </h4>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#A19E9B]">اسم المنشأة</label>
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={!canManage}
                className="w-full rounded-xl border border-white/10 bg-[#1C1B1B] px-3.5 py-2.5 text-xs text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none disabled:opacity-60"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#A19E9B]">
                العبارة التعريفية
              </label>
              <input
                value={tagline}
                onChange={(event) => setTagline(event.target.value)}
                maxLength={100}
                disabled={!canManage}
                placeholder="قهوة مختصة وذكريات لا تُنسى"
                className="w-full rounded-xl border border-white/10 bg-[#1C1B1B] px-3.5 py-2.5 text-xs text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none disabled:opacity-60"
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-[#1C1B1B] p-4 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#141212]">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="شعار المنشأة" className="h-full w-full object-contain" />
              ) : (
                <ImageIcon className="h-7 w-7 text-[#A19E9B]" />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-xs font-bold text-[#FAF5EB]">شعار المنشأة</p>
              <p className="text-[11px] text-[#A19E9B]">
                PNG فقط، بحد أقصى 2MB. يُستخدم في الواجهة وبطاقة الولاء.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={!canManage || isUploadingLogo}
                  className="flex items-center gap-1.5 rounded-lg bg-[#DFAB56] px-3.5 py-2 text-[11px] font-bold text-[#12100E] hover:bg-[#C99645] disabled:opacity-50"
                >
                  {isUploadingLogo ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  رفع شعار جديد
                </button>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoUrl(null)}
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#141212] px-3.5 py-2 text-[11px] font-bold text-[#A19E9B] hover:text-[#FAF5EB]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    إزالة من العرض
                  </button>
                )}
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadLogo(file);
                }}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#A19E9B]">اللون الأساسي</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(event) => setPrimaryColor(event.target.value.toUpperCase())}
                  disabled={!canManage}
                  className="h-9 w-12 cursor-pointer rounded-lg border border-white/10 bg-[#1C1B1B]"
                />
                <input
                  dir="ltr"
                  value={primaryColor}
                  onChange={(event) => setPrimaryColor(event.target.value.toUpperCase())}
                  disabled={!canManage}
                  pattern="^#[0-9A-Fa-f]{6}$"
                  className="w-full rounded-xl border border-white/10 bg-[#1C1B1B] px-3.5 py-2.5 font-mono text-xs text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none disabled:opacity-60"
                />
              </div>
              <p className="mt-1 text-[10px] text-[#A19E9B]">يجب أن يكون داكناً ليقرأ عليه النص الأبيض.</p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#A19E9B]">لون التمييز</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(event) => setAccentColor(event.target.value.toUpperCase())}
                  disabled={!canManage}
                  className="h-9 w-12 cursor-pointer rounded-lg border border-white/10 bg-[#1C1B1B]"
                />
                <input
                  dir="ltr"
                  value={accentColor}
                  onChange={(event) => setAccentColor(event.target.value.toUpperCase())}
                  disabled={!canManage}
                  pattern="^#[0-9A-Fa-f]{6}$"
                  className="w-full rounded-xl border border-white/10 bg-[#1C1B1B] px-3.5 py-2.5 font-mono text-xs text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none disabled:opacity-60"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#A19E9B]">نمط الإطار</label>
              <select
                value={frameStyle}
                onChange={(event) =>
                  setFrameStyle(event.target.value as 'film' | 'polaroid' | 'editorial')
                }
                disabled={!canManage}
                className="w-full rounded-xl border border-white/10 bg-[#1C1B1B] px-3.5 py-2.5 text-xs text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none disabled:opacity-60"
              >
                {FRAME_STYLES.map((style) => (
                  <option key={style.id} value={style.id}>
                    {style.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#A19E9B]">
                لون بطاقة المحفظة
              </label>
              <select
                value={walletPreset}
                onChange={(event) =>
                  setWalletPreset(
                    event.target.value as 'dark' | 'blue' | 'green' | 'red' | 'purple' | 'orange'
                  )
                }
                disabled={!canManage}
                className="w-full rounded-xl border border-white/10 bg-[#1C1B1B] px-3.5 py-2.5 text-xs text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none disabled:opacity-60"
              >
                {WALLET_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-white/10 bg-[#141212] p-6 shadow-xl">
          <h4 className="flex items-center gap-2 border-b border-white/10 pb-3 text-sm font-bold text-[#FAF5EB]">
            <Palette className="h-4 w-4 text-[#DFAB56]" />
            تجربة الاستوديو
          </h4>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#A19E9B]">نوع النشاط</label>
              <select
                value={businessType}
                onChange={(event) => setBusinessType(event.target.value as BusinessType)}
                disabled={!canManage}
                className="w-full rounded-xl border border-white/10 bg-[#1C1B1B] px-3.5 py-2.5 text-xs text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none disabled:opacity-60"
              >
                {BUSINESS_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#A19E9B]">
                عدد اللقطات في الشريط
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[2, 3, 4, 5, 6].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setShotCount(value)}
                    disabled={!canManage}
                    className={`rounded-lg border py-2 text-xs font-bold transition ${
                      shotCount === value
                        ? 'border-[#DFAB56] bg-[#DFAB56] text-[#12100E]'
                        : 'border-white/10 bg-[#1C1B1B] text-[#A19E9B] hover:text-[#FAF5EB]'
                    } disabled:opacity-50`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#A19E9B]">اتجاه الشريط</label>
              <select
                value={orientation}
                onChange={(event) =>
                  setOrientation(event.target.value as 'vertical' | 'horizontal')
                }
                disabled={!canManage}
                className="w-full rounded-xl border border-white/10 bg-[#1C1B1B] px-3.5 py-2.5 text-xs text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none disabled:opacity-60"
              >
                <option value="vertical">عمودي</option>
                <option value="horizontal">أفقي</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#A19E9B]">شكل الإطار</label>
              <select
                value={frameShape}
                onChange={(event) =>
                  setFrameShape(
                    event.target.value as 'rounded' | 'sharp' | 'polaroid' | 'pill'
                  )
                }
                disabled={!canManage}
                className="w-full rounded-xl border border-white/10 bg-[#1C1B1B] px-3.5 py-2.5 text-xs text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none disabled:opacity-60"
              >
                <option value="rounded">حواف دائرية</option>
                <option value="sharp">حواف حادة</option>
                <option value="polaroid">بولارويد</option>
                <option value="pill">كبسولة</option>
              </select>
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-white/10 bg-[#141212] p-6 shadow-xl">
          <h4 className="flex items-center gap-2 border-b border-white/10 pb-3 text-sm font-bold text-[#FAF5EB]">
            <Clock className="h-4 w-4 text-[#DFAB56]" />
            شاشة الصالة
          </h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#A19E9B]">طريقة العرض</label>
              <select
                value={wallMode}
                onChange={(event) =>
                  setWallMode(event.target.value as 'board' | 'grid' | 'slideshow')
                }
                disabled={!canManage}
                className="w-full rounded-xl border border-white/10 bg-[#1C1B1B] px-3.5 py-2.5 text-xs text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none disabled:opacity-60"
              >
                <option value="slideshow">عرض متتابع</option>
                <option value="grid">شبكة</option>
                <option value="board">لوحة</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#A19E9B]">
                مدة عرض كل ذكرى: {wallInterval} ثانية
              </label>
              <input
                type="range"
                min={3}
                max={60}
                step={1}
                value={wallInterval}
                onChange={(event) => setWallInterval(Number(event.target.value))}
                disabled={!canManage}
                className="w-full accent-[#DFAB56] disabled:opacity-60"
              />
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-white/10 bg-[#141212] p-6 shadow-xl">
          <h4 className="border-b border-white/10 pb-3 text-sm font-bold text-[#FAF5EB]">
            روابط التواصل
          </h4>
          <p className="-mt-2 text-[11px] text-[#A19E9B]">
            تُعرض في بطاقة الولاء. الروابط تُتحقق على الخادم، وأي رابط غير آمن يُرفض.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {SOCIAL_FIELDS.map((field) => (
              <div key={field.id}>
                <label className="mb-1 block font-mono text-[10px] font-bold text-[#A19E9B]">
                  {field.label}
                </label>
                <input
                  dir="ltr"
                  value={socialLinks[field.id]}
                  onChange={(event) =>
                    setSocialLinks({ ...socialLinks, [field.id]: event.target.value })
                  }
                  disabled={!canManage}
                  placeholder={field.placeholder}
                  className="w-full rounded-xl border border-white/10 bg-[#1C1B1B] px-3.5 py-2 text-xs text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none disabled:opacity-60"
                />
              </div>
            ))}
          </div>
        </section>

        {canManage && (
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 rounded-lg bg-[#DFAB56] px-6 py-3 text-xs font-bold text-[#12100E] hover:bg-[#C99645] disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            حفظ الإعدادات
          </button>
        )}
      </form>
    </div>
  );
};
