'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Loader2,
  Nfc,
  Pause,
  Play,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { formatDateTime, growthErrorMessage, growthFetch } from './api';
import type { GrowthBranch, NfcReader } from './types';

interface ReadersPanelProps {
  branches: GrowthBranch[];
  canManage: boolean;
}

export function ReadersPanel({ branches, canManage }: ReadersPanelProps) {
  const router = useRouter();
  const [readers, setReaders] = useState<NfcReader[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [label, setLabel] = useState('قارئ الكاشير');
  const [branchId, setBranchId] = useState(branches[0]?.id ?? '');
  const [freshTag, setFreshTag] = useState<{ readerId: string; tagUrl: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const { ok, status, body } = await growthFetch<{ readers: NfcReader[] }>(
        '/api/v1/merchant/readers'
      );
      if (status === 401) {
        router.replace('/login');
        return;
      }
      if (!ok) throw new Error(growthErrorMessage(body, 'تعذر تحميل القُرّاء'));
      setReaders(body.readers);
      // Keep an explicit choice; otherwise fall back to the first reader branch.
      setBranchId((current) => current || body.readers[0]?.branchId || '');
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'تعذر تحميل القُرّاء');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // `load` only writes state after its first await; the compiler rule scans
    // the whole async body and cannot see that boundary.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!branchId) {
      setError('اختر فرعًا أولًا.');
      return;
    }
    setNotice(null);
    setError(null);
    setIsSaving(true);
    try {
      const { ok, body } = await growthFetch<{
        reader: NfcReader;
        tagUrl: string;
      }>('/api/v1/merchant/readers', {
        method: 'POST',
        body: JSON.stringify({ label: label.trim(), branchId }),
      });
      if (!ok) throw new Error(growthErrorMessage(body, 'تعذر إنشاء القارئ'));
      setReaders((current) => [...current, body.reader]);
      setFreshTag({ readerId: body.reader.id, tagUrl: body.tagUrl });
      setNotice('تم إنشاء القارئ. اكتب الرابط على شريحة NFC الآن — لن يظهر السر مرة أخرى.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'تعذر إنشاء القارئ');
    } finally {
      setIsSaving(false);
    }
  };

  const act = async (reader: NfcReader, action: 'rotate' | 'pause' | 'activate') => {
    if (action === 'rotate' && !window.confirm('تدوير السر يبطل كل شريحة قديمة. متابعة؟')) return;
    setNotice(null);
    setError(null);
    try {
      const { ok, body } = await growthFetch<{ reader: NfcReader; tagUrl: string | null }>(
        '/api/v1/merchant/readers',
        { method: 'PATCH', body: JSON.stringify({ id: reader.id, action }) }
      );
      if (!ok) throw new Error(growthErrorMessage(body, 'تعذر تحديث القارئ'));
      setReaders((current) =>
        current.map((item) => (item.id === reader.id ? body.reader : item))
      );
      if (body.tagUrl) {
        setFreshTag({ readerId: reader.id, tagUrl: body.tagUrl });
        setNotice('تم تدوير السر. اطبع الشريحة الجديدة؛ القديمة لم تعد تعمل.');
      } else {
        setNotice(action === 'pause' ? 'تم إيقاف القارئ مؤقتًا.' : 'تم تشغيل القارئ.');
      }
    } catch (actError) {
      setError(actError instanceof Error ? actError.message : 'تعذر تحديث القارئ');
    }
  };

  const retire = async (reader: NfcReader) => {
    if (!window.confirm('إيقاف هذا القارئ نهائيًا؟ سجل النقرات سيظل محفوظًا.')) return;
    setNotice(null);
    setError(null);
    try {
      const { ok, body } = await growthFetch<{ retired: boolean }>(
        `/api/v1/merchant/readers?id=${encodeURIComponent(reader.id)}`,
        { method: 'DELETE' }
      );
      if (!ok) throw new Error(growthErrorMessage(body, 'تعذر إيقاف القارئ'));
      setReaders((current) =>
        current.map((item) => (item.id === reader.id ? { ...item, status: 'retired' } : item))
      );
    } catch (retireError) {
      setError(retireError instanceof Error ? retireError.message : 'تعذر إيقاف القارئ');
    }
  };

  const copyTag = async () => {
    if (!freshTag) return;
    try {
      await navigator.clipboard.writeText(freshTag.tagUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-black text-[#FAF5EB]">قُرّاء NFC</h2>
        <p className="text-[11px] text-[#A19E9B]">
          كل شريحة تحمل رابطًا بسرّ فريد. الخادم يخزّن بصمة SHA-256 فقط، وتدوير السر يبطل
          الشرائح القديمة فورًا.
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-[#DFAB56]/25 bg-[#1C1811] p-3 text-[10px] leading-relaxed text-[#C9B18B]">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#DFAB56]" />
        <span>
          السر يظهر مرة واحدة عند الإنشاء أو التدوير، ويُحفظ داخل جزء <code dir="ltr">#</code> من
          الرابط حتى لا يُرسل إلى السيرفر أو السجلات. لا تشارك الرابط: من يملكه يستطيع تسجيل
          نقرة.
        </span>
      </div>

      {notice && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-3 text-xs font-bold text-emerald-200">
          <CheckCircle2 className="h-4 w-4" /> {notice}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-950/30 p-3 text-xs font-bold text-rose-200">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {freshTag && (
        <div className="space-y-2 rounded-2xl border border-[#DFAB56]/40 bg-[#1C1811] p-4">
          <p className="text-[11px] font-black text-[#DFAB56]">رابط الشريحة — يُعرض مرة واحدة</p>
          <div className="flex flex-wrap items-center gap-2">
            <code
              dir="ltr"
              className="min-w-0 flex-1 overflow-x-auto rounded-lg border border-white/10 bg-[#12100E] px-3 py-2 font-mono text-[10px] text-[#FAF5EB]"
            >
              {freshTag.tagUrl}
            </code>
            <button
              type="button"
              onClick={() => void copyTag()}
              className="flex items-center gap-1 rounded-lg bg-[#DFAB56] px-2.5 py-2 text-[10px] font-black text-[#12100E]"
            >
              <Copy className="h-3 w-3" /> {copied ? 'تم النسخ' : 'نسخ'}
            </button>
          </div>
          <p className="text-[10px] text-[#A19E9B]">
            اكتبه على شريحة NTAG213/215 باستخدام أي تطبيق NFC writer، أو استخدم رابط التحميل
            المباشر في صفحة العميل.
          </p>
        </div>
      )}

      {canManage && (
        <form onSubmit={create} className="flex flex-wrap items-end gap-2 rounded-2xl border border-white/10 bg-[#141212] p-4">
          <label className="min-w-40 flex-1 text-[10px] font-bold text-[#A19E9B]">
            اسم القارئ
            <input
              required
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#1C1B1B] px-2.5 py-2 text-xs text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none"
            />
          </label>
          <label className="min-w-40 flex-1 text-[10px] font-bold text-[#A19E9B]">
            الفرع
            <select
              value={branchId}
              onChange={(event) => setBranchId(event.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#1C1B1B] px-2.5 py-2 text-xs text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none"
            >
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-1.5 rounded-lg bg-[#DFAB56] px-3 py-2 text-[11px] font-black text-[#12100E] hover:bg-[#C99645] disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            إنشاء قارئ
          </button>
        </form>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#141212] p-8 text-xs text-[#A19E9B]">
          <Loader2 className="h-4 w-4 animate-spin" /> جارٍ التحميل…
        </div>
      ) : readers.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#141212] p-8 text-center text-xs text-[#A19E9B]">
          لا توجد قُرّاء بعد. أنشئ قارئًا واكتب رابطه على شريحة NFC.
        </div>
      ) : (
        <div className="space-y-2">
          {readers.map((reader) => (
            <div
              key={reader.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#141212] p-3"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DFAB56]/15 text-[#DFAB56]">
                  <Nfc className="h-5 w-5" />
                </span>
                <div>
                  <p className="flex items-center gap-2 text-xs font-black text-[#FAF5EB]">
                    {reader.label}
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                        reader.status === 'active'
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : reader.status === 'paused'
                            ? 'bg-amber-500/15 text-amber-300'
                            : 'bg-white/10 text-[#A19E9B]'
                      }`}
                    >
                      {reader.status === 'active'
                        ? 'نشط'
                        : reader.status === 'paused'
                          ? 'متوقف'
                          : 'متقاعد'}
                    </span>
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-2 font-mono text-[10px] text-[#A19E9B]">
                    <span>{reader.branchName}</span>
                    <span dir="ltr">{reader.publicId}</span>
                    <span>آخر نقرة: {formatDateTime(reader.lastTapAt)}</span>
                  </p>
                </div>
              </div>

              {canManage && reader.status !== 'retired' && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => void act(reader, 'rotate')}
                    className="flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-[10px] font-bold text-[#A19E9B] hover:text-[#DFAB56]"
                  >
                    <RefreshCw className="h-3 w-3" /> تدوير
                  </button>
                  <button
                    type="button"
                    onClick={() => void act(reader, reader.status === 'active' ? 'pause' : 'activate')}
                    className="flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-[10px] font-bold text-[#A19E9B] hover:text-[#DFAB56]"
                  >
                    {reader.status === 'active' ? (
                      <>
                        <Pause className="h-3 w-3" /> إيقاف
                      </>
                    ) : (
                      <>
                        <Play className="h-3 w-3" /> تشغيل
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => void retire(reader)}
                    className="rounded-lg border border-rose-500/20 p-1.5 text-rose-300 hover:bg-rose-950/30"
                    aria-label="إيقاف القارئ"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
