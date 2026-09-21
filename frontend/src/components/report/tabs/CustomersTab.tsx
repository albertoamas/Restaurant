import type { TopCustomerDto } from '@pos/shared';
import { Card } from '../../ui/Card';
import { Spinner } from '../../ui/Spinner';
import { Icon } from '../../ui/Icon';
import { TopCustomerRow } from '../index';
import { ExpandableList } from '../ExpandableList';

interface Props {
  topCustomers: TopCustomerDto[];
  loading: boolean;
}

/** Quiénes compran: ranking de clientes por gasto en el período. */
export function CustomersTab({ topCustomers, loading }: Props) {
  return (
    <Card variant="default">
      <h3 className="mb-4 font-heading text-sm font-bold text-gray-700">Clientes Más Frecuentes</h3>

      {loading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : topCustomers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
          <Icon name="users" size={32} strokeWidth={1.5} className="mb-2 opacity-40" />
          <p className="text-xs font-medium text-gray-500">Sin clientes registrados en este período</p>
        </div>
      ) : (
        <ExpandableList
          items={topCustomers}
          renderItem={(c, i) => (
            <TopCustomerRow key={c.customerId} rank={i + 1} customer={c} maxSpent={topCustomers[0].totalSpent} />
          )}
        />
      )}
    </Card>
  );
}
