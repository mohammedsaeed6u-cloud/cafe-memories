'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AlertCircle, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function AuthCallbackPage() {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    const navigateToDashboard = (session?: any) => {
      if (!isMounted) return;
      setIsRedirecting(true);

      if (session?.user) {
        const u = session.user;
        const meta = u.user_metadata || {};
        const fullName = meta.full_name || meta.name || u.email?.split('@')[0] || 'التاجر';
        const avatarUrl = meta.avatar_url || meta.picture || '';
        const email = u.email || '';

        try {
          localStorage.setItem('memories_merchant_name', fullName);
          if (avatarUrl) localStorage.setItem('memories_merchant_avatar', avatarUrl);
          if (email) localStorage.setItem('memories_merchant_email', email);

          let currentSlug = localStorage.getItem('memories_active_merchant_slug');
          if (!currentSlug || currentSlug === 'memories') {
            const derivedSlug = (fullName || 'cafe')
              .toLowerCase()
              .replace(/[^a-z0-9]/g, '-')
              .replace(/--+/g, '-')
              .replace(/^-|-$/g, '')
              .slice(0, 25) || 'my-cafe';
            localStorage.setItem('memories_active_merchant_slug', derivedSlug);
            currentSlug = derivedSlug;
          }

          window.location.href = `/dashboard?cafe=${currentSlug}`;
          return;
        } catch (e) {
          console.warn('Callback storage error:', e);
        }
      }

      // Hard navigation to guarantee fresh cookies and state in the dashboard
      window.location.href = '/dashboard';
    };

    // 1. Check if session is already active (immediate check)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigateToDashboard(session);
      }
    });

    // 2. Listen to Supabase auth state changes (handles implicit hash and PKCE exchanges)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigateToDashboard(session);
      }
    });

    // 3. Inspect query string & hash params
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));

    const err =
      searchParams.get('error_description') ||
      searchParams.get('error') ||
      hashParams.get('error_description') ||
      hashParams.get('error');

    if (err) {
      // Before displaying error, verify whether session succeeded anyway
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          navigateToDashboard();
        } else if (isMounted) {
          setErrorMsg(decodeURIComponent(err));
        }
      });
      return;
    }

    // 4. PKCE code exchange with safety catch for double-execution
    const code = searchParams.get('code');
    if (code) {
      supabase.auth
        .exchangeCodeForSession(code)
        .then(({ data, error }) => {
          if (data?.session) {
            navigateToDashboard();
          } else if (error) {
            console.warn('exchangeCodeForSession note:', error.message);
            // Verify if code was already exchanged by onAuthStateChange
            supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
              if (existingSession) {
                navigateToDashboard();
              } else if (isMounted) {
                // Wait briefly in case session storage is in flight
                setTimeout(() => {
                  supabase.auth.getSession().then(({ data: { session: retrySession } }) => {
                    if (retrySession) {
                      navigateToDashboard();
                    } else if (isMounted) {
                      setErrorMsg(error.message);
                    }
                  });
                }, 1200);
              }
            });
          }
        })
        .catch((err) => {
          console.error('Exchange error:', err);
        });
    }

    // 5. Final fallback after 3.5 seconds
    const fallbackTimer = setTimeout(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          navigateToDashboard();
        } else if (isMounted && !code && !err) {
          setErrorMsg('لم يتم العثور على جلسة دخول صالحة. يرجى العودة وتسجيل الدخول.');
        }
      });
    }, 3500);

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#141313] text-[#e6e1e1] flex flex-col items-center justify-center font-sans p-6 text-center relative overflow-hidden selection:bg-[#c92a54] selection:text-white">
      {/* Ambient Archival Glows */}
      <div className="fixed top-0 left-0 w-[550px] h-[500px] bg-gradient-to-br from-[#98183c]/20 via-[#1A0706]/30 to-transparent rounded-full blur-[100px] pointer-events-none z-0 transform-gpu will-change-transform" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[450px] bg-gradient-to-tl from-[#c92a54]/10 via-[#98183c]/15 to-transparent rounded-full blur-[100px] pointer-events-none z-0 transform-gpu will-change-transform" />

      {errorMsg ? (
        <div className="max-w-md w-full p-8 rounded-2xl bg-[#141212] border border-white/10 shadow-2xl text-[#FBF9F5] space-y-4 relative z-10 backdrop-blur-xl">
          <div className="w-12 h-12 rounded-xl bg-[#98183c]/30 text-[#c92a54] flex items-center justify-center mx-auto text-xl font-bold border border-[#c92a54]/40 shadow-md">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2
            style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
            className="text-base sm:text-lg font-bold text-[#FBF9F5]"
          >
            تعذر إكمال تسجيل الدخول
          </h2>
          <p className="text-xs text-[#A19E9B] leading-relaxed">{errorMsg}</p>
          <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#c92a54] hover:bg-[#B50200] text-[#FBF9F5] text-xs font-bold transition shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>العودة لصفحة الدخول</span>
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#1C1B1B] hover:bg-[#211F1F] text-[#FBF9F5] text-xs font-bold transition border border-white/10"
            >
              <span>متابعة للوحة التحكم مباشرة</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="max-w-sm w-full p-8 rounded-2xl bg-[#141212] border border-white/10 shadow-2xl space-y-4 relative z-10 backdrop-blur-xl">
          <div className="w-12 h-12 rounded-full border-3 border-[#c92a54] border-t-transparent animate-spin mx-auto" />
          <h2
            style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
            className="text-base sm:text-lg font-bold text-[#FBF9F5] tracking-tight"
          >
            {isRedirecting ? 'تم التحقق بنجاح!' : 'جاري تأكيد حسابك...'}
          </h2>
          <p className="text-xs text-[#A19E9B]">
            {isRedirecting
              ? 'يتم تحويلك إلى لوحة التحكم الآن...'
              : 'يرجى الانتظار لحظات للتحقق من بيانات الجلسة.'}
          </p>
        </div>
      )}
    </div>
  );
}
