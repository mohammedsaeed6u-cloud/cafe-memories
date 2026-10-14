'use client';

import React from 'react';
import { Sparkles, ShieldCheck } from 'lucide-react';

interface TerminalGuidelinesProps {
  requiredVisits: number;
  staffLabel: string;
  staffMemberName?: string;
}

export function TerminalGuidelines({
  requiredVisits,
  staffLabel,
  staffMemberName,
}: TerminalGuidelinesProps) {
  return (
    <div className="space-y-4">
      <div className="p-6 rounded-3xl bg-[#141212] border border-white/10 shadow-lg space-y-3">
        <h4 className="font-bold text-sm text-[#FBF9F5] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#c92a54]" />
          <span>إرشادات تشغيل الكاونتر:</span>
        </h4>
        <ul className="text-xs text-[#A19E9B] space-y-2.5 leading-relaxed">
          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-[#98183c]/50 text-[#FBF9F5] border border-[#c92a54]/30 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
            <span>العميل يحصل على خدمته ويذكر رقم جواله أو يمسح كود الفرع.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-[#98183c]/50 text-[#FBF9F5] border border-[#c92a54]/30 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
            <span>اضغط <strong>«ختم زيارة جديدة»</strong> لإضافة ختم فوري وبث إشعار لشاشة قفل هاتف العميل بشعار متجرك.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
            <span>عند إكمال {requiredVisits} أختام، يتفعل زر <strong>«تسليم الهدية»</strong> باللون الأخضر للاستبدال الفوري.</span>
          </li>
        </ul>
      </div>

      <div className="p-4 rounded-2xl bg-[#141212] border border-white/10 shadow-lg flex items-center justify-between text-xs font-bold text-[#FBF9F5]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{staffLabel} المسؤول:</span>
        </div>
        <span className="font-mono text-[#FBF9F5]">{staffMemberName || `${staffLabel} المعتمد`}</span>
      </div>
    </div>
  );
}
