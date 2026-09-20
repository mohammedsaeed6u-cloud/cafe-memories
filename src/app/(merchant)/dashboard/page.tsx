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
  AlertCircle
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface PhotoBoothMemory {
  id: string;
  customer: string;
  caption: string;
  img: string;
  time: string;
  status: 'pending' | 'approved' | 'hidden';
  visibility: string;
}

export default function PhotoBoothModerationDashboard() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'hidden'>('all');
  const [memories, setMemories] = useState<PhotoBoothMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const loadMemories = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;

      if (data && data.length > 0) {
        setMemories(
          data.map((m: any, idx: number) => {
            const date = new Date(m.created_at);
            const diffMin = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));
            const timeAgo = diffMin < 60 ? `${diffMin}m ago` : `${Math.round(diffMin / 60)}h ago`;

            return {
              id: m.id,
              customer: m.customer_id === '00000000-0000-0000-0000-000000000005' ? 'Sarah Mansour' : `Table Guest #${100 + idx}`,
              caption: m.caption || 'Specialty Coffee Photo Booth Moment ☕✨',
              img: m.optimized_url || m.original_url || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
              time: timeAgo,
              status: (m.status as any) || 'approved',
              visibility: m.visibility || 'live_wall',
            };
          })
        );
      } else {
        // Default sample photobooth strips
        setMemories([
          {
            id: 'm1',
            customer: 'Sarah Mansour',
            caption: 'Morning cortado with friends ✨',
            img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
            time: '5m ago',
            status: 'approved',
            visibility: 'live_wall',
          },
          {
            id: 'm2',
            customer: 'Omar Khaled',
            caption: 'Single origin V60 drip coffee ☕',
            img: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
            time: '18m ago',
            status: 'pending',
            visibility: 'live_wall',
          },
          {
            id: 'm3',
            customer: 'Nour El-Din',
            caption: 'Weekend work session corner 🥐',
            img: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
            time: '42m ago',
            status: 'approved',
            visibility: 'live_wall',
          },
        ]);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMemories();
  }, [loadMemories]);

  // Update memory status (Approve / Hide)
  const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'hidden') => {
    // Optimistic UI
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
      const samplePhotos = [
        'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
      ];
      const randomPhoto = samplePhotos[Math.floor(Math.random() * samplePhotos.length)];

      const supabase = createClient();
      await supabase.from('memories').insert({
        organization_id: '00000000-0000-0000-0000-000000000001',
        branch_id: '00000000-0000-0000-0000-000000000002',
        customer_id: '00000000-0000-0000-0000-000000000005',
        original_url: randomPhoto,
        optimized_url: randomPhoto,
        thumbnail_url: randomPhoto,
        caption: 'New Photo Booth Strip from Table 4! 📸☕',
        status: 'approved',
        visibility: 'live_wall',
      });

      setToast('🎉 New Photo Booth Strip Created & Sent to TV Wall!');
      setTimeout(() => setToast(null), 4000);
      loadMemories();
    } catch (err: any) {
      alert('Error simulating: ' + err.message);
    } finally {
      setSimulating(false);
    }
  };

  const filtered = memories.filter(m => {
    if (filter === 'all') return true;
    return m.status === filter;
  });

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
                  Espresso Lab • Photo Booth Studio
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                  LIVE CURATION
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Curate and broadcast guest photo booth strips live to your venue screens.
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
              <span>Simulate Guest Photo Strip</span>
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
            {filtered.length} strips displayed
          </div>
        </div>

        {/* PHOTO BOOTH STRIPS GALLERY GRID */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="h-96 rounded-3xl bg-stone-900/50 border border-stone-800/60 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 rounded-3xl bg-stone-900/30 border border-stone-800/60 p-8 space-y-4">
            <Camera className="w-12 h-12 text-stone-600 mx-auto" />
            <h3 className="text-lg font-bold text-stone-300">No Photo Booth Strips Found</h3>
            <p className="text-xs text-stone-400 max-w-sm mx-auto">
              Guests will appear here the moment they take photos from table QR codes.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filtered.map(strip => (
              <div
                key={strip.id}
                className="group rounded-3xl bg-stone-900 border border-stone-800/90 shadow-xl overflow-hidden flex flex-col justify-between transition-all hover:border-amber-500/40 hover:shadow-amber-500/5"
              >
                {/* PHOTO BOOTH STRIP MINIATURE */}
                <div className="p-4 bg-[#FAF8F5] text-stone-900 m-3 rounded-2xl shadow-inner">
                  {/* Miniature Strip Header */}
                  <div className="text-center pb-2 mb-2 border-b border-stone-200">
                    <div className="font-serif font-black text-[10px] tracking-wider uppercase">
                      ESPRESSO LAB • PHOTO BOOTH
                    </div>
                  </div>

                  {/* 3 Stacked Miniature Photos */}
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

                  {/* Miniature Strip Footer */}
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

                {/* Strip Management & Moderation Actions */}
                <div className="p-4 pt-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-white">{strip.customer}</div>
                      <div className="text-[11px] text-stone-400">{strip.time}</div>
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

                  {/* Quick Action Buttons */}
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
      </main>
    </div>
  );
}
