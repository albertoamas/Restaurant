import { useState } from 'react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { UserRole, isUnlimited } from '@pos/shared';
import type { BranchDto } from '@pos/shared';
import { branchesApi } from '../api/branches.api';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import { PageHeader } from '../components/ui/PageHeader';
import { PageShell } from '../components/ui/PageShell';
import { Skeleton } from '../components/ui/Skeleton';
import { BranchFormModal, type BranchFormData } from '../components/branch/BranchFormModal';
import { BranchSheet } from '../components/branch/BranchSheet';
import { useBranches } from '../hooks/useBranches';
import { useUsers } from '../hooks/useUsers';
import { useSettingsStore } from '../store/settings.store';
import { queryKeys } from '../lib/query-keys';
import { handleApiError } from '../utils/api-error';

export function BranchesPage() {
  const queryClient = useQueryClient();
  const { branches, loading: branchesLoading } = useBranches();
  const { users, loading: usersLoading } = useUsers();
  const maxBranches = useSettingsStore((s) => s.planLimits?.maxBranches);
  const loading = branchesLoading || usersLoading;

  const sorted = [...branches]
    .sort((a, b) => Number(b.isActive) - Number(a.isActive) || a.name.localeCompare(b.name, 'es'));
  // El plan cuenta solo las sucursales activas.
  const activeCount = branches.filter((b) => b.isActive).length;
  const limited = maxBranches !== undefined && !isUnlimited(maxBranches);
  const full = limited && activeCount >= (maxBranches as number);

  // El backend solo frena la desactivación por cajeros activos: los inactivos no cuentan.
  const cashiersOf = (branchId: string) =>
    users.filter((u) => u.role !== UserRole.OWNER && u.isActive && u.branchId === branchId);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm]             = useState<{ open: boolean; branch: BranchDto | null }>({ open: false, branch: null });
  const [toggling, setToggling]     = useState<BranchDto | null>(null);
  const [busy, setBusy]             = useState(false);
  const selected = branches.find((b) => b.id === selectedId) ?? null;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.branches });

  const save = async (data: BranchFormData) => {
    try {
      if (form.branch) {
        await branchesApi.update(form.branch.id, data);
        toast.success('Sucursal actualizada');
      } else {
        await branchesApi.create(data);
        toast.success(`${data.name} creada`);
      }
      setForm({ open: false, branch: null });
      invalidate();
    } catch (err) {
      handleApiError(err, form.branch ? 'Error al actualizar la sucursal' : 'Error al crear la sucursal');
    }
  };

  const confirmToggle = async () => {
    if (!toggling) return;
    setBusy(true);
    try {
      const updated = await branchesApi.toggle(toggling.id);
      toast.success(updated.isActive ? `${toggling.name} vuelve a estar activa` : `${toggling.name} desactivada`);
      setToggling(null);
      invalidate();
    } catch (err) {
      handleApiError(err, 'Error al cambiar el estado de la sucursal');
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell>
      <PageHeader
        title="Sucursales"
        description={limited ? `${activeCount} de ${maxBranches} sucursales activas de tu plan.` : `${activeCount} sucursales activas.`}
        actions={
          <Button onClick={() => setForm({ open: true, branch: null })} disabled={full}>
            <Icon name="plus" size={18} />
            Nueva sucursal
          </Button>
        }
      >
        {full && (
          <p className="flex items-start gap-2 rounded-control border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-label text-amber-800 dark:text-amber-300">
            <Icon name="warning" size={16} className="mt-0.5 shrink-0" />
            Llegaste al máximo de {maxBranches} sucursales activas de tu plan. Desactiva una que ya no uses para abrir otra.
          </p>
        )}
      </PageHeader>

      {loading ? (
        <div className="space-y-3"><Skeleton variant="card" /><Skeleton variant="card" /></div>
      ) : sorted.length === 0 ? (
        <EmptyState
          icon="building"
          title="Todavía no tienes sucursales"
          description="Crea una para empezar a vender y abrir caja."
          action={<Button onClick={() => setForm({ open: true, branch: null })}>Crear la primera</Button>}
        />
      ) : (
        <section className="overflow-hidden rounded-card border border-line bg-surface-card shadow-raised">
          <ul className="divide-y divide-line">
            {sorted.map((b) => {
              const n = cashiersOf(b.id).length;
              // Los cajeros primero: en celular la línea se corta por el final.
              const details = [n === 0 ? 'Sin cajeros' : n === 1 ? '1 cajero' : `${n} cajeros`, b.address, b.phone].filter(Boolean);
              return (
                <li key={b.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(b.id)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-2 focus-visible:outline-none focus-visible:bg-surface-2"
                  >
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-control border border-line ${
                      b.isActive ? 'bg-primary-500/10 text-primary-700 dark:text-primary-400' : 'bg-surface-2 text-muted'
                    }`}>
                      <Icon name="building" size={18} />
                    </span>
                    <div className={`min-w-0 flex-1 ${b.isActive ? '' : 'opacity-60'}`}>
                      <div className="flex items-center gap-2">
                        <p className="min-w-0 truncate text-body font-semibold text-main">{b.name}</p>
                        {b.isActive ? <Badge variant="success" dot>Activa</Badge> : <Badge dot>Inactiva</Badge>}
                      </div>
                      <p className="truncate text-caption text-muted">{details.join('. ')}</p>
                    </div>
                    <Icon name="chevron-right" size={16} className="shrink-0 text-muted" />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {selected && (
        <BranchSheet
          branch={selected}
          cashiers={cashiersOf(selected.id)}
          canActivate={!full}
          maxBranches={maxBranches}
          onClose={() => setSelectedId(null)}
          onEdit={() => { setForm({ open: true, branch: selected }); setSelectedId(null); }}
          onToggle={() => setToggling(selected)}
        />
      )}

      {form.open && (
        <BranchFormModal branch={form.branch} onClose={() => setForm({ open: false, branch: null })} onSubmit={save} />
      )}

      <ConfirmModal
        isOpen={toggling !== null}
        onClose={() => setToggling(null)}
        onConfirm={confirmToggle}
        loading={busy}
        variant={toggling?.isActive ? 'danger' : 'primary'}
        title={toggling ? (toggling.isActive ? `Desactivar ${toggling.name}` : `Activar ${toggling.name}`) : ''}
        message={toggling?.isActive
          ? 'Deja de aparecer en el selector de sucursal y no se puede vender ni abrir caja ahí. Sus ventas y reportes se conservan y puedes volver a activarla.'
          : 'Vuelve a aparecer en el selector de sucursal: se puede vender, abrir caja y asignarle cajeros.'}
        confirmLabel={toggling?.isActive ? 'Desactivar' : 'Activar'}
        cancelLabel="Volver"
      />
    </PageShell>
  );
}
