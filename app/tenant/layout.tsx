'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { CollapsibleSidebar } from '@/components/ui/organisms/collapsible-sidebar';
import { Header } from '@/components/ui/organisms/header';
import { TenantProvider, useTenant } from '@/lib/tenant-context';
import { fetchOidcConfigIfNeeded, getUserManager } from '@/lib/oidc';

const HEADER_HEIGHT = 64;

function TenantSwitcherSelect() {
  const { activeTenant, tenantList, setActiveTenant } = useTenant();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = tenantList.find((t) => t.id === e.target.value) ?? null;
    setActiveTenant(selected);
    router.push('/tenant/dashboard');
  };

  return (
    <select
      className="h-10 rounded-md border border-primary-400 bg-primary-700 dark:bg-primary-900 text-white text-sm px-3 focus:outline-none focus:ring-2 focus:ring-primary-300 min-w-[140px] max-w-[220px] truncate"
      value={activeTenant?.id ?? ''}
      onChange={handleChange}
    >
      <option value="" disabled>Select tenant</option>
      {tenantList.map((t) => (
        <option key={t.id} value={t.id}>
          {t.displayName || t.name}
        </option>
      ))}
    </select>
  );
}

async function handleSignOut() {
  try {
    await fetchOidcConfigIfNeeded();
    const manager = getUserManager();
    if (manager) {
      await manager.signoutRedirect();
    }
  } catch (error) {
    console.error('Error signing out:', error);
  }
}

function TenantShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { activeTenant } = useTenant();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-app">
      <Header
        tenantSwitcher={<TenantSwitcherSelect />}
        onSettingsClick={() => router.push('/tenant/administration')}
        onLogout={handleSignOut}
        className="fixed top-0 left-0 right-0 z-50"
      />
      <CollapsibleSidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        userRole="tenant"
        tenantIdForSidebarCounts={activeTenant?.id ?? null}
        showTenantSwitcher={false}
        showUserSection={false}
        topOffset={HEADER_HEIGHT}
      />
      <div
        className={`transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-16'}`}
        style={{ paddingTop: HEADER_HEIGHT }}
      >
        {children}
      </div>
    </div>
  );
}

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/tenant/login';

  if (isLoginPage) {
    return <TenantProvider>{children}</TenantProvider>;
  }

  return (
    <TenantProvider>
      <TenantShell>{children}</TenantShell>
    </TenantProvider>
  );
}
