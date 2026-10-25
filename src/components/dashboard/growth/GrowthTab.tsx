'use client';

import React, { useState } from 'react';
import {
  Activity,
  BellRing,
  Gift,
  MapPin,
  Nfc,
  Sparkles,
  Stamp,
} from 'lucide-react';
import { InsightsPanel } from './InsightsPanel';
import { LadderPanel } from './LadderPanel';
import { PromotionsPanel } from './PromotionsPanel';
import { NudgesPanel } from './NudgesPanel';
import { ReadersPanel } from './ReadersPanel';
import { DiscoveryPanel } from './DiscoveryPanel';
import type { GrowthBranch, GrowthSection } from './types';

interface GrowthTabProps {
  branches: GrowthBranch[];
  branchId: string;
  canManage: boolean;
}

const SECTIONS: Array<{
  id: GrowthSection;
  label: string;
  icon: React.ElementType;
  hint: string;
}> = [
  { id: 'insights', label: 'التحليلات', icon: Activity, hint: 'النقرات والعملاء' },
  { id: 'ladder', label: 'سلم المكافآت', icon: Gift, hint: 'مكافآت متعددة' },
  { id: 'promotions', label: 'عروض الأختام', icon: Stamp, hint: 'مضاعفات مؤقتة' },
  { id: 'nudges', label: 'تنبيهات المحفظة', icon: BellRing, hint: 'Wallet' },
  { id: 'discovery', label: 'الاكتشاف', icon: MapPin, hint: 'دليل العملاء' },
  { id: 'readers', label: 'قُرّاء NFC', icon: Nfc, hint: 'الشرائح والأمان' },
];

export function GrowthTab({ branches, branchId, canManage }: GrowthTabProps) {
  const [section, setSection] = useState<GrowthSection>('insights');

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-l from-[#1C1811] to-[#141212] p-4">
        <div className="flex items-center gap-2 text-xs font-black text-[#FAF5EB]">
          <Sparkles className="h-4 w-4 text-[#DFAB56]" />
          النمو والولاء
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-[#A19E9B]">
          نقرة واحدة على شريحة NFC تسجّل الزيارة، تمنح الأختام، تطبّق العرض، وتصدر المكافآت —
          دون تطبيق ودون إدخال رقم هاتف.
        </p>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {SECTIONS.map((item) => {
          const Icon = item.icon;
          const active = section === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-start transition ${
                active
                  ? 'border-[#DFAB56] bg-[#DFAB56]/15 text-[#DFAB56]'
                  : 'border-white/10 bg-[#141212] text-[#A19E9B] hover:text-[#FAF5EB]'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>
                <span className="block text-[11px] font-black">{item.label}</span>
                <span className="block text-[9px] opacity-70">{item.hint}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0F0E0E] p-4">
        {section === 'insights' && <InsightsPanel branchId={branchId} />}
        {section === 'ladder' && <LadderPanel canManage={canManage} />}
        {section === 'promotions' && (
          <PromotionsPanel branches={branches} canManage={canManage} />
        )}
        {section === 'nudges' && <NudgesPanel canManage={canManage} />}
        {section === 'discovery' && <DiscoveryPanel canManage={canManage} />}
        {section === 'readers' && <ReadersPanel branches={branches} canManage={canManage} />}
      </div>
    </div>
  );
}
