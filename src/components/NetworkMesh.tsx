import React from 'react';
import { motion } from 'motion/react';
import { useUltron } from '../core/ultronContext';
import { NetworkNode } from '../types/ultron';
import { useDynamicRgbColor } from '../utils/dynamicRgb';

// \internet speed
// \github status
// \memory status
// \omni router status
// \instagram status
// \administrator status

/**
 * Fixed Orbit Cybernetic Node Matrix.
 * Positions nodes along clean, non-overlapping concentric orbital quadrants
 * away from the central 3D globe and bottom conversation bubble dock.
 */
export const NetworkMesh: React.FC = () => {
  const {
    nodes,
    activeNodeId,
    pulseNode,
    toggleNodeStatus,
    setActiveDiagnosticsNode,
    setIsDiagnosticsOpen,
    status,
  } = useUltron();

  const colors = useDynamicRgbColor();

  const handleNodeClick = (node: NetworkNode) => {
    pulseNode(node.id);
    setActiveDiagnosticsNode(node);
    setIsDiagnosticsOpen(true);
  };

  // Calculate radius dynamically so nodes stay comfortable distance away from the globe
  const [distPx, setDistPx] = React.useState(300);

  React.useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const minDim = Math.min(w, h);
      // Push buttons away from globe radius (globe is ~220px radius, so 290px-330px is ideal)
      setDistPx(Math.min(330, Math.max(280, Math.floor(minDim * 0.32))));
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible select-none z-30">
      {/* Background Holographic Orbital & Reticle Grid */}
      <svg className="w-full h-full absolute inset-0" xmlns="http://www.w3.org/2000/svg">
        <g opacity="0.18">
          <circle cx="50%" cy="48%" r={distPx} stroke={colors.border} strokeWidth="1" strokeDasharray="4 8" fill="none" />
          <circle cx="50%" cy="48%" r={distPx + 60} stroke={colors.border} strokeWidth="1" strokeDasharray="6 14" fill="none" />
          <line x1="5%" y1="48%" x2="95%" y2="48%" stroke={colors.border} strokeWidth="1" strokeDasharray="4 12" />
        </g>

        {/* Dynamic Connection Beams between Nodes and Center Core */}
        {nodes.map((node) => {
          const rad = (node.angle * Math.PI) / 180;
          const xPercent = 50 + (distPx * Math.cos(rad) * 100) / (window.innerWidth || 1200);
          const yPercent = 48 + (distPx * Math.sin(rad) * 100) / (window.innerHeight || 800);
          const isConnected = node.status === 'CONNECTED' || node.status === 'ONLINE';
          const isActive = activeNodeId === node.id || status === 'EXECUTING';

          return (
            <line
              key={`line-${node.id}`}
              x1="50%"
              y1="48%"
              x2={`${xPercent}%`}
              y2={`${yPercent}%`}
              stroke={isConnected ? (isActive ? colors.primary : colors.border) : '#ef4444'}
              strokeWidth={isActive ? '1.8' : '0.8'}
              strokeDasharray={isConnected ? (isActive ? '4 4' : '2 8') : '1 4'}
              opacity={isConnected ? (isActive ? 0.85 : 0.4) : 0.25}
            />
          );
        })}
      </svg>

      {/* Interactive Orbit Nodes */}
      {nodes.map((node) => {
        const rad = (node.angle * Math.PI) / 180;
        const isActive = activeNodeId === node.id;
        const isConnected = node.status === 'CONNECTED' || node.status === 'ONLINE';

        return (
          <div
            key={node.id}
            style={{
              position: 'absolute',
              left: `calc(50% + ${distPx * Math.cos(rad)}px)`,
              top: `calc(48% + ${distPx * Math.sin(rad)}px)`,
              transform: 'translate(-50%, -50%)',
            }}
            className="pointer-events-auto"
          >
            <div className="flex items-center gap-1.5">
              {/* Primary Node Button */}
              <motion.button
                id={`mesh-node-${node.id}`}
                onClick={() => handleNodeClick(node)}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border backdrop-blur-xl shadow-lg transition-all cursor-pointer ${
                  isActive
                    ? 'border-cyan-400 bg-cyan-950/90 text-white shadow-[0_0_16px_rgba(6,182,212,0.6)]'
                    : 'border-slate-800/90 bg-slate-950/85 text-slate-300 hover:border-cyan-500/80 hover:text-white hover:bg-slate-900'
                }`}
                style={{
                  borderColor: isActive ? colors.primary : undefined,
                  boxShadow: isActive ? `0 0 16px ${colors.glow}` : undefined,
                }}
                title={`${node.label} — ${node.description} (Click to inspect)`}
              >
                <span className="text-xs">{node.emoji}</span>
                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-black tracking-wider leading-none">
                    {node.label}
                  </span>

                  {node.id === 'internet' ? (
                    // \internet speed
                    <span className="text-[8px] text-cyan-300 font-mono leading-tight mt-0.5">
                      {/* \internet speed */}
                      {node.latency}
                    </span>
                  ) : (
                    <span className="text-[8px] text-slate-500 font-mono leading-tight mt-0.5">
                      {node.latency}
                    </span>
                  )}
                </div>
              </motion.button>

              {/* Connected (Green) vs Not Connected (Red) Status Button */}
              {node.id === 'github' && (
                // \github status
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    // \github status
                    toggleNodeStatus(node.id);
                  }}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[9px] font-bold tracking-wider transition-all cursor-pointer ${
                    isConnected
                      ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-400 hover:bg-emerald-900 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                      : 'bg-red-950/80 border-red-500/60 text-red-400 hover:bg-red-900 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                  }`}
                  title="Toggle GitHub status"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
                  <span>{isConnected ? 'CONNECTED' : 'DISCONNECTED'}</span>
                </button>
              )}

              {node.id === 'supabase_memory' && (
                // \memory status
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    // \memory status
                    toggleNodeStatus(node.id);
                  }}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[9px] font-bold tracking-wider transition-all cursor-pointer ${
                    isConnected
                      ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-400 hover:bg-emerald-900 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                      : 'bg-red-950/80 border-red-500/60 text-red-400 hover:bg-red-900 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                  }`}
                  title="Toggle Memory status"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
                  <span>{isConnected ? 'CONNECTED' : 'DISCONNECTED'}</span>
                </button>
              )}

              {node.id === 'ai_brain' && (
                // \omni router status
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    // \omni router status
                    toggleNodeStatus(node.id);
                  }}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[9px] font-bold tracking-wider transition-all cursor-pointer ${
                    isConnected
                      ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-400 hover:bg-emerald-900 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                      : 'bg-red-950/80 border-red-500/60 text-red-400 hover:bg-red-900 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                  }`}
                  title="Toggle AI Router status"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
                  <span>{isConnected ? 'CONNECTED' : 'DISCONNECTED'}</span>
                </button>
              )}

              {node.id === 'quantum_matrix' && (
                // \instagram status
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    // \instagram status
                    toggleNodeStatus(node.id);
                  }}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[9px] font-bold tracking-wider transition-all cursor-pointer ${
                    isConnected
                      ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-400 hover:bg-emerald-900 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                      : 'bg-red-950/80 border-red-500/60 text-red-400 hover:bg-red-900 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                  }`}
                  title="Toggle Instagram status"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
                  <span>{isConnected ? 'CONNECTED' : 'DISCONNECTED'}</span>
                </button>
              )}

              {node.id === 'guardian' && (
                // \administrator status
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    // \administrator status
                    toggleNodeStatus(node.id);
                  }}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[9px] font-bold tracking-wider transition-all cursor-pointer ${
                    isConnected
                      ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-400 hover:bg-emerald-900 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                      : 'bg-red-950/80 border-red-500/60 text-red-400 hover:bg-red-900 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                  }`}
                  title="Toggle Computer Access status"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
                  <span>{isConnected ? 'CONNECTED' : 'DISCONNECTED'}</span>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
