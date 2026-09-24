'use client';

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Printer,
  Image as ImageIcon,
  Users,
  Tv,
  Gift,
  QrCode,
  Sliders,
  BarChart3,
  Settings,
  CreditCard,
  Sparkles,
  ExternalLink,
  Store,
  ShieldCheck,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { BusinessSettings } from '@/types/photobooth';
import { StaffMember } from '@/types/staff';
import { CoBrandingLogos } from '@/components/brand/CoBrandingLogos';

export type DashboardTab =
  | 'overview'
  | 'print'
  | 'memories'
  | 'customers'
  | 'wall'
  | 'rewards'
  | 'qrcodes'
  | 'frames'
  | 'analytics'
  | 'settings'
  | 'billing';

interface DashboardNavBarProps {
  settings: BusinessSettings;
  activeTab: DashboardTab;
  onSelectTab: (tab: DashboardTab) => void;
  activeStaff: StaffMember | null;
  onOpenStaffModal: () => void;
  onOpenQuickSetup: () => void;
  onOpenBaristaRedeem: () => void;
  onSignOut: () => void;
  printQueueCount: number;
  pendingMemoriesCount?: number;
}

export const DashboardNavBar: React.FC<DashboardNavBarProps> = ({
  settings,
  activeTab,
  onSelectTab,
  activeStaff,
  onOpenStaffModal,
  onOpenQuickSetup,
  onOpenBaristaRedeem,
  onSignOut,
  printQueueCount,
  pendingMemoriesCount,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
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

  const allTabs: { id: DashboardTab; label: string; icon: any; badge?: number }[] = [
    { id: 'overview', label: 'نظرة عامة', icon: LayoutDashboard },
    { id: 'print', label: 'محطة الطباعة', icon: Printer, badge: printQueueCount },
    { id: 'memories', label: 'اعتماد الذكريات', icon: ImageIcon, badge: pendingMemoriesCount },
    { id: 'customers', label: 'العملاء والولاء', icon: Users },
    { id: 'wall', label: 'شاشات الصالة', icon: Tv },
    { id: 'rewards', label: 'المكافآت', icon: Gift },
    { id: 'qrcodes', label: 'أكواد الطاولات', icon: QrCode },
    { id: 'frames', label: 'استوديو الإطارات', icon: Sliders },
    { id: 'analytics', label: 'التحليلات', icon: BarChart3 },
    { id: 'settings', label: 'الإعدادات والهوية', icon: Settings },
    { id: 'billing', label: 'الاشتراك والباقة', icon: CreditCard },
  ];

  return (
    <header className="bg-white border-b border-stone-200/90 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CoBrandingLogos
            cafeName={settings.branding?.name || 'Memories Studio'}
            cafeLogoUrl={settings.branding?.logoUrl}
            size="md"
            showTagline={true}
          />
        </div>

        {/* Desktop Quick Actions */}
        <div className="hidden lg:flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={onOpenQuickSetup}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>إعداد المنشأة والـ QR</span>
          </button>

          <a
            href={`/wall/screen-1?cafe=${settings.cafeSlug || 'memories'}`}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-1.5 rounded-xl border border-stone-300 hover:border-stone-400 bg-white text-xs font-bold text-stone-700 flex items-center gap-1.5 transition"
          >
            <Tv className="w-3.5 h-3.5 text-amber-600" />
            <span>فتح شاشة العرض (Live Wall)</span>
            <ExternalLink className="w-3 h-3 text-stone-400" />
          </a>

          <button
            type="button"
            onClick={() => onSelectTab('billing')}
            className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200/80 text-xs font-bold text-amber-900 flex items-center gap-1.5 transition cursor-pointer"
            title="إدارة الباقة والاشتراك"
          >
            <CreditCard className="w-3.5 h-3.5 text-amber-700" />
            <span>الاشتراك والباقة</span>
          </button>

          <a
            href={`/terminal?cafe=${settings.cafeSlug || 'memories'}`}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-xs font-bold text-amber-950 flex items-center gap-1.5 transition cursor-pointer"
            title="فتح محطة الكاونتر ونقاط الخدمة المستقلة"
          >
            <Store className="w-3.5 h-3.5 text-amber-700" />
            <span>محطة الكاونتر (POS)</span>
          </a>

          <button
            type="button"
            onClick={onOpenBaristaRedeem}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            title="التحقق من كود الهدية وصرفها للزائر فوراً"
          >
            <Gift className="w-3.5 h-3.5" />
            <span>صرف هدية للزائر</span>
          </button>

          <button
            type="button"
            onClick={onOpenStaffModal}
            className="px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-xs font-bold text-stone-800 flex items-center gap-1.5 transition cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{activeStaff ? activeStaff.name : 'تسجيل الموظف (PIN)'}</span>
          </button>

          <button
            type="button"
            onClick={onSignOut}
            className="p-2 rounded-xl border border-stone-200 hover:border-red-200 hover:bg-red-50 text-stone-500 hover:text-red-600 transition cursor-pointer"
            title="تسجيل الخروج"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile Top Controls: Quick Stamp + Hamburger Toggle */}
        <div className="flex lg:hidden items-center gap-2">
          <button
            type="button"
            onClick={onOpenBaristaRedeem}
            className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition shadow-xs"
            title="صرف هدية"
          >
            <Gift className="w-3.5 h-3.5" />
            <span className="text-[11px]">صرف هدية</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? 'إغلاق القائمة' : 'فتح القائمة الرئيسية'}
            aria-expanded={isMobileMenuOpen}
            className="p-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-800 transition cursor-pointer"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-stone-900" />
            ) : (
              <Menu className="w-5 h-5 text-stone-900" />
            )}
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs (Desktop Scrollable) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 hidden lg:flex items-center gap-1 overflow-x-auto border-t border-stone-100 py-1.5 scrollbar-none">
        {allTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-amber-600 text-white shadow-sm ring-1 ring-amber-700/20'
                  : 'text-stone-600 hover:text-stone-950 hover:bg-stone-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {Boolean(tab.badge && tab.badge > 0) && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-stone-950 text-[10px] font-black animate-pulse">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Mobile / Tablet Horizontal Scrollable Tab Strip (Direct Quick Switching) */}
      <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto px-3.5 py-2 border-t border-stone-200/70 bg-stone-50/70 scrollbar-none touch-pan-x">
        {allTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer active:scale-95 ${
                isActive
                  ? 'bg-amber-600 text-white shadow-xs font-black'
                  : 'text-stone-700 bg-white border border-stone-200 hover:bg-stone-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
              {Boolean(tab.badge && tab.badge > 0) && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                    isActive ? 'bg-white text-stone-900' : 'bg-amber-500 text-stone-950'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Mobile Drawer (Tabs + Quick Actions) */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 top-16 z-50 lg:hidden bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="bg-white border-b border-stone-200 p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-top-4 duration-250"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Quick Actions Bar */}
            <div className="grid grid-cols-2 gap-2 pb-3 border-b border-stone-100">
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenQuickSetup();
                }}
                className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>إعداد الـ QR</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenStaffModal();
                }}
                className="p-2.5 rounded-xl bg-stone-100 border border-stone-200 text-stone-900 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{activeStaff ? activeStaff.name : 'رمز PIN'}</span>
              </button>

              <a
                href={`/terminal?cafe=${settings.cafeSlug || 'memories'}`}
                className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Store className="w-3.5 h-3.5 text-emerald-700" />
                <span>محطة POS</span>
              </a>

              <a
                href={`/wall/screen-1?cafe=${settings.cafeSlug || 'memories'}`}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Tv className="w-3.5 h-3.5 text-purple-700" />
                <span>شاشة الصالة</span>
              </a>
            </div>

            {/* All Tabs List */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono tracking-widest text-stone-400 font-bold uppercase block px-2 mb-1">
                تبويبات لوحة التحكم
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {allTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        onSelectTab(tab.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full px-3.5 py-3 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                        isActive
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-stone-700 hover:text-stone-950 hover:bg-stone-100 bg-stone-50/70 border border-stone-200/70'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                      </div>
                      {Boolean(tab.badge && tab.badge > 0) && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          isActive ? 'bg-white text-stone-900' : 'bg-amber-500 text-stone-950'
                        }`}>
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Logout */}
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onSignOut();
                }}
                className="w-full py-2.5 px-3 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>تسجيل الخروج من الحساب</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

