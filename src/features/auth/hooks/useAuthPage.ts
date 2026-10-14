'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { verifyPinOnly, setActiveStaffMember } from '@/lib/services/staff-auth.service';
import { BusinessSettingsService } from '@/lib/services/business-settings.service';
import { reportIgnoredError } from '@/lib/services/diagnostics';
import { authClient, useSession } from '@/lib/auth/auth-client';

export type AuthTab = 'signup' | 'signin' | 'pin' | '2fa';

export function useAuthPage() {
  const [authTab, setAuthTab] = useState<AuthTab>('signup');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Email / Password / Cafe Registration state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cafeName, setCafeName] = useState('');
  const [cafeSlug, setCafeSlug] = useState('');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

  // Staff PIN state
  const [pin, setPin] = useState('');

  // Better Auth 2FA state
  const [twoFactorCode, setTwoFactorCode] = useState('');

  // Better Auth Reactive Session
  const { data: sessionData, isPending: sessionLoading } = useSession();

  const handleCafeNameChange = (val: string) => {
    setCafeName(val);
    if (!isSlugManuallyEdited) {
      const generated = val
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/--+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 30);
      setCafeSlug(generated);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('يرجى إدخال البريد الإلكتروني وكلمة المرور.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const supabase = createClient();

    try {
      if (authTab === 'signup') {
        if (!cafeName.trim()) {
          setErrorMsg('يرجى إدخال اسم المنشأة أو الكافيه لإنشاء حسابك.');
          setLoading(false);
          return;
        }

        const effectiveSlug = (cafeSlug.trim() || cafeName.trim())
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '')
          .replace(/--+/g, '-')
          .slice(0, 30) || 'my-cafe';

        // 1. Supabase Auth Sign Up
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              cafe_name: cafeName.trim(),
              cafe_slug: effectiveSlug,
            },
          },
        });

        if (authError) {
          throw new Error(
            authError.message === 'User already registered'
              ? 'هذا البريد الإلكتروني مسجل بالفعل، يرجى تسجيل الدخول.'
              : authError.message
          );
        }

        // 2. Multi-Tenant Provisioning in Supabase
        try {
          const { data: orgData } = await supabase
            .from('organizations')
            .upsert(
              {
                name: cafeName.trim(),
                slug: effectiveSlug,
                status: 'active',
                country: 'SA',
                currency: 'SAR',
              },
              { onConflict: 'slug' }
            )
            .select()
            .single();

          if (authData?.user && orgData?.id) {
            await supabase.from('organization_members').upsert(
              {
                organization_id: orgData.id,
                user_id: authData.user.id,
                role: 'owner',
              },
              { onConflict: 'organization_id,user_id' }
            );

            await supabase.from('tenant_wallet_quotas').upsert(
              {
                tenant_slug: effectiveSlug,
                monthly_quota: 1000,
                used_quota: 0,
                plan_tier: 'starter',
                is_byok: false,
              },
              { onConflict: 'tenant_slug' }
            );
          }
        } catch (syncErr) {
          reportIgnoredError('auth/signup_tenant_provisioning', syncErr);
        }

        // 3. Better Auth Multi-Tenant & Account Provisioning
        try {
          await authClient.signUp.email({
            email: email.trim(),
            password,
            name: cafeName.trim(),
          });
        } catch (baErr) {
          reportIgnoredError('auth/useAuthPage#signup_better_auth', baErr);
        }

        BusinessSettingsService.saveSettings({
          ...BusinessSettingsService.getSettings(effectiveSlug),
          cafeSlug: effectiveSlug,
          cafeName: cafeName.trim(),
          branding: {
            name: cafeName.trim(),
          },
        });

        try {
          localStorage.setItem('memories_active_merchant_slug', effectiveSlug);
          localStorage.setItem('memories_active_merchant_name', cafeName.trim());
        } catch (e) {
          reportIgnoredError('auth/useAuthPage#signup_local_storage', e);
        }

        setSuccessMsg('تم إنشاء حسابك وتجهيز مساحة العمل بنجاح! جاري تحويلك...');
        setTimeout(() => {
          window.location.href = `/dashboard?cafe=${effectiveSlug}`;
        }, 1200);
      } else {
        // Sign In
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) {
          throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
        }

        // Check Better Auth 2FA / Session
        try {
          const baRes = await authClient.signIn.email({
            email: email.trim(),
            password,
          });
          if (baRes?.data && (baRes.data as any).twoFactorRedirect) {
            setAuthTab('2fa');
            setLoading(false);
            return;
          }
        } catch (baErr) {
          reportIgnoredError('auth/useAuthPage#signin_better_auth', baErr);
        }

        let userCafeSlug = signInData.user?.user_metadata?.cafe_slug;

        if (!userCafeSlug) {
          try {
            const { data: memberData } = await supabase
              .from('organization_members')
              .select('organization_id, organizations(slug, name)')
              .eq('user_id', signInData.user.id)
              .limit(1)
              .maybeSingle();

            if (memberData && (memberData as any).organizations?.slug) {
              userCafeSlug = (memberData as any).organizations.slug;
            }
          } catch (e) {
            reportIgnoredError('auth/useAuthPage#org_lookup', e);
          }
        }

        const resolvedSlug = userCafeSlug || localStorage.getItem('memories_active_merchant_slug') || 'memories';
        try {
          localStorage.setItem('memories_active_merchant_slug', resolvedSlug);
        } catch (e) {
          reportIgnoredError('auth/useAuthPage#signin_local_storage', e);
        }

        setSuccessMsg('تم تسجيل الدخول بنجاح! جاري التحويل...');
        setTimeout(() => {
          window.location.href = `/dashboard?cafe=${resolvedSlug}`;
        }, 1000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء المصادقة.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFactorCode.trim()) {
      setErrorMsg('يرجى إدخال رمز التحقق المكون من 6 أرقام.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const { data, error } = await authClient.twoFactor.verifyTotp({
        code: twoFactorCode.trim(),
        trustDevice: true,
      });

      if (error) {
        throw new Error(error.message || 'رمز التحقق غير صحيح.');
      }

      const resolvedSlug = localStorage.getItem('memories_active_merchant_slug') || 'memories';
      setSuccessMsg('تم تأكيد الهوية بنجاح! جاري تحويلك...');
      setTimeout(() => {
        window.location.href = `/dashboard?cafe=${resolvedSlug}`;
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل التحقق من رمز 2FA.');
    } finally {
      setLoading(false);
    }
  };

  const handlePinAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) {
      setErrorMsg('يرجى إدخال رمز PIN.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const result = await verifyPinOnly(pin);
    if (!result.success || !result.staff) {
      setErrorMsg(result.error || 'رمز PIN غير صحيح. تحقق من الرمز وحاول مجدداً.');
      setLoading(false);
      return;
    }

    // Mint the signed httpOnly staff cookie for guarded API routes.
    try {
      await fetch('/api/v1/staff-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
    } catch (e) {
      reportIgnoredError('auth/useAuthPage#staff_session_mint', e);
    }

    const cafe = localStorage.getItem('memories_active_merchant_slug') || 'memories';
    setSuccessMsg(`مرحباً ${result.staff.name}! تم التحقق من هويتك.`);
    setTimeout(() => {
      window.location.href = `/terminal?cafe=${cafe}`;
    }, 600);
  };

  const handleOAuthLogin = async (provider: 'google') => {
    setErrorMsg(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) {
      setErrorMsg(error.message);
    }
  };

  return {
    authTab,
    setAuthTab,
    loading,
    errorMsg,
    successMsg,
    email,
    setEmail,
    password,
    setPassword,
    cafeName,
    handleCafeNameChange,
    cafeSlug,
    setCafeSlug,
    setIsSlugManuallyEdited,
    pin,
    setPin,
    twoFactorCode,
    setTwoFactorCode,
    sessionData,
    sessionLoading,
    handleEmailAuth,
    handleVerify2FA,
    handlePinAuth,
    handleOAuthLogin,
  };
}
