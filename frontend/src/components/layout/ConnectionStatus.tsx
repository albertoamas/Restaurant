import { useSocket } from '../../context/socket.context';

/**
 * Visual indicator of the WebSocket connection state.
 * - connected    → green dot + "En vivo"
 * - reconnecting → amber dot (pulsing) + "Reconectando..."
 * - disconnected → red dot + "Sin conexión"
 *
 * On mobile, only the dot is shown to save space; the label appears from `sm:` up.
 */
export function ConnectionStatus() {
  const { status } = useSocket();

  const config = {
    connected: {
      dot:   'bg-emerald-500',
      ring:  'bg-emerald-500/30',
      text:  'text-emerald-700',
      label: 'En vivo',
      pulse: false,
    },
    reconnecting: {
      dot:   'bg-amber-500',
      ring:  'bg-amber-500/30',
      text:  'text-amber-700',
      label: 'Reconectando…',
      pulse: true,
    },
    disconnected: {
      dot:   'bg-rose-500',
      ring:  'bg-rose-500/30',
      text:  'text-rose-700',
      label: 'Sin conexión',
      pulse: false,
    },
  }[status];

  return (
    <div
      role="status"
      aria-live="polite"
      title={config.label}
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-gray-50 border border-gray-200/80"
    >
      <span className="relative flex h-2 w-2">
        {config.pulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.ring}`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dot}`} />
      </span>
      <span className={`hidden sm:inline text-[11px] font-semibold ${config.text}`}>
        {config.label}
      </span>
    </div>
  );
}
