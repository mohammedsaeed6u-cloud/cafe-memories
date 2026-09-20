'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Coffee,
  Users,
  Image as ImageIcon,
  Tv,
  Award,
  CheckCircle,
  XCircle,
  Eye,
  QrCode,
  Sparkles,
  TrendingUp,
  Clock,
  Shield,
  ArrowRight,
  RefreshCw,
  PlusCircle,
  ExternalLink,
  Smartphone
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface MemoryItem {
  id: string;
  customer: string;
  visitNum: number;
  caption: string;
  img: string;
  time: string;
  status: 'pending' | 'approved' | 'hidden' | 'rejected';
  consentWall: boolean;
}

export default function MerchantDashboardPage() {
  const [activeTab, setActiveTab] = useState<'moderation' | 'screens' | 'loyalty' | 'crm'>('moderation');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'hidden'>('all');
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [memories, setMemories] = useState<MemoryItem[]>([
    {
      id: 'm1',
      customer: 'Sarah Mansour',
      visitNum: 5,
      caption: 'Best cortado in the city! Celebrating 5 visits today ☕✨',
      img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
      time: '3 mins ago',
      status: 'approved',
      consentWall: true,
    },
    {
      id: 'm2',
      customer: 'Tarek Helmy',
      visitNum: 2,
      caption: 'Quiet corner for afternoon reading & single origin pour over',
      img: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
      time: '12 mins ago',
      status: 'pending',
      consentWall: true,
    },
    {
      id: 'm3',
      customer: 'Laila Riad',
      visitNum: 4,
      caption: 'Espresso Lab morning light with cold brew & almond croissant 🥐',
      img: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
      time: '28 mins ago',
      status: 'approved',
      consentWall: true,
    },
  ]);

  // Load live memories from Supabase
  const loadMemories = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data && data.length > 0) {
        const mapped: MemoryItem[] = data.map((m: any, idx: number) => {
          const date = new Date(m.created_at);
          const diffMin = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));
          const timeAgo = diffMin < 60 ? `${diffMin}m ago` : `${Math.round(diffMin / 60)}h ago`;

          return {
            id: m.id,
            customer: m.customer_id === '00000000-0000-0000-0000-000000000005' ? 'Sarah Mansour' : 'Guest Regular',
            visitNum: Math.max(1, 5 - (idx % 5)),
            caption: m.caption || 'Specialty Coffee Moment ☕',
            img: m.original_url || m.optimized_url || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
            time: timeAgo,
            status: m.status as any,
            consentWall: m.visibility === 'live_wall'
          };
        });
        setMemories(mapped);
      }
    } catch (err) {
      console.warn('Dashboard fetch fallback:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMemories();

    // Subscribe to Realtime memory updates
    const supabase = createClient();
    const channel = supabase
      .channel('merchant-dashboard-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'memories' },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            setToast('🔔 New guest photo uploaded and waiting for moderation!');
            setTimeout(() => setToast(null), 5000);
            loadMemories();
          } else if (payload.eventType === 'UPDATE') {
            loadMemories();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Moderate Memory: Approve
  const handleApprove = async (id: string) => {
    // Optimistic update
    setMemories(prev =>
      prev.map(m => (m.id === id ? { ...m, status: 'approved' } : m))
    );

    try {
      const supabase = createClient();
      await supabase
        .from('memories')
        .update({ status: 'approved', visibility: 'live_wall' })
        .eq('id', id);

      setToast('✅ Photo approved and broadcast to Live TV Wall!');
      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      console.error('Approve failed:', err);
    }
  };

  // Moderate Memory: Hide
  const handleHide = async (id: string) => {
    // Optimistic update
    setMemories(prev =>
      prev.map(m => (m.id === id ? { ...m, status: 'hidden' } : m))
    );

    try {
      const supabase = createClient();
      await supabase
        .from('memories')
        .update({ status: 'hidden' })
        .eq('id', id);

      setToast('🔒 Photo removed from Live TV Wall.');
      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      console.error('Hide failed:', err);
    }
  };

  // Simulate Live Customer Upload in 1-Click
  const handleSimulateUpload = async () => {
    setSimulating(true);
    try {
      const samplePhotos = [
        'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=800&q=80'
      ];
      const randomPhoto = samplePhotos[Math.floor(Math.random() * samplePhotos.length)];

      const supabase = createClient();
      const { data, error } = await supabase
        .from('memories')
        .insert({
          customer_id: '00000000-0000-0000-0000-000000000005',
          organization_id: '00000000-0000-0000-0000-000000000001',
          branch_id: '00000000-0000-0000-0000-000000000002',
          visit_id: '00000000-0000-0000-0000-000000000006',
          original_url: randomPhoto,
          optimized_url: randomPhoto,
          caption: 'Specialty coffee moment just checked in from Table 3! ☕',
          status: 'pending',
          visibility: 'live_wall'
        })
        .select()
        .single();

      if (!error && data) {
        setToast('⚡ Simulated live customer photo uploaded to Supabase!');
        setTimeout(() => setToast(null), 4000);
        await loadMemories();
      }
    } catch (err) {
      console.error('Simulate upload error:', err);
    } finally {
      setSimulating(false);
    }
  };

  const pendingCount = memories.filter(m => m.status === 'pending').length;
  const approvedCount = memories.filter(m => m.status === 'approved').length;

  const filteredMemories = memories.filter(m => {
    if (filterStatus === 'all') return true;
    return m.status === filterStatus;
  });

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 selection:bg-amber-500 selection:text-black">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold text-xs shadow-2xl flex items-center gap-2 animate-slideIn">
          <Sparkles className="w-4 h-4 text-stone-950" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-stone-900/90 backdrop-blur-md border-b border-stone-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 text-stone-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-black text-white text-base leading-tight flex items-center gap-2">
              <span>Espresso Lab</span>
              <span className="px-2 py-0.5 rounded-md bg-stone-800 text-[10px] text-stone-300 font-mono">
                Main Branch (New Cairo)
              </span>
            </h1>
            <p className="text-xs text-stone-400">Merchant Operations & Loyalty Center</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Simulation Button for Demo & QA */}
          <button
            onClick={handleSimulateUpload}
            disabled={simulating}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-bold text-amber-300 transition-all disabled:opacity-50"
            title="Simulate a live customer uploading a photo from table QR"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{simulating ? 'Simulating...' : 'Simulate Guest Upload'}</span>
          </button>

          <Link
            href="/c/espresso-lab"
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-stone-200 border border-stone-700 transition-colors"
          >
            <Smartphone className="w-3.5 h-3.5 text-amber-400" />
            <span>Customer QR</span>
          </Link>

          <Link
            href="/wall/screen-101"
            target="_blank"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20"
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Launch Live TV Wall</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-2 shadow-lg">
            <div className="flex items-center justify-between text-stone-400 text-xs font-medium">
              <span>Verified Visits</span>
              <Users className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white">1,428</div>
            <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3 h-3" />
              <span>+18.4% this week</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-2 shadow-lg">
            <div className="flex items-center justify-between text-stone-400 text-xs font-medium">
              <span>Memories Created</span>
              <ImageIcon className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white">{memories.length + 339}</div>
            <div className="text-[11px] text-stone-400">92% consented for Live Wall</div>
          </div>

          <div className="p-5 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-2 shadow-lg">
            <div className="flex items-center justify-between text-stone-400 text-xs font-medium">
              <span>Rewards Claimed</span>
              <Award className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white">89</div>
            <div className="text-[11px] text-amber-400 font-medium">68 claimed in-store</div>
          </div>

          <div className="p-5 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-2 shadow-lg">
            <div className="flex items-center justify-between text-stone-400 text-xs font-medium">
              <span>Live Screens</span>
              <Tv className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white flex items-center gap-2">
              <span>1 Online</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <div className="text-[11px] text-stone-400">Screen #screen-101 active</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('moderation')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'moderation'
                  ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                  : 'text-stone-400 hover:text-white bg-stone-900 border border-stone-800'
              }`}
            >
              Photo Moderation ({pendingCount} Pending)
            </button>
            <button
              onClick={() => setActiveTab('screens')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'screens'
                  ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                  : 'text-stone-400 hover:text-white bg-stone-900 border border-stone-800'
              }`}
            >
              Live Wall Screens
            </button>
            <button
              onClick={() => setActiveTab('loyalty')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'loyalty'
                  ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                  : 'text-stone-400 hover:text-white bg-stone-900 border border-stone-800'
              }`}
            >
              Reward Rules
            </button>
            <button
              onClick={() => setActiveTab('crm')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'crm'
                  ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                  : 'text-stone-400 hover:text-white bg-stone-900 border border-stone-800'
              }`}
            >
              Customer Regulars
            </button>
          </div>

          <button
            onClick={loadMemories}
            className="p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-400 hover:text-white transition-colors"
            title="Refresh from Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>

        {/* Tab Content: Moderation */}
        {activeTab === 'moderation' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white">Live Guest Moderation Queue</h2>
                <p className="text-xs text-stone-400">
                  Approve guest moments to immediately display on the in-store Live TV Wall.
                </p>
              </div>

              {/* Sub-filters */}
              <div className="flex items-center gap-1.5 bg-stone-900 p-1 rounded-xl border border-stone-800 text-xs">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    filterStatus === 'all' ? 'bg-stone-800 text-white' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  All ({memories.length})
                </button>
                <button
                  onClick={() => setFilterStatus('pending')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    filterStatus === 'pending' ? 'bg-amber-500/20 text-amber-300' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Pending ({pendingCount})
                </button>
                <button
                  onClick={() => setFilterStatus('approved')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    filterStatus === 'approved' ? 'bg-emerald-500/20 text-emerald-300' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  On Wall ({approvedCount})
                </button>
              </div>
            </div>

            {filteredMemories.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-stone-900/50 border border-stone-800 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-stone-800 text-stone-400 flex items-center justify-center mx-auto">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-white text-sm">No photos in this category</h3>
                <p className="text-xs text-stone-400 max-w-sm mx-auto">
                  Guests scan table QR codes to upload their coffee moments. Click "Simulate Guest Upload" above to test.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {filteredMemories.map(m => (
                  <div
                    key={m.id}
                    className="rounded-2xl overflow-hidden bg-stone-900/90 border border-stone-800 flex flex-col justify-between shadow-xl transition-all hover:border-stone-700"
                  >
                    <div className="aspect-[4/3] relative overflow-hidden bg-stone-950">
                      <img src={m.img} alt={m.caption} className="w-full h-full object-cover" />
                      <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-sm text-[11px] font-bold text-white border border-stone-700">
                        Visit #{m.visitNum}
                      </div>
                      <div className="absolute top-2.5 right-2.5">
                        {m.status === 'approved' && (
                          <span className="px-2.5 py-1 rounded-md bg-emerald-500 text-stone-950 text-[10px] font-extrabold flex items-center gap-1 shadow-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-stone-950 animate-pulse"></span>
                            ON TV WALL
                          </span>
                        )}
                        {m.status === 'pending' && (
                          <span className="px-2.5 py-1 rounded-md bg-amber-500 text-stone-950 text-[10px] font-extrabold shadow-md">
                            PENDING APPROVAL
                          </span>
                        )}
                        {m.status === 'hidden' && (
                          <span className="px-2.5 py-1 rounded-md bg-stone-700 text-stone-300 text-[10px] font-bold">
                            HIDDEN
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-xs text-stone-400 mb-1.5">
                          <span className="font-bold text-white text-sm">{m.customer}</span>
                          <span className="text-[11px] font-mono">{m.time}</span>
                        </div>
                        <p className="text-xs text-stone-300 font-medium leading-relaxed">
                          &ldquo;{m.caption}&rdquo;
                        </p>
                      </div>

                      <div className="pt-3 border-t border-stone-800/80 flex items-center justify-between gap-2">
                        {m.status !== 'approved' ? (
                          <button
                            onClick={() => handleApprove(m.id)}
                            className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-emerald-500/20"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Approve for Wall
                          </button>
                        ) : (
                          <button
                            onClick={() => handleHide(m.id)}
                            className="flex-1 py-2.5 rounded-xl bg-stone-800 hover:bg-rose-500/20 hover:text-rose-400 text-stone-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors border border-stone-700"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Hide from Wall
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Screens */}
        {activeTab === 'screens' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-white">Connected In-Store TV Displays</h2>
              <p className="text-xs text-stone-400">
                Open any smart TV browser or media stick to sync with your café.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                  <Tv className="w-7 h-7" />
                </div>
                <div>
                  <div className="font-extrabold text-white text-base flex items-center gap-2">
                    <span>Main Hall 4K Display</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold">
                      Online • Realtime
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 mt-1">Screen ID: screen-101 • Resolution: 1920x1080 • Slide Rotation: 7s</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/wall/screen-101"
                  target="_blank"
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Launch Screen Window</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: Loyalty Rules */}
        {activeTab === 'loyalty' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-white">Loyalty Milestone Rules</h2>
              <p className="text-xs text-stone-400">Configured visit rules for Espresso Lab customers.</p>
            </div>

            <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 space-y-4 max-w-xl">
              <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                <span className="text-xs text-stone-400">Rule Name</span>
                <span className="font-bold text-sm text-white">Standard Regulars Perk</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                <span className="text-xs text-stone-400">Required Verified Visits</span>
                <span className="font-bold text-sm text-amber-400">5 Visits</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                <span className="text-xs text-stone-400">Reward Vouched</span>
                <span className="font-bold text-sm text-white">Free Specialty Drink / Pastry</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-400">Anti-Fraud Cooldown</span>
                <span className="font-bold text-sm text-stone-300">30 minutes per device</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: CRM */}
        {activeTab === 'crm' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-white">Top Regular Customers</h2>
              <p className="text-xs text-stone-400">Patrons with highest visit frequency and memory contributions.</p>
            </div>

            <div className="rounded-2xl overflow-hidden bg-stone-900 border border-stone-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-950 text-stone-400 uppercase font-semibold">
                  <tr>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Total Visits</th>
                    <th className="p-4">Memories</th>
                    <th className="p-4">Rewards Claimed</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800">
                  <tr>
                    <td className="p-4 font-bold text-white">Sarah Mansour</td>
                    <td className="p-4 text-amber-400 font-bold">5 Visits</td>
                    <td className="p-4 text-stone-300">3 Photos</td>
                    <td className="p-4 text-emerald-400 font-bold">1 Free V60</td>
                    <td className="p-4"><span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">VIP Regular</span></td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">Omar Khaled</td>
                    <td className="p-4 text-amber-400 font-bold">3 Visits</td>
                    <td className="p-4 text-stone-300">2 Photos</td>
                    <td className="p-4 text-stone-400">In Progress (3/5)</td>
                    <td className="p-4"><span className="px-2 py-0.5 rounded bg-stone-800 text-stone-300 text-[10px]">Active</span></td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">Nour El-Din</td>
                    <td className="p-4 text-amber-400 font-bold">4 Visits</td>
                    <td className="p-4 text-stone-300">1 Photo</td>
                    <td className="p-4 text-stone-400">1 visit away!</td>
                    <td className="p-4"><span className="px-2 py-0.5 rounded bg-stone-800 text-stone-300 text-[10px]">Active</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
