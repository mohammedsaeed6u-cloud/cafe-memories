'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Camera,
  Coffee,
  CheckCircle,
  Eye,
  EyeOff,
  Tv,
  Sparkles,
  Download,
  Trash2,
  RefreshCw,
  ExternalLink,
  Heart,
  Check,
  AlertCircle,
  Users,
  Phone,
  MessageSquare,
  Search,
  FileSpreadsheet,
  Copy,
  Award,
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface PhotoBoothMemory {
  id: string;
  customer: string;
  customerPhone?: string;
  caption: string;
  img: string;
  time: string;
  status: 'pending' | 'approved' | 'hidden';
  visibility: string;
}

interface CustomerLead {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  tier: 'VIP' | 'Regular' | 'New';
  memoryCount: number;
  visitCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
  recentStrips: Array<{
    id: string;
    img: string;
    caption?: string;
  }>;
}

export default function PhotoBoothModerationDashboard() {
  // Main Navigation Tabs
  const [activeTab, setActiveTab] = useState<'strips' | 'crm'>('crm');

  // Photo Strips State
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'hidden'>('all');
  const [memories, setMemories] = useState<PhotoBoothMemory[]>([]);
  const [loadingMemories, setLoadingMemories] = useState(true);
  const [simulating, setSimulating] = useState(false);

  // CRM State
  const [customers, setCustomers] = useState<CustomerLead[]>([]);
  const [crmLoading, setCrmLoading] = useState(true);
  const [crmSearch, setCrmSearch] = useState('');
  const [crmTierFilter, setCrmTierFilter] = useState<'all' | 'VIP' | 'Regular' | 'New'>('all');
  const [copiedPhones, setCopiedPhones] = useState(false);

  const [toast, setToast] = useState<string | null>(null);

  // Load Photo Booth Memories
  const loadMemories = useCallback(async () => {
    setLoadingMemories(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('memories')
        .select('*, customers(display_name, anonymous_id)')
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;

      if (data && data.length > 0) {
        setMemories(
          data.map((m: any, idx: number) => {
            const date = new Date(m.created_at);
            const diffMin = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));
            const timeAgo = diffMin < 60 ? `${diffMin}m ago` : `${Math.round(diffMin / 60)}h ago`;
            const customerObj = m.customers;

            return {
              id: m.id,
              customer: customerObj?.display_name || (m.customer_id === '00000000-0000-0000-0000-000000000005' ? 'Sarah Mansour' : `Guest #${100 + idx}`),
              customerPhone: customerObj?.anonymous_id || '+966 50 123 4567',
              caption: m.caption || 'Specialty Coffee Photo Booth Moment ☕✨',
              img: m.optimized_url || m.original_url || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
              time: timeAgo,
              status: (m.status as any) || 'approved',
              visibility: m.visibility || 'live_wall',
            };
          })
        );
      } else {
        setMemories([
          {
            id: 'm1',
            customer: 'Sarah Mansour',
            customerPhone: '+966 50 987 6543',
            caption: 'Morning cortado with friends ✨',
            img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
            time: '5m ago',
            status: 'approved',
            visibility: 'live_wall',
          },
          {
            id: 'm2',
            customer: 'Karim Zaki',
            customerPhone: '+20 100 112 2334',
            caption: 'Single origin V60 drip coffee ☕',
            img: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
            time: '18m ago',
            status: 'approved',
            visibility: 'live_wall',
          },
          {
            id: 'm3',
            customer: 'Ahmed Hassan',
            customerPhone: '+20 100 987 6543',
            caption: 'Weekend work session corner 🥐',
            img: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
            time: '42m ago',
            status: 'pending',
            visibility: 'live_wall',
          },
        ]);
      }
    } catch {
      // Fallback
    } finally {
      setLoadingMemories(false);
    }
  }, []);

  // Load CRM Customer Leads
  const loadCustomers = useCallback(async () => {
    setCrmLoading(true);
    try {
      const res = await fetch('/api/v1/crm/customers');
      if (res.ok) {
        const data = await res.json();
        if (data.customers && data.customers.length > 0) {
          setCustomers(data.customers);
          return;
        }
      }

      // Fallback direct Supabase fetch
      const supabase = createClient();
      const { data: custData, error } = await supabase
        .from('customers')
        .select('*, memories(*), visits(*)')
        .order('last_seen_at', { ascending: false });

      if (error) throw error;

      if (custData && custData.length > 0) {
        setCustomers(
          custData.map((c: any) => {
            const memoryCount = c.memories ? c.memories.length : 0;
            const visitCount = c.visits ? c.visits.length : 0;
            const total = Math.max(memoryCount, visitCount);
            let tier: 'VIP' | 'Regular' | 'New' = 'New';
            if (total >= 3) tier = 'VIP';
            else if (total >= 2) tier = 'Regular';

            return {
              id: c.id,
              name: c.display_name || 'Guest Regular',
              phone: c.anonymous_id || '',
              email: c.email,
              tier,
              memoryCount,
              visitCount,
              firstSeenAt: c.created_at,
              lastSeenAt: c.last_seen_at,
              recentStrips: (c.memories || []).slice(0, 3).map((m: any) => ({
                id: m.id,
                img: m.optimized_url || m.original_url,
                caption: m.caption,
              })),
            };
          })
        );
      } else {
        setCustomers([
          {
            id: 'c1',
            name: 'Sarah Mansour',
            phone: '+966509876543',
            tier: 'VIP',
            memoryCount: 6,
            visitCount: 7,
            firstSeenAt: new Date(Date.now() - 86400000 * 14).toISOString(),
            lastSeenAt: new Date(Date.now() - 3600000 * 2).toISOString(),
            recentStrips: [
              { id: '1', img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80' },
              { id: '2', img: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&q=80' },
            ],
          },
          {
            id: 'c2',
            name: 'Karim Zaki',
            phone: '+201001122334',
            tier: 'Regular',
            memoryCount: 3,
            visitCount: 3,
            firstSeenAt: new Date(Date.now() - 86400000 * 5).toISOString(),
            lastSeenAt: new Date(Date.now() - 3600000 * 5).toISOString(),
            recentStrips: [
              { id: '3', img: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&q=80' },
            ],
          },
          {
            id: 'c3',
            name: 'Ahmed Hassan',
            phone: '+201009876543',
            tier: 'New',
            memoryCount: 1,
            visitCount: 1,
            firstSeenAt: new Date(Date.now() - 86400000 * 1).toISOString(),
            lastSeenAt: new Date(Date.now() - 3600000 * 8).toISOString(),
            recentStrips: [
              { id: '4', img: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80' },
            ],
          },
        ]);
      }
    } catch {
      // Fallback
    } finally {
      setCrmLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMemories();
    loadCustomers();
  }, [loadMemories, loadCustomers]);

  // Update memory status (Approve / Hide)
  const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'hidden') => {
    setMemories(prev =>
      prev.map(m => (m.id === id ? { ...m, status: newStatus } : m))
    );

    const actionText = newStatus === 'approved' ? 'Featured on Café TV Wall!' : 'Hidden from TV Wall';
    setToast(actionText);
    setTimeout(() => setToast(null), 3000);

    try {
      const supabase = createClient();
      await supabase
        .from('memories')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);
    } catch (err: any) {
      console.warn('Update failed:', err.message);
    }
  };

  // Simulate Guest Photo Booth Submission (for 1-click merchant testing)
  const handleSimulateStrip = async () => {
    setSimulating(true);
    try {
      const sampleNames = ['Laila Nour', 'Youssef Fathy', 'Mariam Tarek', 'Ziad Ezzat'];
      const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
      const randomPhone = `+96650${Math.floor(1000000 + Math.random() * 9000000)}`;

      const res = await fetch('/api/v1/photobooth/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: randomName,
          phone: randomPhone,
          originalUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
          caption: `Morning specialty roast by ${randomName} ☕✨`,
          liveWallConsent: true,
        }),
      });

      if (!res.ok) {
        throw new Error('Simulation endpoint failed');
      }

      setToast(`🎉 New Guest Profile Created: ${randomName} (${randomPhone})`);
      setTimeout(() => setToast(null), 4000);
      loadMemories();
      loadCustomers();
    } catch (err: any) {
      alert('Error simulating: ' + err.message);
    } finally {
      setSimulating(false);
    }
  };

  // Export Customers CSV with UTF-8 BOM
  const handleExportCSV = () => {
    const csvHeader = 'اسم العميل,رقم الموبايل,عدد أشرطة الصور,عدد الزيارات,تاريخ أول زيارة,تاريخ آخر زيارة,فئة العميل\n';
    const csvRows = filteredCustomers.map(c => {
      const safeName = `"${c.name.replace(/"/g, '""')}"`;
      const safePhone = `"${c.phone.replace(/"/g, '""')}"`;
      const firstSeen = new Date(c.firstSeenAt).toLocaleDateString('ar-EG');
      const lastSeen = new Date(c.lastSeenAt).toLocaleDateString('ar-EG');
      return `${safeName},${safePhone},${c.memoryCount},${c.visitCount},${firstSeen},${lastSeen},${c.tier}`;
    });

    const csvContent = '\uFEFF' + csvHeader + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cafe-memories-crm-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    setToast('📥 تم تصدير بيانات العملاء إلى ملف CSV بنجاح!');
    setTimeout(() => setToast(null), 3500);
  };

  // Copy Phone Numbers to Clipboard for Bulk SMS or Telegram
  const handleCopyPhones = () => {
    const phones = filteredCustomers
      .map(c => c.phone.trim())
      .filter(p => p.length > 5)
      .join(', ');

    if (!phones) {
      setToast('لا توجد أرقام هواتف لنسخها');
      setTimeout(() => setToast(null), 2500);
      return;
    }

    navigator.clipboard.writeText(phones);
    setCopiedPhones(true);
    setTimeout(() => setCopiedPhones(false), 3000);
    setToast(`📋 تم نسخ ${filteredCustomers.length} رقم هاتف لحملات الرسائل التسويقية!`);
    setTimeout(() => setToast(null), 3500);
  };

  // Filtered Photo Strips
  const filteredMemories = memories.filter(m => {
    if (filter === 'all') return true;
    return m.status === filter;
  });

  // Filtered CRM Customers
  const filteredCustomers = customers.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(crmSearch.toLowerCase()) ||
      c.phone.toLowerCase().includes(crmSearch.toLowerCase());
    const matchesTier = crmTierFilter === 'all' || c.tier === crmTierFilter;
    return matchesSearch && matchesTier;
  });

  // Quick WhatsApp link generator
  const getWhatsAppLink = (phone: string, name: string) => {
    const cleanDigits = phone.replace(/\D/g, '');
    const greeting = encodeURIComponent(`أهلاً بك يا ${name} في Espresso Lab! نسعد بزيارتك ومشاركتك في كابينة تصوير الذكريات ☕📸`);
    return `https://wa.me/${cleanDigits}?text=${greeting}`;
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 selection:bg-amber-500 selection:text-stone-950 pb-20">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl bg-amber-500 text-stone-950 font-black text-sm flex items-center gap-2 shadow-2xl animate-in slide-in-from-top duration-300">
          <Sparkles className="w-4 h-4" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-stone-950/80 border-b border-stone-800/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 text-stone-950 flex items-center justify-center font-black shadow-md shadow-amber-600/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-white font-serif">
                  Espresso Lab • Photo Booth & CRM
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                  STUDIO & CRM
                </span>
              </div>
              <p className="text-xs text-stone-400">
                إدارة أشرطة صور الرواد وسجل بيانات العملاء للتسويق والولاء.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleSimulateStrip}
              disabled={simulating}
              className="py-2.5 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {simulating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Simulate Guest & CRM Lead</span>
            </button>

            <Link
              href="/wall/screen-101"
              target="_blank"
              className="py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 font-bold text-xs flex items-center gap-2 shadow-md transition-all"
            >
              <Tv className="w-3.5 h-3.5 text-amber-400" />
              <span>Open TV Wall</span>
              <ExternalLink className="w-3 h-3 text-stone-400" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 pt-8 space-y-6">
        {/* Navigation Tabs (Photo Strips vs Customer CRM) */}
        <div className="flex items-center justify-between border-b border-stone-800/80 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('crm')}
              className={`py-2.5 px-4 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
                activeTab === 'crm'
                  ? 'bg-amber-500 text-stone-950 shadow-lg shadow-amber-500/20'
                  : 'bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>👥 سجل عملاء الكافيه (Customer CRM)</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                activeTab === 'crm' ? 'bg-stone-950/20 text-stone-950 font-black' : 'bg-stone-800 text-stone-400'
              }`}>
                {customers.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('strips')}
              className={`py-2.5 px-4 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
                activeTab === 'strips'
                  ? 'bg-amber-500 text-stone-950 shadow-lg shadow-amber-500/20'
                  : 'bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-800'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>📸 فرز أشرطة الصور (Photo Strips)</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                activeTab === 'strips' ? 'bg-stone-950/20 text-stone-950 font-black' : 'bg-stone-800 text-stone-400'
              }`}>
                {memories.length}
              </span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-stone-400 font-mono">
            <span>Branch: Downtown Roastery</span>
          </div>
        </div>

        {/* TAB 1: CUSTOMER CRM DIRECTORY */}
        {activeTab === 'crm' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* KPI STATS CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl bg-stone-900/90 border border-stone-800/90 space-y-2">
                <div className="flex items-center justify-between text-xs text-stone-400 font-semibold">
                  <span>إجمالي العملاء المسجلين</span>
                  <Users className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-white font-mono">{customers.length}</div>
                <p className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                  <span>+100% مسجلين برقم الموبايل</span>
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-stone-900/90 border border-stone-800/90 space-y-2">
                <div className="flex items-center justify-between text-xs text-stone-400 font-semibold">
                  <span>أشرطة الصور الملتقطة</span>
                  <Camera className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-white font-mono">
                  {customers.reduce((acc, c) => acc + c.memoryCount, 0)}
                </div>
                <p className="text-[11px] text-stone-400">ذكريات مصورة بالكافيه</p>
              </div>

              <div className="p-5 rounded-3xl bg-stone-900/90 border border-stone-800/90 space-y-2">
                <div className="flex items-center justify-between text-xs text-stone-400 font-semibold">
                  <span>عملاء VIP والرواد الدائمين</span>
                  <Award className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-amber-400 font-mono">
                  {customers.filter(c => c.tier === 'VIP' || c.tier === 'Regular').length}
                </div>
                <p className="text-[11px] text-amber-300/80">أكثر من زيارة وشريط</p>
              </div>

              <div className="p-5 rounded-3xl bg-stone-900/90 border border-stone-800/90 space-y-2">
                <div className="flex items-center justify-between text-xs text-stone-400 font-semibold">
                  <span>قنوات التواصل (SMS / WhatsApp)</span>
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-emerald-400 font-mono">
                  {customers.filter(c => c.phone && c.phone.length > 5).length}
                </div>
                <p className="text-[11px] text-stone-400">أرقام جاهزة للحملات</p>
              </div>
            </div>

            {/* CRM TOOLBAR: SEARCH & EXPORT */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-3xl bg-stone-900 border border-stone-800/90">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={crmSearch}
                    onChange={e => setCrmSearch(e.target.value)}
                    placeholder="ابحث بالاسم أو رقم الموبايل..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  {(['all', 'VIP', 'Regular', 'New'] as const).map(tier => (
                    <button
                      key={tier}
                      onClick={() => setCrmTierFilter(tier)}
                      className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                        crmTierFilter === tier
                          ? 'bg-amber-500 text-stone-950 shadow-md font-black'
                          : 'bg-stone-950 text-stone-400 border border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      {tier === 'all' ? 'الكل' : tier}
                    </button>
                  ))}
                </div>
              </div>

              {/* CRM EXPORT ACTIONS */}
              <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
                <button
                  onClick={handleCopyPhones}
                  className="py-2.5 px-3.5 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-800 text-stone-200 font-bold text-xs flex items-center gap-2 transition-all active:scale-[0.98]"
                >
                  <Copy className="w-3.5 h-3.5 text-amber-400" />
                  <span>{copiedPhones ? 'تم النسخ!' : 'نسخ الأرقام (SMS / Telegram)'}</span>
                </button>

                <button
                  onClick={handleExportCSV}
                  className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.98]"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>تصدير العملاء (Export CSV)</span>
                </button>
              </div>
            </div>

            {/* CUSTOMERS LIST DIRECTORY */}
            {crmLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(n => (
                  <div key={n} className="h-24 rounded-3xl bg-stone-900/50 border border-stone-800 animate-pulse" />
                ))}
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center py-20 rounded-3xl bg-stone-900/40 border border-stone-800 p-8 space-y-3">
                <Users className="w-12 h-12 text-stone-600 mx-auto" />
                <h3 className="text-lg font-bold text-stone-300">لم يتم العثور على عملاء</h3>
                <p className="text-xs text-stone-400">
                  أي عميل يلتقط شريط صور من كابينة التصوير ويحفظ بروفايله يظهر هنا فوراً.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCustomers.map(customer => {
                  const initial = customer.name.slice(0, 1).toUpperCase();
                  const lastSeenFormatted = new Date(customer.lastSeenAt).toLocaleDateString('ar-EG', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={customer.id}
                      className="p-5 rounded-3xl bg-stone-900 border border-stone-800/90 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:border-amber-500/30"
                    >
                      {/* Customer Info */}
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 text-stone-950 font-black text-lg flex items-center justify-center shadow-md shadow-amber-600/20 shrink-0">
                          {initial}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-base text-white">{customer.name}</h4>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                customer.tier === 'VIP'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : customer.tier === 'Regular'
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                  : 'bg-stone-800 text-stone-400 border border-stone-700'
                              }`}
                            >
                              {customer.tier}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-stone-400 mt-1 font-mono">
                            <span className="text-stone-300 font-semibold">{customer.phone}</span>
                            <span>•</span>
                            <span>{customer.memoryCount} أشرطة صور</span>
                            <span>•</span>
                            <span>{customer.visitCount} زيارات</span>
                          </div>
                        </div>
                      </div>

                      {/* Mini photo booth strip previews */}
                      <div className="flex items-center gap-2">
                        {customer.recentStrips && customer.recentStrips.length > 0 ? (
                          customer.recentStrips.map((s, idx) => (
                            <div
                              key={idx}
                              className="w-10 h-12 rounded-lg overflow-hidden bg-stone-800 border border-stone-700 relative shrink-0 shadow-sm"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={s.img}
                                alt="Strip preview"
                                className="w-full h-full object-cover sepia-[0.2]"
                              />
                            </div>
                          ))
                        ) : (
                          <div className="text-[11px] text-stone-500 font-mono">لا توجد صور محفوظة</div>
                        )}
                      </div>

                      {/* Actions (WhatsApp & Call) */}
                      <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-stone-800">
                        <div className="text-right hidden lg:block mr-2">
                          <p className="text-[10px] text-stone-500 font-mono">آخر زيارة</p>
                          <p className="text-xs text-stone-300 font-medium">{lastSeenFormatted}</p>
                        </div>

                        <a
                          href={getWhatsAppLink(customer.phone, customer.name)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2 px-3.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-all"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                          <span>واتساب</span>
                        </a>

                        <a
                          href={`tel:${customer.phone}`}
                          className="py-2 px-3.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold text-xs flex items-center gap-1.5 transition-all"
                        >
                          <Phone className="w-3.5 h-3.5 text-amber-400" />
                          <span>اتصال</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PHOTO BOOTH STRIPS MODERATION */}
        {activeTab === 'strips' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Filter Bar & Counters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-800/80">
              <div className="flex items-center gap-2">
                {[
                  { key: 'all', label: 'All Photo Strips', count: memories.length },
                  { key: 'approved', label: 'On TV Wall', count: memories.filter(m => m.status === 'approved').length },
                  { key: 'pending', label: 'Pending Review', count: memories.filter(m => m.status === 'pending').length },
                  { key: 'hidden', label: 'Hidden', count: memories.filter(m => m.status === 'hidden').length },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key as any)}
                    className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                      filter === tab.key
                        ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                        : 'bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-800'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                      filter === tab.key ? 'bg-stone-950/20 text-stone-950 font-black' : 'bg-stone-800 text-stone-400'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              <div className="text-xs text-stone-400 font-mono">
                {filteredMemories.length} strips displayed
              </div>
            </div>

            {/* PHOTO BOOTH STRIPS GALLERY GRID */}
            {loadingMemories ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className="h-96 rounded-3xl bg-stone-900/50 border border-stone-800/60 animate-pulse" />
                ))}
              </div>
            ) : filteredMemories.length === 0 ? (
              <div className="text-center py-20 rounded-3xl bg-stone-900/30 border border-stone-800/60 p-8 space-y-4">
                <Camera className="w-12 h-12 text-stone-600 mx-auto" />
                <h3 className="text-lg font-bold text-stone-300">No Photo Booth Strips Found</h3>
                <p className="text-xs text-stone-400 max-w-sm mx-auto">
                  Guests will appear here the moment they take photos from table QR codes.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredMemories.map(strip => (
                  <div
                    key={strip.id}
                    className="group rounded-3xl bg-stone-900 border border-stone-800/90 shadow-xl overflow-hidden flex flex-col justify-between transition-all hover:border-amber-500/40 hover:shadow-amber-500/5"
                  >
                    {/* PHOTO BOOTH STRIP MINIATURE */}
                    <div className="p-4 bg-[#FAF8F5] text-stone-900 m-3 rounded-2xl shadow-inner">
                      <div className="text-center pb-2 mb-2 border-b border-stone-200">
                        <div className="font-serif font-black text-[10px] tracking-wider uppercase">
                          ESPRESSO LAB • PHOTO BOOTH
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        {[strip.img, strip.img, strip.img].map((photoUrl, pIdx) => (
                          <div
                            key={pIdx}
                            className="aspect-[4/3] rounded-lg overflow-hidden bg-stone-200 shadow-sm relative"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={photoUrl}
                              alt="Photo booth frame"
                              className="w-full h-full object-cover sepia-[0.2] contrast-[1.05]"
                            />
                            <span className="absolute top-1 left-1 px-1 py-0.2 rounded bg-black/60 text-[8px] font-mono text-white">
                              0{pIdx + 1}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 mt-2 border-t border-stone-200 text-center space-y-0.5">
                        <p className="text-[10px] font-bold line-clamp-1 italic font-serif">
                          &ldquo;{strip.caption}&rdquo;
                        </p>
                        <div className="flex items-center justify-between text-[8px] font-mono text-stone-500">
                          <span>{strip.time}</span>
                          <span>#BOOTH</span>
                        </div>
                      </div>
                    </div>

                    {/* Strip Details & Actions */}
                    <div className="p-4 pt-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-xs text-white">{strip.customer}</div>
                          {strip.customerPhone && (
                            <div className="text-[10px] text-amber-400/80 font-mono">{strip.customerPhone}</div>
                          )}
                          <div className="text-[10px] text-stone-400">{strip.time}</div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            strip.status === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : strip.status === 'pending'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-stone-800 text-stone-400 border border-stone-700'
                          }`}
                        >
                          {strip.status === 'approved' ? 'ON TV WALL' : strip.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-800/80">
                        {strip.status !== 'approved' ? (
                          <button
                            onClick={() => handleUpdateStatus(strip.id, 'approved')}
                            className="py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                          >
                            <Tv className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Send to TV</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateStatus(strip.id, 'hidden')}
                            className="py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                          >
                            <EyeOff className="w-3.5 h-3.5 text-stone-400" />
                            <span>Hide from TV</span>
                          </button>
                        )}

                        <a
                          href={strip.img}
                          download={`photobooth-${strip.id}.jpg`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
                        >
                          <Download className="w-3.5 h-3.5 text-amber-400" />
                          <span>Download</span>
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
