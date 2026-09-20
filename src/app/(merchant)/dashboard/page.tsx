'use client';

import React, { useState } from 'react';
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
  ArrowRight
} from 'lucide-react';

interface MemoryItem {
  id: string;
  customer: string;
  visitNum: number;
  caption: string;
  img: string;
  time: string;
  status: 'pending' | 'approved' | 'hidden';
  consentWall: boolean;
}

export default function MerchantDashboardPage() {
  const [activeTab, setActiveTab] = useState<'moderation' | 'screens' | 'loyalty' | 'analytics'>('moderation');
  const [memories, setMemories] = useState<MemoryItem[]>([
    {
      id: 'm1',
      customer: 'Sarah M.',
      visitNum: 4,
      caption: 'Best cortado in the city! Love the new roast ☕✨',
      img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
      time: '5 mins ago',
      status: 'approved',
      consentWall: true,
    },
    {
      id: 'm2',
      customer: 'Tarek H.',
      visitNum: 2,
      caption: 'Great atmosphere for reading on a Sunday afternoon',
      img: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80',
      time: '12 mins ago',
      status: 'pending',
      consentWall: true,
    },
    {
      id: 'm3',
      customer: 'Laila R.',
      visitNum: 5,
      caption: 'Redeemed my 5th visit reward! Delicious pastry 🥐',
      img: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80',
      time: '24 mins ago',
      status: 'approved',
      consentWall: true,
    },
  ]);

  const handleApprove = (id: string) => {
    setMemories(prev =>
      prev.map(m => (m.id === id ? { ...m, status: 'approved' } : m))
    );
  };

  const handleHide = (id: string) => {
    setMemories(prev =>
      prev.map(m => (m.id === id ? { ...m, status: 'hidden' } : m))
    );
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 selection:bg-amber-500 selection:text-black">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-stone-900/90 backdrop-blur-md border-b border-stone-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-white text-base leading-tight">Espresso Lab • Main Branch</h1>
            <p className="text-xs text-stone-400">Merchant Control Panel</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/c/espresso-lab"
            target="_blank"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-stone-300 transition-colors"
          >
            <span>Customer QR View</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/wall/screen-101"
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-bold text-amber-300 transition-colors"
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Open Live Wall</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-2">
            <div className="flex items-center justify-between text-stone-400 text-xs font-medium">
              <span>Total Visits</span>
              <Users className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white">1,428</div>
            <div className="text-[11px] text-emerald-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>+18.4% this week</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-2">
            <div className="flex items-center justify-between text-stone-400 text-xs font-medium">
              <span>Memories Created</span>
              <ImageIcon className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white">342</div>
            <div className="text-[11px] text-stone-400">82% consented for Live Wall</div>
          </div>

          <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-2">
            <div className="flex items-center justify-between text-stone-400 text-xs font-medium">
              <span>Rewards Unlocked</span>
              <Award className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white">89</div>
            <div className="text-[11px] text-amber-400 font-medium">68 claimed in-store</div>
          </div>

          <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-2">
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
        <div className="flex items-center gap-2 border-b border-stone-800 pb-3">
          <button
            onClick={() => setActiveTab('moderation')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'moderation'
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                : 'text-stone-400 hover:text-white bg-stone-900'
            }`}
          >
            Photo Moderation ({memories.filter(m => m.status === 'pending').length} Pending)
          </button>
          <button
            onClick={() => setActiveTab('screens')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'screens'
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                : 'text-stone-400 hover:text-white bg-stone-900'
            }`}
          >
            Live Wall Screens
          </button>
          <button
            onClick={() => setActiveTab('loyalty')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'loyalty'
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                : 'text-stone-400 hover:text-white bg-stone-900'
            }`}
          >
            Reward Rules
          </button>
        </div>

        {/* Tab Content: Moderation */}
        {activeTab === 'moderation' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Guest Photo Approval Queue</h2>
                <p className="text-xs text-stone-400">
                  Photos must be approved before broadcasting on your in-store Live Wall.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
                <Shield className="w-3.5 h-3.5" />
                <span>AI Safety Check: Active</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {memories.map(m => (
                <div
                  key={m.id}
                  className="rounded-2xl overflow-hidden bg-stone-900 border border-stone-800 flex flex-col justify-between"
                >
                  <div className="aspect-[4/3] relative overflow-hidden bg-stone-950">
                    <img src={m.img} alt={m.caption} className="w-full h-full object-cover" />
                    <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-sm text-[11px] font-bold text-white border border-stone-700">
                      Visit #{m.visitNum}
                    </div>
                    <div className="absolute top-2.5 right-2.5">
                      {m.status === 'approved' && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/90 text-white text-[10px] font-bold">
                          On Screen
                        </span>
                      )}
                      {m.status === 'pending' && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/90 text-stone-950 text-[10px] font-bold">
                          Pending
                        </span>
                      )}
                      {m.status === 'hidden' && (
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/90 text-white text-[10px] font-bold">
                          Hidden
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
                        <span className="font-bold text-white">{m.customer}</span>
                        <span>{m.time}</span>
                      </div>
                      <p className="text-xs text-stone-300 font-medium leading-relaxed">
                        "{m.caption}"
                      </p>
                    </div>

                    <div className="pt-3 border-t border-stone-800/80 flex items-center justify-between gap-2">
                      {m.status !== 'approved' ? (
                        <button
                          onClick={() => handleApprove(m.id)}
                          className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Approve for Wall
                        </button>
                      ) : (
                        <button
                          onClick={() => handleHide(m.id)}
                          className="flex-1 py-2 rounded-xl bg-stone-800 hover:bg-rose-500/20 hover:text-rose-400 text-stone-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
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
          </div>
        )}

        {/* Tab Content: Screens */}
        {activeTab === 'screens' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Connected TV Displays</h2>
                <p className="text-xs text-stone-400">
                  Open any smart TV browser or media stick to pair with your café.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Tv className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-white text-sm flex items-center gap-2">
                    <span>Main Hall 4K TV</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                      Online
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 mt-0.5">Screen ID: screen-101 • Resolution: 1920x1080</p>
                </div>
              </div>

              <Link
                href="/wall/screen-101"
                target="_blank"
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-bold text-white border border-stone-700"
              >
                Launch Display
              </Link>
            </div>
          </div>
        )}

        {/* Tab Content: Loyalty Rules */}
        {activeTab === 'loyalty' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-white">Active Loyalty Campaign</h2>
              <p className="text-xs text-stone-400">Configure visit milestones and rewards.</p>
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
                <span className="text-xs text-stone-400">Reward Type</span>
                <span className="font-bold text-sm text-white">Free Specialty Drink / Pastry</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-400">Visit Anti-Fraud Cooldown</span>
                <span className="font-bold text-sm text-stone-300">30 minutes</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
