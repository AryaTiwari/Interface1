import React, { useEffect, useRef } from 'react';
import { useUltron } from '../core/ultronContext';
import { hexToRgba } from '../utils/colorLerp';
import { useGlobeDynamics } from './UltronCore';
import { useDynamicRgbColor } from '../utils/dynamicRgb';

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface ProjectedPoint {
  x: number;
  y: number;
  scale: number;
  alpha: number;
  z: number;
}

export const Ultron3DGlobe: React.FC<{ size?: number }> = ({ size = 440 }) => {
  const { status, audioAmplitude, isTyping } = useUltron();
  const dynamics = useGlobeDynamics(status);
  const colors = useDynamicRgbColor();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rotXRef = useRef<number>(0.25);
  const rotYRef = useRef<number>(0);
  const targetRotX = useRef<number>(0.25);
  const targetRotY = useRef<number>(0);
  const isDragging = useRef<boolean>(false);
  const lastMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Store dynamics and colors in refs so canvas loop gets current dynamic frame
  const dynamicsRef = useRef(dynamics);
  dynamicsRef.current = dynamics;

  const colorsRef = useRef(colors);
  colorsRef.current = colors;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const dpr = window.devicePixelRatio || 1;
    const width = size;
    const height = size;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const centerX = width / 2;
    const centerY = height / 2;
    const globeRadius = size * 0.35;

    // Generate Max 3D Spherical Coordinate Points (Fibonacci sphere lattice)
    const maxPoints = 260;
    const spherePoints: Point3D[] = [];
    const goldenRatio = (1 + Math.sqrt(5)) / 2;

    for (let i = 0; i < maxPoints; i++) {
      const theta = (2 * Math.PI * i) / goldenRatio;
      const phi = Math.acos(1 - (2 * (i + 0.5)) / maxPoints);
      spherePoints.push({
        x: globeRadius * Math.sin(phi) * Math.cos(theta),
        y: globeRadius * Math.cos(phi),
        z: globeRadius * Math.sin(phi) * Math.sin(theta),
      });
    }

    // Generate Max Latitudinal & Longitudinal Wireframe Rings
    const maxLatitudes = 14;
    const allLatRings: { phi: number; points: Point3D[] }[] = [];
    for (let l = 1; l < maxLatitudes; l++) {
      const phi = (Math.PI * l) / maxLatitudes;
      const ringRadius = globeRadius * Math.sin(phi);
      const y = globeRadius * Math.cos(phi);
      const ring: Point3D[] = [];
      const segments = 40;
      for (let s = 0; s <= segments; s++) {
        const theta = (2 * Math.PI * s) / segments;
        ring.push({
          x: ringRadius * Math.cos(theta),
          y: y,
          z: ringRadius * Math.sin(theta),
        });
      }
      allLatRings.push({ phi, points: ring });
    }

    const maxLongitudes = 16;
    const allLongRings: Point3D[][] = [];
    for (let l = 0; l < maxLongitudes; l++) {
      const theta = (Math.PI * l) / maxLongitudes;
      const ring: Point3D[] = [];
      const segments = 48;
      for (let s = 0; s <= segments; s++) {
        const phi = (2 * Math.PI * s) / segments;
        ring.push({
          x: globeRadius * Math.sin(phi) * Math.cos(theta),
          y: globeRadius * Math.cos(phi),
          z: globeRadius * Math.sin(phi) * Math.sin(theta),
        });
      }
      allLongRings.push(ring);
    }

    // Orbiting Satellites and Neural Data Packets
    interface Satellite {
      orbitRadius: number;
      speed: number;
      inclination: number;
      angle: number;
      size: number;
      tail: Point3D[];
    }

    const satellites: Satellite[] = Array.from({ length: 8 }, (_, idx) => ({
      orbitRadius: globeRadius * (1.18 + (idx % 3) * 0.12),
      speed: (0.012 + (idx % 3) * 0.004) * (idx % 2 === 0 ? 1 : -1),
      inclination: (idx * Math.PI) / 4 + 0.35,
      angle: (idx * Math.PI) / 4 + Math.random() * 0.5,
      size: 2 + (idx % 3) * 0.8,
      tail: [],
    }));

    // 3D Perspective Projection Function
    const fov = 380;
    const project = (p: Point3D, rx: number, ry: number): ProjectedPoint => {
      const cosY = Math.cos(ry);
      const sinY = Math.sin(ry);
      const x1 = p.x * cosY + p.z * sinY;
      const z1 = -p.x * sinY + p.z * cosY;

      const cosX = Math.cos(rx);
      const sinX = Math.sin(rx);
      const y2 = p.y * cosX - z1 * sinX;
      const z2 = p.y * sinX + z1 * cosX;

      const scale = fov / (fov + z2);
      const alpha = (z2 + globeRadius * 1.5) / (globeRadius * 3);

      return {
        x: centerX + x1 * scale,
        y: centerY + y2 * scale,
        scale,
        alpha: Math.max(0.08, Math.min(1, alpha)),
        z: z2,
      };
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const currentDyn = dynamicsRef.current;
      const activeColors = colorsRef.current;
      const primaryRgba = hexToRgba(activeColors.primary);
      const secondaryRgba = hexToRgba(activeColors.secondary);

      targetRotY.current += currentDyn.rotationSpeed;

      // Smooth interpolation for interactive drag vs auto-rotation
      rotXRef.current += (targetRotX.current - rotXRef.current) * 0.08;
      rotYRef.current += (targetRotY.current - rotYRef.current) * 0.08;

      const rx = rotXRef.current;
      const ry = rotYRef.current;

      // Outer Spherical Atmospheric Corona
      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        globeRadius * 0.2,
        centerX,
        centerY,
        globeRadius * 1.35
      );
      gradient.addColorStop(0, `rgba(${primaryRgba.r}, ${primaryRgba.g}, ${primaryRgba.b}, 0.22)`);
      gradient.addColorStop(0.5, `rgba(${secondaryRgba.r}, ${secondaryRgba.g}, ${secondaryRgba.b}, 0.08)`);
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, globeRadius * 1.35, 0, Math.PI * 2);
      ctx.fill();

      // Dynamic Inner Core Singularity
      const pulseAmp =
        status === 'LISTENING'
          ? audioAmplitude * 24
          : status === 'THINKING' || status === 'EXECUTING'
          ? Math.sin(Date.now() * 0.008) * 8
          : Math.sin(Date.now() * 0.002) * 2;
      const innerCoreRadius = (globeRadius * 0.3 + pulseAmp) * (isTyping ? 1.08 : 1.0);

      const coreGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        innerCoreRadius
      );
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.4, `rgba(${primaryRgba.r}, ${primaryRgba.g}, ${primaryRgba.b}, 0.95)`);
      coreGrad.addColorStop(0.85, `rgba(${secondaryRgba.r}, ${secondaryRgba.g}, ${secondaryRgba.b}, 0.3)`);
      coreGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, innerCoreRadius, 0, Math.PI * 2);
      ctx.fill();

      // Render 3D Longitude Wireframe Rings based on active density
      const visibleLongitudes = allLongRings.slice(0, currentDyn.wireframeDensity.longitudes);
      ctx.lineWidth = currentDyn.wireframeAlpha > 0.5 ? 1.2 : 0.9;
      visibleLongitudes.forEach((ring) => {
        ctx.beginPath();
        let started = false;
        ring.forEach((pt) => {
          const pr = project(pt, rx, ry);
          if (!started) {
            ctx.moveTo(pr.x, pr.y);
            started = true;
          } else {
            ctx.lineTo(pr.x, pr.y);
          }
        });
        ctx.strokeStyle = `rgba(${primaryRgba.r}, ${primaryRgba.g}, ${primaryRgba.b}, ${
          currentDyn.wireframeAlpha * 0.25
        })`;
        ctx.stroke();
      });

      // Render 3D Latitude Wireframe Rings based on active density
      const visibleLatitudes = allLatRings.slice(0, currentDyn.wireframeDensity.latitudes);
      visibleLatitudes.forEach((item, idx) => {
        ctx.beginPath();
        let started = false;
        item.points.forEach((pt) => {
          const pr = project(pt, rx, ry);
          if (!started) {
            ctx.moveTo(pr.x, pr.y);
            started = true;
          } else {
            ctx.lineTo(pr.x, pr.y);
          }
        });
        const isEquator = idx === Math.floor(visibleLatitudes.length / 2);
        ctx.strokeStyle = isEquator
          ? `rgba(${primaryRgba.r}, ${primaryRgba.g}, ${primaryRgba.b}, ${currentDyn.wireframeAlpha * 0.65})`
          : `rgba(${secondaryRgba.r}, ${secondaryRgba.g}, ${secondaryRgba.b}, ${currentDyn.wireframeAlpha * 0.3})`;
        ctx.lineWidth = isEquator ? 1.5 : 1;
        ctx.stroke();
      });

      // Project & Depth-Sort Surface Neural Nodes based on nodeCount density
      const activePoints = spherePoints.slice(0, currentDyn.wireframeDensity.nodeCount);
      const projectedNodes = activePoints.map((pt) => ({
        point: pt,
        proj: project(pt, rx, ry),
      }));

      projectedNodes.sort((a, b) => a.proj.z - b.proj.z);

      // Draw Neural Mesh Connections on the Globe
      ctx.lineWidth = 0.6;
      for (let i = 0; i < projectedNodes.length; i++) {
        const a = projectedNodes[i];
        if (a.proj.z < -globeRadius * 0.5) continue;

        for (let j = i + 1; j < projectedNodes.length; j++) {
          const b = projectedNodes[j];
          const dx = a.point.x - b.point.x;
          const dy = a.point.y - b.point.y;
          const dz = a.point.z - b.point.z;
          const dist3D = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist3D < currentDyn.wireframeDensity.connectionDistance) {
            const lineAlpha =
              (1 - dist3D / currentDyn.wireframeDensity.connectionDistance) *
              a.proj.alpha *
              currentDyn.wireframeAlpha *
              0.55;
            ctx.beginPath();
            ctx.moveTo(a.proj.x, a.proj.y);
            ctx.lineTo(b.proj.x, b.proj.y);
            ctx.strokeStyle = `rgba(${primaryRgba.r}, ${primaryRgba.g}, ${primaryRgba.b}, ${lineAlpha})`;
            ctx.stroke();
          }
        }
      }

      // Draw Surface Nodes
      projectedNodes.forEach((item) => {
        const pr = item.proj;
        const nodeSize = (pr.z > 0 ? 2.4 : 1.2) * pr.scale;

        ctx.beginPath();
        ctx.arc(pr.x, pr.y, Math.max(0.5, nodeSize), 0, Math.PI * 2);
        ctx.fillStyle =
          pr.z > 0
            ? `rgba(255, 255, 255, ${pr.alpha})`
            : `rgba(${primaryRgba.r}, ${primaryRgba.g}, ${primaryRgba.b}, ${pr.alpha * 0.6})`;
        ctx.fill();

        // Pulsing glow on front-facing nodes
        if (pr.z > globeRadius * 0.35) {
          ctx.beginPath();
          ctx.arc(pr.x, pr.y, nodeSize * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${primaryRgba.r}, ${primaryRgba.g}, ${primaryRgba.b}, ${pr.alpha * 0.28})`;
          ctx.fill();
        }
      });

      // Orbiting Satellites and Data Flow Stream Trails
      const isProcessingOrExecuting = status === 'THINKING' || status === 'EXECUTING';
      const targetTailLength = isProcessingOrExecuting ? 24 : 8;

      satellites.forEach((sat, satIdx) => {
        sat.angle += sat.speed * (isProcessingOrExecuting ? 2.8 : 1);

        const satX = sat.orbitRadius * Math.cos(sat.angle);
        const satY = sat.orbitRadius * Math.sin(sat.angle) * Math.sin(sat.inclination);
        const satZ = sat.orbitRadius * Math.sin(sat.angle) * Math.cos(sat.inclination);

        const satPoint: Point3D = { x: satX, y: satY, z: satZ };
        const satProj = project(satPoint, rx, ry);

        sat.tail.unshift(satPoint);
        while (sat.tail.length > targetTailLength) {
          sat.tail.pop();
        }

        // Render Glowing Data Flow Stream Trail Ribbon
        if (sat.tail.length > 1) {
          const tailPoints = sat.tail.map((tp) => project(tp, rx, ry));

          // Draw multi-segment tapered trail with glowing gradient decay
          for (let t = 0; t < tailPoints.length - 1; t++) {
            const p1 = tailPoints[t];
            const p2 = tailPoints[t + 1];
            const progress = 1 - t / tailPoints.length; // 1 at head, 0 at tail tip
            const segmentAlpha = progress * satProj.alpha * (isProcessingOrExecuting ? 0.9 : 0.4);
            const lineWidth = Math.max(0.6, (isProcessingOrExecuting ? 2.5 : 1.2) * progress * satProj.scale);

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${primaryRgba.r}, ${primaryRgba.g}, ${primaryRgba.b}, ${segmentAlpha})`;
            ctx.lineWidth = lineWidth;

            if (isProcessingOrExecuting && t < 4) {
              ctx.shadowBlur = 10;
              ctx.shadowColor = colors.primary;
            } else {
              ctx.shadowBlur = 0;
            }
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Render trailing quantum data packet bead along trail during active processing
            if (isProcessingOrExecuting && t % 5 === 0 && t > 0) {
              ctx.beginPath();
              ctx.arc(p1.x, p1.y, Math.max(0.8, 1.6 * progress * satProj.scale), 0, Math.PI * 2);
              ctx.fillStyle = `rgba(255, 255, 255, ${segmentAlpha * 0.9})`;
              ctx.fill();
            }
          }
        }

        // Main Satellite Orb Head with Luminous Quantum Aura
        ctx.beginPath();
        ctx.arc(
          satProj.x,
          satProj.y,
          (sat.size + (isProcessingOrExecuting ? 0.8 : 0)) * satProj.scale,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = isProcessingOrExecuting ? '#ffffff' : `rgba(255, 255, 255, ${satProj.alpha})`;
        ctx.shadowBlur = isProcessingOrExecuting ? 14 : 7;
        ctx.shadowColor = colors.primary;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Data Transmission Rays to Core Center
        if (isProcessingOrExecuting || status === 'RESPONDING') {
          const pulseOffset = (Date.now() * 0.003 + satIdx * 0.5) % 1;
          const beamX = centerX + (satProj.x - centerX) * pulseOffset;
          const beamY = centerY + (satProj.y - centerY) * pulseOffset;

          // Background connection wire
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(satProj.x, satProj.y);
          ctx.strokeStyle = `rgba(${primaryRgba.r}, ${primaryRgba.g}, ${primaryRgba.b}, ${isProcessingOrExecuting ? 0.28 : 0.15})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();

          // Traveling Data Packet Pulse along beam
          if (isProcessingOrExecuting) {
            ctx.beginPath();
            ctx.arc(beamX, beamY, 2 * satProj.scale, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 8;
            ctx.shadowColor = colors.primary;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      });

      // 3D Equator Caliper Ring with rotating ticks
      const equatorRadius = globeRadius * 1.25;
      const numTicks = 36;
      for (let i = 0; i < numTicks; i++) {
        const theta = (2 * Math.PI * i) / numTicks + ry * 0.5;
        const tickP1: Point3D = {
          x: equatorRadius * Math.cos(theta),
          y: 0,
          z: equatorRadius * Math.sin(theta),
        };
        const tickP2: Point3D = {
          x: (equatorRadius + (i % 6 === 0 ? 8 : 4)) * Math.cos(theta),
          y: 0,
          z: (equatorRadius + (i % 6 === 0 ? 8 : 4)) * Math.sin(theta),
        };

        const pr1 = project(tickP1, rx, ry);
        const pr2 = project(tickP2, rx, ry);

        if (pr1.z > -globeRadius * 0.8) {
          ctx.beginPath();
          ctx.moveTo(pr1.x, pr1.y);
          ctx.lineTo(pr2.x, pr2.y);
          ctx.strokeStyle = `rgba(${primaryRgba.r}, ${primaryRgba.g}, ${primaryRgba.b}, ${pr1.alpha * 0.6})`;
          ctx.lineWidth = i % 6 === 0 ? 1.5 : 0.8;
          ctx.stroke();
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    // Mouse drag handlers
    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left - width / 2;
        const mouseY = e.clientY - rect.top - height / 2;
        targetRotX.current = Math.max(-0.6, Math.min(0.6, (mouseY / height) * 0.8));
        return;
      }
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      targetRotY.current += dx * 0.008;
      targetRotX.current += dy * 0.008;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [size, status, audioAmplitude, isTyping, colors]);

  return (
    <div
      className="relative flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
      style={{ width: size, height: size }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="block"
        title="Interactive 3D Ultron Globe — Click and drag to rotate"
      />
    </div>
  );
};
