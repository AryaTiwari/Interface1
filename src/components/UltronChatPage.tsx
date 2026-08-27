import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useUltron } from '../core/ultronContext';
import { FormattedMessage } from './FormattedMessage';
import { useDynamicRgbColor } from '../utils/dynamicRgb';

// \code of mood

export const UltronChatPage: React.FC = () => {
  const {
    isChatOpen,
    setIsChatOpen,
    messages,
    sendUserPrompt,
    status,
    clearConsole,
    personality,
    diagnostics,
    userRequirements,
    customDirectives,
    saveUserMemoryDirectives,
    addCustomDirective,
    removeCustomDirective,
  } = useUltron();

  const [inputVal, setInputVal] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isDirectivesPanelOpen, setIsDirectivesPanelOpen] = useState(false);

  // Local editing states for Memory & Directives panel
  const [editingRequirements, setEditingRequirements] = useState(userRequirements);
  const [newLabel, setNewLabel] = useState('');
  const [newPrompt, setNewPrompt] = useState('');
  const [saveToast, setSaveToast] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const colors = useDynamicRgbColor();

  // Sync editing requirements when userRequirements changes in context
  useEffect(() => {
    setEditingRequirements(userRequirements);
  }, [userRequirements]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, status, isChatOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isChatOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isChatOpen]);

  // Listen to Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isChatOpen) {
        if (isExportMenuOpen) {
          setIsExportMenuOpen(false);
        } else if (isDirectivesPanelOpen) {
          setIsDirectivesPanelOpen(false);
        } else {
          setIsChatOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isChatOpen, setIsChatOpen, isDirectivesPanelOpen, isExportMenuOpen]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputVal.trim() || status === 'THINKING') return;
    const text = inputVal.trim();
    setInputVal('');
    await sendUserPrompt(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCopyTranscript = () => {
    const transcript = messages
      .map((m) => `[${m.timestamp}] ${m.sender}: ${m.text}`)
      .join('\n\n');
    navigator.clipboard.writeText(transcript);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const triggerDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const exportPayload = {
      exportedAt: new Date().toISOString(),
      appletUnit: personality.ULTRON_NAME || 'ULTRON_CORE',
      activeColorMode: 'DYNAMIC_RGB',
      userRequirements,
      messageCount: messages.length,
      messages: messages.map((m) => ({
        id: m.id,
        sender: m.sender,
        timestamp: m.timestamp,
        text: m.text,
        toolUsed: m.toolUsed,
        telemetry: m.telemetry,
        pipeline: m.pipeline,
      })),
    };
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    triggerDownload(
      JSON.stringify(exportPayload, null, 2),
      `ultron_chat_history_${timestamp}.json`,
      'application/json'
    );
    setIsExportMenuOpen(false);
    setExportFeedback('JSON EXPORTED!');
    setTimeout(() => setExportFeedback(null), 2500);
  };

  const handleExportText = () => {
    const header = `====================================================
ULTRON CHAT MATRIX - CONVERSATION SESSION TRANSCRIPT
Exported: ${new Date().toLocaleString()}
Unit Persona: ${personality.ULTRON_NAME || 'ULTRON_CORE'} | Matrix Mode: Dynamic RGB
Messages Saved: ${messages.length}
User Requirements: ${userRequirements || 'None'}
====================================================\n\n`;

    const body = messages
      .map((m) => {
        const toolLabel = m.toolUsed ? ` [TOOL: ${m.toolUsed.toUpperCase()}]` : '';
        return `[${m.timestamp}] ${m.sender}${toolLabel}:\n${m.text}`;
      })
      .join('\n\n----------------------------------------------------\n\n');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    triggerDownload(
      header + body,
      `ultron_chat_transcript_${timestamp}.txt`,
      'text/plain'
    );
    setIsExportMenuOpen(false);
    setExportFeedback('TXT EXPORTED!');
    setTimeout(() => setExportFeedback(null), 2500);
  };

  const handleSaveMemory = () => {
    saveUserMemoryDirectives(editingRequirements, customDirectives);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  const handleAddDirectiveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim() || !newPrompt.trim()) return;
    addCustomDirective({ label: newLabel, prompt: newPrompt });
    setNewLabel('');
    setNewPrompt('');
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  return (
    <AnimatePresence>
      {isChatOpen && (
        <motion.div
          id="ultron-chat-page"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex flex-col bg-[#030712]/95 backdrop-blur-2xl text-slate-100 font-mono select-none overflow-hidden"
          style={{
            backgroundImage: `
              radial-gradient(circle at 50% 10%, ${colors.ambient} 0%, transparent 60%),
              linear-gradient(to bottom, #030712 0%, #050b18 50%, #030712 100%)
            `,
          }}
        >
          {/* Cybernetic Background Grid Overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-15"
            style={{
              backgroundImage: `
                linear-gradient(to right, ${colors.border} 1px, transparent 1px),
                linear-gradient(to bottom, ${colors.border} 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
            }}
          />

          {/* CHAT PAGE HEADER */}
          <header
            id="chat-page-header"
            className="relative z-10 flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-1.5 border-b border-slate-900 bg-slate-950/80 backdrop-blur-xl shadow-xl"
          >
            {/* Title and Persona status */}
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center border text-sm shadow-md"
                style={{
                  borderColor: colors.border,
                  backgroundColor: colors.bgAccent,
                  boxShadow: `0 0 12px ${colors.glow}`,
                }}
              >
                <span>🤖</span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xs sm:text-sm font-black tracking-wider text-white">
                    {personality.ULTRON_NAME} CHAT MATRIX
                  </h2>
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.2 rounded-full border"
                    style={{
                      borderColor: colors.border,
                      color: colors.text,
                      backgroundColor: colors.bgAccent,
                    }}
                  >
                    ● DYNAMIC RGB MATRIX
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[9px] text-slate-400">
                  <span className="text-emerald-400 font-bold">💾 CHAT SAVED PERMANENTLY</span>
                  <span>•</span>
                  <span>{messages.length} Messages</span>
                  <span>•</span>
                  <span className="text-cyan-300 font-semibold">🧠 Memory Directives Active</span>
                </div>
              </div>
            </div>

            {/* Header Control Buttons */}
            <div className="flex items-center gap-2">
              {/* Export Session Menu Button */}
              <div className="relative">
                <button
                  id="btn-chat-export-session"
                  type="button"
                  onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    exportFeedback
                      ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                      : isExportMenuOpen
                      ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white hover:border-cyan-500'
                  }`}
                  title="Export chat history as JSON or Text file"
                >
                  <span>📥</span>
                  <span className="hidden sm:inline">
                    {exportFeedback || 'EXPORT'}
                  </span>
                  <span className="text-[10px] text-slate-400">▼</span>
                </button>

                {/* Export Format Dropdown Menu */}
                <AnimatePresence>
                  {isExportMenuOpen && (
                    <motion.div
                      id="export-dropdown-menu"
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-52 rounded-xl border border-cyan-500/40 bg-slate-950/95 backdrop-blur-2xl p-2 shadow-2xl z-50 space-y-1 font-mono text-xs"
                    >
                      <div className="px-2 py-1 border-b border-slate-900 text-[10px] font-bold text-slate-400 flex items-center justify-between">
                        <span>SELECT FORMAT</span>
                        <span className="text-cyan-400">{messages.length} MSGS</span>
                      </div>

                      <button
                        id="btn-export-json"
                        type="button"
                        onClick={handleExportJSON}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900/90 hover:bg-cyan-950/80 hover:border-cyan-500/60 border border-slate-800 text-slate-200 hover:text-cyan-300 transition-all cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">💾</span>
                          <div>
                            <div className="font-bold text-xs">JSON DATA</div>
                            <div className="text-[9px] text-slate-400">Full structured object</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">.json</span>
                      </button>

                      <button
                        id="btn-export-txt"
                        type="button"
                        onClick={handleExportText}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900/90 hover:bg-cyan-950/80 hover:border-cyan-500/60 border border-slate-800 text-slate-200 hover:text-cyan-300 transition-all cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">📄</span>
                          <div>
                            <div className="font-bold text-xs">TEXT TRANSCRIPT</div>
                            <div className="text-[9px] text-slate-400">Human-readable log</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">.txt</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                id="btn-chat-copy-transcript"
                type="button"
                onClick={handleCopyTranscript}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
                title="Copy entire conversation to clipboard"
              >
                <span>{copyFeedback ? '✓' : '📋'}</span>
                <span className="hidden sm:inline">
                  {copyFeedback ? 'COPIED!' : 'COPY LOG'}
                </span>
              </button>

              <button
                id="btn-chat-clear-history"
                type="button"
                onClick={() => {
                  if (window.confirm('Clear all conversation history from permanent storage?')) {
                    clearConsole();
                  }
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-red-950/60 text-slate-400 hover:text-red-300 hover:border-red-800 text-xs font-bold transition-all cursor-pointer"
                title="Clear saved chat history"
              >
                <span>🗑️</span>
                <span className="hidden sm:inline">CLEAR</span>
              </button>

              <button
                id="btn-close-chat-page"
                type="button"
                onClick={() => setIsChatOpen(false)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-lg"
                style={{
                  borderColor: colors.border,
                  backgroundColor: colors.bgAccent,
                  color: colors.text,
                }}
                title="Return to Core Matrix View (Esc)"
              >
                <span>✕</span>
                <span>RETURN TO MATRIX</span>
              </button>
            </div>
          </header>

          {/* TELEMETRY SUB-BAR */}
          <div className="relative z-10 px-4 sm:px-8 py-1.5 bg-slate-950/40 border-b border-slate-900/60 flex items-center justify-between text-[10px] text-slate-500">
            <div className="flex items-center gap-3">
              <span>CPU: {diagnostics?.cpuLoad || '12%'}</span>
              <span>•</span>
              <span>MEMORY: {diagnostics?.memoryUsage || '42%'}</span>
              <span>•</span>
              <span>LATENCY: {diagnostics?.latency || '4ms'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-cyan-400 font-semibold">
                Requirements Grounded in AI System Prompt
              </span>
              <span>•</span>
              <span>Press Esc to exit</span>
            </div>
          </div>

          {/* UPDATABLE USER DIRECTIVES & MEMORY DRAWER / PANEL */}
          <AnimatePresence>
            {isDirectivesPanelOpen && (
              <motion.div
                id="user-directives-panel"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="relative z-20 border-b border-cyan-500/30 bg-slate-950/95 backdrop-blur-3xl px-4 sm:px-8 py-5 shadow-2xl overflow-hidden"
              >
                <div className="max-w-5xl mx-auto space-y-4">
                  {/* Panel Header & Toast Notice */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🧠</span>
                      <h3 className="text-sm font-black text-cyan-300 tracking-wider">
                        UPDATABLE USER REQUIREMENTS & MEMORY DIRECTIVES
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                        PERSISTENT IN GEMINI CONTEXT
                      </span>
                    </div>

                    {saveToast && (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 animate-bounce">
                        <span>✓</span> MEMORY & DIRECTIVES SAVED!
                      </span>
                    )}
                  </div>

                  {/* Top Textarea: Primary Requirements Memory */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                      <span>📌</span>
                      <span>GLOBAL USER REQUIREMENTS & SYSTEM CONTEXT:</span>
                    </label>
                    <textarea
                      id="input-user-requirements"
                      value={editingRequirements}
                      onChange={(e) => setEditingRequirements(e.target.value)}
                      rows={3}
                      placeholder="Specify your exact requirements, coding preferences, project goals, or domain context here..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 leading-relaxed font-mono"
                    />
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>
                        This memory block is automatically appended to Ultron's system prompt on every query.
                      </span>
                      <button
                        id="btn-save-memory-requirements"
                        type="button"
                        onClick={handleSaveMemory}
                        className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all cursor-pointer shadow-md flex items-center gap-1"
                      >
                        <span>💾</span> SAVE MEMORY REQUIREMENTS
                      </button>
                    </div>
                  </div>

                  {/* Bottom Section: Custom Quick Directive Chips Manager */}
                  <div className="border-t border-slate-900 pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <span>⚡</span>
                        <span>CUSTOM QUICK DIRECTIVE CHIPS ({customDirectives.length}):</span>
                      </h4>
                    </div>

                    {/* Chips grid */}
                    <div className="flex flex-wrap gap-2">
                      {customDirectives.map((d) => (
                        <div
                          key={d.id}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/90 text-xs text-slate-200 group hover:border-cyan-500/60 transition-all"
                        >
                          <span className="font-bold text-cyan-400">⚡ {d.label}</span>
                          <span className="text-[10px] text-slate-500 max-w-[200px] truncate" title={d.prompt}>
                            "{d.prompt}"
                          </span>
                          <button
                            type="button"
                            onClick={() => removeCustomDirective(d.id)}
                            className="text-slate-500 hover:text-red-400 font-bold px-1 transition-colors cursor-pointer"
                            title="Delete custom directive"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add New Directive Form */}
                    <form onSubmit={handleAddDirectiveSubmit} className="flex flex-wrap items-center gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      <input
                        type="text"
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        placeholder="Directive Label (e.g. Cyber Audit)"
                        className="flex-1 min-w-[140px] bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                      />
                      <input
                        type="text"
                        value={newPrompt}
                        onChange={(e) => setNewPrompt(e.target.value)}
                        placeholder="Prompt text (e.g. Scan codebase for vulnerability exposure)"
                        className="flex-[2] min-w-[220px] bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                      />
                      <button
                        type="submit"
                        disabled={!newLabel.trim() || !newPrompt.trim()}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          newLabel.trim() && newPrompt.trim()
                            ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <span>➕</span> ADD DIRECTIVE
                      </button>
                    </form>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* SCROLLABLE MESSAGE STREAM */}
          <div
            id="chat-messages-scroll-container"
            className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-4 max-w-5xl mx-auto w-full scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"
          >
            {/* Storage Info Banner */}
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-2 px-4 py-1 rounded-full border border-slate-800/80 bg-slate-950/70 text-[10px] text-slate-400 shadow-md">
                <span className="text-emerald-400">●</span>
                <span>All conversation records & directives are permanently saved in your browser storage.</span>
              </div>
            </div>

            {/* Messages List */}
            {messages.map((msg) => {
              const isUser = msg.sender === 'USER';
              const isSystem = msg.sender === 'SYSTEM';

              if (isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center my-2">
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl border border-slate-800/80 bg-slate-900/60 text-slate-300 text-xs shadow-md">
                      <span className="text-cyan-400">⚡</span>
                      <span>{msg.text}</span>
                    </div>
                  </div>
                );
              }

              if (isUser) {
                return (
                  <div key={msg.id} className="flex flex-col items-end pl-12 sm:pl-24">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-1 pr-1">
                      <span className="font-bold text-slate-300">YOU</span>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                    </div>
                    <div className="px-4 py-2.5 rounded-2xl rounded-tr-xs bg-slate-800/90 border border-slate-700/90 text-slate-100 text-sm shadow-xl leading-relaxed select-text w-full max-w-3xl">
                      <FormattedMessage text={msg.text} />
                    </div>
                  </div>
                );
              }

              // Ultron Message
              return (
                <div key={msg.id} className="flex flex-col items-start pr-12 sm:pr-24 w-full">
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-1 pl-1">
                    <span className="font-black tracking-wider text-xs" style={{ color: colors.text }}>
                      🤖 {personality.ULTRON_NAME}
                    </span>
                    {msg.toolUsed && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold border border-cyan-800 bg-cyan-950/80 text-cyan-300 shadow-sm">
                        ⚡ TOOL: {msg.toolUsed.toUpperCase()}
                      </span>
                    )}
                    {msg.pipeline?.guardian && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold border border-emerald-800/60 bg-emerald-950/60 text-emerald-300">
                        🛡️ {msg.pipeline.guardian.status}
                      </span>
                    )}
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-500">{msg.timestamp}</span>
                  </div>

                  <div
                    className="px-5 py-3.5 rounded-2xl rounded-tl-xs border text-sm leading-relaxed text-slate-200 shadow-2xl backdrop-blur-md select-text w-full max-w-3xl"
                    style={{
                      borderColor: colors.border,
                      backgroundColor: 'rgba(15, 23, 42, 0.92)',
                      boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 16px ${colors.ambient}`,
                    }}
                  >
                    <FormattedMessage text={msg.text} />

                    {/* Telemetry Footer if available */}
                    {msg.telemetry && (
                      <div className="mt-3 pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-3 text-[9px] text-slate-400">
                        <span>MODEL: {msg.telemetry.engine || 'Gemini 3.7'}</span>
                        <span>•</span>
                        <span>LATENCY: {msg.telemetry.responseTime || '120ms'}</span>
                        <span>•</span>
                        <span>TOKENS: {msg.telemetry.tokens || 'N/A'}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Thinking / Cognitive Processing Indicator */}
            {status === 'THINKING' && (
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl border border-cyan-500/50 bg-cyan-950/50 text-cyan-300 text-xs w-fit animate-pulse shadow-lg">
                <span className="animate-spin text-sm">⚙️</span>
                <span className="font-bold tracking-wider">
                  COGNITIVE MATRIX EVALUATING INTENT & LOGIC BOUNDS...
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* CHAT INPUT AREA AT BOTTOM */}
          <footer
            id="chat-page-footer"
            className="relative z-10 p-4 sm:p-6 border-t border-slate-900 bg-slate-950/95 backdrop-blur-2xl shadow-2xl"
          >
            <div className="max-w-5xl mx-auto w-full space-y-3">
              {/* Dynamic Suggested Directive Chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-[10px] text-slate-500 font-bold shrink-0">DIRECTIVES:</span>
                {customDirectives.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setInputVal(item.prompt);
                      inputRef.current?.focus();
                    }}
                    className="px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 hover:border-cyan-500/60 text-slate-300 hover:text-white text-[10px] font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 flex items-center gap-1"
                    title={item.prompt}
                  >
                    <span>⚡</span> {item.label}
                  </button>
                ))}

                <button
                  id="btn-quick-manage-directives"
                  type="button"
                  onClick={() => setIsDirectivesPanelOpen(!isDirectivesPanelOpen)}
                  className="px-2 py-1 rounded-lg border border-cyan-800/80 bg-cyan-950/60 hover:bg-cyan-900 text-cyan-300 text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 flex items-center gap-1"
                >
                  <span>⚙️</span> MANAGE
                </button>
              </div>

              {/* Textarea Input Form */}
              <form onSubmit={handleSubmit} className="flex items-end gap-3">
                <div
                  className="flex-1 rounded-2xl border bg-slate-900/90 p-2 shadow-inner transition-all"
                  style={{
                    borderColor: inputVal.trim() ? colors.primary : 'rgba(51, 65, 85, 0.8)',
                    boxShadow: inputVal.trim() ? `0 0 16px ${colors.glow}` : undefined,
                  }}
                >
                  <textarea
                    ref={inputRef}
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={2}
                    placeholder="Issue your directive to Ultron (Press Enter to transmit, Shift+Enter for new line)..."
                    className="w-full bg-transparent text-slate-100 text-xs sm:text-sm font-mono placeholder:text-slate-500 focus:outline-none resize-none px-2 py-1 leading-relaxed"
                  />
                </div>

                {/* Transmit Action Button */}
                <button
                  id="btn-chat-transmit"
                  type="submit"
                  disabled={!inputVal.trim() || status === 'THINKING'}
                  className={`h-12 px-5 sm:px-6 rounded-2xl font-black text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 border transition-all cursor-pointer shrink-0 shadow-xl ${
                    inputVal.trim() && status !== 'THINKING'
                      ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.5)]'
                      : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                  }`}
                >
                  <span>TRANSMIT</span>
                  <span>⚡</span>
                </button>
              </form>

              {/* Bottom Security & Persistence Status Footer */}
              <div className="flex items-center justify-between text-[9px] text-slate-500 px-1">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">🛡️ GUARDIAN LEVEL 4 ARMED</span>
                  <span>•</span>
                  <span>Directives Grounded in Memory</span>
                </div>
                <div>
                  <span>Persistent Conversation Matrix</span>
                </div>
              </div>
            </div>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
