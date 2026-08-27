import React, { useEffect, useRef } from 'react';
import { useUltron } from '../core/ultronContext';
import { MOOD_COLORS } from './UltronCore';
import { hexToRgba } from '../utils/colorLerp';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  length: number;
  angle: number;
  color: string;
  alpha: number;
  char?: string;
  type: 'trace' | 'hex' | 'dot';
}

const HEX_CHARS = ['0', '1', 'A', 'F', 'X', '7', 'E', '9', 'C', '3'];

/**
 * High-performance canvas-based particle emitter that emits data-trace fragments,
 * vectorized glyphs, and velocity lines expanding outwards or spiraling from UltronCore.
 * Frequency, velocity, and lifespan scale dynamically based on system status.
 */
export const DataTraceEmitter: React.FC<{ width?: number; height?: number }> = ({
  width = 560,
  height = 560,
}) => {
  const { status, mood } = useUltron();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const statusRef = useRef(status);
  statusRef.current = status;

  const colors = MOOD_COLORS[mood] || MOOD_COLORS.CALM;
  const colorsRef = useRef(colors);
  colorsRef.current = colors;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const centerX = width / 2;
    const centerY = height / 2;
    const coreRadius = 150; // Radius of Ultron sphere boundary

    const particles: Particle[] = [];
    let lastEmitTime = performance.now();

    const spawnParticle = (currentStatus: string) => {
      const angle = Math.random() * Math.PI * 2;
      const spawnRadius = coreRadius * (0.85 + Math.random() * 0.25);
      const startX = centerX + Math.cos(angle) * spawnRadius;
      const startY = centerY + Math.sin(angle) * spawnRadius;

      // Speed & dynamics tailored to system status
      let baseSpeed = 1.2;
      let maxLife = 50;

      if (currentStatus === 'THINKING') {
        baseSpeed = 3.2 + Math.random() * 2.5;
        maxLife = 35 + Math.floor(Math.random() * 25);
      } else if (currentStatus === 'EXECUTING') {
        baseSpeed = 2.8 + Math.random() * 2.0;
        maxLife = 40 + Math.floor(Math.random() * 20);
      } else if (currentStatus === 'RESPONDING') {
        baseSpeed = 2.0 + Math.random() * 1.5;
        maxLife = 50 + Math.floor(Math.random() * 30);
      } else if (currentStatus === 'WARNING' || currentStatus === 'ERROR') {
        baseSpeed = 3.8 + Math.random() * 3.0;
        maxLife = 30 + Math.floor(Math.random() * 20);
      } else {
        // IDLE / LISTENING
        baseSpeed = 0.8 + Math.random() * 0.8;
        maxLife = 65 + Math.floor(Math.random() * 45);
      }

      // Add a slight tangential swirl component
      const swirl = (Math.random() - 0.5) * 0.4;
      const vx = Math.cos(angle + swirl) * baseSpeed;
      const vy = Math.sin(angle + swirl) * baseSpeed;

      const particleType: 'trace' | 'hex' | 'dot' =
        Math.random() > 0.6 ? 'hex' : Math.random() > 0.3 ? 'trace' : 'dot';

      particles.push({
        x: startX,
        y: startY,
        vx,
        vy,
        life: 0,
        maxLife,
        size: 1.2 + Math.random() * 2.4,
        length: 4 + Math.random() * 14,
        angle,
        color: colorsRef.current.primary,
        alpha: 0.9,
        char: HEX_CHARS[Math.floor(Math.random() * HEX_CHARS.length)],
        type: particleType,
      });
    };

    const render = (now: number) => {
      ctx.clearRect(0, 0, width, height);

      const curStatus = statusRef.current;
      const primaryRgba = hexToRgba(colorsRef.current.primary);
      const secondaryRgba = hexToRgba(colorsRef.current.secondary);

      // Determine emission rate based on state
      let emitInterval = 120; // IDLE
      let batchSize = 1;

      if (curStatus === 'THINKING') {
        emitInterval = 18; // Very frequent
        batchSize = 3;
      } else if (curStatus === 'EXECUTING') {
        emitInterval = 25;
        batchSize = 2;
      } else if (curStatus === 'RESPONDING') {
        emitInterval = 40;
        batchSize = 2;
      } else if (curStatus === 'WARNING' || curStatus === 'ERROR') {
        emitInterval = 15;
        batchSize = 4;
      } else if (curStatus === 'LISTENING') {
        emitInterval = 70;
        batchSize = 1;
      }

      // Emit new particle batches
      if (now - lastEmitTime >= emitInterval) {
        for (let i = 0; i < batchSize; i++) {
          spawnParticle(curStatus);
        }
        lastEmitTime = now;
      }

      // Update and render particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;

        // Slight acceleration for explosive feeling during processing
        if (curStatus === 'THINKING' || curStatus === 'EXECUTING') {
          p.vx *= 1.015;
          p.vy *= 1.015;
        }

        const progress = p.life / p.maxLife;
        p.alpha = Math.max(0, 1 - progress);

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }

        // Draw particle based on type
        if (p.type === 'trace') {
          // Linear high-velocity data streak line
          const traceLength = p.length * (curStatus === 'THINKING' ? 1.6 : 1.0);
          const endX = p.x - p.vx * (traceLength * 0.4);
          const endY = p.y - p.vy * (traceLength * 0.4);

          const grad = ctx.createLinearGradient(endX, endY, p.x, p.y);
          grad.addColorStop(
            0,
            `rgba(${secondaryRgba.r}, ${secondaryRgba.g}, ${secondaryRgba.b}, 0)`
          );
          grad.addColorStop(
            1,
            `rgba(${primaryRgba.r}, ${primaryRgba.g}, ${primaryRgba.b}, ${p.alpha * 0.85})`
          );

          ctx.beginPath();
          ctx.moveTo(endX, endY);
          ctx.lineTo(p.x, p.y);
          ctx.strokeStyle = grad;
          ctx.lineWidth = p.size;
          ctx.stroke();

          // Bright spark head
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
          ctx.fill();
        } else if (p.type === 'hex') {
          // Floating holographic cyber glyph
          ctx.font = `${Math.floor(8 + p.size * 2)}px 'JetBrains Mono', monospace`;
          ctx.fillStyle = `rgba(${primaryRgba.r}, ${primaryRgba.g}, ${primaryRgba.b}, ${p.alpha * 0.8})`;
          ctx.fillText(p.char || '0', p.x, p.y);
        } else {
          // Glowing quantum point
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${primaryRgba.r}, ${primaryRgba.g}, ${primaryRgba.b}, ${p.alpha})`;
          ctx.shadowBlur = 4;
          ctx.shadowColor = colorsRef.current.primary;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className="absolute inset-0 pointer-events-none z-15"
    />
  );
};
