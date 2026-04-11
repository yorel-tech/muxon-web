'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';

export interface TenantInfo {
  id: string;
  name: string;
  displayName?: string;
}

const ACTIVE_TENANT_ID_KEY = 'activeTenantId';
const TENANT_LIST_KEY = 'tenantList';
const TENANT_EVENT = 'infron:tenant-context-changed';

interface TenantContextType {
  activeTenant: TenantInfo | null;
  tenantList: TenantInfo[];
  setActiveTenant: (tenant: TenantInfo | null) => void;
  setTenantList: (list: TenantInfo[]) => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

function readTenantListFromStorage(): TenantInfo[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(TENANT_LIST_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((t): t is TenantInfo => !!t && typeof t.id === 'string' && typeof t.name === 'string');
  } catch {
    return [];
  }
}

function readActiveTenantIdFromStorage(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_TENANT_ID_KEY);
}

export function persistTenantContext(list: TenantInfo[], activeTenantId: string | null): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TENANT_LIST_KEY, JSON.stringify(list));
  if (activeTenantId) {
    localStorage.setItem(ACTIVE_TENANT_ID_KEY, activeTenantId);
  } else {
    localStorage.removeItem(ACTIVE_TENANT_ID_KEY);
  }
  window.dispatchEvent(new CustomEvent(TENANT_EVENT));
}

/** Persist tenant scope and open the tenant dashboard in a new tab (shared localStorage + OIDC session). */
export function openTenantPortalInNewTab(
  tenant: Pick<TenantInfo, 'id' | 'name'> & { displayName?: string },
): void {
  if (typeof window === 'undefined') return;
  persistTenantContext(
    [{ id: tenant.id, name: tenant.name, displayName: tenant.displayName }],
    tenant.id,
  );
  window.open(`${window.location.origin}/tenant/dashboard`, '_blank', 'noopener,noreferrer');
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenantList, setTenantListState] = useState<TenantInfo[]>([]);
  const [activeTenantId, setActiveTenantId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const syncFromStorage = () => {
      setTenantListState(readTenantListFromStorage());
      setActiveTenantId(readActiveTenantIdFromStorage());
    };
    syncFromStorage();
    window.addEventListener(TENANT_EVENT, syncFromStorage);
    window.addEventListener('storage', syncFromStorage);
    return () => {
      window.removeEventListener(TENANT_EVENT, syncFromStorage);
      window.removeEventListener('storage', syncFromStorage);
    };
  }, []);

  const setTenantList = useCallback((list: TenantInfo[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TENANT_LIST_KEY, JSON.stringify(list));
    setTenantListState(list);

    const currentActiveId = localStorage.getItem(ACTIVE_TENANT_ID_KEY);
    const hasActive = !!currentActiveId && list.some((t) => t.id === currentActiveId);
    if (!hasActive) {
      localStorage.removeItem(ACTIVE_TENANT_ID_KEY);
      setActiveTenantId(null);
    }

    window.dispatchEvent(new CustomEvent(TENANT_EVENT));
  }, []);

  const setActiveTenant = useCallback((tenant: TenantInfo | null) => {
    if (typeof window === 'undefined') return;
    if (tenant) {
      localStorage.setItem(ACTIVE_TENANT_ID_KEY, tenant.id);
      setActiveTenantId(tenant.id);
    } else {
      localStorage.removeItem(ACTIVE_TENANT_ID_KEY);
      setActiveTenantId(null);
    }
    window.dispatchEvent(new CustomEvent(TENANT_EVENT));
  }, []);

  const activeTenant = tenantList.find((t) => t.id === activeTenantId) ?? null;

  return (
    <TenantContext.Provider value={{ activeTenant, tenantList, setActiveTenant, setTenantList }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (ctx === undefined) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return ctx;
}

export function useTenantOptional() {
  return useContext(TenantContext);
}
