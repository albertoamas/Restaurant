import type { CashSessionDto } from '@pos/shared';
import { Modal } from '../ui/Modal';
import { formatDate } from '../../utils/date';

function diffColor(diff: number | null) {
  if (diff === null) return 'text-gray-500';
  if (diff > 0) return 'text-emerald-600';
  if (diff < 0) return 'text-red-500';
  return 'text-gray-700';
}

interface HistoryModalProps {
  isOpen: boolean;
  sessions: CashSessionDto[];
  onClose: () => void;
}

export function HistoryModal({ isOpen, sessions, onClose }: HistoryModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Historial de caja" size="lg">
      <div className="overflow-y-auto space-y-2.5 max-h-[60vh]">
        {sessions.map((s) => (
          <div
            key={s.id}
            className="bg-gray-50/60 border border-gray-100 rounded-xl p-4 hover:bg-white hover:border-gray-200 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500">{formatDate(s.openedAt)}</span>
              {s.closedAt && (
                <span className="text-xs text-gray-400">→ {formatDate(s.closedAt)}</span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="bg-white rounded-lg p-2.5 border border-gray-100">
                <p className="text-gray-400 mb-1">Monto inicial</p>
                <p className="font-heading font-bold text-sm text-gray-700">Bs {s.openingAmount.toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-lg p-2.5 border border-gray-100">
                <p className="text-gray-400 mb-1">Esperado</p>
                <p className="font-heading font-bold text-sm text-gray-700">Bs {(s.expectedAmount ?? 0).toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-lg p-2.5 border border-gray-100">
                <p className="text-gray-400 mb-1">Diferencia</p>
                <p className={`font-heading font-bold text-sm ${diffColor(s.difference)}`}>
                  {s.difference !== null
                    ? `${s.difference >= 0 ? '+' : ''}Bs ${s.difference.toFixed(2)}`
                    : '—'}
                </p>
              </div>
            </div>
            {s.notes && (
              <p className="text-xs text-gray-400 mt-2.5 bg-white border border-gray-100 rounded-lg px-3 py-2 italic">
                {s.notes}
              </p>
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
}
