'use client';

import React from 'react';
import { Server, Zap, Globe, HardDrive, Activity } from 'lucide-react';
import { SystemTelemetry } from '@/types/super-admin';

interface AdminTelemetrySectionProps {
  telemetry: SystemTelemetry;
}

export function AdminTelemetrySection({ telemetry }: AdminTelemetrySectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-[#FBF9F5] flex items-center gap-2 font-serif">
            <Server className="w-5 h-5 text-[#c92a54]" />
            <span>حالة السيرفرات السحابية ومقاييس الأداء لمليون مستخدم (1M Scale)</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            توزيع الحمل عبر Cloudflare Global Network + Supabase RLS Multi-Tenancy + R2 Storage
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 bg-[#141212] rounded-2xl border border-[rgba(255,255,255,0.1)] shadow-xl">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold text-stone-500">طاقة الاستيعاب التزامنية</span>
            <Zap className="w-4 h-4 text-[#c92a54]" />
          </div>
          <p className="text-2xl font-black text-[#FBF9F5]">{telemetry.totalUsersCapacity}</p>
          <p className="text-[10px] text-emerald-400 font-bold mt-1">Distributed Workers</p>
        </div>

        {/* Metric 2 */}
        <div className="p-5 bg-[#141212] rounded-2xl border border-[rgba(255,255,255,0.1)] shadow-xl">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold text-stone-500">معدل كاش الحافة (Edge Cache)</span>
            <Globe className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400">{telemetry.edgeCacheHitRatio}</p>
          <p className="text-[10px] text-stone-500/70 font-mono mt-1">330+ Global PoPs</p>
        </div>

        {/* Metric 3 */}
        <div className="p-5 bg-[#141212] rounded-2xl border border-[rgba(255,255,255,0.1)] shadow-xl">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold text-stone-500">مساحة تخزين الصور (R2 / S3)</span>
            <HardDrive className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-[#FBF9F5]">{telemetry.storageUsedGb} GB</p>
          <p className="text-[10px] text-stone-500/70 mt-1">WebP Compressed Buckets</p>
        </div>

        {/* Metric 4 */}
        <div className="p-5 bg-[#141212] rounded-2xl border border-[rgba(255,255,255,0.1)] shadow-xl">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold text-stone-500">زمن الاستجابة العالمي</span>
            <Activity className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-[#FBF9F5]">{telemetry.globalLatencyMs} ms</p>
          <p className="text-[10px] text-emerald-400 font-bold mt-1">Zero Origin Bottleneck</p>
        </div>
      </div>
    </div>
  );
}
