'use client';

import React from 'react';
import { Layers, Printer, Monitor, ExternalLink } from 'lucide-react';
import { TenantSummary, TenantFeatureFlags } from '@/types/super-admin';

interface AdminFeatureFlagsTableProps {
  tenants: TenantSummary[];
  onToggleFeature: (tenantId: string, feature: keyof TenantFeatureFlags, currentValue: boolean) => void;
}

export function AdminFeatureFlagsTable({ tenants, onToggleFeature }: AdminFeatureFlagsTableProps) {
  return (
    <div className="bg-[#141212] rounded-2xl border border-[rgba(255,255,255,0.1)] shadow-xl overflow-hidden">
      <div className="p-6 border-b border-[rgba(255,255,255,0.1)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-base font-bold text-[#FBF9F5] flex items-center gap-2 font-serif">
            <Layers className="w-4 h-4 text-[#c92a54]" />
            <span>التحكم في الميزات التشغيلية (Feature Flags)</span>
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            تفعيل أو إيقاف محطة الطباعة وشاشات العرض لكل فرع بنقرة واحدة
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.1)] bg-[#141212] text-[11px] font-bold uppercase text-stone-500 tracking-wider">
              <th className="py-4 px-5">المنشأة / المشترك</th>
              <th className="py-4 px-5 text-center">ميزة الطباعة 2x6</th>
              <th className="py-4 px-5 text-center">ميزة شاشة العرض (TV Wall)</th>
              <th className="py-4 px-5">المعاينة المباشرة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm">
            {tenants.map((t) => (
              <tr key={t.id} className="hover:bg-white/[0.03] transition">
                <td className="py-4 px-5 font-bold text-[#FBF9F5]">
                  <div>
                    <p className="leading-tight">{t.name}</p>
                    <p className="text-[11px] text-stone-500 font-mono mt-0.5">/{t.slug}</p>
                  </div>
                </td>

                <td className="py-4 px-5 text-center">
                  <button
                    onClick={() =>
                      onToggleFeature(t.id, 'printing', t.features.printing)
                    }
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs ${
                      t.features.printing
                        ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/60'
                        : 'bg-[#141212] text-stone-500 border border-[rgba(255,255,255,0.1)] hover:bg-[#252424]'
                    }`}
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>{t.features.printing ? 'مُفعّلة (ON)' : 'مُعطّلة (OFF)'}</span>
                  </button>
                </td>

                <td className="py-4 px-5 text-center">
                  <button
                    onClick={() =>
                      onToggleFeature(t.id, 'tvWall', t.features.tvWall)
                    }
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs ${
                      t.features.tvWall
                        ? 'bg-sky-950/40 text-sky-400 border border-sky-800/60'
                        : 'bg-[#141212] text-stone-500 border border-[rgba(255,255,255,0.1)] hover:bg-[#252424]'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>{t.features.tvWall ? 'مُفعّلة (ON)' : 'مُعطّلة (OFF)'}</span>
                  </button>
                </td>

                <td className="py-4 px-5">
                  <div className="flex items-center gap-2">
                    <a
                      href={`/c/${t.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-[#141212] hover:bg-[#252424] text-[#FBF9F5] text-xs font-bold flex items-center gap-1 transition border border-[rgba(255,255,255,0.1)]"
                    >
                      <span>الفوتوبوث</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <a
                      href={`/wall/${t.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-[#c92a54] hover:bg-amber-700 text-[#FBF9F5] text-xs font-bold flex items-center gap-1 transition shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
                    >
                      <span>الشاشة</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
