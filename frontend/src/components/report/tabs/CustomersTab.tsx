import type { TopCustomerDto } from '@pos/shared';
import { EmptyState } from '../../ui/EmptyState';
import { Skeleton } from '../../ui/Skeleton';
import { ChartCard, RankRow, bs, share } from '../index';
import { ExpandableList } from '../ExpandableList';

interface Props {
  topCustomers: TopCustomerDto[];
  loading: boolean;
}

/** Quiénes compran: ranking de clientes por lo que gastaron en el período. */
export function CustomersTab({ topCustomers, loading }: Props) {
  return (
    <ChartCard title="Clientes que más compraron" description="Por monto gastado en el período. Solo pedidos con cliente registrado.">
      {loading ? (
        <Skeleton variant="rect" h="240px" />
      ) : topCustomers.length === 0 ? (
        <EmptyState compact icon="users" title="Sin pedidos con cliente en este período" description="Asigna un cliente al cobrar para verlo aquí." />
      ) : (
        <ExpandableList
          items={topCustomers}
          renderItem={(c, i) => (
            <RankRow
              key={c.customerId}
              rank={i + 1}
              title={c.customerName}
              detail={c.customerPhone ?? undefined}
              value={bs(c.totalSpent)}
              secondary={`${c.orderCount} ${c.orderCount === 1 ? 'pedido' : 'pedidos'}`}
              pct={share(c.totalSpent, topCustomers[0].totalSpent)}
            />
          )}
        />
      )}
    </ChartCard>
  );
}
