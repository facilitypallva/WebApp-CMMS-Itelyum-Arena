import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Uncaught render error:', error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-xl border border-slate-100 shadow-sm p-10 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-lg bg-red-50 flex items-center justify-center">
                <AlertTriangle size={32} className="text-red-400" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-slate-800">Qualcosa è andato storto</h1>
              <p className="text-sm text-slate-500">
                Si è verificato un errore imprevisto. Puoi riprovare o tornare alla home.
              </p>
              {import.meta.env.DEV && this.state.error.message && (
                <p className="mt-3 break-all rounded-xl bg-slate-100 p-3 text-left font-mono text-xs text-slate-600">
                  {this.state.error.message}
                </p>
              )}
            </div>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" className="gap-2 rounded-xl" onClick={this.reset}>
                <RefreshCw size={14} /> Riprova
              </Button>
              <Button
                className="gap-2 rounded-xl bg-primary"
                onClick={() => { window.location.href = '/'; }}
              >
                <Home size={14} /> Torna alla home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
