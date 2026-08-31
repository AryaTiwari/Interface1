import React, { useEffect, useMemo, useState } from 'react';

type ActivityEvent = {
  type?: string;
  state?: string;
  label?: string;
  text?: string;
  tool?: string;
  toolCalls?: any[];
  toolResults?: any[];
  error?: string;
  durationMs?: number;
  partial?: boolean;
  at?: number;
};

const LABELS: Record<string, string> = {
  thinking: 'THINKING', planning: 'PLANNING', researching: 'RESEARCHING',
  inspecting: 'INSPECTING', executing: 'EXECUTING', synthesizing: 'SYNTHESIZING',
  responding: 'RESPONDING', speaking: 'SPEAKING', complete: 'COMPLETE', error: 'ERROR',
};
const ICONS: Record<string, string> = {
  thinking: '◌', planning: '◌', researching: '⌁', inspecting: '⌕', executing: '⚙',
  synthesizing: '◇', responding: '→', speaking: '◉', complete: '✓', error: '!',
};
function stateOf(event: ActivityEvent) {
  const raw = String(event.state || event.type || '').toLowerCase();
  if (raw === 'meta') return 'researching';
  if (raw === 'tool') return 'executing';
  if (raw === 'delta') return 'responding';
  if (raw === 'final') return 'synthesizing';
  return LABELS[raw] ? raw : 'thinking';
}
function formatDuration(ms: number) { return `${(Math.max(0, ms) / 1000).toFixed(1)}s`; }

export const AgentActivity: React.FC = () => {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [active, setActive] = useState<ActivityEvent | null>(null);
  const [liveText, setLiveText] = useState('');
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = ((event as CustomEvent<ActivityEvent>).detail || {});
      const normalized = { ...detail, state: stateOf(detail), at: detail.at || Date.now() };
      const nextState = normalized.state;
      if (nextState === 'thinking') setLiveText('');
      if (nextState === 'responding' && detail.text) setLiveText((prev) => `${prev}${detail.text}`);
      if (nextState === 'complete' || nextState === 'error') {
        setActive(normalized);
        setEvents((prev) => [...prev, normalized].slice(-10));
        if (normalized.durationMs != null) setElapsed(normalized.durationMs);
        setStartedAt(null);
      } else {
        setStartedAt((prev) => prev ?? Date.now());
        setActive(normalized);
        setEvents((prev) => [...prev, normalized].slice(-10));
      }
    };
    window.addEventListener('ultron:activity', handler);
    return () => window.removeEventListener('ultron:activity', handler);
  }, []);

  useEffect(() => {
    if (!startedAt || !active) return;
    const timer = window.setInterval(() => setElapsed(Date.now() - startedAt), 100);
    return () => window.clearInterval(timer);
  }, [startedAt, active]);

  const state = active ? stateOf(active) : stateOf(events[events.length - 1] || { state: 'complete' });
  const live = Boolean(active && !['complete', 'error'].includes(state));
  const recent = useMemo(() => events.slice(-5), [events]);

  return <div className="fixed right-5 top-20 z-[70] w-[min(390px,calc(100vw-2rem))] pointer-events-none font-mono">
    <div className="rounded-2xl border border-cyan-500/20 bg-slate-950/88 backdrop-blur-xl shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-900">
        <div className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${live ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'}`} /><span className="text-[9px] font-black tracking-[0.2em] text-slate-300">LIVE ACTIVITY</span></div>
        <span className={`text-[9px] font-bold tracking-widest ${state === 'error' ? 'text-red-300' : state === 'complete' ? 'text-emerald-300' : 'text-cyan-300'}`}>{LABELS[state]}</span>
      </div>
      <div className="px-4 py-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg border border-cyan-500/20 bg-cyan-950/20 flex items-center justify-center text-cyan-300">{ICONS[state] || '◉'}</div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold text-white tracking-wide">{active?.label || (state === 'responding' ? 'Live response' : active?.error || (state === 'complete' ? 'Task complete.' : 'Standing by.'))}</div>
            {active?.tool && <div className="mt-1 text-[9px] text-cyan-300 break-all">{active.tool}</div>}
            {active?.error && <div className="mt-1 text-[9px] text-red-300">{active.error}</div>}
            {state === 'responding' && liveText && <div className="mt-2 max-h-28 overflow-hidden text-[10px] leading-relaxed text-slate-300/90 whitespace-pre-wrap">{liveText}<span className="inline-block ml-1 w-1.5 h-3 bg-cyan-400/80 animate-pulse" /></div>}
            <div className="mt-2 flex items-center gap-3 text-[8px] tracking-[0.14em] text-slate-500"><span>{formatDuration(elapsed)}</span>{active?.toolCalls?.length ? <span>{active.toolCalls.length} TOOL{active.toolCalls.length === 1 ? '' : 'S'}</span> : null}{active?.partial ? <span>PARTIAL</span> : null}</div>
          </div>
        </div>
        {recent.length > 1 && <div className="mt-3 pt-3 border-t border-slate-900 space-y-1.5">{recent.slice(0, -1).reverse().map((item, index) => { const itemState = stateOf(item); return <div key={`${item.at}-${index}`} className="flex items-center gap-2 text-[8px] tracking-wider text-slate-500"><span>{ICONS[itemState] || '•'}</span><span>{LABELS[itemState] || itemState}</span>{item.tool && <span className="truncate text-slate-600">{item.tool}</span>}</div>; })}</div>}
      </div>
    </div>
  </div>;
};
