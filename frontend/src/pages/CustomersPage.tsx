import { useState, useEffect } from 'react';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { useCustomers } from '../hooks/useCustomers';
import { customersApi } from '../api/customers.api';
import { ordersApi } from '../api/orders.api';
import { handleApiError } from '../utils/api-error';
import type { CustomerStatsDto, OrderDto } from '@pos/shared';
import { OrderStatus, OrderType, PaymentMethod } from '@pos/shared';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
}

const ORDER_TYPE_LABEL: Record<OrderType, string> = {
  [OrderType.DINE_IN]: 'Mesa',
  [OrderType.TAKEOUT]: 'Para llevar',
  [OrderType.DELIVERY]: 'Delivery',
};

const STATUS_STYLE: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'bg-yellow-100 text-yellow-700',
  [OrderStatus.PREPARING]: 'bg-blue-100 text-blue-700',
  [OrderStatus.DELIVERED]: 'bg-gray-100 text-gray-600',
  [OrderStatus.CANCELLED]: 'bg-red-100 text-red-500',
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'Pendiente',
  [OrderStatus.PREPARING]: 'Preparando',
  [OrderStatus.DELIVERED]: 'Entregado',
  [OrderStatus.CANCELLED]: 'Cancelado',
};

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: 'Efectivo',
  [PaymentMethod.QR]: 'QR',
  [PaymentMethod.TRANSFER]: 'Transferencia',
  [PaymentMethod.CORTESIA]: 'Cortesía',
};

// ── Sort header ───────────────────────────────────────────────────────────────

type SortBy = 'name' | 'totalSpent' | 'purchaseCount';
type SortDir = 'asc' | 'desc';

function SortHeader({
  label, col, sortBy, sortDir, onSort, align = 'left',
}: {
  label: string;
  col: SortBy;
  sortBy: SortBy;
  sortDir: SortDir;
  onSort: (col: SortBy) => void;
  align?: 'left' | 'right';
}) {
  const active = sortBy === col;
  return (
    <button
      onClick={() => onSort(col)}
      className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-wide transition-colors select-none ${
        active ? 'text-primary-600' : 'text-gray-500 hover:text-gray-700'
      } ${align === 'right' ? 'justify-end w-full' : ''}`}
    >
      {label}
      <span className="flex flex-col gap-[1px]">
        <svg className={`w-2.5 h-2.5 ${active && sortDir === 'asc' ? 'text-primary-500' : 'text-gray-300'}`} viewBox="0 0 10 6" fill="currentColor">
          <path d="M5 0L10 6H0z" />
        </svg>
        <svg className={`w-2.5 h-2.5 ${active && sortDir === 'desc' ? 'text-primary-500' : 'text-gray-300'}`} viewBox="0 0 10 6" fill="currentColor">
          <path d="M5 6L0 0h10z" />
        </svg>
      </span>
    </button>
  );
}

// ── Order history ─────────────────────────────────────────────────────────────

function CustomerOrderHistory({ customerId }: { customerId: string }) {
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersApi.getAll({ customerId, limit: 50 }).then((r) => setOrders(r.data)).catch(() => setOrders([])).finally(() => setLoading(false));
  }, [customerId]);

  if (loading) return <div className="flex justify-center py-4"><Spinner /></div>;
  if (orders.length === 0) return <p className="text-xs text-gray-400 text-center py-3">Sin pedidos registrados</p>;

  return (
    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
      {orders.map((o) => (
        <div key={o.id} className="bg-gray-50 rounded-xl px-3 py-2.5">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-gray-700">#{o.orderNumber}</span>
              <span className="text-xs text-gray-400">{ORDER_TYPE_LABEL[o.type]}</span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-400">{o.paymentMethod ? PAYMENT_LABEL[o.paymentMethod] : '—'}</span>
            </div>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${STATUS_STYLE[o.status]}`}>
              {STATUS_LABEL[o.status]}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 truncate max-w-[180px]">
              {o.items.map((i) => `${i.quantity}× ${i.productName}`).join(', ')}
            </p>
            <p className="text-xs font-semibold text-gray-900 shrink-0 ml-2">Bs {o.total.toFixed(2)}</p>
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(o.createdAt)}</p>
        </div>
      ))}
    </div>
  );
}

// ── Detail modal ──────────────────────────────────────────────────────────────

function CustomerDetailModal({
  customer,
  onClose,
  onUpdate,
}: {
  customer: CustomerStatsDto;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone ?? '');
  const [email, setEmail] = useState(customer.email ?? '');
  const [notes, setNotes] = useState(customer.notes ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSaveEdit() {
    setSaving(true);
    try {
      await customersApi.update(customer.id, {
        name: name.trim() || undefined,
        phone: phone.trim() || null,
        email: email.trim() || null,
        notes: notes.trim() || null,
      });
      onUpdate();
      setEditMode(false);
    } catch (err) {
      handleApiError(err, 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen onClose={onClose} title="Detalle del Cliente" size="sm">
      {/* Purchase stats */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-gray-900 font-heading">{customer.purchaseCount}</p>
          <p className="text-xs text-gray-400 mt-0.5">Compras</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-gray-900 font-heading">Bs {customer.totalSpent.toFixed(0)}</p>
          <p className="text-xs text-gray-400 mt-0.5">Total gastado</p>
        </div>
      </div>
      <p className="text-xs text-gray-400 mb-4">Última compra: {formatDate(customer.lastOrderAt)}</p>

      {/* Customer info */}
      {editMode ? (
        <div className="space-y-2 mb-4">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre *"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300" />
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Teléfono"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300" />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300" />
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas (opcional)" rows={2}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none" />
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setEditMode(false)} disabled={saving}>Cancelar</Button>
            <Button variant="primary" fullWidth onClick={handleSaveEdit} loading={saving}>Guardar</Button>
          </div>
        </div>
      ) : (
        <div className="mb-4 space-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">{customer.name}</p>
              {customer.phone && <p className="text-sm text-gray-500">{customer.phone}</p>}
              {customer.email && <p className="text-sm text-gray-500">{customer.email}</p>}
              {customer.notes && <p className="text-xs text-gray-400 mt-1 italic">{customer.notes}</p>}
            </div>
            <button onClick={() => setEditMode(true)} className="text-xs text-primary-500 hover:text-primary-700 underline">
              Editar
            </button>
          </div>
        </div>
      )}

      {/* Order history */}
      <div className="border-t border-gray-100 pt-4 mt-2">
        <p className="text-sm font-medium text-gray-800 mb-3">Historial de pedidos</p>
        <CustomerOrderHistory customerId={customer.id} />
      </div>
    </Modal>
  );
}

// ── Create modal ──────────────────────────────────────────────────────────────

function CreateCustomerModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await customersApi.create({
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onCreated();
      onClose();
    } catch (err) {
      handleApiError(err, 'Error al crear cliente');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen onClose={onClose} title="Nuevo Cliente" size="sm">
      <div className="space-y-3">
        <input autoFocus type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre *"
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-300" />
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Teléfono"
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-300" />
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-300" />
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas (opcional)" rows={2}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none" />
        <div className="flex gap-2 pt-1">
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button variant="primary" fullWidth onClick={handleSubmit} loading={saving} disabled={!name.trim()}>
            Crear Cliente
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function CustomersPage() {
  const { customers, loading, q, setQ, reload, total, page, totalPages, setPage, sortBy, sortDir, setSort } = useCustomers();
  const [selected, setSelected] = useState<CustomerStatsDto | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchTimer, setSearchTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  function handleSearchChange(val: string) {
    setSearchInput(val);
    if (searchTimer) clearTimeout(searchTimer);
    const t = setTimeout(() => setQ(val), 350);
    setSearchTimer(t);
  }

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="rounded-2xl border border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_10px_30px_oklch(0.13_0.012_260/0.10)] p-4 sm:p-5 mb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 font-heading">Clientes</h1>
            <p className="text-xs text-gray-500 mt-0.5">{total} registrado{total !== 1 ? 's' : ''}</p>
          </div>
          <Button variant="primary" onClick={() => setShowCreate(true)}>+ Nuevo cliente</Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Buscar por nombre o teléfono..."
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white/90"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : customers.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-500">
            {q ? 'No se encontraron clientes' : 'Sin clientes registrados aún'}
          </p>
          {!q && (
            <button onClick={() => setShowCreate(true)} className="mt-2 text-sm text-primary-500 hover:text-primary-700 underline">
              Crear el primer cliente
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/70 shadow-[0_8px_24px_oklch(0.13_0.012_260/0.10)] overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[2fr_1fr_1fr] gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50">
            <SortHeader label="Nombre" col="name" sortBy={sortBy} sortDir={sortDir} onSort={setSort} />
            <SortHeader label="Gastado" col="totalSpent" sortBy={sortBy} sortDir={sortDir} onSort={setSort} align="right" />
            <SortHeader label="Compras" col="purchaseCount" sortBy={sortBy} sortDir={sortDir} onSort={setSort} align="right" />
          </div>

          {/* Rows */}
          {customers.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelected(c)}
              className="w-full grid grid-cols-[2fr_1fr_1fr] gap-3 px-4 py-3.5 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                <p className="text-xs text-gray-400 truncate">{c.phone ?? c.email ?? '—'}</p>
              </div>
              <p className="text-sm text-gray-700 text-right self-center">Bs {c.totalSpent.toFixed(0)}</p>
              <p className="text-sm font-semibold text-gray-900 text-right self-center">{c.purchaseCount}</p>
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-xs text-gray-500">
            Página {page} de {totalPages} · {total} clientes
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Anterior
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pg: number;
              if (totalPages <= 7) {
                pg = i + 1;
              } else if (page <= 4) {
                pg = i + 1;
              } else if (page >= totalPages - 3) {
                pg = totalPages - 6 + i;
              } else {
                pg = page - 3 + i;
              }
              return (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  className={`w-8 h-8 text-xs font-medium rounded-lg border transition-colors ${
                    pg === page
                      ? 'bg-primary-500 border-primary-500 text-white'
                      : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {pg}
                </button>
              );
            })}
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <CustomerDetailModal
          customer={selected}
          onClose={() => setSelected(null)}
          onUpdate={() => { reload(); setSelected(null); }}
        />
      )}

      {/* Create modal */}
      {showCreate && (
        <CreateCustomerModal onClose={() => setShowCreate(false)} onCreated={reload} />
      )}
    </div>
  );
}
