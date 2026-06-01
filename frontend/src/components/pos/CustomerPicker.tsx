import { useState, useRef, useEffect } from 'react';
import type { CreateCustomerRequest, CustomerSearchResult } from '@pos/shared';
import { Icon } from '../ui/Icon';
import { useCustomerSearch } from '../../hooks/useCustomerSearch';

type CustomerValue =
  | { type: 'existing'; customerId: string; name: string; purchaseCount: number }
  | { type: 'new'; createCustomer: CreateCustomerRequest }
  | null;

interface CustomerPickerProps {
  onCustomerChange: (value: { customerId?: string; createCustomer?: CreateCustomerRequest } | null) => void;
}

export function CustomerPicker({ onCustomerChange }: CustomerPickerProps) {
  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState<'search' | 'create'>('search');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<CustomerValue>(null);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const { results, loading, search, clear } = useCustomerSearch();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleQueryChange(val: string) {
    setQuery(val);
    search(val);
    setShowDropdown(true);
  }

  function selectExisting(r: CustomerSearchResult) {
    const value: CustomerValue = { type: 'existing', customerId: r.id, name: r.name, purchaseCount: r.purchaseCount };
    setSelected(value);
    setShowDropdown(false);
    setQuery('');
    clear();
    onCustomerChange({ customerId: r.id });
  }

  function clearSelection() {
    setSelected(null);
    onCustomerChange(null);
    setQuery('');
    clear();
    setMode('search');
  }

  function handleCollapse() {
    setExpanded(false);
    if (!selected) onCustomerChange(null);
  }

  function handleSaveNew() {
    if (!newName.trim()) return;
    const createCustomer: CreateCustomerRequest = {
      name: newName.trim(),
      phone: newPhone.trim() || undefined,
    };
    setSelected({ type: 'new', createCustomer });
    onCustomerChange({ createCustomer });
    setMode('search');
    setNewName('');
    setNewPhone('');
  }

  function handleCancelCreate() {
    setMode('search');
    setNewName('');
    setNewPhone('');
  }

  // Collapsed toggle button
  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => { setExpanded(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl
          border-2 border-white/12 bg-white/5 text-sm font-medium text-gray-400
          hover:border-primary-400/50 hover:text-primary-400 hover:bg-primary-500/10 transition-all duration-150"
      >
        <Icon name="user" size={16} strokeWidth={2} className="shrink-0" />
        <span>Agregar cliente (opcional)</span>
      </button>
    );
  }

  // Selected customer chip
  if (selected) {
    const label = selected.type === 'existing'
      ? `${selected.name} · ${selected.purchaseCount} compra${selected.purchaseCount !== 1 ? 's' : ''}`
      : `${selected.createCustomer.name}${selected.createCustomer.phone ? ` · ${selected.createCustomer.phone}` : ''} (nuevo)`;

    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200">
        <Icon name="check" size={16} strokeWidth={2} className="text-emerald-500 shrink-0" />
        <span className="text-sm text-emerald-800 font-medium flex-1 truncate">{label}</span>
        <button type="button" onClick={clearSelection} aria-label="Quitar cliente" className="text-emerald-500 hover:text-emerald-700 transition-colors">
          <Icon name="x" size={16} strokeWidth={2} />
        </button>
      </div>
    );
  }

  // Create new customer form
  if (mode === 'create') {
    return (
      <div className="rounded-xl border border-gray-200 p-3 space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nuevo cliente</p>
        <input
          autoFocus
          type="text"
          placeholder="Nombre *"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
        <input
          type="tel"
          placeholder="Teléfono (opcional)"
          value={newPhone}
          onChange={(e) => setNewPhone(e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={handleCancelCreate}
            className="flex-1 text-sm text-gray-500 hover:text-gray-700 py-1.5 rounded-lg border border-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSaveNew}
            disabled={!newName.trim()}
            className="flex-1 text-sm bg-primary-600 text-white py-1.5 rounded-lg disabled:opacity-40 hover:bg-primary-700 transition-colors font-medium"
          >
            Vincular
          </button>
        </div>
      </div>
    );
  }

  // Search mode
  return (
    <div className="space-y-2" ref={dropdownRef}>
      <div className="relative">
        <div className="flex items-center gap-2 px-3 py-3 rounded-2xl border-2 border-white/12 bg-white/5 focus-within:border-primary-500/60 transition-colors">
          <Icon name="search" size={16} strokeWidth={2} className="text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={() => query.length >= 2 && setShowDropdown(true)}
            placeholder="Buscar cliente por nombre o teléfono..."
            className="flex-1 text-sm bg-transparent outline-none placeholder-gray-400"
          />
          <button type="button" onClick={handleCollapse} aria-label="Cancelar búsqueda" className="text-gray-300 hover:text-gray-500 transition-colors">
            <Icon name="x" size={16} strokeWidth={2} />
          </button>
        </div>

        {showDropdown && (results.length > 0 || loading) && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 border border-white/12 rounded-xl shadow-lg max-h-48 overflow-y-auto" style={{ background: 'var(--color-surface-card)' }}>
            {loading && (
              <div className="px-3 py-2 text-xs text-gray-400">Buscando...</div>
            )}
            {results.map((r) => (
              <button
                key={r.id}
                type="button"
                onMouseDown={() => selectExisting(r)}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors flex items-center justify-between gap-2"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">{r.name}</p>
                  {r.phone && <p className="text-xs text-gray-400">{r.phone}</p>}
                </div>
                <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full shrink-0">
                  {r.purchaseCount} compra{r.purchaseCount !== 1 ? 's' : ''}
                </span>
              </button>
            ))}
          </div>
        )}

        {showDropdown && !loading && query.trim().length >= 2 && results.length === 0 && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 border border-white/12 rounded-xl shadow-lg" style={{ background: 'var(--color-surface-card)' }}>
            <div className="px-3 py-2 text-xs text-gray-400">No se encontró ningún cliente</div>
            <button
              type="button"
              onMouseDown={() => { setMode('create'); setNewName(query); setShowDropdown(false); setQuery(''); }}
              className="w-full text-left px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 transition-colors border-t border-gray-100 font-medium"
            >
              + Crear "{query}" como nuevo cliente
            </button>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setMode('create')}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl
          border-2 border-white/12 bg-white/5 text-sm font-medium text-gray-400
          hover:border-primary-400/50 hover:text-primary-400 hover:bg-primary-500/10 transition-all duration-150"
      >
        <Icon name="plus" size={16} strokeWidth={2} className="shrink-0" />
        Crear nuevo cliente
      </button>
    </div>
  );
}
