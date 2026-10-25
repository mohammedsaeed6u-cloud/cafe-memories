'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  BellRing,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Send,
  Wallet,
} from 'lucide-react';
import { formatDateTime, growthErrorMessage, growthFetch } from './api';
import type { NudgeCampaign } from './types';

interface NudgesPanelProps {
  canManage: boolean;
}

const AUDIENCES: Array<{ id: string; label: string; hint: string }> = [
  { id: 'reward_ready', label: 'مكافأة جاهزة', hint: 'لديهم كارت مكتمل لم يُستبدل بعد.' },
  { id: 'almost_there', label: 'على وشك الوصول', hint: 'باقي ختم واحد أو أقل لإكمال الكارت.' },
  { id: 'winback', label: 'استرجاع', hint: 'آخر زيارة بين ٣٠ و٦٠ يومًا.' },
  { id: 'inactive30', label: 'غير نشط ٣٠ يومًا', hint: 'لم يزوروا منذ أكثر من ٣٠ يومًا.' },
  { id: 'returning', label: 'عملاء عائدون', hint: 'ثلاث زيارات مؤكدة أو أكثر.' },
  { id: 'all', label: 'الجميع', hint: 'كل من فعّل المحفظة والتسويق.' },
];

export function NudgesPanel({ canManage }: NudgesPanelProps) {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<NudgeCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [audience, setAudience] = useState('reward_ready');
  const [message, setMessage] = useState('مكافأتك جاهزة! افتح المحفظة واعرض الكارت عند الكاشير.');
  const [pendingCampaign, setPendingCampaign] = useState<string | null>(null);
  const [messagingAvailable, setMessagingAvailable] = useState(true);

  const load = useCallback(async () => {
    try {
      const { ok, status, body } = await growthFetch<{
        campaigns: NudgeCampaign[];
        messagingAvailable?: boolean;
      }>('/api/v1/merchant/nudges');
      if (status === 401) {
        router.replace('/login');
        return;
      }
      if (!ok) throw new Error(growthErrorMessage(body, 'تعذر تحميل الحملات'));
      setCampaigns(body.campaigns);
      setMessagingAvailable(body.messagingAvailable !== false);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'تعذر تحميل الحملات');
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

  const send = async (campaignId?: string) => {
    setNotice(null);
    setError(null);
    setIsSending(true);
    try {
      const { ok, body } = await growthFetch<{
        campaignId: string;
        claimed: number;
        accepted: number;
        unknown: number;
        done: boolean;
        needsReview?: boolean;
      }>('/api/v1/merchant/nudges', {
        method: 'POST',
        body: JSON.stringify(
          campaignId
            ? { campaignId, audience, message }
            : { audience, message: message.trim() }
        ),
      });
      if (!ok) throw new Error(growthErrorMessage(body, 'تعذر إرسال التنبيه'));
      if (body.done) {
        setPendingCampaign(null);
        setNotice(
          `تمت المعالجة: ${body.accepted} تحديث ناجح، ${body.unknown} يحتاج مراجعة. لا يُعاد الإرسال تلقائيًا.`
        );
      } else {
        setPendingCampaign(body.campaignId);
        setNotice(
          `تمت معالجة دفعة (${body.accepted} ناجح). اضغط «متابعة» لإكمال بقية الجمهور.`
        );
      }
      await load();
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'تعذر إرسال التنبيه');
    } finally {
      setIsSending(false);
    }
  };

  const selected = AUDIENCES.find((item) => item.id === audience);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-black text-[#FAF5EB]">تنبيهات المحفظة</h2>
        <p className="text-[11px] text-[#A19E9B]">
          تحديث مباشر لكارت Apple/Google Wallet الموجود على جهاز العميل. لا يُرسل SMS ولا يحتاج
          تطبيقًا. متاح لمن فعّل المحفظة والتسويق فقط.
        </p>
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

      {!messagingAvailable && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-950/30 p-3 text-xs font-bold text-amber-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            تنبيهات المحفظة تحتاج خطة Pro في WalletWallet لهذا المكان. على الخطة المجانية لا يظهر حقل
            الرسالة على الكارت، لذلك لن تُنشأ حملة حتى تُرقّى الخطة.
          </span>
        </div>
      )}

      {canManage && (
        <div className="space-y-3 rounded-2xl border border-white/10 bg-[#141212] p-4">
          <div className="flex items-center gap-2 text-xs font-black text-[#FAF5EB]">
            <BellRing className="h-4 w-4 text-[#DFAB56]" /> حملة جديدة
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-[10px] font-bold text-[#A19E9B]">
              الجمهور
              <select
                value={audience}
                onChange={(event) => setAudience(event.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#1C1B1B] px-2.5 py-2 text-xs text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none"
              >
                {AUDIENCES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
              {selected && <span className="mt-1 block text-[9px] text-[#6F6C69]">{selected.hint}</span>}
            </label>
            <label className="text-[10px] font-bold text-[#A19E9B]">
              الرسالة ({message.length}/110)
              <input
                value={message}
                maxLength={110}
                onChange={(event) => setMessage(event.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#1C1B1B] px-2.5 py-2 text-xs text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none"
              />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isSending || !messagingAvailable || message.trim().length < 3}
              onClick={() => void send(pendingCampaign ?? undefined)}
              className="flex items-center gap-1.5 rounded-lg bg-[#DFAB56] px-3 py-2 text-[11px] font-black text-[#12100E] hover:bg-[#C99645] disabled:opacity-50"
            >
              {isSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              {pendingCampaign ? 'متابعة الحملة' : 'إرسال التنبيه'}
            </button>
            {pendingCampaign && (
              <button
                type="button"
                onClick={() => setPendingCampaign(null)}
                className="rounded-lg border border-white/10 px-3 py-2 text-[11px] font-bold text-[#A19E9B]"
              >
                حملة جديدة
              </button>
            )}
            <span className="flex items-center gap-1 text-[10px] text-[#6F6C69]">
              <Wallet className="h-3 w-3" /> بحد أقصى تنبيه واحد لكل كارت كل ٢٤ ساعة.
            </span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs font-black text-[#FAF5EB]">آخر الحملات</p>
        <button
          type="button"
          onClick={() => {
            setIsLoading(true);
            void load();
          }}
          className="flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-[10px] font-bold text-[#A19E9B] hover:text-[#FAF5EB]"
        >
          <RefreshCw className="h-3 w-3" /> تحديث
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#141212] p-8 text-xs text-[#A19E9B]">
          <Loader2 className="h-4 w-4 animate-spin" /> جارٍ التحميل…
        </div>
      ) : campaigns.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#141212] p-8 text-center text-xs text-[#A19E9B]">
          لا توجد حملات بعد. ابدأ بتنبيه «مكافأة جاهزة» — أعلى نسبة استجابة عادة.
        </div>
      ) : (
        <div className="space-y-2">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="rounded-2xl border border-white/10 bg-[#141212] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-black text-[#FAF5EB]">{campaign.name}</p>
                <span className="font-mono text-[10px] text-[#A19E9B]">
                  {formatDateTime(campaign.createdAt)}
                </span>
              </div>
              <p className="mt-1 text-[10px] text-[#A19E9B]">{campaign.message}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px]">
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-bold text-emerald-300">
                  {campaign.sent} أُرسل
                </span>
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 font-bold text-amber-300">
                  {campaign.processing} قيد المعالجة
                </span>
                <span className="rounded-full bg-rose-500/15 px-2 py-0.5 font-bold text-rose-300">
                  {campaign.unknown} غير مؤكد
                </span>
                <span className="text-[#6F6C69]">{campaign.audience}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
