import { useState } from 'react';
import toast from 'react-hot-toast';
import type { CashSessionDto } from '@pos/shared';
import { CashSessionStatus } from '@pos/shared';
import { cashSessionApi } from '../api/cash-session.api';
import { useAuth } from '../context/auth.context';
import { useSocketEvent } from '../context/socket.context';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { useCashSession } from '../hooks/useCashSession';
import { formatDate } from '../utils/date';
import { handleApiError } from '../utils/api-error';
import { CashAmountModal } from '../components/cash/CashAmountModal';
import { HistoryModal } from '../components/cash/HistoryModal';

function diffColor(diff: number | null) {
  if (diff === null) return 'text-gray-500';
  if (diff > 0) return 'text-emerald-600';
  if (diff < 0) return 'text-red-500';
  return 'text-gray-700';
}

interface StatRowProps {
  label: string;
  value: string;
  muted?: boolean;
  bold?: boolean;
  bordered?: boolean;
  valueClass?: string;
}

function StatRow({ label, value, muted, bold, bordered, valueClass }: StatRowProps) {
  return (
    <div className={`flex justify-between items-center py-3 ${bordered ? 'border-t border-gray-100' : ''}`}>
      <span className={`text-sm ${muted ? 'text-gray-400' : 'text-gray-600'}`}>{label}</span>
      <span className={`text-sm ${bold ? 'font-heading font-bold' : 'font-medium'} ${valueClass || 'text-gray-900'}`}>
        {value}
      </span>
    </div>
  );
}

export function CashPage() {
  const { currentBranchId } = useAuth();
  const { session, setSession, history, loading, reload } = useCashSession(currentBranchId);
  const [showOpen, setShowOpen] = useState(false);
  const [showClose, setShowClose] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useSocketEvent<CashSessionDto>('cash.opened', (s) => { setSession(s); reload(); });
  useSocketEvent<CashSessionDto>('cash.closed', (s) => { setSession(s); reload(); });

  if (!currentBranchId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400 px-6">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-gray-500 text-center">Selecciona una sucursal</p>
        <p className="text-xs mt-1 text-center">para ver el estado de caja</p>
      </div>
    );
  }

  if (loading || session === undefined) {
    return <div className="flex justify-center py-12"><Spinner /></div>;
  }

  const isOpen = session?.status === CashSessionStatus.OPEN;
  const closedSessions = history.filter((s) => s.status === CashSessionStatus.CLOSED);

  const handleOpen = async (amount: number, notes?: string) => {
    try {
      const s = await cashSessionApi.open({ openingAmount: amount, notes }, currentBranchId);
      toast.success('Caja abierta');
      setSession(s);
      setShowOpen(false);
    } catch (err) {
      handleApiError(err, 'Error al abrir caja');
    }
  };

  const handleClose = async (amount: number, notes?: string) => {
    try {
      const s = await cashSessionApi.close({ closingAmount: amount, notes }, currentBranchId);
      toast.success('Caja cerrada');
      setSession(s);
      setShowClose(false);
    } catch (err) {
      handleApiError(err, 'Error al cerrar caja');
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-lg mx-auto animate-slide">
      {/* Hero status card */}
      <div className={[
        'rounded-2xl p-6 mb-4 border',
        isOpen
          ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/60 border-emerald-200/80'
          : 'bg-gradient-to-br from-gray-50 to-gray-100/60 border-gray-200/80',
      ].join(' ')}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2.5 h-2.5 rounded-full ${isOpen ? 'bg-emerald-500 animate-pulse-dot' : 'bg-gray-300'}`} />
              <span className={`text-sm font-bold ${isOpen ? 'text-emerald-700' : 'text-gray-500'}`}>
                {isOpen ? 'Caja abierta' : 'Caja cerrada'}
              </span>
            </div>
            {isOpen && session && (
              <p className="text-xs text-emerald-600/70 ml-4">Desde {formatDate(session.openedAt)}</p>
            )}
          </div>
          <div className={[
            'w-12 h-12 rounded-xl flex items-center justify-center',
            isOpen ? 'bg-emerald-500/15' : 'bg-gray-200/60',
          ].join(' ')}>
            <svg className={`w-6 h-6 ${isOpen ? 'text-emerald-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>

        {isOpen && session ? (
          <>
            <div className="mb-5">
              <p className="text-xs font-semibold text-emerald-600/70 uppercase tracking-wide mb-1">Monto inicial</p>
              <p className="font-heading font-black text-3xl text-emerald-700">Bs {session.openingAmount.toFixed(2)}</p>
            </div>
            {session.notes && (
              <p className="text-xs text-emerald-600/60 bg-emerald-500/8 rounded-lg px-3 py-2 mb-4">{session.notes}</p>
            )}
            <Button variant="secondary" fullWidth onClick={() => setShowClose(true)}>
              Cerrar caja
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-5 leading-relaxed">
              Abre la caja al inicio del turno para registrar el monto inicial de efectivo.
            </p>
            <Button size="lg" fullWidth onClick={() => setShowOpen(true)}>
              Abrir caja
            </Button>
          </>
        )}
      </div>

      {/* Last closing summary */}
      {!isOpen && session?.closingAmount !== null && session?.closingAmount !== undefined && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_oklch(0.13_0.012_260/0.07)] p-5">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="text-sm font-bold text-gray-700">Último cierre</h3>
            {session?.closedAt && (
              <span className="ml-auto text-xs text-gray-400">{formatDate(session.closedAt)}</span>
            )}
          </div>

          <div className="divide-y divide-gray-50">
            <StatRow label="Monto inicial" value={`Bs ${session!.openingAmount.toFixed(2)}`} />
            <StatRow
              label="Ventas en efectivo"
              value={`Bs ${((session!.expectedAmount ?? 0) - session!.openingAmount).toFixed(2)}`}
            />
            <StatRow
              label="Esperado en caja"
              value={`Bs ${(session!.expectedAmount ?? 0).toFixed(2)}`}
              bold
            />
            <StatRow
              label="Contado al cierre"
              value={`Bs ${session!.closingAmount!.toFixed(2)}`}
              bold
              bordered
            />
            <StatRow
              label="Diferencia"
              value={session!.difference !== null
                ? `${session!.difference >= 0 ? '+' : ''}Bs ${session!.difference.toFixed(2)}`
                : '—'}
              bold
              valueClass={diffColor(session!.difference)}
            />
          </div>
        </div>
      )}

      {/* History link */}
      {closedSessions.length > 0 && (
        <button
          onClick={() => setShowHistory(true)}
          className="w-full mt-3 text-xs text-primary-600 hover:text-primary-700 font-semibold transition-colors
            bg-white border border-gray-100 rounded-xl py-3 hover:border-primary-200 hover:bg-primary-50/30"
        >
          Ver historial de cierres ({closedSessions.length}) →
        </button>
      )}

      <CashAmountModal
        isOpen={showOpen}
        onClose={() => setShowOpen(false)}
        onConfirm={handleOpen}
        title="Abrir caja"
        amountLabel="Monto inicial en efectivo"
        confirmLabel="Abrir caja"
      />

      <CashAmountModal
        isOpen={showClose}
        onClose={() => setShowClose(false)}
        onConfirm={handleClose}
        title="Cerrar caja"
        subtitle={session ? `Abierta el ${formatDate(session.openedAt)}` : undefined}
        amountLabel="Efectivo contado al cierre"
        confirmLabel="Cerrar caja"
      />

      <HistoryModal
        isOpen={showHistory}
        sessions={closedSessions}
        onClose={() => setShowHistory(false)}
      />
    </div>
  );
}
