import { useEffect, useState } from 'react';

/** Hora actual que se recalcula cada `intervalMs` (30 s por defecto): para tiempos en minutos. */
export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
