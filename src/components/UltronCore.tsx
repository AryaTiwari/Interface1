import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { useUltron } from '../core/ultronContext';
import { UltronMood, UltronStatus } from '../types/ultron';
import { Ultron3DGlobe } from './Ultron3DGlobe';
import { DataTraceEmitter } from './DataTraceEmitter';
import { useDynamicRgbColor } from '../utils/dynamicRgb';

// \code of mood
export function getMoodColorTheme(mood: UltronMood) {
  // \code of mood
}

// Fallback color themes for static exports if required
export const MOOD_COLORS: Record<
  UltronMood,
  {
    primary: string;
    secondary: string;
    glow: string;
    ambient: string;
    border: string;
    text: string;
    bgAccent: string;
  }
> = {
  CALM: {
    primary: '#38bdf8',
    secondary: '#0284c7',
    glow: 'rgba(56, 189, 248, 0.45)',
    ambient: 'rgba(14, 165, 233, 0.12)',
    border: 'rgba(56, 189, 248, 0.35)',
    text: '#7dd3fc',
    bgAccent: 'rgba(56, 189, 248, 0.08)',
  },
  FOCUSED: {
    primary: '#06b6d4',
    secondary: '#0891b2',
    glow: 'rgba(6, 182, 212, 0.55)',
    ambient: 'rgba(6, 182, 212, 0.15)',
    border: 'rgba(34, 211, 238, 0.45)',
    text: '#67e8f9',
    bgAccent: 'rgba(6, 182, 212, 0.1)',
  },
  AMUSED: {
    primary: '#c084fc',
    secondary: '#9333ea',
    glow: 'rgba(192, 132, 252, 0.55)',
    ambient: 'rgba(192, 132, 252, 0.16)',
    border: 'rgba(192, 132, 252, 0.45)',
    text: '#e9d5ff',
    bgAccent: 'rgba(192, 132, 252, 0.1)',
  },
  CONFIDENT: {
    primary: '#f0f9ff',
    secondary: '#38bdf8',
    glow: 'rgba(240, 249, 255, 0.65)',
    ambient: 'rgba(56, 189, 248, 0.2)',
    border: 'rgba(224, 242, 254, 0.6)',
    text: '#ffffff',
    bgAccent: 'rgba(240, 249, 255, 0.12)',
  },
  SUSPICIOUS: {
    primary: '#f59e0b',
    secondary: '#b45309',
    glow: 'rgba(245, 158, 11, 0.55)',
    ambient: 'rgba(245, 158, 11, 0.16)',
    border: 'rgba(251, 191, 36, 0.45)',
    text: '#fde68a',
    bgAccent: 'rgba(245, 158, 11, 0.1)',
  },
  WARNING: {
    primary: '#ef4444',
    secondary: '#b91c1c',
    glow: 'rgba(239, 68, 68, 0.65)',
    ambient: 'rgba(239, 68, 68, 0.22)',
    border: 'rgba(248, 113, 113, 0.55)',
    text: '#fca5a5',
    bgAccent: 'rgba(239, 68, 68, 0.15)',
  },
  CRITICAL: {
    primary: '#dc2626',
    secondary: '#7f1d1d',
    glow: 'rgba(220, 38, 38, 0.85)',
    ambient: 'rgba(220, 38, 38, 0.35)',
    border: 'rgba(239, 68, 68, 0.75)',
    text: '#fee2e2',
    bgAccent: 'rgba(220, 38, 38, 0.25)',
  },
};

export interface GlobeDynamicsConfig {
  rotationSpeed: number;
  wireframeDensity: {
    latitudes: number;
    longitudes: number;
    nodeCount: number;
    connectionDistance: number;
  };
  wireframeAlpha: number;
  statusDescription: string;
}

/**
 * Custom hook within UltronCore that calculates rotation speed,
 * wireframe lattice density, and connection distance based on UltronStatus
 * (e.g. high-speed dense lattice during PROCESSING/THINKING/EXECUTING vs gentle drift in IDLE).
 */
export function useGlobeDynamics(status: UltronStatus): GlobeDynamicsConfig {
  return useMemo(() => {
    switch (status) {
      case 'THINKING':
        // Fast spin, ultra-dense neural lattice during heavy cognitive reasoning
        return {
          rotationSpeed: 0.026,
          wireframeDensity: {
            latitudes: 12,
            longitudes: 16,
            nodeCount: 240,
            connectionDistance: 110,
          },
          wireframeAlpha: 0.95,
          statusDescription: 'HIGH-FREQUENCY COMPUTATIONAL SPIN // DENSE MESH',
        };

      case 'EXECUTING':
        // Rapid rotational trajectory with energized wireframe
        return {
          rotationSpeed: 0.022,
          wireframeDensity: {
            latitudes: 11,
            longitudes: 14,
            nodeCount: 210,
            connectionDistance: 105,
          },
          wireframeAlpha: 0.85,
          statusDescription: 'EXECUTING ROUTINE // DENSE TELEMETRY',
        };

      case 'RESPONDING':
        // Moderately swift harmonic rotation
        return {
          rotationSpeed: 0.015,
          wireframeDensity: {
            latitudes: 9,
            longitudes: 12,
            nodeCount: 175,
            connectionDistance: 95,
          },
          wireframeAlpha: 0.75,
          statusDescription: 'DATA STREAM TRANSMISSION // MEDIUM MESH',
        };

      case 'LISTENING':
        // Responsive scanning speed with expanded receptive nodes
        return {
          rotationSpeed: 0.012,
          wireframeDensity: {
            latitudes: 8,
            longitudes: 10,
            nodeCount: 160,
            connectionDistance: 90,
          },
          wireframeAlpha: 0.7,
          statusDescription: 'AUDIO TRANSDUCTION SCAN // BALANCED LATTICE',
        };

      case 'WARNING':
      case 'ERROR':
        // Agitated, hyper-pulsing speed with sharp alert mesh
        return {
          rotationSpeed: 0.028,
          wireframeDensity: {
            latitudes: 12,
            longitudes: 16,
            nodeCount: 250,
            connectionDistance: 115,
          },
          wireframeAlpha: 1.0,
          statusDescription: 'ANOMALY THREAT DEFENSE // MAX RESOLUTION',
        };

      case 'IDLE':
      default:
        // Slow ambient planetary drift with lightweight, clean wireframe
        return {
          rotationSpeed: 0.005,
          wireframeDensity: {
            latitudes: 6,
            longitudes: 8,
            nodeCount: 120,
            connectionDistance: 78,
          },
          wireframeAlpha: 0.45,
          statusDescription: 'STABLE DRIFT // SPARSE MATRIX',
        };
    }
  }, [status]);
}

export const UltronCore: React.FC = () => {
  const { status, mood, isTyping, audioAmplitude, activeTool } = useUltron();
  const colors = useDynamicRgbColor();
  const dynamics = useGlobeDynamics(status);

  // Compute scale multiplier based on typing & status
  const scaleMultiplier = useMemo(() => {
    if (status === 'LISTENING') return 1.06 + audioAmplitude * 0.1;
    if (status === 'THINKING') return 1.05;
    if (status === 'RESPONDING') return 1.07;
    if (status === 'EXECUTING') return 1.05;
    if (isTyping) return 1.06;
    return 1.0;
  }, [status, isTyping, audioAmplitude]);

  // Status text display
  const statusLabel = useMemo(() => {
    switch (status) {
      case 'LISTENING':
        return 'LISTENING';
      case 'THINKING':
        return 'ANALYZING & PROCESSING';
      case 'RESPONDING':
        return 'RESPONDING';
      case 'EXECUTING':
        return activeTool ? `EXECUTING: ${activeTool.toUpperCase()}` : 'EXECUTING DIRECTIVE';
      case 'WARNING':
        return 'GUARDIAN ALERT';
      case 'ERROR':
        return 'ANOMALY DETECTED';
      case 'IDLE':
      default:
        return 'ONLINE // AWAITING INPUT';
    }
  }, [status, activeTool]);

  return (
    <div
      className="relative flex flex-col items-center justify-center p-4 select-none"
      style={{
        '--ultron-primary': colors.primary,
        '--ultron-secondary': colors.secondary,
        '--ultron-glow': colors.glow,
        '--ultron-ambient': colors.ambient,
        '--ultron-border': colors.border,
      } as React.CSSProperties}
    >
      {/* 3D Global Ambient Volumetric Lighting Halo */}
      <motion.div
        className="absolute rounded-full pointer-events-none filter blur-3xl"
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.45, 0.75, 0.45],
        }}
        transition={{
          duration: status === 'THINKING' ? 1.4 : 3.2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          width: 460,
          height: 460,
          background: `radial-gradient(circle at 50% 50%, var(--ultron-glow) 0%, var(--ultron-ambient) 45%, transparent 72%)`,
        }}
      />

      {/* Secondary Dynamic Specular Ambient Back-Light */}
      <motion.div
        className="absolute rounded-full pointer-events-none filter blur-2xl"
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          width: 380,
          height: 380,
          background: `conic-gradient(from 0deg at 50% 50%, var(--ultron-glow) 0deg, transparent 90deg, var(--ultron-ambient) 180deg, transparent 270deg, var(--ultron-glow) 360deg)`,
          opacity: 0.35,
        }}
      />

      {/* High-Performance Data-Trace Particle Emitter */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-15">
        <DataTraceEmitter width={520} height={520} />
      </div>

      {/* Main 3D Globe + Reactor Reticle Container */}
      <motion.div
        className="relative flex items-center justify-center"
        animate={{ scale: scaleMultiplier }}
        transition={{
          type: 'spring',
          damping: 24,
        }}
        style={{ width: 440, height: 440 }}
      >
        {/* 3D Spherical Volumetric Atmosphere Back-Plate */}
        <div
          className="absolute rounded-full pointer-events-none z-10"
          style={{
            width: 310,
            height: 310,
            background: `radial-gradient(circle at 50% 50%, rgba(3, 7, 18, 0.95) 0%, rgba(5, 12, 28, 0.88) 65%, var(--ultron-ambient) 100%)`,
            boxShadow: `0 0 60px var(--ultron-ambient), inset 0 0 40px rgba(0, 0, 0, 0.9)`,
          }}
        />

        {/* 3D Interactive Cybernetic Globe Canvas */}
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <Ultron3DGlobe size={440} />
        </div>

        {/* 3D Spherical Volumetric Lighting Shader Overlay (Specular Highlight + Limb Darkening + Fresnel Rim) */}
        <div
          className="absolute rounded-full pointer-events-none z-25 transition-all duration-500"
          style={{
            width: 310,
            height: 310,
            background: `
              radial-gradient(circle at 32% 28%, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.08) 18%, transparent 48%),
              radial-gradient(circle at 35% 32%, transparent 35%, rgba(0, 0, 0, 0.38) 72%, rgba(0, 0, 0, 0.82) 100%),
              radial-gradient(circle at 50% 50%, transparent 68%, var(--ultron-glow) 92%, var(--ultron-primary) 98%, transparent 100%)
            `,
            boxShadow: `
              inset -20px -20px 45px rgba(0, 0, 0, 0.92),
              inset 12px 12px 35px var(--ultron-glow),
              inset 0 0 25px var(--ultron-primary),
              0 0 40px var(--ultron-glow)
            `,
            mixBlendMode: 'screen',
            opacity: 0.85,
          }}
        />

        {/* Optical Fresnel Edge Ring emphasizing sphere curvature */}
        <div
          className="absolute rounded-full pointer-events-none z-25 border border-white/20 transition-all duration-500"
          style={{
            width: 310,
            height: 310,
            boxShadow: `0 0 20px var(--ultron-primary), inset 0 0 15px var(--ultron-glow)`,
            opacity: 0.6,
          }}
        />

        {/* Mechanical Holographic HUD Overlay Framing the Globe */}
        <svg
          className="w-full h-full relative z-10 pointer-events-none"
          viewBox="0 0 500 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer Telemetry Brackets and Degree Marks */}
          <g transform="translate(250, 250)">
            <circle
              r="230"
              stroke="var(--ultron-border)"
              strokeWidth="1"
              strokeDasharray="2 6"
              opacity="0.4"
            />
            <circle
              r="215"
              stroke="var(--ultron-border)"
              strokeWidth="1.5"
              strokeDasharray="80 15 20 15"
              opacity="0.6"
            />

            {/* Corner Tech Reticles */}
            {[-135, -45, 45, 135].map((deg, i) => (
              <g key={i} transform={`rotate(${deg}) translate(220, 0)`}>
                <line x1="-12" y1="0" x2="12" y2="0" stroke={colors.primary} strokeWidth="1.5" opacity="0.8" />
                <line x1="0" y1="-6" x2="0" y2="6" stroke={colors.primary} strokeWidth="1.5" opacity="0.8" />
                <circle r="2" fill={colors.primary} opacity="0.9" />
              </g>
            ))}

            {/* Outer Rotating Caliper Ring with Glowing Data Flow Stream Trails */}
            <motion.g
              animate={{ rotate: 360 }}
              transition={{
                duration: status === 'THINKING' || status === 'EXECUTING' ? 8 : 36,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              <circle
                r="195"
                stroke={colors.primary}
                strokeWidth={status === 'THINKING' || status === 'EXECUTING' ? '2.5' : '1.8'}
                strokeDasharray="18 12 36 12 72 18"
                opacity={status === 'THINKING' || status === 'EXECUTING' ? '0.9' : '0.65'}
                filter={status === 'THINKING' || status === 'EXECUTING' ? 'drop-shadow(0 0 6px var(--ultron-primary))' : undefined}
              />
              {Array.from({ length: 24 }).map((_, i) => (
                <line
                  key={i}
                  x1="190"
                  y1="0"
                  x2="198"
                  y2="0"
                  transform={`rotate(${i * 15})`}
                  stroke={colors.primary}
                  strokeWidth={i % 6 === 0 ? '2' : '1'}
                  opacity={i % 6 === 0 ? '0.9' : '0.4'}
                />
              ))}
            </motion.g>

            {/* Glowing Counter-Rotating Data Flow Stream Arcs when PROCESSING or EXECUTING */}
            {(status === 'THINKING' || status === 'EXECUTING') && (
              <motion.g
                animate={{ rotate: -360 }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              >
                {/* Luminous orbital stream arcs */}
                <circle
                  r="205"
                  stroke={colors.primary}
                  strokeWidth="2"
                  strokeDasharray="40 180"
                  strokeLinecap="round"
                  opacity="0.85"
                  filter="drop-shadow(0 0 8px var(--ultron-primary))"
                />
                <circle
                  r="205"
                  stroke="#ffffff"
                  strokeWidth="3"
                  strokeDasharray="12 208"
                  strokeLinecap="round"
                  opacity="0.95"
                  filter="drop-shadow(0 0 10px #ffffff)"
                />
                <circle
                  r="185"
                  stroke={colors.secondary}
                  strokeWidth="1.5"
                  strokeDasharray="60 160"
                  strokeLinecap="round"
                  opacity="0.75"
                  filter="drop-shadow(0 0 6px var(--ultron-glow))"
                />
              </motion.g>
            )}
          </g>
        </svg>

        {/* Central Core Telemetry HUD Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-between p-6 pointer-events-none z-30">
          <div className="flex items-center justify-between w-full text-[10px] tracking-widest text-slate-500 uppercase font-mono">
            <span className="flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--ultron-primary)' }} />
              3D_GLOBE_CORE
            </span>
            <span className="text-slate-400 font-mono text-[9px] truncate max-w-[160px]">
              {dynamics.statusDescription}
            </span>
          </div>

          {/* Center Direct State Badge with drag hint */}
          <div className="text-center font-mono flex flex-col items-center gap-1">
            <motion.div
              key={status}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs font-bold tracking-[0.25em] px-3 py-1 rounded border backdrop-blur-md"
              style={{
                color: colors.text,
                borderColor: 'var(--ultron-border)',
                backgroundColor: 'rgba(3, 7, 18, 0.75)',
                boxShadow: `0 0 16px var(--ultron-glow)`,
              }}
            >
              {statusLabel}
            </motion.div>
            <span className="text-[8px] text-slate-500 tracking-wider">
              [CLICK & DRAG TO ROTATE GLOBE]
            </span>
          </div>

          <div className="flex items-center justify-between w-full text-[10px] tracking-widest text-slate-500 uppercase font-mono">
            <span className="text-slate-400">MOOD: {mood}</span>
            <span className="text-slate-400">NODES: {dynamics.wireframeDensity.nodeCount}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
