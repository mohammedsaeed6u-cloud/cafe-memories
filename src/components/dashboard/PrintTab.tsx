'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Printer,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  X,
  Play,
  RotateCcw,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react';

export interface PrintJob {
  id: string;
  name: string;
  phone: string;
  photoStripUrl: string;
  format: string;
  copies: number;
  status: 'pending' | 'printing' | 'printed' | 'failed' | 'dismissed' | string;
  createdAt: string;
  printedAt: string | null;
  error: string | null;
  memoryId: string | null;
}

interface PrintTabProps {
  canManage: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'بانتظار الطباعة',
  printing: 'قيد الطباعة',
  printed: 'تمت الطباعة',
  failed: 'فشل',
  dismissed: 'مُستبعد',
};

const STATUS_STYLES: Record<string, string> = {
  pending: 'border-[#DFAB56]/40 bg-[#3D2314]/60 text-[#FAF5EB]',
  printing: 'border-sky-500/40 bg-sky-950/40 text-sky-200',
  printed: 'border-emerald-500/40 bg-emerald-950/40 text-emerald-200',
  failed: 'border-rose-500/40 bg-rose-950/40 text-rose-200',
  dismissed: 'border-white/10 bg-white/5 text-[#A19E9B]',
};

export const PrintTab: React.FC<PrintTabProps> = ({ canManage }) => {
  const [jobs, setJobs] = useState<PrintJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'active' | 'all' | 'printed'>('active');
  const [preview, setPreview] = useState<PrintJob | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setListError(null);
    try {
      const response = await fetch('/api/v1/print/jobs?status=all&limit=100', {
        cache: 'no-store',
      });
      if (response.status === 401) {
        window.location.assign('/login');
        return;
      }
      const body = (await response.json().catch(() => ({}))) as {
        jobs?: PrintJob[];
        error?: string;
      };
      if (!response.ok) throw new Error(body.error || 'تعذر تحميل طابور الطباعة');
      setJobs(body.jobs ?? []);
    } catch (error) {
      setListError(error instanceof Error ? error.message : 'تعذر تحميل طابور الطباعة');
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

  const updateStatus = async (job: PrintJob, status: 'printing' | 'printed' | 'failed') => {
    setBusyId(job.id);
    setActionError(null);
    setNotice(null);
    try {
      const response = await fetch('/api/v1/print/jobs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: job.id,
          status,
          ...(status === 'failed' ? { error: 'print_failed' } : {}),
        }),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(body.error || 'تعذر تحديث حالة الطباعة');
      setNotice(`تم تحديث الطلب إلى: ${STATUS_LABELS[status]}`);
      await load();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'تعذر تحديث حالة الطباعة');
    } finally {
      setBusyId(null);
    }
  };

  const dismiss = async (job: PrintJob) => {
    if (!window.confirm('استبعاد طلب الطباعة من القائمة؟')) return;
    setBusyId(job.id);
    setActionError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/v1/print/jobs?id=${encodeURIComponent(job.id)}`, {
        method: 'DELETE',
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(body.error || 'تعذر استبعاد الطلب');
      setNotice('تم استبعاد الطلب');
      await load();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'تعذر استبعاد الطلب');
    } finally {
      setBusyId(null);
    }
  };

  const filtered = useMemo(() => {
    if (filter === 'all') return jobs;
    if (filter === 'printed') return jobs.filter((job) => job.status === 'printed');
    return jobs.filter((job) => job.status === 'pending' || job.status === 'printing');
  }, [jobs, filter]);

  const pendingCount = jobs.filter((job) => job.status === 'pending').length;
  const printingCount = jobs.filter((job) => job.status === 'printing').length;
  const printedCount = jobs.filter((job) => job.status === 'printed').length;

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
            <Printer className="h-5 w-5 text-[#DFAB56]" />
            <span>طابور الطباعة</span>
          </h3>
          <p className="mt-1 max-w-2xl text-xs text-[#A19E9B]">
            طلبات الزوار تصل هنا مباشرة. اطبع الصورة من جهاز الكاونتر ثم حدّث حالتها حتى تبقى
            القائمة مطابقة للواقع على كل الأجهزة.
          </p>
          <div className="mt-2 flex flex-wrap gap-2 font-mono text-[10px]">
            <span className="rounded-md border border-[#DFAB56]/40 bg-[#3D2314]/60 px-2 py-0.5 text-[#FAF5EB]">
              {pendingCount} بانتظار
            </span>
            <span className="rounded-md border border-sky-500/30 bg-sky-950/40 px-2 py-0.5 text-sky-200">
              {printingCount} قيد الطباعة
            </span>
            <span className="rounded-md border border-emerald-500/30 bg-emerald-950/40 px-2 py-0.5 text-emerald-200">
              {printedCount} مكتمل
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void load()}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#1C1B1B] px-3 py-2 text-xs font-bold text-[#FAF5EB] hover:bg-[#211F1F]"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          تحديث
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: 'active', label: 'الطلبات النشطة' },
            { id: 'printed', label: 'المكتملة' },
            { id: 'all', label: 'الكل' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`rounded-lg border px-3.5 py-2 text-xs font-bold transition ${
              filter === tab.id
                ? 'border-[#DFAB56] bg-[#DFAB56] text-[#12100E]'
                : 'border-white/10 bg-[#1C1B1B] text-[#A19E9B] hover:text-[#FAF5EB]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {listError ? (
        <p className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-6 text-center text-xs text-rose-200">
          {listError}
        </p>
      ) : isLoading ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#141212] p-10 text-xs text-[#A19E9B]">
          <Loader2 className="h-4 w-4 animate-spin" />
          جاري تحميل الطابور...
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/15 bg-[#141212] p-10 text-center text-xs text-[#A19E9B]">
          لا توجد طلبات في هذا التصنيف.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((job) => (
            <div
              key={job.id}
              className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#141212] p-4 shadow-xl"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setPreview(job)}
                    className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-[#1C1B1B]"
                    title="معاينة الصورة"
                  >
                    {job.photoStripUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={job.photoStripUrl}
                        alt={`صورة ${job.name}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-[#A19E9B]">
                        <ImageIcon className="h-5 w-5" />
                      </span>
                    )}
                  </button>
                  <div>
                    <div className="text-xs font-bold text-[#FAF5EB]">{job.name}</div>
                    {job.phone && (
                      <div className="font-mono text-[10px] text-[#A19E9B]" dir="ltr">
                        {job.phone}
                      </div>
                    )}
                    <div className="mt-1 font-mono text-[10px] text-[#A19E9B]">
                      {job.format} • {job.copies} نسخة
                    </div>
                  </div>
                </div>
                <span
                  className={`rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold ${
                    STATUS_STYLES[job.status] ?? STATUS_STYLES.pending
                  }`}
                >
                  {STATUS_LABELS[job.status] ?? job.status}
                </span>
              </div>

              <div className="flex items-center justify-between font-mono text-[10px] text-[#A19E9B]">
                <span>{new Date(job.createdAt).toLocaleString('ar-SA')}</span>
                {job.printedAt && (
                  <span>طُبعت {new Date(job.printedAt).toLocaleTimeString('ar-SA')}</span>
                )}
              </div>

              {job.error && (
                <p className="rounded-lg border border-rose-500/30 bg-rose-950/30 px-2.5 py-1.5 font-mono text-[10px] text-rose-200">
                  {job.error}
                </p>
              )}

              {canManage && job.status !== 'dismissed' && (
                <div className="mt-auto flex flex-wrap gap-1.5">
                  {job.status === 'pending' && (
                    <button
                      type="button"
                      disabled={busyId === job.id}
                      onClick={() => void updateStatus(job, 'printing')}
                      className="flex items-center gap-1.5 rounded-lg bg-[#DFAB56] px-3 py-1.5 text-[11px] font-bold text-[#12100E] hover:bg-[#C99645] disabled:opacity-50"
                    >
                      {busyId === job.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Play className="h-3.5 w-3.5" />
                      )}
                      بدء الطباعة
                    </button>
                  )}
                  {job.status === 'printing' && (
                    <button
                      type="button"
                      disabled={busyId === job.id}
                      onClick={() => void updateStatus(job, 'printed')}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-[11px] font-bold text-emerald-950 hover:bg-emerald-400 disabled:opacity-50"
                    >
                      {busyId === job.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                      تمت الطباعة
                    </button>
                  )}
                  {(job.status === 'pending' || job.status === 'printing') && (
                    <button
                      type="button"
                      disabled={busyId === job.id}
                      onClick={() => void updateStatus(job, 'failed')}
                      className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#1C1B1B] px-3 py-1.5 text-[11px] font-bold text-[#FAF5EB] hover:bg-[#211F1F] disabled:opacity-50"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      تعذر
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busyId === job.id}
                    onClick={() => void dismiss(job)}
                    className="ms-auto flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-950/30 px-3 py-1.5 text-[11px] font-bold text-rose-200 hover:bg-rose-950/60 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    استبعاد
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl border border-white/10 bg-[#141212] p-4">
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="absolute end-3 top-3 rounded-lg border border-white/10 bg-[#1C1B1B] p-1.5 text-[#FAF5EB]"
              aria-label="إغلاق"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="mb-3 pe-10 text-xs font-bold text-[#FAF5EB]">
              معاينة الطباعة — {preview.name}
            </div>
            {preview.photoStripUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview.photoStripUrl}
                alt={`معاينة ${preview.name}`}
                className="max-h-[70vh] w-full rounded-xl object-contain"
              />
            ) : (
              <p className="p-8 text-center text-xs text-[#A19E9B]">الصورة غير متاحة.</p>
            )}
            <a
              href={preview.photoStripUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-[#DFAB56] px-4 py-2.5 text-xs font-bold text-[#12100E] hover:bg-[#C99645]"
            >
              <ImageIcon className="h-4 w-4" />
              فتح الصورة بالحجم الكامل
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
