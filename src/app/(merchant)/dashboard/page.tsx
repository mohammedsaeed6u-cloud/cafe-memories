'use client';

import React, { useState, useEffect } from 'react';
import { BusinessSettings } from '@/types/photobooth';
import { BusinessSettingsService } from '@/lib/services/business-settings.service';
import { FrameStudioTab } from '@/components/dashboard/FrameStudioTab';
import { CustomerCRMTab, CustomerVisitRecord } from '@/components/dashboard/CustomerCRMTab';
import { PrintStationTab } from '@/components/dashboard/PrintStationTab';
import { TVModerationTab } from '@/components/dashboard/TVModerationTab';
import {
  Sparkles,
  Users,
  Printer,
  Palette,
  Monitor,
  ExternalLink,
  Store,
} from 'lucide-react';

export default function MerchantDashboardPage() {
  const cafeSlug = 'espresso-lab';

  const [settings, setSettings] = useState<BusinessSettings>(() =>
    BusinessSettingsService.getSettings(cafeSlug)
  );

  const [activeTab, setActiveTab] = useState<'crm' | 'studio' | 'print' | 'wall'>('studio');
  const [customers, setCustomers] = useState<CustomerVisitRecord[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);

  // Load customer data from API
  useEffect(() => {
    async function fetchCustomers() {
      setIsLoadingCustomers(true);
      try {
        const res = await fetch('/api/v1/crm/customers?format=json');
        if (res.ok) {
          const data = await res.json();
          if (data.customers && data.customers.length > 0) {
            setCustomers(
              data.customers.map((c: any) => ({
                id: c.id,
                name: c.name,
                phone: c.phone,
                role: c.role || 'coffee_lover',
                totalVisits: c.visitsCount || 1,
                lastVisit: c.lastVisit || new Date().toISOString(),
                giftCode: c.giftCode || 'GIFT-1001',
                photoStripUrl: c.photoStripUrl || c.photos?.[0],
                photos: c.photos || [],
              }))
            );
            return;
          }
        }
      } catch (err) {
        console.warn('Could not fetch from API, loading mock state', err);
      } finally {
        setIsLoadingCustomers(false);
      }

      // Fallback sample data if empty
      setCustomers([
        {
          id: 'cust-1',
          name: 'سارة المهندس',
          phone: '01019882233',
          role: 'tech_freelancer',
          totalVisits: 5,
          lastVisit: new Date().toISOString(),
          giftCode: 'GIFT-9921',
          photoStripUrl:
            'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&auto=format&fit=crop&q=80',
        },
        {
          id: 'cust-2',
          name: 'عمر شريف',
          phone: '01224556677',
          role: 'creator_creative',
          totalVisits: 3,
          lastVisit: new Date(Date.now() - 86400000).toISOString(),
          giftCode: 'GIFT-4432',
          photoStripUrl:
            'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=80',
        },
        {
          id: 'cust-3',
          name: 'نور الهدى',
          phone: '01112233445',
          role: 'student_researcher',
          totalVisits: 2,
          lastVisit: new Date(Date.now() - 172800000).toISOString(),
          giftCode: 'GIFT-8871',
          photoStripUrl:
            'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500&auto=format&fit=crop&q=80',
        },
        {
          id: 'cust-4',
          name: 'كريم عبد العزيز',
          phone: '01009988776',
          role: 'business_founder',
          totalVisits: 7,
          lastVisit: new Date().toISOString(),
          giftCode: 'GIFT-1209',
          photoStripUrl:
            'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&auto=format&fit=crop&q=80',
        },
      ]);
    }

    fetchCustomers();
  }, []);

  // Listen to external settings changes
  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail) setSettings(e.detail);
    };
    window.addEventListener('memories-settings-updated', handleUpdate);
    return () => window.removeEventListener('memories-settings-updated', handleUpdate);
  }, []);

  // Export CSV
  const handleExportCsv = () => {
    window.open('/api/v1/crm/customers?format=csv', '_blank');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col selection:bg-amber-100">
      {/* Top Navbar */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {settings.branding.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settings.branding.logoUrl}
                alt={settings.branding.name}
                className="h-9 object-contain"
              />
            ) : (
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-500 text-white flex items-center justify-center font-black text-base shadow-sm">
                M
              </div>
            )}

            <div>
              <h1 className="font-black text-stone-900 text-base flex items-center gap-2">
                <span>{settings.branding.name || 'Memories • موميريز'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                  لوحة التاجر
                </span>
              </h1>
              <p className="text-[11px] text-stone-500">
                منظومة كبائن التصوير والـ CRM والطباعة والهدايا
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`/c/${cafeSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Store className="w-3.5 h-3.5" />
              <span>شاشة العميل (Photobooth)</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>

            <a
              href={`/wall/screen-1`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Monitor className="w-3.5 h-3.5 text-amber-400" />
              <span>شاشة العرض (TV Wall)</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex border-t border-stone-100 overflow-x-auto gap-2">
          <button
            onClick={() => setActiveTab('studio')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 flex-shrink-0 ${
              activeTab === 'studio'
                ? 'border-amber-600 text-amber-700 font-black'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>🎨 استوديو وتخصيص الإطارات</span>
          </button>

          <button
            onClick={() => setActiveTab('crm')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 flex-shrink-0 ${
              activeTab === 'crm'
                ? 'border-amber-600 text-amber-700 font-black'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>👥 سجل العملاء والـ CRM ({customers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('print')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 flex-shrink-0 ${
              activeTab === 'print'
                ? 'border-amber-600 text-amber-700 font-black'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>🖨️ محطة الطباعة والهدايا</span>
          </button>

          <button
            onClick={() => setActiveTab('wall')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 flex-shrink-0 ${
              activeTab === 'wall'
                ? 'border-amber-600 text-amber-700 font-black'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>📸 فرز شرائط العرض (TV Wall)</span>
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {activeTab === 'studio' && (
          <FrameStudioTab
            settings={settings}
            onSettingsUpdated={(newSettings) => setSettings(newSettings)}
          />
        )}

        {activeTab === 'crm' && (
          <CustomerCRMTab
            customers={customers}
            onExportCsv={handleExportCsv}
            brandName={settings.branding.name}
          />
        )}

        {activeTab === 'print' && (
          <PrintStationTab
            queue={customers}
            brandName={settings.branding.name}
          />
        )}

        {activeTab === 'wall' && (
          <TVModerationTab
            memories={customers}
            brandName={settings.branding.name}
          />
        )}
      </main>
    </div>
  );
}
