'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';
import { VmConsole, type VmConsoleProtocol } from '@/components/ui/organisms/vm-console';
import { apiGet } from '@/lib/api';
import { useTenantId } from '@/lib/use-tenant-id';

interface ConsoleSessionResponse {
  url?: string;
  token?: string;
  expires_at?: string;
  console_type?: string;
  remote_password?: string | null;
}

export function VmConsolePageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const vmId = typeof params.vmId === 'string' ? params.vmId : '';
  const vmNameFromQuery = searchParams.get('name') ?? undefined;
  const { tenantId } = useTenantId();

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [session, setSession] = useState<ConsoleSessionResponse | null>(null);

  const loadSession = useCallback(async () => {
    if (!tenantId || !vmId) return;
    setLoading(true);
    setErr(null);
    setSession(null);
    const path = `/api/v1/tenants/${tenantId}/vms/${vmId}/console`;
    try {
      const data = await apiGet<ConsoleSessionResponse>(path, { timeoutMs: 120_000 });
      setSession(data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to open console session');
    } finally {
      setLoading(false);
    }
  }, [tenantId, vmId]);

  useEffect(() => {
    if (tenantId && vmId) {
      void loadSession();
    }
  }, [tenantId, vmId, loadSession]);

  const wsUrl = session?.url ? String(session.url) : '';
  const protocol = (session?.console_type?.toUpperCase() ?? 'VNC') as VmConsoleProtocol;
  const title = vmNameFromQuery ? `Console — ${vmNameFromQuery}` : 'VM console';

  useEffect(() => {
    document.title = title;
  }, [title]);

  if (!tenantId) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center p-6 text-gray-600 dark:text-gray-300">
        Tenant is not available. Open this page from the tenant VMs list.
      </div>
    );
  }

  if (!vmId) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center p-6 text-gray-600 dark:text-gray-300">
        Invalid VM id.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app flex flex-col">
      <header className="shrink-0 border-b border-panel bg-surface px-4 py-3 flex items-center gap-4 flex-wrap">
        <Link
          href="/tenant/vms"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to VMs
        </Link>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">{title}</h1>
      </header>

      <main className="flex-1 flex flex-col min-h-0 p-4 gap-3">
        {loading && (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            Resolving console session…
          </div>
        )}
        {err && <p className="text-sm text-red-600 dark:text-red-400">{err}</p>}
        {!loading && session && !wsUrl && (
          <p className="text-sm text-amber-700 dark:text-amber-400">
            API returned a session without a <code className="text-xs">url</code> field.
          </p>
        )}
        {!loading && session && wsUrl && (
          <VmConsole
            wsUrl={wsUrl}
            remotePassword={session.remote_password}
            consoleType={protocol === 'SPICE' || protocol === 'SERIAL' ? protocol : 'VNC'}
            className="flex-1 flex flex-col min-h-0"
            iframeClassName="flex-1 min-h-[min(70vh,640px)] w-full rounded-lg border border-gray-700 bg-black"
          />
        )}
        {session?.expires_at && (
          <p className="text-xs text-gray-500 shrink-0">Session expires: {new Date(session.expires_at).toLocaleString()}</p>
        )}
      </main>
    </div>
  );
}
