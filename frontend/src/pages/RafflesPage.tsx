import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { Spinner } from '../components/ui/Spinner';
import { useRaffles } from '../hooks/useRaffles';
import { RaffleCard } from '../components/raffles/RaffleCard';
import { CreateRaffleModal } from '../components/raffles/CreateRaffleModal';
import type { RaffleDto } from '@pos/shared';
import { queryKeys } from '../lib/query-keys';

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--border-subtle)] flex items-center justify-center mx-auto mb-4">
        <Icon name="ticket" size={32} strokeWidth={1.5} className="text-gray-400" />
      </div>
      <h3 className="text-base font-bold font-heading text-gray-700 mb-1">Sin sorteos aún</h3>
      <p className="text-sm text-gray-400 max-w-xs mb-6 leading-relaxed">
        Crea un sorteo, asígnale un producto y los tickets se generarán automáticamente con cada pedido.
      </p>
      <Button variant="primary" onClick={onCreate}>+ Crear primer sorteo</Button>
    </div>
  );
}

export function RafflesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { raffles, loading } = useRaffles();
  const [showCreate, setShowCreate] = useState(false);

  function handleCreated(raffle: RaffleDto) {
    queryClient.invalidateQueries({ queryKey: queryKeys.raffles });
    navigate(`/raffles/${raffle.id}`);
  }

  const activeCount = raffles.filter((r) => r.status === 'ACTIVE' || r.status === 'DRAWING').length;

  return (
    <div className="p-4 lg:p-6 animate-slide">
      <div className="rounded-2xl border border-[var(--border-subtle)] shadow-card-xl p-4 sm:p-5 mb-5" style={{ background: 'var(--color-surface-card)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 font-heading">Sorteos</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {raffles.length} sorteo{raffles.length !== 1 ? 's' : ''}
              {activeCount > 0 && (
                <span className="ml-1.5 text-emerald-600 font-semibold">
                  · {activeCount} activo{activeCount !== 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>
          <Button variant="primary" onClick={() => setShowCreate(true)}>+ Nuevo sorteo</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : raffles.length === 0 ? (
        <EmptyState onCreate={() => setShowCreate(true)} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {raffles.map((raffle) => (
            <RaffleCard key={raffle.id} raffle={raffle} onClick={() => navigate(`/raffles/${raffle.id}`)} />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateRaffleModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />
      )}
    </div>
  );
}
