'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Printer,
  Image as ImageIcon,
  Users,
  Tv,
  Gift,
  QrCode,
  Settings,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  ExternalLink,
  UserCog,
  Sparkles,
} from 'lucide-react';
import { BusinessSettings } from '@/types/photobooth';
import { CoBrandingLogos } from '@/components/brand/CoBrandingLogos';

export type DashboardTab =
  | 'overview'
  | 'memories'
  | 'customers'
  | 'wall'
  | 'rewards'
  | 'growth'
  | 'staff'
  | 'print'
  | 'qrcodes'
  | 'settings';

interface DashboardNavBarProps {
  settings: BusinessSettings;
  activeTab: DashboardTab;
  onSelectTab: (tab: DashboardTab) => void;
  onSignOut: () => void;
  printQueueCount: number;
  pendingMemoriesCount?: number;
  role?: string;
}

const TABS: Array<{ id: DashboardTab; label: string; icon: React.ElementType }> = [
  { id: 'overview', label: 'نظرة عامة', icon: LayoutDashboard },
  { id: 'memories', label: 'ذكريات الصالة', icon: ImageIcon },
  { id: 'customers', label: 'العملاء', icon: Users },
  { id: 'wall', label: 'شاشات الصالة', icon: Tv },
  { id: 'rewards', label: 'المكافآت', icon: Gift },
  { id: 'growth', label: 'النمو والولاء', icon: Sparkles },
  { id: 'staff', label: 'الموظفون', icon: UserCog },
  { id: 'print', label: 'محطة الطباعة', icon: Printer },
  { id: 'qrcodes', label: 'رموز QR', icon: QrCode },
  { id: 'settings', label: 'الإعدادات', icon: Settings },
];

export const DashboardNavBar: React.FC<DashboardNavBarProps> = ({
  settings,
  activeTab,
  onSelectTab,
  onSignOut,
  printQueueCount,
  pendingMemoriesCount = 0,
  role,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMobileMenuOpen(false);
    };
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  const badge = (tab: DashboardTab) => {
    if (tab === 'print' && printQueueCount > 0) return printQueueCount;
    if (tab === 'memories' && pendingMemoriesCount > 0) return pendingMemoriesCount;
    return null;
  };

  const tabButton = (tab: (typeof TABS)[number], mobile = false) => {
    const Icon = tab.icon;
    const count = badge(tab.id);
    return (
      <button
        key={tab.id}
        type="button"
        onClick={() => {
          onSelectTab(tab.id);
          if (mobile) setIsMobileMenuOpen(false);
        }}
        className={`relative flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition ${
          activeTab === tab.id
            ? 'bg-[#DFAB56] text-[#12100E]'
            : 'text-[#A19E9B] hover:text-[#FAF5EB] hover:bg-white/5'
        } ${mobile ? 'w-full text-right' : ''}`}
      >
        <Icon className="w-4 h-4 shrink-0" />
        <span>{tab.label}</span>
        {count !== null && (
          <span
            className={`ms-auto min-w-5 rounded-full px-1.5 py-0.5 text-center font-mono text-[10px] ${
              activeTab === tab.id ? 'bg-[#12100E] text-[#DFAB56]' : 'bg-[#DFAB56] text-[#12100E]'
            }`}
          >
            {count}
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#141212]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <CoBrandingLogos
              cafeName={settings.branding.name}
              cafeLogoUrl={settings.branding.logoUrl}
              size="sm"
              theme="dark"
              showTagline={false}
            />
            {role && (
              <span className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-mono font-bold text-[#A19E9B] sm:inline-flex">
                <ShieldCheck className="w-3 h-3 text-[#DFAB56]" />
                {role}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/terminal"
              className="hidden items-center gap-1.5 rounded-lg border border-white/10 bg-[#1C1B1B] px-3 py-1.5 text-[11px] font-bold text-[#FAF5EB] hover:bg-[#211F1F] sm:inline-flex"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              محطة الكاونتر
            </Link>
            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#1C1B1B] px-3 py-1.5 text-[11px] font-bold text-[#FAF5EB] hover:bg-[#211F1F]"
            >
              <LogOut className="w-3.5 h-3.5" />
              خروج
            </button>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="rounded-lg border border-white/10 bg-[#1C1B1B] p-2 text-[#FAF5EB] lg:hidden"
              aria-label="فتح القائمة"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>

        <nav className="mx-auto hidden max-w-7xl items-center gap-1 overflow-x-auto px-4 pb-3 sm:px-6 lg:flex lg:px-8">
          {TABS.map((tab) => tabButton(tab))}
        </nav>
      </header>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 right-0 w-72 space-y-2 overflow-y-auto border-l border-white/10 bg-[#141212] p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-bold text-[#FAF5EB]">القائمة</span>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-lg border border-white/10 p-2 text-[#FAF5EB]"
                aria-label="إغلاق القائمة"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {TABS.map((tab) => tabButton(tab, true))}
          </div>
        </div>
      )}
    </>
  );
};
