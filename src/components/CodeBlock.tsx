import React, { useState } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-yaml';

interface CodeBlockProps {
  code: string;
  language?: string;
}

const LANGUAGE_MAP: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  jsx: 'jsx',
  tsx: 'tsx',
  py: 'python',
  python: 'python',
  bash: 'bash',
  sh: 'bash',
  shell: 'bash',
  json: 'json',
  sql: 'sql',
  css: 'css',
  html: 'markup',
  xml: 'markup',
  yaml: 'yaml',
  yml: 'yaml',
};

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'javascript' }) => {
  const [copied, setCopied] = useState(false);

  const cleanLang = (language || 'text').trim().toLowerCase();
  const prismLangKey = LANGUAGE_MAP[cleanLang] || (Prism.languages[cleanLang] ? cleanLang : 'javascript');
  const grammar = Prism.languages[prismLangKey] || Prism.languages.javascript;

  const highlightedCode = Prism.highlight(code, grammar, prismLangKey);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lineCount = code.split('\n').length;

  return (
    <div className="my-3 rounded-xl border border-cyan-500/30 bg-[#040814] overflow-hidden shadow-2xl font-mono text-xs select-text">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-800/80 bg-slate-950/90 select-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <span className="ml-1 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-widest bg-cyan-950 text-cyan-300 border border-cyan-800/80">
            {cleanLang || 'CODE'}
          </span>
          <span className="text-[10px] text-slate-500 font-semibold">
            {lineCount} {lineCount === 1 ? 'line' : 'lines'}
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
            copied
              ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-cyan-500/60'
          }`}
          title="Copy snippet to clipboard"
        >
          <span>{copied ? '✓' : '📋'}</span>
          <span>{copied ? 'COPIED!' : 'COPY CODE'}</span>
        </button>
      </div>

      {/* Code Display Area */}
      <div className="p-4 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent bg-[#030611] leading-relaxed">
        <pre className="m-0 p-0 bg-transparent font-mono text-xs sm:text-[13px] tracking-wide">
          <code
            className={`language-${prismLangKey}`}
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
          />
        </pre>
      </div>
    </div>
  );
};
