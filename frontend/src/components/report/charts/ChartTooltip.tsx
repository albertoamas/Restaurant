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
        border:       '1px solid rgba(255,255,255,0.12)',
        borderRadius: '12px',
        padding:      '10px 14px',
        boxShadow:    '0 8px 32px rgba(0,0,0,0.4)',
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
          <span style={{ color: '#f9fafb' }}>
            {formatter ? formatter(item.value, item.name) : item.value}
          </span>
        </p>
      ))}
    </div>
  );
}
