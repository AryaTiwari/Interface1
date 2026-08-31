import React, { useEffect, useState } from 'react';

type ActivityEvent = {
  type?: string;
  state?: string;
  label?: string;
  text?: string;
  error?: string;
};

export const StreamingResponseOverlay: React.FC = () => {
  const [text, setText] = useState('');
  const [live, setLive] = useState(false);

  useEffect(() => {
    const handler = (customEvent: Event) => {
      const event = (customEvent as CustomEvent<ActivityEvent>).detail || {};
      const state = String(event.state || event.type || '').toLowerCase();

      if (state === 'responding' && event.text) {
        setLive(true);
        setText((prev) => `${prev}${event.text || ''}`);
      } else if (state === 'thinking' || state === 'planning' || state === 'researching' || state === 'executing' || state === 'synthesizing') {
        if (!live) setText('');
      } else if (state === 'speaking') {
        setLive(false);
      } else if (state === 'complete' || state === 'error') {
        setLive(false);
        if (state === 'error') setText('');
      }
    };

    window.addEventListener('ultron:activity', handler);
    return () => window.removeEventListener('ultron:activity', handler);
  }, [live]);

  if (!live || !text.trim()) return null;

  return (
    <div className="fixed left-5 bottom-24 z-[65] w-[min(520px,calc(100vw-2rem))] pointer-events-none font-mono">
      <div className="rounded-2xl border border-cyan-500/20 bg-slate-950/75 backdrop-blur-xl shadow-2xl px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[9px] font-black tracking-[0.2em] text-cyan-300">ULTRON LIVE OUTPUT</span>
          <span className="text-[8px] text-slate-600 tracking-widest">STREAMING</span>
        </div>
        <div className="text-[11px] leading-relaxed text-slate-200 whitespace-pre-wrap max-h-28 overflow-hidden">
          {text}
          <span className="inline-block w-1.5 h-3 ml-1 align-middle bg-cyan-400 animate-pulse" />
        </div>
      </div>
    </div>
  );
};
