'use client';

import { useTenantOptional } from '@/lib/tenant-context';

export function useTenantId(): { tenantId: string | null; loading: boolean; error: string | null; refetch: () => void } {
  const tenant = useTenantOptional()?.activeTenant ?? null;
  return { tenantId: tenant?.id ?? null, loading: false, error: null, refetch: () => {} };
}
