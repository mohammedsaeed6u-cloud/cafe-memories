'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Coffee, ArrowRight, Sparkles, Shield, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setErrorMsg(error.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to initialize Google Sign-in');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = () => {
    // Store demo session in cookie / localStorage and route to dashboard
    document.cookie = 'cafe_demo_session=true; path=/; max-age=86400';
    router.push('/dashboard');
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 rounded-3xl bg-stone-900/90 border border-stone-800 shadow-2xl backdrop-blur-xl text-stone-100">
      <div className="text-center space-y-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 text-stone-950 flex items-center justify-center font-bold mx-auto shadow-lg shadow-amber-500/20">
          <Coffee className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">Merchant Portal</h1>
        <p className="text-sm text-stone-400">
          Manage your café memories, live screens, and customer rewards.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="space-y-4">
        {/* Google Sign-in */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-stone-100 text-stone-900 font-bold text-sm flex items-center justify-center gap-3 shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Demo Merchant Quick Access */}
        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-stone-800"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-stone-900 px-2 text-stone-500 font-semibold tracking-wider">or</span>
          </div>
        </div>

        <button
          onClick={handleDemoSignIn}
          className="w-full py-3.5 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Explore Demo Merchant Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-8 pt-6 border-t border-stone-800/80 text-center space-y-2">
        <Link
          href="/"
          className="text-xs text-stone-400 hover:text-stone-200 transition-colors inline-block"
        >
          ← Return to Home
        </Link>
        <p className="text-[11px] text-stone-400 flex items-center justify-center gap-1">
          <Shield className="w-3.5 h-3.5 text-stone-400" />
          <span>Protected with Role-Based Access Control</span>
        </p>
      </div>
    </div>
  );
}
