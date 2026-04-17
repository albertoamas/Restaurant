import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { useRaffles } from '../hooks/useRaffles';
import { RaffleCard } from '../components/raffles/RaffleCard';
import { CreateRaffleModal } from '../components/raffles/CreateRaffleModal';
import { RaffleDetailModal } from '../components/raffles/RaffleDetailModal';
import { WinnerModal } from '../components/raffles/WinnerModal';
import type { RaffleDto } from '@pos/shared';
import type { DetailRaffle } from '../components/raffles/types';

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
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
  const { raffles, setRaffles, loading, reload } = useRaffles();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [winner, setWinner] = useState<DetailRaffle | null>(null);

  function handleCreated(raffle: RaffleDto) {
    setRaffles((prev) => [raffle, ...prev]);
    setSelectedId(raffle.id);
  }

  const activeCount = raffles.filter((r) => r.status === 'ACTIVE').length;

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">
      <div className="rounded-2xl border border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_10px_30px_oklch(0.13_0.012_260/0.10)] p-4 sm:p-5 mb-5">
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
            <RaffleCard key={raffle.id} raffle={raffle} onClick={() => setSelectedId(raffle.id)} />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateRaffleModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />
      )}

      {selectedId && (
        <RaffleDetailModal
          raffleId={selectedId}
          onClose={() => setSelectedId(null)}
          onUpdate={reload}
          onDraw={(r) => setWinner(r)}
        />
      )}

      {winner && (
        <WinnerModal raffle={winner} onClose={() => { setWinner(null); reload(); }} />
      )}
    </div>
  );
}
