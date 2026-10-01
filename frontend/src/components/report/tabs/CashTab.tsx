import type { CashierReportDto, CashSessionReportItemDto } from '@pos/shared';
import { Badge } from '../../ui/Badge';
import { EmptyState } from '../../ui/EmptyState';
import { Skeleton } from '../../ui/Skeleton';
import { CashierRankingTable } from '../charts/CashierRankingTable';
import { ChartCard, bs } from '../index';
import { cashResult } from '../../cash/cash-result';
import { formatBoliviaDateShort, formatBoliviaTime } from '../../../utils/date';

interface Props {
  byCashier: CashierReportDto[];
  cashSessions: CashSessionReportItemDto[];
  loading: boolean;
}

const when = (iso: string) => `${formatBoliviaDateShort(iso)}, ${formatBoliviaTime(iso)}`;
const amount = (n: number | null) => (n == null ? '-' : bs(n));

/** Resultado del cierre en palabras, igual que en la pantalla Caja. */
function Result({ s }: { s: CashSessionReportItemDto }) {
  if (!s.closedAt) return <Badge variant="warning" dot>Abierta</Badge>;
  if (s.difference == null) return <span className="text-muted">-</span>;
  const r = cashResult(s.difference);
  return <Badge variant={r.tone}>{r.label}</Badge>;
}

/** Quién vendió y cómo cerró la caja: cajeros y cierres del período. */
export function CashTab({ byCashier, cashSessions, loading }: Props) {
  if (loading) {
    return <div className="grid gap-4 lg:grid-cols-2"><Skeleton variant="card" /><Skeleton variant="card" /></div>;
  }

  return (
    <div className="space-y-4">
      <ChartCard title="Ventas por cajero" description="Ordenados por lo que vendieron en el período.">
        {byCashier.length > 0
          ? <CashierRankingTable data={byCashier} />
          : <EmptyState compact icon="users" title="Sin ventas en este período" />}
      </ChartCard>

      <ChartCard title="Cierres de caja" description="Cada turno del período: lo esperado, lo contado y si cuadró.">
        {cashSessions.length === 0 ? (
          <EmptyState compact icon="cash" title="Sin turnos de caja en este período" />
        ) : (
          <>
            {/* Celular y tablet: una fila por turno */}
            <ul className="lg:hidden -my-3 divide-y divide-line">
              {cashSessions.map((s) => (
                <li key={s.id} className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-body font-semibold text-main">{formatBoliviaDateShort(s.openedAt)}</p>
                      <p className="text-caption text-muted">
                        {s.branchName}, {formatBoliviaTime(s.openedAt)} a {s.closedAt ? formatBoliviaTime(s.closedAt) : 'ahora'}
                      </p>
                    </div>
                    <Result s={s} />
                  </div>
                  <dl className="mt-2 grid grid-cols-3 gap-2 text-caption">
                    <div><dt className="text-muted">Inicial</dt><dd className="text-soft tabular-nums">{amount(s.openingAmount)}</dd></div>
                    <div><dt className="text-muted">Esperado</dt><dd className="text-soft tabular-nums">{amount(s.expectedAmount)}</dd></div>
                    <div><dt className="text-muted">Contado</dt><dd className="font-semibold text-main tabular-nums">{amount(s.closingAmount)}</dd></div>
                  </dl>
                </li>
              ))}
            </ul>

            {/* Escritorio: tabla */}
            <div className="hidden lg:block -mx-2">
              <table className="w-full text-label">
                <thead>
                  <tr className="border-b border-line text-left text-soft">
                    <th scope="col" className="px-2 pb-2 font-medium">Sucursal</th>
                    <th scope="col" className="px-2 pb-2 font-medium">Apertura</th>
                    <th scope="col" className="px-2 pb-2 font-medium">Cierre</th>
                    <th scope="col" className="px-2 pb-2 font-medium text-right">Inicial</th>
                    <th scope="col" className="px-2 pb-2 font-medium text-right">Esperado</th>
                    <th scope="col" className="px-2 pb-2 font-medium text-right">Contado</th>
                    <th scope="col" className="px-2 pb-2 font-medium text-right">Resultado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {cashSessions.map((s) => (
                    <tr key={s.id} className="hover:bg-surface-2 transition-colors">
                      <td className="px-2 py-2.5 text-main">{s.branchName}</td>
                      <td className="px-2 py-2.5 text-soft whitespace-nowrap">{when(s.openedAt)}</td>
                      <td className="px-2 py-2.5 text-soft whitespace-nowrap">{s.closedAt ? when(s.closedAt) : '-'}</td>
                      <td className="px-2 py-2.5 text-right text-soft tabular-nums">{amount(s.openingAmount)}</td>
                      <td className="px-2 py-2.5 text-right text-soft tabular-nums">{amount(s.expectedAmount)}</td>
                      <td className="px-2 py-2.5 text-right font-semibold text-main tabular-nums">{amount(s.closingAmount)}</td>
                      <td className="px-2 py-2.5 text-right"><Result s={s} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </ChartCard>
    </div>
  );
}
