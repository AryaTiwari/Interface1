import React, { useEffect, useRef } from 'react';
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
  const {
    nodes,
    toggleNodeStatus,
    setStatus,
    setIsChatOpen,
    isChatOpen,
    messages,
    mood,
  } = useUltron();

  const chatWasOpenRef = useRef(isChatOpen);
  useEffect(() => {
    if (isChatOpen) chatWasOpenRef.current = true;
  }, [isChatOpen]);

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

    // Never allow the runtime bridge to collapse the conversation UI during a submit.
    const preserveChatDuringSubmit = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('#chat-page-footer')) return;
      chatWasOpenRef.current = true;
      setIsChatOpen(true);
    };

    const preserveChatDuringChatKey = (event: Event) => {
      const keyboard = event as KeyboardEvent;
      if (keyboard.key !== 'Enter' || keyboard.shiftKey) return;
      const target = event.target as HTMLElement | null;
      if (!target?.closest('#chat-page-footer')) return;
      chatWasOpenRef.current = true;
      setIsChatOpen(true);
    };

    document.addEventListener('submit', preserveChatDuringSubmit, true);
    document.addEventListener('keydown', preserveChatDuringChatKey, true);

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
      document.removeEventListener('submit', preserveChatDuringSubmit, true);
      document.removeEventListener('keydown', preserveChatDuringChatKey, true);
      document.removeEventListener('click', click, true);
    };
  }, [nodes, setStatus, setIsChatOpen, toggleNodeStatus]);

  // If a state update during the submit cycle briefly closes the chat, restore it.
  useEffect(() => {
    if (chatWasOpenRef.current && messages.length > 0 && !isChatOpen) {
      setIsChatOpen(true);
    }
  }, [messages.length, isChatOpen, setIsChatOpen]);

  return null;
};
