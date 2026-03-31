'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { CollapsibleSidebar } from '@/components/ui/organisms/collapsible-sidebar';
import { TenantProvider } from '@/lib/tenant-context';
import { useTenantId } from '@/lib/use-tenant-id';

function TenantShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { tenantId } = useTenantId();

  return (
    <div className="min-h-screen bg-app">
      <CollapsibleSidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        userRole="tenant"
        tenantIdForSidebarCounts={tenantId}
      />
      <div className={`transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-16'}`}>{children}</div>
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
