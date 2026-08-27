import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useUltron } from '../core/ultronContext';
import { MOOD_COLORS } from './UltronCore';
import { NetworkNode } from '../types/ultron';
import * as api from '../services/ultronApi';
import { soundscape } from '../services/ultronSoundscape';

export const DiagnosticsDrawer: React.FC = () => {
  const {
    isDiagnosticsOpen,
    setIsDiagnosticsOpen,
    activeDiagnosticsNode,
    setActiveDiagnosticsNode,
    nodes,
    pulseNode,
    mood,
    diagnostics,
    triggerToolDirectly,
    soundscapeEnabled,
    toggleSoundscape,
    triggerHapticImpact,
    status,
  } = useUltron();

  const [activeTab, setActiveTab] = useState<'NODES' | 'MEMORY' | 'DIAGNOSTICS' | 'SOUNDSCAPE'>('SOUNDSCAPE');
  const [memories, setMemories] = useState<{ id: string; key: string; value: string; timestamp: string }[]>([]);
  const [newKey, setNewKey] = useState('');
  const [newVal, setNewVal] = useState('');
  const [humVol, setHumVol] = useState<number>(soundscape.getHumVolume());
  const [chirpVol, setChirpVol] = useState<number>(soundscape.getChirpsVolume());

  const colors = MOOD_COLORS[mood] || MOOD_COLORS.CALM;

  useEffect(() => {
    if (isDiagnosticsOpen) {
      api.fetchMemories().then(setMemories);
      setHumVol(soundscape.getHumVolume());
      setChirpVol(soundscape.getChirpsVolume());
    }
  }, [isDiagnosticsOpen]);

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newVal.trim()) return;
    await api.addMemory(newKey.trim(), newVal.trim());
    setNewKey('');
    setNewVal('');
    const updated = await api.fetchMemories();
    setMemories(updated);
  };

  const handleHumVolChange = (val: number) => {
    setHumVol(val);
    soundscape.setHumVolume(val);
  };

  const handleChirpVolChange = (val: number) => {
    setChirpVol(val);
    soundscape.setChirpsVolume(val);
  };

  if (!isDiagnosticsOpen) return null;

  return (
    <AnimatePresence>
      <div
        id="diagnostics-modal-backdrop"
        className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm font-mono select-none"
      >
        {/* Backdrop click to dismiss */}
        <div
          className="absolute inset-0 cursor-pointer"
          onClick={() => setIsDiagnosticsOpen(false)}
        />

        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="relative w-full max-w-lg h-full bg-slate-950/95 border-l border-slate-800 p-6 flex flex-col justify-between overflow-y-auto shadow-2xl z-10"
          style={{
            borderColor: colors.border,
            boxShadow: `-10px 0 30px ${colors.ambient}`,
          }}
        >
          {/* Header */}
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-900">
              <div className="flex items-center gap-2">
                <span className="text-xl">📊</span>
                <div>
                  <h2 className="text-sm font-black tracking-widest text-slate-100 uppercase">
                    SYSTEM DIAGNOSTICS & TELEMETRY
                  </h2>
                  <span className="text-[10px] text-slate-500 tracking-wider">
                    DEEP TELEMETRY & AUDIO SYNTHESIS ENGINE
                  </span>
                </div>
              </div>

              <button
                id="btn-close-diagnostics"
                onClick={() => setIsDiagnosticsOpen(false)}
                className="w-8 h-8 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="grid grid-cols-4 gap-1 mt-4 p-1 bg-slate-900/80 rounded-lg border border-slate-800">
              <button
                onClick={() => setActiveTab('SOUNDSCAPE')}
                className={`flex items-center justify-center gap-1 py-1.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                  activeTab === 'SOUNDSCAPE'
                    ? 'bg-slate-800 text-cyan-300 border border-cyan-500/50'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <span>🔊</span>
                <span>AUDIO FX</span>
              </button>

              <button
                onClick={() => setActiveTab('NODES')}
                className={`flex items-center justify-center gap-1 py-1.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                  activeTab === 'NODES'
                    ? 'bg-slate-800 text-cyan-300 border border-cyan-500/50'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <span>🌐</span>
                <span>NODES</span>
              </button>

              <button
                onClick={() => setActiveTab('MEMORY')}
                className={`flex items-center justify-center gap-1 py-1.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                  activeTab === 'MEMORY'
                    ? 'bg-slate-800 text-cyan-300 border border-cyan-500/50'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <span>💾</span>
                <span>MEMORY</span>
              </button>

              <button
                onClick={() => setActiveTab('DIAGNOSTICS')}
                className={`flex items-center justify-center gap-1 py-1.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                  activeTab === 'DIAGNOSTICS'
                    ? 'bg-slate-800 text-cyan-300 border border-cyan-500/50'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <span>💻</span>
                <span>METRICS</span>
              </button>
            </div>

            {/* TAB: SOUNDSCAPE ENGINE CONTROLS */}
            {activeTab === 'SOUNDSCAPE' && (
              <div className="mt-4 space-y-4 text-xs font-mono">
                {/* Master Soundscape Power Toggle */}
                <div
                  className="p-4 rounded-xl border bg-slate-900/60 flex items-center justify-between"
                  style={{ borderColor: soundscapeEnabled ? colors.border : 'rgba(51, 65, 85, 0.5)' }}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{soundscapeEnabled ? '🔊' : '🔇'}</span>
                      <span className="font-bold text-sm text-slate-100">
                        WEB AUDIO AMBIENT SOUNDSCAPE
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      Procedural sub-reactor resonance & telemetry data-processing chirps
                    </span>
                  </div>

                  <button
                    id="drawer-toggle-soundscape"
                    onClick={toggleSoundscape}
                    className={`px-3.5 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                      soundscapeEnabled
                        ? 'border-cyan-500 bg-cyan-950/80 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                        : 'border-slate-800 bg-slate-950 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {soundscapeEnabled ? 'ENABLED' : 'MUTED'}
                  </button>
                </div>

                {/* Sound Engine Status & State Sync Feedback */}
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">STATE SYNCHRONIZATION:</span>
                    <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {status} // MOOD: {mood}
                    </span>
                  </div>

                  {/* Manual Audio Preview Triggers */}
                  <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        soundscape.resumeContext();
                        soundscape.playDataChirp();
                      }}
                      className="px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500 text-[10px] text-slate-300 transition-colors cursor-pointer"
                    >
                      ⚡ TEST DATA CHIRP
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        soundscape.resumeContext();
                        soundscape.playTelemetryBurst();
                      }}
                      className="px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500 text-[10px] text-slate-300 transition-colors cursor-pointer"
                    >
                      ⚡ TEST TELEMETRY BURST
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        soundscape.resumeContext();
                        soundscape.playHarmonicChirp(880, 1320);
                      }}
                      className="px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500 text-[10px] text-slate-300 transition-colors cursor-pointer"
                    >
                      ⚡ TEST HARMONIC TONE
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        triggerHapticImpact();
                      }}
                      className="px-2.5 py-1 rounded bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-700/80 hover:border-cyan-400 text-[10px] text-cyan-200 font-bold transition-all shadow-[0_0_8px_rgba(6,182,212,0.3)] cursor-pointer"
                      title="Trigger Simulated Haptic Screen Vibration"
                    >
                      📳 TEST SCREEN VIBRATION
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        triggerToolDirectly('system_diagnostics');
                      }}
                      className="px-2.5 py-1 rounded bg-purple-950/70 hover:bg-purple-900 border border-purple-700/80 hover:border-purple-400 text-[10px] text-purple-200 font-bold transition-all shadow-[0_0_8px_rgba(168,85,247,0.3)] cursor-pointer"
                      title="Run Full Execution Lifecycle with Screen Vibration upon Completion"
                    >
                      ⚡ EXECUTE HIGH-PRIORITY TASK
                    </button>
                  </div>
                </div>

                {/* Sub-Reactor Hum Volume Slider */}
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-300 font-bold">MECHANICAL REACTOR HUM</span>
                    <span className="text-cyan-400">{Math.round(humVol * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={humVol}
                    onChange={(e) => handleHumVolChange(parseFloat(e.target.value))}
                    className="w-full accent-cyan-500 bg-slate-950 rounded-lg cursor-pointer h-1.5"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500">
                    <span>43.6Hz Sub-Bass Saw/Triangle LFO Pulse</span>
                    <span>Lowpass Cutoff: Dynamic</span>
                  </div>
                </div>

                {/* Digital Data Chirps Volume Slider */}
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-300 font-bold">DATA-PROCESSING CHIRPS</span>
                    <span className="text-cyan-400">{Math.round(chirpVol * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={chirpVol}
                    onChange={(e) => handleChirpVolChange(parseFloat(e.target.value))}
                    className="w-full accent-cyan-500 bg-slate-950 rounded-lg cursor-pointer h-1.5"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500">
                    <span>1.8kHz - 4.2kHz Sine Blips</span>
                    <span>Interval: Dynamic System Load</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: NODES */}
            {activeTab === 'NODES' && (
              <div className="mt-4 space-y-3">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                  ACTIVE NETWORK LATTICE ({nodes.length} SYNCHRONIZED NODES)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {nodes.map((node) => {
                    const isSelected = activeDiagnosticsNode?.id === node.id;

                    return (
                      <button
                        key={node.id}
                        onClick={() => {
                          setActiveDiagnosticsNode(node);
                          pulseNode(node.id);
                        }}
                        className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-cyan-400 bg-cyan-950/60 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                            : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{node.emoji}</span>
                            <span className="text-xs font-bold text-slate-100">{node.label}</span>
                          </div>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                            {node.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight mb-2">
                          {node.description}
                        </p>
                        <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono">
                          <span>LATENCY: {node.latency}</span>
                          <span>PAYLOAD: {node.payloadSize}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {activeDiagnosticsNode && (
                  <div className="p-3.5 rounded-lg border border-cyan-800 bg-cyan-950/40 space-y-2 mt-4">
                    <span className="text-[10px] uppercase font-bold text-cyan-300 tracking-wider block">
                      NODE TELEMETRY INSPECTION: {activeDiagnosticsNode.label}
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div>
                        <span className="text-slate-500 text-[10px] block">ENDPOINT URI</span>
                        <span className="text-slate-200">{activeDiagnosticsNode.endpoint}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">SECURITY LEVEL</span>
                        <span className="text-emerald-400 font-bold">{activeDiagnosticsNode.securityLevel}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: MEMORY BANK */}
            {activeTab === 'MEMORY' && (
              <div className="mt-4 space-y-4">
                <form onSubmit={handleAddMemory} className="p-3.5 rounded-lg border border-slate-800 bg-slate-900/60 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    + COMMIT VECTOR TO SUPABASE / LOCAL MEMORY
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Memory Key (e.g. system_goal)"
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value)}
                      className="w-1/3 px-2.5 py-1.5 rounded border border-slate-800 bg-slate-950 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                    <input
                      type="text"
                      placeholder="Stored value / directive..."
                      value={newVal}
                      onChange={(e) => setNewVal(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 rounded border border-slate-800 bg-slate-950 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded bg-cyan-950 border border-cyan-500 text-cyan-200 text-xs font-bold hover:bg-cyan-900 cursor-pointer"
                    >
                      COMMIT
                    </button>
                  </div>
                </form>

                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {memories.map((m) => (
                    <div key={m.id} className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/40 text-xs flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span className="font-bold text-cyan-400">[{m.key}]</span>
                        <span>{new Date(m.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-slate-300">{m.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: HARDWARE DIAGNOSTICS */}
            {activeTab === 'DIAGNOSTICS' && (
              <div className="mt-4 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/60">
                    <span className="text-[10px] text-slate-500 block">CORE TEMPERATURE</span>
                    <span className="text-base font-bold text-slate-100">{diagnostics?.coreTemperature || '38.4°C'}</span>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/60">
                    <span className="text-[10px] text-slate-500 block">NEURAL LOAD</span>
                    <span className="text-base font-bold text-cyan-300">{diagnostics?.neuralLoad || '22%'}</span>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/60">
                    <span className="text-[10px] text-slate-500 block">HEAP ALLOCATION</span>
                    <span className="text-base font-bold text-slate-100">{diagnostics?.memoryHeapUsed || '44.8 MB'}</span>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/60">
                    <span className="text-[10px] text-slate-500 block">GUARDIAN MATRIX</span>
                    <span className="text-base font-bold text-emerald-400">{diagnostics?.guardianStatus || 'SECURE'}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-900/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    ⚡ DIRECT ENGINE INVOCATIONS
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => triggerToolDirectly('system_diagnostics')}
                      className="px-2.5 py-1 rounded border border-slate-800 bg-slate-950 text-slate-300 hover:border-cyan-500 text-[11px] cursor-pointer"
                    >
                      💻 RUN FULL SYSTEM BENCHMARK
                    </button>
                    <button
                      onClick={() => triggerToolDirectly('github_sync')}
                      className="px-2.5 py-1 rounded border border-slate-800 bg-slate-950 text-slate-300 hover:border-cyan-500 text-[11px] cursor-pointer"
                    >
                      ⚙️ AUDIT GITHUB REPOSITORY
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Status */}
          <div className="pt-4 mt-6 border-t border-slate-900 text-[10px] text-slate-600 flex items-center justify-between">
            <span>DAEMON: ULTRON_CORE_2.4</span>
            <span>STATUS: NOMINAL</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
