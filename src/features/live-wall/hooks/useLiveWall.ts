'use client';

import { useState, useEffect, useCallback } from 'react';
import { BusinessSettingsService } from '@/lib/services/business-settings.service';
import { EventOrchestratorService } from '@/lib/services/event-orchestrator.service';
import { TenantSubdomainService } from '@/lib/services/tenant-subdomain.service';
import { reportIgnoredError } from '@/lib/services/diagnostics';
import { WallMemoryItem, DEFAULT_FEATURED_MEMORIES, UseLiveWallReturn } from '../types';

export function useLiveWall(screenId: string): UseLiveWallReturn {
  const [isPaired, setIsPaired] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem(`memories_wall_paired_${screenId}`);
    if (stored !== null) return stored === 'true';
    return screenId === 'screen-1' || screenId === 'screen-101';
  });

  const [screenPairingCode, setScreenPairingCode] = useState<string>(() => {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const arr = new Uint32Array(1);
      crypto.getRandomValues(arr);
      return (100000 + (arr[0] % 900000)).toString();
    }
    return Math.floor(100000 + Math.random() * 900000).toString();
  });
  const [pairedSuccessMsg, setPairedSuccessMsg] = useState<string | null>(null);

  const [memories, setMemories] = useState<WallMemoryItem[]>(DEFAULT_FEATURED_MEMORIES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<string>('الآن');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBlackout, setIsBlackout] = useState(false);
  const [slideIntervalMs, setSlideIntervalMs] = useState(8000);
  const [newMemoryToast, setNewMemoryToast] = useState<string | null>(null);

  const [brandName, setBrandName] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('memories_active_merchant_name') || 'Stampy Specialty Coffee';
    }
    return 'Stampy Specialty Coffee';
  });
  const [brandLogoUrl, setBrandLogoUrl] = useState<string | null>('/brand/stampy-logo.svg');
  const [cafeSlug, setCafeSlug] = useState(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const queryCafe = urlParams.get('cafe') || urlParams.get('slug');
      if (queryCafe) return decodeURIComponent(queryCafe);

      const subdomainSlug = TenantSubdomainService.extractTenantSlug(window.location.hostname);
      if (subdomainSlug) return subdomainSlug;

      return localStorage.getItem('memories_active_merchant_slug') || 'stampy';
    }
    return 'stampy';
  });

  useEffect(() => {
    try {
      const s = BusinessSettingsService.getSettings(cafeSlug);
      if (s?.branding?.name) setBrandName(s.branding.name);
      if (s?.branding?.logoUrl) setBrandLogoUrl(s.branding.logoUrl);
      if (s?.cafeSlug) setCafeSlug(s.cafeSlug);
    } catch (e) { reportIgnoredError('wall/WallClient#1', e); }
  }, [cafeSlug]);

  const CACHE_KEY = `memories_wall_cache_${screenId}`;

  // 1. Offline & Heartbeat Detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const heartbeatTimer = setInterval(async () => {
      try {
        await fetch('/api/v1/screens/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            screenId,
            status: 'online',
          }),
        });
      } catch (e) { reportIgnoredError('wall/WallClient#2', e); }
    }, 45000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(heartbeatTimer);
    };
  }, [screenId]);

  // 2. Pair Success Handler
  const handlePairedSuccess = useCallback((newSlug: string, newName: string) => {
    setBrandName(newName);
    setCafeSlug(newSlug);
    setPairedSuccessMsg(`تم بنجاح! تم اقتران هذه الشاشة مع (${newName})`);
    try {
      localStorage.setItem(`memories_wall_paired_${screenId}`, 'true');
      localStorage.setItem(`memories_wall_cafe_${screenId}`, newSlug);
    } catch (e) { reportIgnoredError('wall/WallClient#3', e); }

    setTimeout(() => {
      setIsPaired(true);
      setPairedSuccessMsg(null);
      fetchApprovedMemories();
    }, 1200);
  }, [screenId]);

  // 3. Fetch Live Approved Memories with Offline Cache Fallback
  const fetchApprovedMemories = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/memories?status=approved&visibility=live_wall&limit=30');
      if (res.ok) {
        const data = await res.json();
        if (data.memories && data.memories.length > 0) {
          const mapped: WallMemoryItem[] = data.memories.map((m: any, idx: number) => ({
            id: m.id,
            customerName: m.customers?.display_name || 'عميل مميز',
            avatarUrl: m.customers?.avatar_url,
            photoUrl: m.optimized_url || m.original_url,
            caption: m.caption,
            visitNumber: m.customers?.total_visits || idx + 1,
            timeFormatted: new Date(m.created_at).toLocaleTimeString('ar-SA', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            createdAt: m.created_at,
          }));

          setMemories(mapped);
          setLastSyncTime(new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }));
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(mapped));
          } catch (e) { reportIgnoredError('wall/WallClient#4', e); }
          return;
        }
      }
    } catch {
      console.warn('API fetch failed, falling back to local storage cache');
    }

    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMemories(parsed);
          return;
        }
      }
    } catch (e) { reportIgnoredError('wall/WallClient#5', e); }
    setMemories(DEFAULT_FEATURED_MEMORIES);
  }, [CACHE_KEY]);

  // 4. Real-Time Pairing & Remote TV Commands Listener
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('memories_active_tv_code', screenPairingCode);
      localStorage.setItem('memories_active_tv_screen', screenId);
    } catch (e) { reportIgnoredError('wall/WallClient#6', e); }

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('memories_screens_channel');
      channel.onmessage = (event) => {
        const data = event.data;
        if (data?.type === 'SCREEN_PAIRED' && (data.code === screenPairingCode || data.code === 'all')) {
          handlePairedSuccess(data.cafeSlug || 'memories', data.cafeName || 'Memories Studio');
        }
        if (data?.type === 'WALL_NEW_PHOTO' && data.item) {
          setMemories((prev) => [data.item, ...prev.filter((m) => m.id !== data.item.id)]);
          setCurrentIndex(0);
          setNewMemoryToast(`وصلت ذكرى جديدة للتو من ${data.item.customerName || 'أحد الزوار المميزين'}! ✨`);
          setTimeout(() => setNewMemoryToast(null), 6000);
        }
        if (data?.type === 'WALL_COMMAND') {
          if (data.command === 'BLACKOUT') {
            setIsBlackout(Boolean(data.blackout));
          } else if (data.command === 'SET_SPEED' && data.durationMs) {
            setSlideIntervalMs(data.durationMs);
          } else if (data.command === 'FORCE_REFRESH') {
            fetchApprovedMemories();
          } else if (data.command === 'UNPAIR') {
            try {
              localStorage.removeItem(`memories_wall_paired_${screenId}`);
              localStorage.removeItem(`memories_wall_cafe_${screenId}`);
            } catch (e) { reportIgnoredError('wall/WallClient#7', e); }
            setIsPaired(false);
          }
        }
      };
    } catch (e) { reportIgnoredError('wall/WallClient#8', e); }

    const handleCustomWallUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && Array.isArray(customEvent.detail) && customEvent.detail.length > 0) {
        setMemories(customEvent.detail);
        setCurrentIndex(0);
        const newest = customEvent.detail[0];
        setNewMemoryToast(`وصلت ذكرى جديدة للتو من ${newest.customerName || 'أحد الزوار المميزين'}! ✨`);
        setTimeout(() => setNewMemoryToast(null), 6000);
      }
    };
    window.addEventListener('memories-wall-updated', handleCustomWallUpdate);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === `memories_paired_screen_${screenPairingCode}` && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          handlePairedSuccess(parsed.cafeSlug || 'memories', parsed.cafeName || 'Memories Studio');
        } catch (e) { reportIgnoredError('wall/WallClient#9', e); }
      }
      if (e.key === `memories_wall_feed_${cafeSlug}` && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMemories(parsed);
            setCurrentIndex(0);
            const newest = parsed[0];
            setNewMemoryToast(`وصلت ذكرى جديدة للتو من ${newest.customerName || 'أحد الزوار المميزين'}! ✨`);
            setTimeout(() => setNewMemoryToast(null), 6000);
          }
        } catch (e) { reportIgnoredError('wall/WallClient#10', e); }
      }
      if (e.key === 'memories_wall_command' && e.newValue) {
        try {
          const cmd = JSON.parse(e.newValue);
          if (cmd.command === 'BLACKOUT') setIsBlackout(Boolean(cmd.blackout));
          if (cmd.command === 'SET_SPEED' && cmd.durationMs) setSlideIntervalMs(cmd.durationMs);
          if (cmd.command === 'FORCE_REFRESH') fetchApprovedMemories();
          if (cmd.command === 'UNPAIR') {
            try {
              localStorage.removeItem(`memories_wall_paired_${screenId}`);
              localStorage.removeItem(`memories_wall_cafe_${screenId}`);
            } catch (e) { reportIgnoredError('wall/WallClient#11', e); }
            setIsPaired(false);
          }
        } catch (e) { reportIgnoredError('wall/WallClient#12', e); }
      }
    };
    window.addEventListener('storage', handleStorage);

    // Authoritative EventOrchestrator subscriptions
    const unsubCast = EventOrchestratorService.subscribe('PHOTO_CASTED', (evt) => {
      const item: WallMemoryItem = {
        id: evt.payload.memoryId,
        customerName: evt.payload.customerName,
        photoUrl: evt.payload.photoUrl,
        caption: evt.payload.caption || '',
        visitNumber: evt.payload.visitNumber,
        timeFormatted: new Date(evt.payload.timestamp).toLocaleTimeString('ar-SA', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        createdAt: evt.payload.timestamp,
      };
      setMemories((prev) => [item, ...prev.filter((m) => m.id !== item.id)].slice(0, 40));
      setCurrentIndex(0);
      setNewMemoryToast(`وصلت ذكرى جديدة للتو من ${item.customerName || 'أحد الزوار المميزين'}! ✨`);
      setTimeout(() => setNewMemoryToast(null), 6000);
    });

    const unsubCmd = EventOrchestratorService.subscribe('SCREEN_COMMAND', (evt) => {
      if (evt.payload.screenId === screenId || evt.payload.screenId === 'all') {
        if (evt.payload.command === 'BLACKOUT') setIsBlackout(Boolean(evt.payload.payload));
        if (evt.payload.command === 'SET_SPEED' && evt.payload.payload) setSlideIntervalMs(evt.payload.payload);
        if (evt.payload.command === 'FORCE_REFRESH') fetchApprovedMemories();
      }
    });

    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('memories-wall-updated', handleCustomWallUpdate);
      unsubCast();
      unsubCmd();
    };
  }, [screenPairingCode, screenId, cafeSlug, handlePairedSuccess, fetchApprovedMemories]);

  useEffect(() => {
    fetchApprovedMemories();
    const pollInterval = setInterval(fetchApprovedMemories, 5000);
    return () => clearInterval(pollInterval);
  }, [fetchApprovedMemories]);

  // 5. Slideshow Transition Timer
  useEffect(() => {
    if (!isPlaying || memories.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % memories.length);
    }, slideIntervalMs);
    return () => clearInterval(timer);
  }, [isPlaying, memories.length, slideIntervalMs]);

  // 6. Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        setIsBlackout((prev) => !prev);
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        fetchApprovedMemories();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setCurrentIndex((prev) => (prev + 1) % (memories.length || 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setCurrentIndex((prev) => (prev - 1 + (memories.length || 1)) % (memories.length || 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [memories.length, fetchApprovedMemories]);

  const handleRegenerateCode = () => {
    let newCode = '100000';
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const arr = new Uint32Array(1);
      crypto.getRandomValues(arr);
      newCode = (100000 + (arr[0] % 900000)).toString();
    } else {
      newCode = Math.floor(100000 + Math.random() * 900000).toString();
    }
    setScreenPairingCode(newCode);
    try {
      localStorage.setItem('memories_active_tv_code', newCode);
    } catch (e) { reportIgnoredError('wall/WallClient#13', e); }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const currentMemory = memories[currentIndex] || memories[0];

  return {
    screenId,
    isPaired,
    setIsPaired,
    screenPairingCode,
    pairedSuccessMsg,
    memories,
    currentIndex,
    currentMemory,
    isPlaying,
    setIsPlaying,
    isOnline,
    lastSyncTime,
    isFullscreen,
    isBlackout,
    newMemoryToast,
    brandName,
    brandLogoUrl,
    cafeSlug,
    handleRegenerateCode,
    toggleFullscreen,
    fetchApprovedMemories,
  };
}
