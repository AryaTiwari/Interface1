export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export function hexToRgba(hex: string, defaultAlpha = 1): RGBA {
  let cleaned = hex.replace('#', '').trim();
  if (cleaned.length === 3) {
    cleaned = cleaned
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const num = parseInt(cleaned, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
    a: defaultAlpha,
  };
}

export function parseRgba(str: string): RGBA {
  if (str.startsWith('#')) return hexToRgba(str);
  const match = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (match) {
    return {
      r: parseInt(match[1], 10),
      g: parseInt(match[2], 10),
      b: parseInt(match[3], 10),
      a: match[4] !== undefined ? parseFloat(match[4]) : 1,
    };
  }
  return { r: 56, g: 189, b: 248, a: 1 };
}

export function lerpRgba(start: RGBA, end: RGBA, t: number): RGBA {
  const clampT = Math.max(0, Math.min(1, t));
  return {
    r: Math.round(start.r + (end.r - start.r) * clampT),
    g: Math.round(start.g + (end.g - start.g) * clampT),
    b: Math.round(start.b + (end.b - start.b) * clampT),
    a: +(start.a + (end.a - start.a) * clampT).toFixed(3),
  };
}

export function rgbaToString(c: RGBA): string {
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a})`;
}
