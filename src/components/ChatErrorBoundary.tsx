import React from 'react';

type Props = { children: React.ReactNode };
type State = { hasError: boolean; message: string };

export class ChatErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : String(error),
    };
  }

  componentDidCatch(error: unknown) {
    console.error('[ULTRON CHAT] Render error:', error);
  }

  private reset = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#030712]/98 backdrop-blur-2xl text-slate-100 font-mono p-6">
        <div className="w-full max-w-xl rounded-2xl border border-red-500/40 bg-slate-950/95 p-6 shadow-2xl">
          <div className="text-xs font-black tracking-[0.25em] text-red-400 mb-3">CHAT RENDER FAULT</div>
          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            The conversation engine is still online, but the chat renderer hit an unexpected UI error. Your conversation state has been preserved.
          </p>
          <pre className="max-h-32 overflow-auto rounded-xl border border-slate-800 bg-black/30 p-3 text-[10px] text-slate-500 whitespace-pre-wrap mb-4">{this.state.message || 'Unknown rendering error'}</pre>
          <button
            type="button"
            onClick={this.reset}
            className="px-4 py-2 rounded-xl border border-cyan-500/50 bg-cyan-950/70 text-cyan-300 text-xs font-bold hover:bg-cyan-900/70 transition-all cursor-pointer"
          >
            RESTORE CHAT MATRIX
          </button>
        </div>
      </div>
    );
  }
}
