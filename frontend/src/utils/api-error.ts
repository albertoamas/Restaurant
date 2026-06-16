import axios from 'axios';
import toast from 'react-hot-toast';

/** Extracts a user-friendly string from an Axios error without side effects. */
export function getApiErrorMessage(err: unknown, fallback = 'Ocurrió un error'): string {
  let message: string | string[] = fallback;
  if (axios.isAxiosError(err)) {
    message = err.response?.data?.message ?? fallback;
  }
  return Array.isArray(message) ? message.join(', ') : String(message);
}

/**
 * Extract a user-friendly message from an Axios error and show a toast.
 * Replaces the repeated `catch (err: any) { toast.error(...) }` pattern.
 */
export function handleApiError(err: unknown, fallback = 'Ocurrió un error'): void {
  toast.error(getApiErrorMessage(err, fallback));
}
