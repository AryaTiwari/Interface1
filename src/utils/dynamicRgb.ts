import { useState, useEffect, useMemo } from 'react';

export interface UltronColorTheme { primary:string; secondary:string; glow:string; ambient:string; border:string; text:string; bgAccent:string; }
export function hslToHex(h:number,s:number,l:number):string { l/=100; const a=(s*Math.min(l,1-l))/100; const f=(n:number)=>{const k=(n+h/30)%12; const color=l-a*Math.max(Math.min(k-3,9-k,1),-1); return Math.round(255*color).toString(16).padStart(2,'0');}; return `#${f(0)}${f(8)}${f(4)}`; }
const MOODS: Record<string,UltronColorTheme>={
 CALM:{primary:'#38bdf8',secondary:'#0284c7',glow:'rgba(56,189,248,.45)',ambient:'rgba(14,165,233,.12)',border:'rgba(56,189,248,.35)',text:'#7dd3fc',bgAccent:'rgba(56,189,248,.08)'},
 FOCUSED:{primary:'#06b6d4',secondary:'#0891b2',glow:'rgba(6,182,212,.55)',ambient:'rgba(6,182,212,.15)',border:'rgba(34,211,238,.45)',text:'#67e8f9',bgAccent:'rgba(6,182,212,.1)'},
 AMUSED:{primary:'#c084fc',secondary:'#9333ea',glow:'rgba(192,132,252,.55)',ambient:'rgba(192,132,252,.16)',border:'rgba(192,132,252,.45)',text:'#e9d5ff',bgAccent:'rgba(192,132,252,.1)'},
 CONFIDENT:{primary:'#f0f9ff',secondary:'#38bdf8',glow:'rgba(240,249,255,.65)',ambient:'rgba(56,189,248,.2)',border:'rgba(224,242,254,.6)',text:'#fff',bgAccent:'rgba(240,249,255,.12)'},
 SUSPICIOUS:{primary:'#f59e0b',secondary:'#b45309',glow:'rgba(245,158,11,.55)',ambient:'rgba(245,158,11,.16)',border:'rgba(251,191,36,.45)',text:'#fde68a',bgAccent:'rgba(245,158,11,.1)'},
 WARNING:{primary:'#ef4444',secondary:'#b91c1c',glow:'rgba(239,68,68,.65)',ambient:'rgba(239,68,68,.22)',border:'rgba(248,113,113,.55)',text:'#fca5a5',bgAccent:'rgba(239,68,68,.15)'},
 CRITICAL:{primary:'#dc2626',secondary:'#7f1d1d',glow:'rgba(220,38,38,.85)',ambient:'rgba(220,38,38,.35)',border:'rgba(239,68,68,.75)',text:'#fee2e2',bgAccent:'rgba(220,38,38,.25)'}
};
export function getMoodColors(mood?:string):UltronColorTheme { return MOODS[String(mood||'CALM').toUpperCase()]||MOODS.CALM; }
export function useDynamicRgbColor():UltronColorTheme { const [mood,setMood]=useState('CALM'); useEffect(()=>{const onMood=(e:Event)=>setMood(String((e as CustomEvent<string>).detail||'CALM').toUpperCase()); window.addEventListener('ultron:mood',onMood); return()=>window.removeEventListener('ultron:mood',onMood);},[]); return useMemo(()=>getMoodColors(mood),[mood]); }
