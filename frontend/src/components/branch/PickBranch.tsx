import { useAuth, BRANCH_PINNED_KEY } from '../../context/auth.context';
import { useBranches } from '../../hooks/useBranches';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';

/**
 * El dueño en la vista consolidada, en una pantalla que exige una sucursal concreta (caja,
 * cocina): la elige aquí mismo, sin buscar el selector del menú.
 */
export function PickBranch({ description }: { description: string }) {
  const { setCurrentBranch } = useAuth();
  const { branches: all } = useBranches();
  const branches = all.filter((b) => b.isActive);

  const select = (id: string) => {
    // Igual que el selector del menú: la elección del dueño se respeta entre sesiones.
    localStorage.setItem(BRANCH_PINNED_KEY, '1');
    setCurrentBranch(id);
  };

  return (
    <EmptyState
      icon="building"
      title="Elige una sucursal"
      description={description}
      action={branches.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {branches.map((b) => (
            <Button key={b.id} variant="secondary" onClick={() => select(b.id)}>{b.name}</Button>
          ))}
        </div>
      )}
    />
  );
}
