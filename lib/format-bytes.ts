const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;

/**
 * Format byte count as human-readable string (e.g. "1.25 MB").
 */
export function formatBytes(bytes: number | null | undefined, decimals = 2): string {
  if (bytes == null || Number.isNaN(bytes) || bytes < 0) return '—';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), UNITS.length - 1);
  const value = bytes / Math.pow(k, i);
  const d = i === 0 ? 0 : decimals;
  return `${value.toFixed(d)} ${UNITS[i]}`;
}
