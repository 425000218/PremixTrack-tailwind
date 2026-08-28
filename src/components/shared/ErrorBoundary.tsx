import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertOctagon, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// @ts-ignore
export class ErrorBoundary extends Component<Props, State> {
  // @ts-ignore
  state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: any): void {
    console.error('Uncaught React Error in PremixTrack:', error, errorInfo);
    // @ts-ignore
    this.setState({ errorInfo });
  }

  handleReset = (): void => {
    // @ts-ignore
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render(): ReactNode {
    // @ts-ignore
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-5">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-3 bg-red-950/60 border border-red-800/60 rounded-2xl">
                <AlertOctagon className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Ðã X?y Ra S? C? Hi?n Th? Giao Di?n</h1>
                <p className="text-xs text-slate-400">PremixTrack Safe Recovery Shield</p>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-700/80 rounded-2xl p-4 text-xs font-mono text-amber-300 space-y-2 overflow-x-auto">
              <div className="font-bold text-red-400">
                {/* @ts-ignore */}
                {this.state.error?.name || 'Error'}: {/* @ts-ignore */}{this.state.error?.message || 'Unknown render exception'}
              </div>
              {/* @ts-ignore */}
              {this.state.error?.stack && (
                <div className="text-[11px] text-slate-400 max-h-40 overflow-y-auto whitespace-pre-wrap">
                  {/* @ts-ignore */}
                  {this.state.error.stack}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-xs text-white transition-all shadow-md cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Khôi Ph?c & T?i L?i Trang</span>
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('premixtrack_user');
                  window.location.href = '/';
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-600 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Trang Ch?</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    // @ts-ignore
    return this.props.children;
  }
}

export default ErrorBoundary;
