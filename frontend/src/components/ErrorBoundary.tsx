import { Component, type ReactNode } from 'react';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';

interface State { hasError: boolean }

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-dvh items-center justify-center bg-surface-page p-4">
          <div className="w-full max-w-sm rounded-card border border-line bg-surface-card p-8 text-center shadow-raised">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-card bg-amber-500/10 text-amber-700 dark:text-amber-300">
              <Icon name="warning" size={24} />
            </span>
            <h1 className="mt-4 font-heading text-title font-bold text-main">Algo salió mal</h1>
            <p className="mt-1 text-body text-soft">
              Recarga la página para seguir. Si estabas cobrando, revisa en Pedidos si el pedido se guardó.
            </p>
            <Button className="mt-6" fullWidth onClick={() => window.location.reload()}>
              Recargar
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
