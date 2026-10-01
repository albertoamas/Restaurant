import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import type { RaffleDto } from '@pos/shared';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import { PageHeader } from '../components/ui/PageHeader';
import { PageShell } from '../components/ui/PageShell';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { Skeleton } from '../components/ui/Skeleton';
import { useRaffles } from '../hooks/useRaffles';
import { RaffleCard } from '../components/raffles/RaffleCard';
import { CreateRaffleModal } from '../components/raffles/CreateRaffleModal';
import { queryKeys } from '../lib/query-keys';

type Filter = 'open' | 'done';
const isDone = (r: RaffleDto) => r.status === 'DRAWN';

export function RafflesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { raffles, loading } = useRaffles();
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<Filter>('open');

  function handleCreated(raffle: RaffleDto) {
    queryClient.invalidateQueries({ queryKey: queryKeys.raffles });
    navigate(`/raffles/${raffle.id}`);
  }

  const open = raffles.filter((r) => !isDone(r));
  const done = raffles.filter(isDone);
  const visible = filter === 'open' ? open : done;

  return (
    <PageShell>
      <PageHeader
        title="Sorteos"
        description="Tus clientes ganan tickets al comprar; aquí los sorteas entre ellos."
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Icon name="plus" size={18} />
            Nuevo sorteo
          </Button>
        }
      >
        {raffles.length > 0 && (
          <SegmentedControl
            label="Qué sorteos ver"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'open', label: 'En curso', count: open.length },
              { value: 'done', label: 'Terminados', count: done.length },
            ]}
          />
        )}
      </PageHeader>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"><Skeleton variant="card" /><Skeleton variant="card" /></div>
      ) : raffles.length === 0 ? (
        <EmptyState
          icon="ticket"
          title="Todavía no tienes sorteos"
          description="Crea uno, elige cómo se ganan los tickets y se generan solos con cada pedido."
          action={<Button onClick={() => setShowCreate(true)}>Crear el primer sorteo</Button>}
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon="ticket"
          title={filter === 'open' ? 'No hay sorteos en curso' : 'Todavía no terminó ningún sorteo'}
          description={filter === 'open' ? 'Crea uno nuevo o revisa los terminados.' : 'Cuando sortees todos los lugares de un sorteo, aparece aquí.'}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((raffle) => (
            <RaffleCard key={raffle.id} raffle={raffle} onClick={() => navigate(`/raffles/${raffle.id}`)} />
          ))}
        </div>
      )}

      {showCreate && <CreateRaffleModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
    </PageShell>
  );
}
