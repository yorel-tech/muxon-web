'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/atoms/button';
import { Maximize2, Minimize2 } from 'lucide-react';

export type VmConsoleProtocol = 'VNC' | 'SPICE' | 'SERIAL';

export interface VmConsoleProps {
  wsUrl: string;
  /** RFB / remote password from API (one-time session). */
  remotePassword?: string | null;
  consoleType: VmConsoleProtocol;
  onDisconnect?: () => void;
  /** Extra classes on the outer wrapper (e.g. flex-1 for standalone page). */
  className?: string;
  /** Classes for the iframe (height, flex, etc.). */
  iframeClassName?: string;
}

/**
 * VNC is rendered via `public/vm-console.html`, which loads noVNC from jsDelivr's ESM bundle (`+esm`;
 * esm.sh’s deep file URL returned errors / wrong MIME for this package). SPICE/SERIAL are not supported
 * in-browser here.
 */
export function VmConsole({
  wsUrl,
  remotePassword,
  consoleType,
  onDisconnect,
  className = '',
  iframeClassName = 'w-full min-h-[480px] rounded-lg border border-gray-700 bg-black',
}: VmConsoleProps) {
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const notifyIframeLayout = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    const send = () => win.postMessage({ type: 'infron-console-layout' }, window.location.origin);
    send();
    window.setTimeout(send, 120);
  }, []);

  useEffect(() => {
    const onChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
      queueMicrotask(() => notifyIframeLayout());
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, [notifyIframeLayout]);

  const toggleFullscreen = useCallback(async () => {
    const el = fullscreenRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
      notifyIframeLayout();
    } catch (e) {
      console.warn('[VmConsole] fullscreen request failed', e);
    }
  }, [notifyIframeLayout]);

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
    <div className={`flex flex-col gap-2 min-h-0 ${className}`.trim()}>
      <div
        ref={fullscreenRef}
        className="flex flex-col gap-2 min-h-0 flex-1 rounded-lg bg-app p-2 -m-2 data-[fullscreen=true]:bg-black data-[fullscreen=true]:p-2"
        data-fullscreen={isFullscreen ? 'true' : 'false'}
      >
        <div className="flex justify-end gap-2 shrink-0">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => void toggleFullscreen()}
            leftIcon={isFullscreen ? <Minimize2 className="h-4 w-4" aria-hidden /> : <Maximize2 className="h-4 w-4" aria-hidden />}
          >
            {isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          </Button>
          {onDisconnect && (
            <Button type="button" variant="secondary" size="sm" onClick={() => onDisconnect()}>
              Close
            </Button>
          )}
        </div>
        <div className="flex flex-col min-h-0 flex-1 bg-black rounded-lg overflow-hidden">
          <iframe
            ref={iframeRef}
            title="VM console"
            className={iframeClassName}
            src={src}
            allow="fullscreen"
            onLoad={() => notifyIframeLayout()}
          />
        </div>
      </div>
      {!isFullscreen && (
        <p className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
          Console loads noVNC in an isolated page. Ensure this origin is allowed by the console-proxy service.
        </p>
      )}
    </div>
  );
}
