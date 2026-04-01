import { Component, type ReactNode } from 'react';

interface State { hasError: boolean }

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center">
            <h1 className="font-heading font-black text-2xl text-gray-900 mb-2">
              Algo salió mal
            </h1>
            <p className="text-sm text-gray-500 mb-4">
              Recarga la página para continuar.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="text-sm font-semibold text-primary-600 hover:underline"
            >
              Recargar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
