'use client';

import { Button } from '@/components/ui/atoms/button';

export type VmConsoleProtocol = 'VNC' | 'SPICE' | 'SERIAL';

export interface VmConsoleProps {
  wsUrl: string;
  /** RFB / remote password from API (one-time session). */
  remotePassword?: string | null;
  consoleType: VmConsoleProtocol;
  onDisconnect?: () => void;
}

/**
 * VNC is rendered via `public/vm-console.html`, which loads noVNC from jsDelivr's ESM bundle (`+esm`;
 * esm.sh’s deep file URL returned errors / wrong MIME for this package). SPICE/SERIAL are not supported
 * in-browser here.
 */
export function VmConsole({ wsUrl, remotePassword, consoleType, onDisconnect }: VmConsoleProps) {
  if (consoleType === 'SPICE') {
    return (
      <div className="rounded-lg bg-gray-900 text-gray-200 p-6 text-sm">
        SPICE console is not yet supported in the browser. Use a SPICE client against the provider, or switch the VM
        to VNC.
      </div>
    );
  }

  if (consoleType === 'SERIAL') {
    return (
      <div className="rounded-lg bg-gray-900 text-gray-200 p-6 text-sm">
        Serial console is not available in this view.
      </div>
    );
  }

  const src = `/vm-console.html?ws=${encodeURIComponent(wsUrl)}&pwd=${encodeURIComponent(remotePassword ?? '')}`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-end">
        <Button type="button" variant="secondary" size="sm" onClick={() => onDisconnect?.()}>
          Close
        </Button>
      </div>
      <iframe title="VM console" className="w-full min-h-[480px] rounded-lg border border-gray-700 bg-black" src={src} />
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Console loads noVNC in an isolated page. Ensure this origin is allowed by the console-proxy service.
      </p>
    </div>
  );
}
