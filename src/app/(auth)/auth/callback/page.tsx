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

    const navigateToDashboard = () => {
      if (!isMounted) return;
      setIsRedirecting(true);
      // Hard navigation to guarantee fresh cookies and state in the dashboard
      window.location.href = '/dashboard';
    };

    // 1. Check if session is already active (immediate check)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigateToDashboard();
      }
    });

    // 2. Listen to Supabase auth state changes (handles implicit hash and PKCE exchanges)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigateToDashboard();
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
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900 flex flex-col items-center justify-center font-cairo p-6 text-center">
      {errorMsg ? (
        <div className="max-w-md w-full p-7 rounded-3xl bg-white border border-stone-200 shadow-xl text-stone-900 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto text-xl font-bold border border-rose-200">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-stone-950">تعذر إكمال تسجيل الدخول</h2>
          <p className="text-xs text-stone-600 leading-relaxed">{errorMsg}</p>
          <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-stone-950 hover:bg-stone-900 text-white text-xs font-bold transition shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>العودة لصفحة الدخول</span>
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition border border-stone-300"
            >
              <span>متابعة للوحة التحكم مباشرة</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="max-w-sm w-full p-8 rounded-3xl bg-white border border-stone-200/90 shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-full border-3 border-amber-600 border-t-transparent animate-spin mx-auto" />
          <h2 className="text-base font-black text-stone-950 tracking-tight">
            {isRedirecting ? 'تم التحقق بنجاح!' : 'جاري تأكيد حسابك...'}
          </h2>
          <p className="text-xs text-stone-500">
            {isRedirecting
              ? 'يتم تحويلك إلى لوحة تحكم الكافيه الآن...'
              : 'يرجى الانتظار لحظات للتحقق من بيانات الجلسة.'}
          </p>
        </div>
      )}
    </div>
  );
}
