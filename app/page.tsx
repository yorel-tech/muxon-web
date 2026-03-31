'use client';

import { useEffect, useState } from 'react';
import { fetchOidcConfigIfNeeded, getUserManager, OIDC_NOT_CONFIGURED_MESSAGE } from '@lib/oidc';
import { useProductInfo } from '@lib/product-info-context';
import { BrandMark } from '@/components/BrandMark';

type LoginType = 'tenant' | 'system';

export default function Home() {
  const { edition, loading: editionLoading } = useProductInfo();
  const isNexus =
    !editionLoading &&
    (edition.toLowerCase() === 'nexus' || edition.toLowerCase() === 'enterprise');
  const [name, setName] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [loginType, setLoginType] = useState<LoginType>('tenant');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [oidcError, setOidcError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    (async () => {
      await fetchOidcConfigIfNeeded();
      const um = getUserManager();
      if (!um) return;
      const u = await um.getUser();
      setName(u?.profile?.email || u?.profile?.preferred_username || null);
    })();
  }, []);

  const onLogin = async (type: LoginType) => {
    const ok = await fetchOidcConfigIfNeeded();
    if (!ok) {
      setOidcError(OIDC_NOT_CONFIGURED_MESSAGE);
      return;
    }
    const um = getUserManager();
    if (!um) {
      setOidcError(OIDC_NOT_CONFIGURED_MESSAGE);
      return;
    }
    setOidcError(null);
    sessionStorage.setItem('loginType', type);
    setShowLoginModal(false);
    um.signinRedirect();
  };

  const onLogout = async () => {
    await fetchOidcConfigIfNeeded();
    await getUserManager()?.signoutRedirect();
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: isNexus
            ? 'linear-gradient(to bottom right, #0F0A1F, #5B21B6, #0F0A1F)'
            : 'linear-gradient(to bottom right, #E0F2FE, #F8FAFC, #BAE6FD)',
        }}
      >
        <div className="absolute inset-0 opacity-30">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: isNexus
                ? `radial-gradient(circle at 25% 25%, rgba(139, 92, 246, 0.3) 0%, transparent 50%),
                   radial-gradient(circle at 75% 75%, rgba(14, 165, 233, 0.3) 0%, transparent 50%)`
                : `radial-gradient(circle at 25% 25%, rgba(14, 165, 233, 0.35) 0%, transparent 50%),
                   radial-gradient(circle at 75% 75%, rgba(2, 132, 199, 0.2) 0%, transparent 50%)`,
              animation: 'pulse-glow 8s ease-in-out infinite',
            }}
          />
        </div>

        <div
          className={isNexus ? 'absolute inset-0 opacity-10' : 'absolute inset-0 opacity-[0.12]'}
          style={{
            backgroundImage: isNexus
              ? `linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                 linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`
              : `linear-gradient(rgba(15, 23, 42, 0.06) 1px, transparent 1px),
                 linear-gradient(90deg, rgba(15, 23, 42, 0.06) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="flex items-center justify-between px-8 py-6">
          <div className="flex items-center space-x-2">
            <BrandMark size={40} className="w-10 h-10 rounded-lg" priority />
            <span
              className={`text-xl font-bold ${isNexus ? 'text-white' : 'text-[color:var(--text-primary)]'}`}
            >
              Infron
            </span>
          </div>
          <div className="flex items-center space-x-4">
            {name ? (
              <>
                <span className={isNexus ? 'text-gray-300' : 'text-[color:var(--text-secondary)]'}>
                  {name}
                </span>
                <button
                  onClick={onLogout}
                  className={
                    isNexus
                      ? 'px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors'
                      : 'px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white transition-colors'
                  }
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setOidcError(null);
                  setShowLoginModal(true);
                }}
                className={
                  isNexus
                    ? 'px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors'
                    : 'px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white transition-colors'
                }
              >
                Login
              </button>
            )}
          </div>
        </nav>

        {/* Hero section */}
        <main className="flex flex-col items-center justify-center px-8 py-20">
          <div className="max-w-4xl text-center">
            <h1
              className={`text-5xl md:text-6xl font-bold mb-6 ${
                isNexus ? 'text-white' : 'text-[color:var(--text-primary)]'
              }`}
            >
              Infrastructure Management Platform
            </h1>
            <p
              className={`text-xl mb-8 ${
                isNexus ? 'text-gray-300' : 'text-[color:var(--text-secondary)]'
              }`}
            >
              Deploy, manage, and scale your infrastructure with ease
            </p>
            {name ? (
              <div className="flex justify-center space-x-4">
                <a
                  href="/system"
                  className={
                    isNexus
                      ? 'px-6 py-3 rounded-lg bg-gradient-to-r from-primary-500 to-accent hover:from-primary-600 hover:brightness-95 text-white font-semibold transition-all'
                      : 'px-6 py-3 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-semibold transition-all'
                  }
                >
                  System Dashboard
                </a>
              </div>
            ) : (
              <button
                onClick={() => {
                  setOidcError(null);
                  setShowLoginModal(true);
                }}
                className={
                  isNexus
                    ? 'px-8 py-4 rounded-lg bg-gradient-to-r from-primary-500 to-accent hover:from-primary-600 hover:brightness-95 text-white font-semibold text-lg transition-all'
                    : 'px-8 py-4 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-semibold text-lg transition-all'
                }
              >
                Get Started
              </button>
            )}
          </div>
        </main>
      </div>

      {/* Login modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-surface rounded-xl border border-panel max-w-md w-full p-8">
            <div className="flex items-center gap-3 mb-6">
              <BrandMark size={40} className="rounded-lg" />
              <h2 className="text-2xl font-bold text-gray-900">Login to Infron</h2>
            </div>
            {oidcError && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                {oidcError}
              </div>
            )}
            <div className="space-y-4">
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  onLogin('tenant');
                }}
                className="w-full px-6 py-4 rounded-lg border-2 border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-all text-left"
              >
                <div className="font-semibold text-gray-900">Tenant Login</div>
                <div className="text-sm text-gray-500">Access your tenant dashboard</div>
              </button>
              <button
                onClick={() => onLogin('system')}
                className="w-full px-6 py-4 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
              >
                <div className="font-semibold text-gray-900">System Login</div>
                <div className="text-sm text-gray-500">Access system administration</div>
              </button>
            </div>
            <button
              onClick={() => setShowLoginModal(false)}
              className="mt-6 w-full px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  );
}
