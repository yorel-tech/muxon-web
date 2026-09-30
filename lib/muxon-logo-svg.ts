/**
 * Inline Muxon mark and lockup, taken from muxon-design/muxon-logo.
 * Colors are injected so the same artwork can follow OSS vs Enterprise tokens.
 */

const ELLIPSE_0 = "M68.00 68.00A32 44 0 1 1 132.00 68.00A32 44 0 1 1 68.00 68.00Z";
const ELLIPSE_120 = "M143.71 88.29A32 44 120 1 1 111.71 143.71A32 44 120 1 1 143.71 88.29Z";
const ELLIPSE_240 = "M88.29 143.71A32 44 240 1 1 56.29 88.29A32 44 240 1 1 88.29 143.71Z";

const WORDMARK =
  "M177.57 55.24V73.50H168.05V56.53Q168.05 53.51 166.45 51.86Q164.86 50.20 162.06 50.20Q159.26 50.20 157.66 51.86Q156.07 53.51 156.07 56.53V73.50H146.55V56.53Q146.55 53.51 144.95 51.86Q143.35 50.20 140.55 50.20Q137.75 50.20 136.16 51.86Q134.56 53.51 134.56 56.53V73.50H124.99V42.25H134.56V46.17Q136.02 44.21 138.37 43.06Q140.72 41.92 143.69 41.92Q147.22 41.92 149.99 43.43Q152.76 44.94 154.33 47.74Q155.95 45.16 158.75 43.54Q161.55 41.92 164.86 41.92Q170.68 41.92 174.13 45.44Q177.57 48.97 177.57 55.24ZM214.03 42.25V73.50H204.45V69.24Q202.99 71.32 200.50 72.58Q198.01 73.84 194.99 73.84Q191.40 73.84 188.66 72.24Q185.91 70.64 184.40 67.62Q182.89 64.60 182.89 60.51V42.25H192.41V59.22Q192.41 62.36 194.03 64.09Q195.66 65.83 198.40 65.83Q201.20 65.83 202.83 64.09Q204.45 62.36 204.45 59.22V42.25ZM238.27 73.50 232.28 64.82 227.24 73.50H216.88L227.19 57.54L216.60 42.25H227.35L233.35 50.88L238.39 42.25H248.75L238.27 57.99L249.03 73.50ZM249.70 57.88Q249.70 53.06 251.83 49.39Q253.95 45.72 257.65 43.76Q261.35 41.80 265.94 41.80Q270.53 41.80 274.23 43.76Q277.92 45.72 280.05 49.39Q282.18 53.06 282.18 57.88Q282.18 62.69 280.02 66.36Q277.87 70.03 274.14 71.99Q270.42 73.95 265.83 73.95Q261.23 73.95 257.57 71.99Q253.90 70.03 251.80 66.39Q249.70 62.75 249.70 57.88ZM272.43 57.88Q272.43 54.12 270.56 52.11Q268.68 50.09 265.94 50.09Q263.14 50.09 261.29 52.08Q259.44 54.07 259.44 57.88Q259.44 61.63 261.26 63.64Q263.08 65.66 265.83 65.66Q268.57 65.66 270.50 63.64Q272.43 61.63 272.43 57.88ZM317.23 55.24V73.50H307.71V56.53Q307.71 53.40 306.09 51.66Q304.47 49.92 301.72 49.92Q298.98 49.92 297.35 51.66Q295.73 53.40 295.73 56.53V73.50H286.15V42.25H295.73V46.40Q297.19 44.32 299.65 43.12Q302.11 41.92 305.19 41.92Q310.68 41.92 313.96 45.47Q317.23 49.03 317.23 55.24Z";

export const LOCKUP_VIEWBOX = "-4 -4 327.3 108";
export const LOCKUP_ASPECT = 327.3 / 108;

function markDefs(id: string, gradient: { from: string; to: string } | null): string {
  const gradientDef = gradient
    ? `<linearGradient id="${id}g" gradientUnits="userSpaceOnUse" x1="23.5" y1="16.5" x2="176.5" y2="158.9"><stop offset="0" stop-color="${gradient.from}"/><stop offset="1" stop-color="${gradient.to}"/></linearGradient>`
    : "";
  return `<defs>${gradientDef}
<clipPath id="${id}c0"><circle cx="86.42" cy="107.84" r="24"/></clipPath>
<clipPath id="${id}c1"><circle cx="130.20" cy="82.57" r="24"/></clipPath>
<clipPath id="${id}c2"><circle cx="69.80" cy="82.57" r="24"/></clipPath>
<clipPath id="${id}c3"><circle cx="113.58" cy="107.84" r="24"/></clipPath>
<clipPath id="${id}c4"><circle cx="100.00" cy="84.32" r="24"/></clipPath>
<clipPath id="${id}c5"><circle cx="100.00" cy="134.87" r="24"/></clipPath>
<mask id="${id}m0" maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="200"><rect width="200" height="200" fill="#fff"/><g clip-path="url(#${id}c2)"><path d="${ELLIPSE_240}" fill="none" stroke="#000" stroke-width="24"/></g><g clip-path="url(#${id}c3)"><path d="${ELLIPSE_240}" fill="none" stroke="#000" stroke-width="24"/></g></mask>
<mask id="${id}m1" maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="200"><rect width="200" height="200" fill="#fff"/><g clip-path="url(#${id}c0)"><path d="${ELLIPSE_0}" fill="none" stroke="#000" stroke-width="24"/></g><g clip-path="url(#${id}c1)"><path d="${ELLIPSE_0}" fill="none" stroke="#000" stroke-width="24"/></g></mask>
<mask id="${id}m2" maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="200"><rect width="200" height="200" fill="#fff"/><g clip-path="url(#${id}c4)"><path d="${ELLIPSE_120}" fill="none" stroke="#000" stroke-width="24"/></g><g clip-path="url(#${id}c5)"><path d="${ELLIPSE_120}" fill="none" stroke="#000" stroke-width="24"/></g></mask>
</defs>`;
}

function markPaths(id: string, stroke: string): string {
  return `<path d="${ELLIPSE_0}" fill="none" stroke="${stroke}" stroke-width="15" mask="url(#${id}m0)"/>
<path d="${ELLIPSE_120}" fill="none" stroke="${stroke}" stroke-width="15" mask="url(#${id}m1)"/>
<path d="${ELLIPSE_240}" fill="none" stroke="${stroke}" stroke-width="15" mask="url(#${id}m2)"/>`;
}

export function buildMuxonMarkSvg(id: string, from: string, to: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="23.5 16.5 153.1 142.4" width="100%" height="100%" role="img" aria-label="Muxon">${markDefs(id, { from, to })}${markPaths(id, `url(#${id}g)`)}</svg>`;
}

export function buildMuxonLockupSvg(id: string, mark: string, word: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${LOCKUP_VIEWBOX}" width="100%" height="100%" role="img" aria-label="Muxon">${markDefs(id, null)}<g transform="scale(0.70233) translate(-23.46 -16.50)">${markPaths(id, mark)}</g><path d="${WORDMARK}" fill="${word}"/></svg>`;
}
