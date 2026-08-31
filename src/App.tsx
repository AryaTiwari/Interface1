import React, { useState, useEffect } from 'react';
import { UltronProvider, useUltron } from './core/ultronContext';
import { RuntimeBridge } from './core/RuntimeBridge';
import { CredentialManager } from './components/CredentialManager';
import { TopHeader } from './components/TopHeader';
import { UltronCore, MOOD_COLORS } from './components/UltronCore';
import { NetworkMesh } from './components/NetworkMesh';
import { GuardianPipeline } from './components/GuardianPipeline';
import { ConversationConsole } from './components/ConversationConsole';
import { PersonalityModal } from './components/PersonalityModal';
import { DiagnosticsDrawer } from './components/DiagnosticsDrawer';
import { UltronChatPage } from './components/UltronChatPage';
import { ChatErrorBoundary } from './components/ChatErrorBoundary';
import { AgentActivity } from './components/AgentActivity';

const MainInterface: React.FC = () => {
  const { mood, status, isVibrating } = useUltron();
  const colors = MOOD_COLORS[mood] || MOOD_COLORS.CALM;
  const [isAlertActive, setIsAlertActive] = useState(false);
  useEffect(() => setIsAlertActive(status === 'WARNING' || status === 'ERROR' || mood === 'WARNING' || mood === 'CRITICAL'), [status, mood]);
  const alertClass = isAlertActive ? (mood === 'CRITICAL' ? 'ultron-critical-shake' : 'ultron-warning-shake') : '';
  const borderPulseClass = isAlertActive ? (mood === 'CRITICAL' ? 'ultron-border-pulse-critical' : 'ultron-border-pulse-warning') : '';
  return <div id="ultron-root-app" className={`relative w-screen h-screen overflow-hidden bg-[#030712] text-slate-100 flex flex-col justify-between font-mono select-none transition-all duration-700 ${alertClass} ${isVibrating ? 'ultron-haptic-vibration' : ''}`} style={{backgroundImage:`radial-gradient(circle at 50% 45%, ${colors.ambient} 0%, transparent 65%), linear-gradient(to bottom, #030712 0%, #080f1e 50%, #030712 100%)`}}>
    {isAlertActive && <div className={`pointer-events-none fixed inset-0 z-50 transition-opacity duration-700 ${borderPulseClass}`} />}
    {isVibrating && <div className="pointer-events-none fixed inset-0 z-50 border-2 border-cyan-400/80 shadow-[inset_0_0_60px_rgba(6,182,212,0.6)] animate-pulse" />}
    <div className="absolute inset-0 pointer-events-none opacity-20" style={{backgroundImage:`linear-gradient(to right, ${colors.border} 1px, transparent 1px), linear-gradient(to bottom, ${colors.border} 1px, transparent 1px)`,backgroundSize:'40px 40px'}} />
    <RuntimeBridge />
    <CredentialManager />
    <TopHeader />
    <main id="center-stage" className="relative flex-1 flex flex-col items-center justify-center w-full px-4 overflow-hidden">
      <NetworkMesh />
      <div id="guardian-pipeline-dock" className="absolute top-2 left-6 z-20 hidden lg:block"><GuardianPipeline /></div>
      <div id="ultron-core-container" className="relative z-20 my-auto flex flex-col items-center"><UltronCore /></div>
    </main>
    <footer id="bottom-console-dock" className="relative z-30 w-full px-4 pb-3 pt-1"><ConversationConsole /></footer>
    <PersonalityModal /><DiagnosticsDrawer />
    <AgentActivity />
    <ChatErrorBoundary><UltronChatPage /></ChatErrorBoundary>
  </div>;
};
export default function App(){return <UltronProvider><MainInterface/></UltronProvider>;}
