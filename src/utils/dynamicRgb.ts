import { useState, useEffect, useMemo } from 'react';

export interface UltronColorTheme {
  primary: string;
  secondary: string;
  glow: string;
  ambient: string;
  border: string;
  text: string;
  bgAccent: string;
}

// Convert HSL to Hex color string
export function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Dynamic RGB Color Hook
 * Continuously cycles hue smoothly through the full RGB spectrum over time.
 */
export function useDynamicRgbColor(): UltronColorTheme {
  const [hue, setHue] = useState(200);

  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const updateHue = (now: number) => {
      const delta = now - lastTime;
      lastTime = now;
      // Cycle hue at ~20 degrees per second for smooth dynamic RGB transition
      setHue((prev) => (prev + delta * 0.02) % 360);
      animId = requestAnimationFrame(updateHue);
    };

    animId = requestAnimationFrame(updateHue);
    return () => cancelAnimationFrame(animId);
  }, []);

  return useMemo(() => {
    const primaryHex = hslToHex(hue, 92, 60);
    const secondaryHex = hslToHex((hue + 45) % 360, 95, 48);
    const textHex = hslToHex(hue, 95, 88);

    return {
      primary: primaryHex,
      secondary: secondaryHex,
      glow: `hsla(${hue}, 90%, 60%, 0.65)`,
      ambient: `hsla(${hue}, 90%, 50%, 0.18)`,
      border: `hsla(${hue}, 85%, 65%, 0.45)`,
      text: textHex,
      bgAccent: `hsla(${hue}, 90%, 60%, 0.12)`,
    };
  }, [hue]);
}

/**
 * Placeholder for mood-based color resolution.
 */
export function getMoodColors(mood?: string): UltronColorTheme {
  // \code of mood
  return {
    primary: '#38bdf8',
    secondary: '#0284c7',
    glow: 'rgba(56, 189, 248, 0.45)',
    ambient: 'rgba(14, 165, 233, 0.12)',
    border: 'rgba(56, 189, 248, 0.35)',
    text: '#7dd3fc',
    bgAccent: 'rgba(56, 189, 248, 0.08)',
  };
}
