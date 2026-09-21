/** Estilo e input label compartidos por los formularios de gastos. */

export const FIELD =
  'w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--color-surface-card)] px-3 py-2.5 text-sm text-gray-700 ' +
  'outline-none transition-[border-color,box-shadow] placeholder:text-gray-400 ' +
  'focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/20';

export function Field({
  label, hint, optional, children,
}: {
  label: string;
  hint?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
        {label}
        {optional && <span className="ml-1 font-medium normal-case tracking-normal text-gray-400">opcional</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-gray-400">{hint}</span>}
    </label>
  );
}
