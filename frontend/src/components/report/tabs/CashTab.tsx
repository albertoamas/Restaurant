import type { CashierReportDto, CashSessionReportItemDto } from '@pos/shared';
import { Card } from '../../ui/Card';
import { Spinner } from '../../ui/Spinner';
import { Icon } from '../../ui/Icon';
import { CashierRankingTable } from '../charts/CashierRankingTable';
import { formatBoliviaTime } from '../../../utils/date';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-BO', {
    timeZone: 'America/La_Paz', day: '2-digit', month: 'short',
  });
}

interface Props {
  byCashier: CashierReportDto[];
  cashSessions: CashSessionReportItemDto[];
  loading: boolean;
}

/** Quién cobró y cómo cerró la caja: ranking de cajeros y arqueos. */
export function CashTab({ byCashier, cashSessions, loading }: Props) {
  if (loading) {
    return <div className="flex justify-center py-12"><Spinner /></div>;
  }

  return (
    <div className="space-y-4">
      <Card variant="panel">
        <h3 className="mb-0.5 font-heading text-sm font-bold text-gray-700">Rendimiento por Cajero</h3>
        <p className="mb-4 text-[11px] text-gray-400">Ranking por ventas · ticket promedio por cajero</p>
        {byCashier.length > 0 ? (
          <CashierRankingTable data={byCashier} />
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <Icon name="users" size={28} strokeWidth={1.5} className="mb-2 opacity-40" />
            <p className="text-xs">Sin datos para este período</p>
          </div>
        )}
      </Card>

      <Card variant="panel">
        <h3 className="mb-0.5 font-heading text-sm font-bold text-gray-700">Arqueos de Caja</h3>
        <p className="mb-4 text-[11px] text-gray-400">Historial de sesiones en el período</p>

        {cashSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <Icon name="dollar" size={28} strokeWidth={1.5} className="mb-2 opacity-40" />
            <p className="text-xs">Sin sesiones de caja en este período</p>
          </div>
        ) : (
          <div className="-mx-1 overflow-x-auto">
            <table className="w-full min-w-[560px] text-xs">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  <th className="pb-2 pl-1 pr-3 text-left font-semibold text-gray-400">Sucursal</th>
                  <th className="pb-2 pr-3 text-left font-semibold text-gray-400">Apertura</th>
                  <th className="pb-2 pr-3 text-left font-semibold text-gray-400">Cierre</th>
                  <th className="pb-2 pr-3 text-right font-semibold text-gray-400">Inicial</th>
                  <th className="pb-2 pr-3 text-right font-semibold text-gray-400">Esperado</th>
                  <th className="pb-2 pr-3 text-right font-semibold text-gray-400">Real</th>
                  <th className="pb-2 pr-1 text-right font-semibold text-gray-400">Diferencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {cashSessions.map((s) => {
                  const diff = s.difference;
                  const diffColor =
                    diff == null ? 'text-gray-400' :
                    diff > 0     ? 'text-emerald-500' :
                    diff < 0     ? 'text-red-500' : 'text-gray-500';
                  return (
                    <tr key={s.id} className="transition-colors hover:bg-[var(--color-surface-2)]">
                      <td className="py-2.5 pl-1 pr-3 font-medium text-gray-700">{s.branchName}</td>
                      <td className="py-2.5 pr-3 text-gray-500">
                        {fmtDate(s.openedAt)}{' '}<span className="text-gray-400">{formatBoliviaTime(s.openedAt)}</span>
                      </td>
                      <td className="py-2.5 pr-3 text-gray-500">
                        {s.closedAt ? (
                          <>{fmtDate(s.closedAt)}{' '}<span className="text-gray-400">{formatBoliviaTime(s.closedAt)}</span></>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-500">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                            Abierta
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3 text-right font-mono text-gray-600">Bs {s.openingAmount.toFixed(2)}</td>
                      <td className="py-2.5 pr-3 text-right font-mono text-gray-600">{s.expectedAmount != null ? `Bs ${s.expectedAmount.toFixed(2)}` : '—'}</td>
                      <td className="py-2.5 pr-3 text-right font-mono text-gray-600">{s.closingAmount  != null ? `Bs ${s.closingAmount.toFixed(2)}`  : '—'}</td>
                      <td className={`py-2.5 pr-1 text-right font-mono font-bold ${diffColor}`}>
                        {diff != null ? `${diff > 0 ? '+' : ''}Bs ${diff.toFixed(2)}` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
