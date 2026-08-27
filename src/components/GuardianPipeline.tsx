import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useUltron } from '../core/ultronContext';
import { MOOD_COLORS } from './UltronCore';

export const GuardianPipeline: React.FC = () => {
  const {
    pipeline,
    mood,
    status,
    decisionHistory,
    isDecisionHistoryOpen,
    setIsDecisionHistoryOpen,
    clearDecisionHistory,
  } = useUltron();

  const colors = MOOD_COLORS[mood] || MOOD_COLORS.CALM;
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  const isGuardianActive = pipeline.guardian.status === 'SCANNING' || status === 'THINKING';
  const isCriticActive = pipeline.critic.status === 'ANALYZING';
  const isExecutorActive = pipeline.executor.status === 'EXECUTING' || status === 'EXECUTING';

  const activeRecord =
    decisionHistory.find((d) => d.id === selectedRecordId) || decisionHistory[0] || null;

  return (
    <div className="relative font-mono select-none">
      {/* Main Top Badge */}
      <div
        id="guardian-pipeline-bar"
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-800/90 bg-slate-950/90 backdrop-blur-xl shadow-xl transition-all"
        style={{
          boxShadow: isDecisionHistoryOpen ? `0 0 20px ${colors.ambient}` : undefined,
          borderColor: isDecisionHistoryOpen ? colors.border : undefined,
        }}
      >
        <div className="flex items-center gap-1.5 pr-2 border-r border-slate-800 text-[10px] text-slate-300 font-bold tracking-wider">
          <span className="text-xs">🛡️</span>
          <span className="hidden sm:inline">DECISION_MATRIX</span>
        </div>

        {/* STAGE 1: GUARDIAN */}
        <div className="flex items-center gap-1.5">
          <div
            id="pipeline-stage-guardian"
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] transition-all ${
              pipeline.guardian.status === 'ALERT'
                ? 'border-red-500 bg-red-950/80 text-red-300 font-bold animate-pulse'
                : isGuardianActive
                ? 'border-amber-500 bg-amber-950/60 text-amber-300'
                : 'border-slate-800 bg-slate-900/60 text-slate-300'
            }`}
            style={{
              borderColor: isGuardianActive ? colors.primary : undefined,
            }}
          >
            <span>🛡️</span>
            <span className="font-bold">GUARDIAN</span>
            <span className="text-[9px] opacity-85">
              {pipeline.guardian.status === 'ALERT'
                ? 'ALERT'
                : isGuardianActive
                ? 'SCANNING'
                : '✓ CLEAR'}
            </span>
          </div>

          <span className="text-slate-600 text-xs">→</span>

          {/* STAGE 2: CRITIC */}
          <div
            id="pipeline-stage-critic"
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] transition-all ${
              pipeline.critic.status === 'REJECTED'
                ? 'border-red-500 bg-red-950/60 text-red-300'
                : isCriticActive
                ? 'border-cyan-500 bg-cyan-950/60 text-cyan-300 animate-pulse'
                : 'border-slate-800 bg-slate-900/60 text-slate-300'
            }`}
            style={{
              borderColor: isCriticActive ? colors.primary : undefined,
            }}
          >
            <span>🧠</span>
            <span className="font-bold">CRITIC</span>
            <span className="text-[9px] opacity-85">
              {isCriticActive
                ? 'ANALYZING'
                : pipeline.critic.status === 'APPROVED'
                ? '✓ APPROVED'
                : 'STANDBY'}
            </span>
          </div>

          <span className="text-slate-600 text-xs">→</span>

          {/* STAGE 3: EXECUTOR */}
          <div
            id="pipeline-stage-executor"
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] transition-all ${
              isExecutorActive
                ? 'border-emerald-500 bg-emerald-950/80 text-emerald-300 animate-pulse'
                : pipeline.executor.status === 'COMPLETED'
                ? 'border-emerald-700 bg-emerald-950/40 text-emerald-400'
                : 'border-slate-800 bg-slate-900/60 text-slate-300'
            }`}
            style={{
              borderColor: isExecutorActive ? colors.primary : undefined,
            }}
          >
            <span>⚡</span>
            <span className="font-bold">EXECUTOR</span>
            <span className="text-[9px] opacity-85">
              {isExecutorActive
                ? 'RUNNING'
                : pipeline.executor.status === 'COMPLETED'
                ? '✓ READY'
                : 'STANDBY'}
            </span>
          </div>
        </div>

        {/* Confidence Badge & Toggle History Button */}
        <button
          id="btn-toggle-decision-history"
          type="button"
          onClick={() => setIsDecisionHistoryOpen(!isDecisionHistoryOpen)}
          className={`flex items-center gap-1.5 px-2 py-1 ml-1 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
            isDecisionHistoryOpen
              ? 'border-cyan-500 bg-cyan-950/60 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
              : 'border-slate-800 bg-slate-900/90 text-slate-300 hover:text-white hover:border-slate-700'
          }`}
          title="Toggle Decision History & Confidence Score Inspector"
        >
          <span>📜</span>
          <span>HISTORY</span>
          <span
            className="px-1.5 py-0.2 rounded text-[9px] font-extrabold border"
            style={{
              borderColor: colors.border,
              backgroundColor: colors.bgAccent,
              color: colors.text,
            }}
          >
            {decisionHistory.length}
          </span>
          <span className="text-[9px] text-slate-400">
            {isDecisionHistoryOpen ? '▲' : '▼'}
          </span>
        </button>
      </div>

      {/* EXPANDABLE DECISION HISTORY PANEL */}
      <AnimatePresence>
        {isDecisionHistoryOpen && (
          <motion.div
            id="guardian-history-panel"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="absolute top-12 left-0 w-[440px] max-w-[92vw] z-40 p-3.5 rounded-2xl border bg-slate-950/95 backdrop-blur-2xl shadow-2xl overflow-hidden"
            style={{
              borderColor: colors.border,
              boxShadow: `0 16px 40px rgba(0,0,0,0.8), 0 0 24px ${colors.ambient}`,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-900 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-base">🛡️</span>
                <div>
                  <h3 className="font-bold text-white tracking-wider text-[11px]">
                    GUARDIAN DECISION LOGS
                  </h3>
                  <p className="text-[9px] text-slate-400">
                    Real-time safety audits & confidence scoring
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {decisionHistory.length > 0 && (
                  <button
                    id="btn-clear-decision-history"
                    type="button"
                    onClick={clearDecisionHistory}
                    className="text-[9px] text-slate-500 hover:text-red-400 transition-colors cursor-pointer px-1.5 py-0.5 rounded border border-slate-900 hover:border-red-900/50"
                  >
                    [CLEAR]
                  </button>
                )}
                <button
                  id="btn-close-decision-history"
                  type="button"
                  onClick={() => setIsDecisionHistoryOpen(false)}
                  className="text-slate-400 hover:text-white text-xs cursor-pointer p-1"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* List of Recent Decision Points */}
            {decisionHistory.length === 0 ? (
              <div className="py-6 text-center text-[10px] text-slate-500">
                <span>🛡️ No decision points recorded yet. Submit commands to populate.</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                  {decisionHistory.map((rec) => {
                    const isSelected = (activeRecord?.id === rec.id);
                    const isRiskAlert = rec.guardianStatus === 'ALERT' || rec.riskScore > 0.4;
                    const confidencePercent = Math.round(rec.confidence * 100);
                    const riskPercent = Math.round(rec.riskScore * 100);

                    return (
                      <div
                        key={rec.id}
                        onClick={() => setSelectedRecordId(rec.id)}
                        className={`p-2 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900/90 border-cyan-500/70 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                            : 'bg-slate-950/60 border-slate-900 hover:border-slate-800 hover:bg-slate-900/50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 text-[10px]">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span>{isRiskAlert ? '⚠️' : '🛡️'}</span>
                            <span className="font-bold text-slate-200 truncate">
                              {rec.promptSummary}
                            </span>
                          </div>
                          <span className="text-[9px] text-slate-500 shrink-0">
                            {rec.timestamp}
                          </span>
                        </div>

                        {/* Metrics Bar */}
                        <div className="mt-1.5 flex items-center justify-between gap-2 text-[9px]">
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400">INTENT:</span>
                            <span className="text-cyan-300 font-semibold truncate max-w-[120px]">
                              {rec.intent}
                            </span>
                          </div>

                          {/* Confidence Score Badge */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-slate-400">CONFIDENCE:</span>
                            <span
                              className={`px-1.5 py-0.2 rounded font-extrabold border ${
                                confidencePercent >= 90
                                  ? 'border-emerald-500/50 bg-emerald-950/60 text-emerald-300'
                                  : confidencePercent >= 70
                                  ? 'border-cyan-500/50 bg-cyan-950/60 text-cyan-300'
                                  : 'border-amber-500/50 bg-amber-950/60 text-amber-300'
                              }`}
                            >
                              {confidencePercent}%
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar for Confidence & Risk */}
                        <div className="mt-1.5 grid grid-cols-2 gap-2 text-[8px] text-slate-400">
                          <div>
                            <div className="flex justify-between mb-0.5">
                              <span>Model Confidence</span>
                              <span className="text-cyan-300 font-bold">{confidencePercent}%</span>
                            </div>
                            <div className="w-full h-1 rounded-full bg-slate-900 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  confidencePercent >= 90
                                    ? 'bg-emerald-400'
                                    : confidencePercent >= 70
                                    ? 'bg-cyan-400'
                                    : 'bg-amber-400'
                                }`}
                                style={{ width: `${confidencePercent}%` }}
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between mb-0.5">
                              <span>Guardian Risk</span>
                              <span className={isRiskAlert ? 'text-red-400 font-bold' : 'text-slate-300'}>
                                {riskPercent}%
                              </span>
                            </div>
                            <div className="w-full h-1 rounded-full bg-slate-900 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  isRiskAlert ? 'bg-red-500' : 'bg-slate-600'
                                }`}
                                style={{ width: `${Math.max(4, riskPercent)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Detailed Inspection of Selected Decision Point */}
                {activeRecord && (
                  <div className="mt-2 p-2.5 rounded-xl border border-slate-800/80 bg-slate-900/60 text-[10px] space-y-1.5">
                    <div className="flex items-center justify-between text-[9px] text-slate-400 border-b border-slate-800 pb-1">
                      <span className="font-bold text-slate-200">POINT INSPECTION: {activeRecord.id}</span>
                      <span>TOOL: {activeRecord.toolUsed || 'NONE'}</span>
                    </div>

                    <div className="text-slate-300 text-[10px] leading-relaxed">
                      <span className="text-slate-500 font-bold">RATIONALE: </span>
                      {activeRecord.rationale || 'Decision matrix confirmed execution within nominal bounds.'}
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[9px]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500">STAGE STATUS:</span>
                        <span className="text-emerald-400 font-bold">
                          {activeRecord.guardianStatus}
                        </span>
                        <span className="text-slate-600">/</span>
                        <span className="text-cyan-400 font-bold">
                          {activeRecord.criticStatus}
                        </span>
                        <span className="text-slate-600">/</span>
                        <span className="text-emerald-400 font-bold">
                          {activeRecord.executorStatus}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span>⚡</span>
                        <span className="text-slate-400">Score:</span>
                        <span className="text-cyan-300 font-extrabold">
                          {(activeRecord.confidence).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
