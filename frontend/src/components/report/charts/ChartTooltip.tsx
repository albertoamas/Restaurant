interface PayloadEntry {
  name:  string;
  value: number | string;
  color: string;
}

interface Props {
  active?:    boolean;
  payload?:   PayloadEntry[];
  label?:     string;
  formatter?: (value: number | string, name: string) => string;
}

export function ChartTooltip({ active, payload, label, formatter }: Props) {
  if (!active || !payload?.length) return null;

  return (
    <div
      style={{
        background:   'var(--color-surface-card)',
        border:       '1px solid var(--border-strong)',
        borderRadius: '12px',
        padding:      '10px 14px',
        boxShadow:    'var(--shadow-card-lg)',
      }}
    >
      {label && (
        <p style={{ color: '#9ca3af', fontSize: 11, fontWeight: 600, marginBottom: 6 }}>
          {label}
        </p>
      )}
      {payload.map((item, i) => (
        <p key={i} style={{ fontSize: 12, fontWeight: 600, lineHeight: '1.6', color: item.color }}>
          {item.name}:{' '}
          <span style={{ color: 'var(--color-text-main)' }}>
            {formatter ? formatter(item.value, item.name) : item.value}
          </span>
        </p>
      ))}
    </div>
  );
}
