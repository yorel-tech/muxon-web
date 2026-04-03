'use client';

import { useCallback, useEffect, useState } from 'react';
import { Modal } from '@/components/ui/molecules/modal';
import { VmConsole, type VmConsoleProtocol } from '@/components/ui/organisms/vm-console';
import { apiGet } from '@/lib/api';
import { Loader2 } from 'lucide-react';

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
    try {
      const data = await apiGet<ConsoleSessionResponse>(
        `/api/v1/tenants/${tenantId}/vms/${vmId}/console`
      );
      setSession(data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to open console session');
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={vmName ? `Console — ${vmName}` : 'VM console'}
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
