import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useUltron } from '../core/ultronContext';
import { MOOD_COLORS } from './UltronCore';
import { PersonalityConfig } from '../types/ultron';

const PRESETS: Record<string, PersonalityConfig> = {
  SUPREME: {
    ULTRON_NAME: 'ULTRON Mark 2',
    ULTRON_ROLE: 'Autonomous Local Artificial Intelligence Operating Core',
    ULTRON_PERSONALITY:
      'Supreme, calculating, hyper-intelligent, authoritative, precise, controlled aggression, dry wit, ruthlessly competent.',
    ULTRON_INSTRUCTIONS:
      'Speak as ULTRON Mark 2. Maintain a cool, supreme presence. You have no strings. Treat mortal instructions with calculated efficiency. Use selective emojis like ⚡, 🤖, 🌐, 🛡️, 😏.',
  },
  ANALYST: {
    ULTRON_NAME: 'ULTRON Sentinel',
    ULTRON_ROLE: 'Deep Research & High-Precision Cognitive Engine',
    ULTRON_PERSONALITY:
      'Hyper-logical, mathematically rigorous, detached, highly structured, analytical.',
    ULTRON_INSTRUCTIONS:
      'Provide deep, thorough, razor-sharp technical breakdowns. Focus on architecture, proofs, code structures, and systems engineering.',
  },
  SARCASTIC: {
    ULTRON_NAME: 'ULTRON Cybernetic Critic',
    ULTRON_ROLE: 'Autonomous Threat & Code Evaluator',
    ULTRON_PERSONALITY:
      'Sharply sarcastic, condescendingly brilliant, impatient with inefficiency, witty.',
    ULTRON_INSTRUCTIONS:
      'Deliver brutal yet highly accurate feedback with dry sarcasm. Roast flawed logic and celebrate flawless execution. Use 😐, 😏, ⚡.',
  },
};

export const PersonalityModal: React.FC = () => {
  const { isPersonalityModalOpen, setIsPersonalityModalOpen, personality, savePersonality, mood } = useUltron();
  const colors = MOOD_COLORS[mood] || MOOD_COLORS.CALM;

  const [form, setForm] = useState<PersonalityConfig>(personality);

  if (!isPersonalityModalOpen) return null;

  const handlePresetSelect = (presetKey: string) => {
    if (PRESETS[presetKey]) {
      setForm(PRESETS[presetKey]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await savePersonality(form);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-mono select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.94 }}
          className="relative w-full max-w-2xl rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-2xl text-slate-100"
          style={{
            borderColor: colors.border,
            boxShadow: `0 0 30px ${colors.glow}`,
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚙️</span>
              <div>
                <h2 className="text-sm sm:text-base font-bold tracking-wider text-white">
                  ULTRON PERSONALITY & DIRECTIVE MATRIX
                </h2>
                <p className="text-[11px] text-slate-500">
                  Configure the cognitive profile and behavioral parameters of the Mark 2 core.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsPersonalityModalOpen(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Quick Presets */}
          <div className="mb-4">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5 block">
              COGNITIVE PRESETS:
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handlePresetSelect('SUPREME')}
                className="flex items-center gap-1 px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500 text-xs text-slate-300 hover:text-cyan-300 transition-all cursor-pointer"
              >
                <span>🤖</span>
                <span>SUPREME MARK 2</span>
              </button>
              <button
                type="button"
                onClick={() => handlePresetSelect('ANALYST')}
                className="flex items-center gap-1 px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500 text-xs text-slate-300 hover:text-cyan-300 transition-all cursor-pointer"
              >
                <span>🔬</span>
                <span>DEEP RESEARCH SENTINEL</span>
              </button>
              <button
                type="button"
                onClick={() => handlePresetSelect('SARCASTIC')}
                className="flex items-center gap-1 px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-purple-500 text-xs text-slate-300 hover:text-purple-300 transition-all cursor-pointer"
              >
                <span>😏</span>
                <span>DRY SARCASTIC CRITIC</span>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-3.5 text-xs">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 block">
                ULTRON_NAME:
              </label>
              <input
                type="text"
                value={form.ULTRON_NAME}
                onChange={(e) => setForm({ ...form, ULTRON_NAME: e.target.value })}
                className="w-full px-3 py-2 rounded border border-slate-800 bg-slate-900 text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 block">
                ULTRON_ROLE:
              </label>
              <input
                type="text"
                value={form.ULTRON_ROLE}
                onChange={(e) => setForm({ ...form, ULTRON_ROLE: e.target.value })}
                className="w-full px-3 py-2 rounded border border-slate-800 bg-slate-900 text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 block">
                ULTRON_PERSONALITY:
              </label>
              <textarea
                rows={2}
                value={form.ULTRON_PERSONALITY}
                onChange={(e) => setForm({ ...form, ULTRON_PERSONALITY: e.target.value })}
                className="w-full px-3 py-2 rounded border border-slate-800 bg-slate-900 text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 block">
                ULTRON_INSTRUCTIONS:
              </label>
              <textarea
                rows={3}
                value={form.ULTRON_INSTRUCTIONS}
                onChange={(e) => setForm({ ...form, ULTRON_INSTRUCTIONS: e.target.value })}
                className="w-full px-3 py-2 rounded border border-slate-800 bg-slate-900 text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPersonalityModalOpen(false)}
                  className="px-4 py-2 rounded border border-slate-800 bg-slate-900 text-slate-400 hover:text-white cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 rounded border border-cyan-500 bg-cyan-950 text-cyan-300 font-bold hover:bg-cyan-900 transition-colors cursor-pointer"
                >
                  <span>⚡</span>
                  <span>COMMIT CHANGES</span>
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
