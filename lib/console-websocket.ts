/**
 * Small helpers for console WebSocket lifecycle (noVNC manages its own socket;
 * these are useful for retries or custom tooling).
 */

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface ReconnectingWebSocketOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
}

/**
 * Opens a WebSocket with simple exponential backoff retries.
 */
export function openWebSocketWithRetry(
  url: string,
  options: ReconnectingWebSocketOptions = {}
): Promise<WebSocket> {
  const maxAttempts = options.maxAttempts ?? 4;
  let delay = options.initialDelayMs ?? 500;
  const maxDelay = options.maxDelayMs ?? 8000;

  return new Promise((resolve, reject) => {
    let attempt = 0;

    const tryConnect = () => {
      attempt += 1;
      const ws = new WebSocket(url);
      ws.binaryType = 'arraybuffer';

      const onOpen = () => {
        ws.removeEventListener('open', onOpen);
        ws.removeEventListener('error', onError);
        resolve(ws);
      };

      const onError = () => {
        ws.removeEventListener('open', onOpen);
        ws.removeEventListener('error', onError);
        ws.close();
        if (attempt >= maxAttempts) {
          reject(new Error(`WebSocket failed after ${maxAttempts} attempts`));
          return;
        }
        sleep(delay).then(() => {
          delay = Math.min(delay * 2, maxDelay);
          tryConnect();
        });
      };

      ws.addEventListener('open', onOpen);
      ws.addEventListener('error', onError);
    };

    tryConnect();
  });
}
