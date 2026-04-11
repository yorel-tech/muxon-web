'use client';

import { useCallback, useEffect, useState } from 'react';
import { Modal } from '@/components/ui/molecules/modal';
import { VmConsole, type VmConsoleProtocol } from '@/components/ui/organisms/vm-console';
import { apiGet } from '@/lib/api';
import { ExternalLink, Loader2 } from 'lucide-react';

export interface VmConsoleModalProps {
  isOpen: boolean;
  tenantId: string;
  vmId: string;
  vmName?: string;
  onClose: () => void;
}

interface ConsoleSessionResponse {
  url?: string;
  token?: string;
  expires_at?: string;
  console_type?: string;
  remote_password?: string | null;
}

export function VmConsoleModal({ isOpen, tenantId, vmId, vmName, onClose }: VmConsoleModalProps) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [session, setSession] = useState<ConsoleSessionResponse | null>(null);

  const loadSession = useCallback(async () => {
    setLoading(true);
    setErr(null);
    setSession(null);
    const path = `/api/v1/tenants/${tenantId}/vms/${vmId}/console`;
    console.info('[VmConsoleModal] requesting console session', { tenantId, vmId, path });
    try {
      const data = await apiGet<ConsoleSessionResponse>(path, {
        // Orchestrator resolve + DB can exceed default infra timeouts; keep below typical LB limits.
        timeoutMs: 120_000,
      });
      console.info('[VmConsoleModal] console session response', {
        hasUrl: Boolean(data?.url),
        hasToken: Boolean(data?.token),
        console_type: data?.console_type,
        expires_at: data?.expires_at,
        hasRemotePassword: data?.remote_password != null && data.remote_password !== '',
      });
      setSession(data);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to open console session';
      console.error('[VmConsoleModal] console session failed', { tenantId, vmId, message, err: e });
      setErr(message);
    } finally {
      setLoading(false);
    }
  }, [tenantId, vmId]);

  useEffect(() => {
    if (isOpen && tenantId && vmId) {
      void loadSession();
    }
    if (!isOpen) {
      setSession(null);
      setErr(null);
    }
  }, [isOpen, tenantId, vmId, loadSession]);

  const wsUrl = session?.url ? String(session.url) : '';
  const protocol = (session?.console_type?.toUpperCase() ?? 'VNC') as VmConsoleProtocol;

  const openConsoleInNewTab = () => {
    const q = vmName ? `?name=${encodeURIComponent(vmName)}` : '';
    // Close this modal first so the in-modal WebSocket disconnects. The proxy marks the session
    // CLOSED on disconnect; opening a new tab while still connected reuses the same token and
    // opens a second VNC connection, which breaks the session.
    onClose();
    window.setTimeout(() => {
      window.open(`/tenant/vms/${vmId}/console${q}`, '_blank', 'noopener,noreferrer');
    }, 300);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={vmName ? `Console — ${vmName}` : 'VM console'}
      titleActions={
        <button
          type="button"
          onClick={openConsoleInNewTab}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Open console in a new browser tab"
        >
          <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
          <span className="hidden sm:inline">New tab</span>
        </button>
      }
      size="full"
      closeOnOverlayClick={false}
    >
      <div className="p-4 flex flex-col gap-3 max-h-[85vh] overflow-auto">
        {loading && (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <Loader2 className="h-5 w-5 animate-spin" />
            Resolving console session…
          </div>
        )}
        {err && <p className="text-sm text-red-600 dark:text-red-400">{err}</p>}
        {!loading && session && !wsUrl && (
          <p className="text-sm text-amber-700 dark:text-amber-400">
            API returned a session without a <code className="text-xs">url</code> field. Check the browser
            console for <code className="text-xs">[VmConsoleModal]</code> logs and core-services VM console
            logs.
          </p>
        )}
        {!loading && session && wsUrl && (
          <VmConsole
            wsUrl={wsUrl}
            remotePassword={session.remote_password}
            consoleType={protocol === 'SPICE' || protocol === 'SERIAL' ? protocol : 'VNC'}
            onDisconnect={onClose}
          />
        )}
        {session?.expires_at && (
          <p className="text-xs text-gray-500">Session expires: {new Date(session.expires_at).toLocaleString()}</p>
        )}
      </div>
    </Modal>
  );
}
