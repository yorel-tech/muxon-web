'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchOidcConfigIfNeeded, getUserManager, OIDC_NOT_CONFIGURED_MESSAGE } from '@lib/oidc';
import { Button } from '@/components/ui/atoms/button';
import { useProductInfo } from '@lib/product-info-context';
import { BrandMark } from '@/components/BrandMark';

export default function TenantLoginPage() {
  const router = useRouter();
  const { edition, loading: editionLoading } = useProductInfo();
  const isNexus =
    !editionLoading &&
    (edition.toLowerCase() === 'nexus' || edition.toLowerCase() === 'enterprise');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // If already authenticated, send the user to the tenant dashboard
    const checkExistingSession = async () => {
      try {
        await fetchOidcConfigIfNeeded();
        const um = getUserManager();
        const user = await um?.getUser();
        if (user) {
          router.replace('/tenant/dashboard');
        }
      } catch (e) {
        // Ignore errors here; user can still attempt login
        console.error('Error checking existing session', e);
      }
    };

    checkExistingSession();
  }, [router]);

  const handleLogin = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const configOk = await fetchOidcConfigIfNeeded();
      if (!configOk) {
        setError(OIDC_NOT_CONFIGURED_MESSAGE);
        setIsSubmitting(false);
        return;
      }
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('loginType', 'tenant');
      }

      const um = getUserManager();
      if (!um) {
        setError(OIDC_NOT_CONFIGURED_MESSAGE);
        setIsSubmitting(false);
        return;
      }
      await um.signinRedirect();
    } catch (err) {
      console.error('Failed to start tenant login', err);
      setError('Failed to start login. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center px-4 ${
        isNexus
          ? 'bg-gradient-to-br from-[#0F0A1F] via-[#1A1333] to-[#0B0320]'
          : 'bg-gradient-to-br from-[#E0F2FE] via-[#F8FAFC] to-[#BAE6FD]'
      }`}
    >
      <div
        className={`max-w-md w-full rounded-2xl p-8 ${
          isNexus
            ? 'bg-white/10 backdrop-blur-xl border border-white/20'
            : 'bg-surface border border-panel'
        }`}
      >
        <div className="flex items-center mb-6">
          <BrandMark size={40} className="h-10 w-10 rounded-xl mr-3" priority />
          <div>
            <h1
              className={`text-xl font-semibold ${isNexus ? 'text-white' : 'text-[color:var(--text-primary)]'}`}
            >
              Infron Tenant Login
            </h1>
            <p
              className={`text-sm ${isNexus ? 'text-slate-300' : 'text-[color:var(--text-secondary)]'}`}
            >
              Enter your tenant name to continue
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <p className={`text-sm ${isNexus ? 'text-slate-300' : 'text-[color:var(--text-secondary)]'}`}>
            Continue to your identity provider. You can select the tenant context after sign-in.
          </p>

          {error && (
            <div
              className={`rounded-lg border px-3 py-2 text-sm ${
                isNexus
                  ? 'bg-red-500/10 border-red-500/60 text-red-100'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2">
            <Button
              type="button"
              onClick={handleLogin}
              disabled={isSubmitting}
              className={
                isNexus
                  ? 'w-full bg-gradient-to-r from-primary-500 to-accent hover:from-primary-600 hover:brightness-95 text-white border-0'
                  : 'w-full bg-primary-500 hover:bg-primary-600 text-white border-0'
              }
            >
              {isSubmitting ? 'Redirecting…' : 'Continue to Login'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/')}
              disabled={isSubmitting}
              className="w-full"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

