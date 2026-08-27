import React, { useEffect } from 'react';
import { useUltron } from './ultronContext';
import * as api from '../services/ultronApi';

const map: Record<string, string> = {
  internet: 'internet',
  github: 'github',
  memory: 'supabase_memory',
  omniroute: 'ai_brain',
  instagram: 'quantum_matrix',
  administrator: 'guardian',
};

const good = (s: string) => /^(CONNECTED|ONLINE|ELEVATED|LOCAL_READY|LOCAL_READY_SUPABASE_CONFIGURED)$/.test(s);

export const RuntimeBridge: React.FC = () => {
  const { nodes, toggleNodeStatus, setStatus, setIsChatOpen, mood } = useUltron();

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('ultron:mood', { detail: mood }));
  }, [mood]);

  useEffect(() => {
    let dead = false;

    const sync = async () => {
      try {
        const d: any = await api.fetchSystemStatus();
        const s = d.live?.status || d.status || {};
        if (dead) return;

        setStatus(s.omniroute?.status === 'OFFLINE' ? 'WARNING' : 'IDLE');
        window.dispatchEvent(new CustomEvent('ultron:live-status', { detail: d.live || d }));

        for (const [source, id] of Object.entries(map)) {
          if (dead) break;
          const live = s[source]?.status;
          const node = nodes.find(n => n.id === id);
          if (!live || !node || node.status === 'ACTIVE') continue;
          if (good(node.status) !== good(String(live))) toggleNodeStatus(id);
        }
      } catch {
        // Core may be offline.
      }
    };

    // Keep the full-screen chat matrix mounted while a message is being submitted.
    const keepChatOpenDuringSubmit = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('#chat-page-footer')) return;
      setIsChatOpen(true);
    };

    document.addEventListener('submit', keepChatOpenDuringSubmit, true);
    document.addEventListener('keydown', (event) => {
      if ((event as KeyboardEvent).key === 'Enter') {
        const target = event.target as HTMLElement | null;
        if (target?.closest('#chat-page-footer')) setIsChatOpen(true);
      }
    }, true);

    const click = (e: Event) => {
      const b = (e.target as HTMLElement | null)?.closest('button');
      const host = b?.parentElement;
      const mesh = host?.querySelector('[id^="mesh-node-"]');
      if (mesh) {
        e.preventDefault();
        e.stopImmediatePropagation();
        sync();
      }
    };

    document.addEventListener('click', click, true);
    sync();
    const t = window.setInterval(sync, 5000);

    return () => {
      dead = true;
      clearInterval(t);
      document.removeEventListener('submit', keepChatOpenDuringSubmit, true);
      document.removeEventListener('click', click, true);
    };
  }, [nodes, setStatus, setIsChatOpen, toggleNodeStatus]);

  return null;
};
