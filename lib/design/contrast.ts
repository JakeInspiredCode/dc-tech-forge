// WCAG 2.x relative luminance and contrast ratio, for hex colours.

export function normalizeHex(hex: string): string {
  let h = hex.replace("#", "").toLowerCase();
  if (h.length === 3 || h.length === 4) h = [...h.slice(0, 3)].map((c) => c + c).join("");
  return h.slice(0, 6);
}

function channels(hex: string): [number, number, number] {
  const h = normalizeHex(hex);
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number];
}

export function luminance(hex: string): number {
  const [r, g, b] = channels(hex).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** HSV saturation, 0–1. Low saturation is what makes a colour read as "gray". */
export function saturation(hex: string): number {
  const c = channels(hex);
  const max = Math.max(...c);
  return max === 0 ? 0 : (max - Math.min(...c)) / max;
}
