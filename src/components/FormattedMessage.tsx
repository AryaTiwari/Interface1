import React from 'react';
import { CORE_URL } from '../services/ultronApi';
import { CodeBlock } from './CodeBlock';

interface FormattedMessageProps {
  text: string;
}

type InlineSegment =
  | { type: 'plain'; content: string }
  | { type: 'inlineCode'; content: string }
  | { type: 'link'; content: string; href: string };

function resolveHref(href: string) {
  const value = String(href || '').trim();
  if (/^https?:\/\//i.test(value)) return value;
  if (/^\/api\/artifacts\//i.test(value)) return `${CORE_URL}${value}`;
  return null;
}

function artifactLabel(href: string) {
  try {
    const pathname = href.startsWith('http') ? new URL(href).pathname : href;
    const name = decodeURIComponent(pathname.split('/').pop() || 'artifact');
    return name || 'artifact';
  } catch {
    return 'artifact';
  }
}

export const FormattedMessage: React.FC<FormattedMessageProps> = ({ text }) => {
  if (!text) return null;

  const codeBlockRegex = /```([a-zA-Z0-9_+#-]*)\n([\s\S]*?)```/g;
  const parts: Array<
    | { type: 'text'; content: string }
    | { type: 'code'; language: string; content: string }
  > = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    const textBefore = text.substring(lastIndex, match.index);
    if (textBefore) parts.push({ type: 'text', content: textBefore });

    parts.push({
      type: 'code',
      language: match[1]?.trim() || 'text',
      content: match[2],
    });
    lastIndex = match.index + match[0].length;
  }

  const remainingText = text.substring(lastIndex);
  if (remainingText) parts.push({ type: 'text', content: remainingText });

  return (
    <div className="space-y-2">
      {parts.map((part, index) => {
        if (part.type === 'code') {
          return (
            <CodeBlock
              key={`code-${index}`}
              language={part.language}
              code={part.content.trimEnd()}
            />
          );
        }
        return <FormattedTextSegment key={`text-${index}`} text={part.content} />;
      })}
    </div>
  );
};

const FormattedTextSegment: React.FC<{ text: string }> = ({ text }) => {
  // Inline code, Markdown links, raw HTTP(S) URLs, and ULTRON artifact URLs.
  // Unsupported schemes such as sandbox: or file: intentionally remain plain text.
  const inlineRegex = /`([^`]+)`|\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/api\/artifacts\/[^\s)]+)\)|(https?:\/\/[^\s<]+|\/api\/artifacts\/[^\s<]+)/g;
  const segments: InlineSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = inlineRegex.exec(text)) !== null) {
    const textBefore = text.substring(lastIndex, match.index);
    if (textBefore) segments.push({ type: 'plain', content: textBefore });

    if (match[1] != null) {
      segments.push({ type: 'inlineCode', content: match[1] });
    } else {
      const href = match[3] || match[4] || '';
      const label = match[2] || (/\/api\/artifacts\//i.test(href) ? `Download ${artifactLabel(href)}` : href);
      segments.push({ type: 'link', content: label, href });
    }
    lastIndex = match.index + match[0].length;
  }

  const remaining = text.substring(lastIndex);
  if (remaining) segments.push({ type: 'plain', content: remaining });

  return (
    <p className="whitespace-pre-wrap leading-relaxed text-slate-200">
      {segments.map((seg, i) => {
        if (seg.type === 'inlineCode') {
          return (
            <code
              key={i}
              className="mx-1 px-1.5 py-0.5 rounded bg-slate-900 border border-cyan-500/40 text-cyan-300 font-mono text-[12px] font-bold shadow-xs select-text"
            >
              {seg.content}
            </code>
          );
        }

        if (seg.type === 'link') {
          const href = resolveHref(seg.href);
          if (!href) return <span key={i}>{seg.content}</span>;
          const isArtifact = /\/api\/artifacts\//i.test(seg.href);
          return (
            <a
              key={i}
              href={href}
              target="_blank"
              rel="noreferrer"
              className={
                isArtifact
                  ? 'mx-1 inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/50 bg-cyan-950/40 px-2.5 py-1 font-bold text-cyan-300 underline-offset-2 transition hover:border-cyan-300 hover:bg-cyan-900/50 hover:text-cyan-100'
                  : 'text-cyan-300 underline decoration-cyan-500/60 underline-offset-2 transition hover:text-cyan-100'
              }
            >
              {isArtifact ? '📄' : '↗'} {seg.content}
            </a>
          );
        }

        return <span key={i}>{seg.content}</span>;
      })}
    </p>
  );
};
