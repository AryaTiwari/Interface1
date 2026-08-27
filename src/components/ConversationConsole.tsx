import React from 'react';
import { useUltron } from '../core/ultronContext';
import { MOOD_COLORS } from './UltronCore';

export const ConversationConsole: React.FC = () => {
  const {
    messages,
    setIsChatOpen,
    mood,
    status,
  } = useUltron();

  const colors = MOOD_COLORS[mood] || MOOD_COLORS.CALM;
  const isThinking = status === 'THINKING';
  const isResponding = status === 'RESPONDING';

  return (
    <div
      id="conversation-console-container"
      className="w-full max-w-xl mx-auto flex flex-col items-center justify-center font-mono select-none"
    >
      {/* Central Ultron Chat Launcher Button */}
      <button
        id="btn-open-ultron-chat"
        type="button"
        onClick={() => setIsChatOpen(true)}
        className="group relative flex items-center justify-between gap-4 px-6 py-3.5 w-full sm:w-auto min-w-[280px] sm:min-w-[360px] rounded-2xl border bg-slate-950/90 backdrop-blur-2xl shadow-2xl transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.99]"
        style={{
          borderColor: colors.border,
          boxShadow: `0 8px 32px rgba(0,0,0,0.8), 0 0 24px ${colors.ambient}`,
        }}
        title="Open Full Ultron Chat Matrix & Permanent Conversation History"
      >
        {/* Left icon with pulse */}
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center border text-base shadow-lg transition-transform group-hover:rotate-6"
            style={{
              borderColor: colors.border,
              backgroundColor: colors.bgAccent,
            }}
          >
            <span>💬</span>
          </div>

          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-widest text-white group-hover:text-cyan-300 transition-colors">
                ULTRON CHAT
              </span>
              {(isThinking || isResponding) && (
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              )}
            </div>
            <p className="text-[10px] text-slate-400 tracking-wider">
              {isThinking
                ? '🧠 THINKING...'
                : isResponding
                ? '⚡ RESPONDING...'
                : 'Click to open conversation'}
            </p>
          </div>
        </div>

        {/* Right Badge: Saved History Count & Arrow */}
        <div className="flex items-center gap-2">
          <span
            className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border"
            style={{
              borderColor: colors.border,
              backgroundColor: colors.bgAccent,
              color: colors.text,
            }}
          >
            <span>💾</span>
            <span>{messages.length} SAVED</span>
          </span>

          <span className="text-slate-500 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-all text-xs">
            →
          </span>
        </div>
      </button>
    </div>
  );
};
