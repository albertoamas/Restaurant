import { useState, useRef, useEffect } from 'react';

function toTitleCase(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
import type { CreateCustomerRequest, CustomerSearchResult } from '@pos/shared';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
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
      name: toTitleCase(newName),
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
        className="w-full flex items-center justify-center gap-2 min-h-11 px-4 rounded-control
          border border-line bg-surface-card text-body font-semibold text-main
          hover:bg-surface-2 hover:border-line-strong transition-colors"
      >
        <Icon name="user" size={16} className="shrink-0 text-muted" />
        <span>Agregar cliente (opcional)</span>
      </button>
    );
  }

  // Selected customer chip
  if (selected) {
    const label = selected.type === 'existing'
      ? `${selected.name}, ${selected.purchaseCount} compra${selected.purchaseCount !== 1 ? 's' : ''}`
      : `${selected.createCustomer.name}${selected.createCustomer.phone ? `, ${selected.createCustomer.phone}` : ''} (nuevo)`;

    return (
      <div className="flex items-center gap-2 min-h-12 pl-3.5 pr-1 rounded-control bg-green-600/10 border border-green-600/30">
        <Icon name="check" size={16} strokeWidth={2} className="text-green-700 dark:text-green-400 shrink-0" />
        <span className="text-body text-main font-medium flex-1 truncate">{label}</span>
        <button type="button" onClick={clearSelection} aria-label="Quitar cliente" className="w-10 h-10 flex items-center justify-center rounded-full text-muted hover:text-main hover:bg-surface-2 transition-colors">
          <Icon name="x" size={16} strokeWidth={2} />
        </button>
      </div>
    );
  }

  // Create new customer form
  if (mode === 'create') {
    return (
      <div className="rounded-card border border-line bg-surface-2 p-4 space-y-3">
        <p className="text-body font-semibold text-main">Nuevo cliente</p>
        <Input autoFocus label="Nombre" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <Input type="tel" label="Teléfono (opcional)" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
        <div className="flex gap-2 pt-1">
          <Button variant="secondary" fullWidth onClick={handleCancelCreate}>Cancelar</Button>
          <Button fullWidth onClick={handleSaveNew} disabled={!newName.trim()}>Vincular</Button>
        </div>
      </div>
    );
  }

  // Search mode
  return (
    <div className="space-y-2" ref={dropdownRef}>
      <div className="relative">
        <div className="flex items-center gap-2 min-h-11 pl-3.5 pr-1 rounded-control border border-line bg-surface-card focus-within:ring-[3px] focus-within:ring-primary-500/20 focus-within:border-primary-500 transition-[border-color,box-shadow]">
          <Icon name="search" size={16} className="text-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={() => query.length >= 2 && setShowDropdown(true)}
            aria-label="Buscar cliente"
            placeholder="Nombre o teléfono del cliente"
            className="flex-1 min-w-0 text-body bg-transparent outline-none placeholder:text-muted text-main"
          />
          <button type="button" onClick={handleCollapse} aria-label="Cancelar búsqueda" className="w-9 h-9 flex items-center justify-center rounded-full text-muted hover:text-main hover:bg-surface-2 transition-colors">
            <Icon name="x" size={16} strokeWidth={2} />
          </button>
        </div>

        {showDropdown && (results.length > 0 || loading) && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 border border-line rounded-card shadow-floating max-h-56 overflow-y-auto bg-surface-card">
            {loading && (
              <div className="px-3.5 py-2.5 text-label text-muted">Buscando</div>
            )}
            {results.map((r) => (
              <button
                key={r.id}
                type="button"
                onMouseDown={() => selectExisting(r)}
                className="w-full text-left px-3.5 min-h-12 py-2 hover:bg-surface-2 transition-colors flex items-center justify-between gap-2"
              >
                <div>
                  <p className="text-body font-medium text-main">{r.name}</p>
                  {r.phone && <p className="text-caption text-muted">{r.phone}</p>}
                </div>
                <span className="text-caption bg-surface-2 border border-line text-soft px-2 py-0.5 rounded-full shrink-0">
                  {r.purchaseCount} compra{r.purchaseCount !== 1 ? 's' : ''}
                </span>
              </button>
            ))}
          </div>
        )}

        {showDropdown && !loading && query.trim().length >= 2 && results.length === 0 && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 border border-line rounded-card shadow-floating bg-surface-card overflow-hidden">
            <div className="px-3.5 py-2.5 text-label text-muted">No se encontró ningún cliente</div>
            <button
              type="button"
              onMouseDown={() => { setMode('create'); setNewName(query); setShowDropdown(false); setQuery(''); }}
              className="w-full flex items-center gap-2 text-left px-3.5 min-h-12 text-body text-primary-700 dark:text-primary-400 hover:bg-primary-500/10 transition-colors border-t border-line font-semibold"
            >
              <Icon name="plus" size={16} className="shrink-0" />
              Crear "{query}" como cliente nuevo
            </button>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setMode('create')}
        className="w-full flex items-center justify-center gap-2 min-h-11 px-4 rounded-control
          text-body font-semibold text-soft hover:text-main hover:bg-surface-2 transition-colors"
      >
        <Icon name="plus" size={16} className="shrink-0" />
        Crear cliente nuevo
      </button>
    </div>
  );
}
