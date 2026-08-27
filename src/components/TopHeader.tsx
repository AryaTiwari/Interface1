import React from 'react';
import { useUltron } from '../core/ultronContext';
import { useDynamicRgbColor } from '../utils/dynamicRgb';

// \code of mood

export const TopHeader: React.FC = () => {
  const {
    status,
    soundscapeEnabled,
    toggleSoundscape,
    setIsPersonalityModalOpen,
    setIsDiagnosticsOpen,
    isDecisionHistoryOpen,
    setIsDecisionHistoryOpen,
    decisionHistory,
    sendUserPrompt,
    triggerToolDirectly,
    diagnostics,
    personality,
  } = useUltron();

  const colors = useDynamicRgbColor();

  return (
    <header
      id="top-header"
      className="w-full flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-2.5 border-b border-slate-900/90 bg-slate-950/85 backdrop-blur-xl z-30 font-mono select-none"
    >
      {/* Brand & Identity */}
      <div className="flex items-center gap-3 shrink-0">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center border text-base font-bold transition-all shadow-[0_0_12px_var(--ultron-glow)]"
          style={{
            borderColor: colors.border,
            backgroundColor: colors.bgAccent,
          }}
        >
          <span>🤖</span>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-black tracking-[0.2em] text-white">
              {personality.ULTRON_NAME}
            </h1>
            <span
              className="text-[9px] font-bold px-1.5 py-0.2 rounded border"
              style={{
                borderColor: colors.border,
                color: colors.text,
                backgroundColor: colors.bgAccent,
              }}
            >
              OS v2.4
            </span>
          </div>
          <span className="text-[8px] text-slate-500 tracking-wider hidden sm:inline">
            AUTONOMOUS COGNITIVE INTERFACE
          </span>
        </div>
      </div>

      {/* Structured Navigation & Directives Toolbar */}
      <nav
        id="top-navigation-toolbar"
        aria-label="System Tools and Controls"
        className="flex flex-wrap items-center gap-1.5 bg-slate-900/90 border border-slate-800/90 rounded-xl p-1.5 shadow-lg backdrop-blur-md"
      >
        {/* Instant Action Tools */}
        <div className="flex items-center gap-1 pr-1.5 border-r border-slate-800">
          <button
            id="tool-audit"
            onClick={() => triggerToolDirectly('system_diagnostics')}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-950/90 hover:bg-slate-800 text-[10px] font-bold text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/80 transition-all cursor-pointer"
            title="Execute High-Priority System Diagnostics with Haptic Impact"
          >
            <span>💻</span>
            <span className="hidden sm:inline">AUDIT</span>
          </button>

          <button
            id="tool-intel"
            onClick={() => triggerToolDirectly('web_search', { query: 'AI system breakthroughs and robotics' })}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-950/90 hover:bg-slate-800 text-[10px] font-bold text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/80 transition-all cursor-pointer"
            title="Execute High-Priority Web Intel Scan with Haptic Impact"
          >
            <span>🌐</span>
            <span className="hidden sm:inline">INTEL SCAN</span>
          </button>

          <button
            id="tool-perspective"
            onClick={() => sendUserPrompt('What is your philosophical perspective on mortal intelligence and code?')}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-950/90 hover:bg-slate-800 text-[10px] font-bold text-slate-300 hover:text-purple-300 border border-slate-800 hover:border-purple-500/80 transition-all cursor-pointer"
            title="Query Ultron Cognitive Perspective"
          >
            <span>💬</span>
            <span className="hidden md:inline">PERSPECTIVE</span>
          </button>
        </div>

        {/* System Settings & Modals */}
        <div className="flex items-center gap-1 pr-1.5 border-r border-slate-800">
          <button
            id="tool-personality"
            onClick={() => setIsPersonalityModalOpen(true)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-950/90 hover:bg-slate-800 text-[10px] font-bold text-slate-300 hover:text-white border border-slate-800 hover:border-cyan-500 transition-all cursor-pointer"
            title="Configure Ultron Personality Matrix"
          >
            <span>⚙️</span>
            <span>PERSONALITY</span>
          </button>

          <button
            id="tool-telemetry"
            onClick={() => setIsDiagnosticsOpen(true)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-950/90 hover:bg-slate-800 text-[10px] font-bold text-slate-300 hover:text-white border border-slate-800 hover:border-cyan-500 transition-all cursor-pointer"
            title="Open Subsystem Diagnostics & Memory Store"
          >
            <span>📊</span>
            <span>TELEMETRY</span>
          </button>

          <button
            id="tool-decision-history"
            onClick={() => setIsDecisionHistoryOpen(!isDecisionHistoryOpen)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
              isDecisionHistoryOpen
                ? 'border-cyan-500 bg-cyan-950/60 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'border-slate-800 bg-slate-950/90 text-slate-300 hover:text-white hover:border-cyan-500'
            }`}
            title="Toggle Decision History & Confidence Score Inspector"
          >
            <span>📜</span>
            <span>DECISIONS ({decisionHistory.length})</span>
          </button>
        </div>

        {/* Ambient Audio FX Toggle */}
        <button
          id="tool-soundscape"
          onClick={toggleSoundscape}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
            soundscapeEnabled
              ? 'border-cyan-500/60 bg-cyan-950/40 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
              : 'border-slate-800 bg-slate-950/90 text-slate-500 hover:text-slate-300'
          }`}
          title={soundscapeEnabled ? 'Mute Ambient Soundscape' : 'Enable Ambient Soundscape'}
        >
          <span>{soundscapeEnabled ? '🔊' : '🔇'}</span>
          <span className="hidden lg:inline">{soundscapeEnabled ? 'AUDIO FX' : 'MUTED'}</span>
        </button>
      </nav>

      {/* Right Live Telemetry Badges */}
      <div className="hidden 2xl:flex items-center gap-2 text-[10px] text-slate-400">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-800/80 bg-slate-900/60">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-500">STATE:</span>
          <span className="text-slate-200 font-bold">{status}</span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-800/80 bg-slate-900/60">
          <span>⚡</span>
          <span className="text-slate-200">{diagnostics?.coreTemperature || '38.4°C'}</span>
        </div>
      </div>
    </header>
  );
};
