import React from 'react';
import { CodeBlock } from './CodeBlock';

interface FormattedMessageProps {
  text: string;
}

export const FormattedMessage: React.FC<FormattedMessageProps> = ({ text }) => {
  if (!text) return null;

  // Regex to split by ``` [lang] \n [code] \n ```
  const codeBlockRegex = /```([a-zA-Z0-9_+#-]*)\n([\s\S]*?)```/g;

  const parts = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    const textBefore = text.substring(lastIndex, match.index);
    if (textBefore) {
      parts.push({ type: 'text' as const, content: textBefore });
    }

    const language = match[1]?.trim() || 'text';
    const code = match[2];
    parts.push({ type: 'code' as const, language, content: code });

    lastIndex = match.index + match[0].length;
  }

  const remainingText = text.substring(lastIndex);
  if (remainingText) {
    parts.push({ type: 'text' as const, content: remainingText });
  }

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

        // Render text with inline code blocks
        return <FormattedTextSegment key={`text-${index}`} text={part.content} />;
      })}
    </div>
  );
};

// Sub-component to format inline `code` fragments and linebreaks
const FormattedTextSegment: React.FC<{ text: string }> = ({ text }) => {
  // Split inline code backticks `code`
  const inlineRegex = /`([^`]+)`/g;
  const segments = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = inlineRegex.exec(text)) !== null) {
    const textBefore = text.substring(lastIndex, match.index);
    if (textBefore) {
      segments.push({ type: 'plain' as const, content: textBefore });
    }
    segments.push({ type: 'inlineCode' as const, content: match[1] });
    lastIndex = match.index + match[0].length;
  }

  const remaining = text.substring(lastIndex);
  if (remaining) {
    segments.push({ type: 'plain' as const, content: remaining });
  }

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
        return <span key={i}>{seg.content}</span>;
      })}
    </p>
  );
};
