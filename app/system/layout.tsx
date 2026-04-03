'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CollapsibleSidebar } from '@/components/ui/organisms/collapsible-sidebar';
import { Header } from '@/components/ui/organisms/header';
import { useProductInfo } from '@/lib/product-info-context';
import { fetchOidcConfigIfNeeded, getUserManager } from '@/lib/oidc';

const HEADER_HEIGHT = 64;

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

export default function SystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { isEnterprise } = useProductInfo();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-app">
      <Header
        onSettingsClick={() => router.push('/system/settings')}
        onLogout={handleSignOut}
        className="fixed top-0 left-0 right-0 z-50"
      />
      <CollapsibleSidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        userRole="system"
        isEnterprise={isEnterprise}
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
