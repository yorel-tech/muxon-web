'use client';

import { useState } from 'react';
import { CollapsibleSidebar } from '@/components/ui/organisms/collapsible-sidebar';
import { useProductInfo } from '@/lib/product-info-context';

export default function SystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { isEnterprise } = useProductInfo();

  return (
    <div className="min-h-screen bg-app">
      <CollapsibleSidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        userRole="system"
        isEnterprise={isEnterprise}
      />
      <div className={`transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-16'}`}>
        {children}
      </div>
    </div>
  );
}
