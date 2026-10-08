import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Hata sonrası sıfırlama (örn. giriş ekranına dönüş). */
  onReset?: () => void;
  compact?: boolean;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Beyaz ekran katili: render çökerse tüm uygulama unmount olmak yerine
 * okunabilir bir hata kartı gösterir + kurtarma düğmesi sunar.
 * APK ve PC'de ortak kullanılır.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    try {
      // eslint-disable-next-line no-console
      console.error('[BiznesHasap] render hatası:', error.message, info.componentStack);
    } catch {
      // yoksay
    }
  }

  private handleReset = (): void => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render(): React.ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    const message = error.message || String(error);
    return (
      <div
        className={`flex-1 flex items-center justify-center bg-[#F1F5F9] p-4 overflow-y-auto ${
          this.props.compact ? '' : 'min-h-0'
        }`}
      >
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm w-full max-w-sm p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto">
            <span className="text-2xl leading-none">⚠️</span>
          </div>
          <p className="font-bold text-gray-800 text-sm">Bir şeyler ters gitti</p>
          <p className="text-[11px] text-gray-500 font-mono break-words bg-gray-50 rounded-xl px-3 py-2 max-h-24 overflow-y-auto">
            {message}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="w-full h-12 rounded-xl bg-emerald-500 active:bg-emerald-600 text-white text-sm font-bold"
          >
            Yeniden başlat
          </button>
        </div>
      </div>
    );
  }
}
