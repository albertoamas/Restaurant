import axios from 'axios';
import toast from 'react-hot-toast';

/**
 * Extract a user-friendly message from an Axios error and show a toast.
 * Replaces the repeated `catch (err: any) { toast.error(...) }` pattern.
 */
export function handleApiError(err: unknown, fallback = 'Ocurrió un error'): void {
  let message: string | string[] = fallback;
  if (axios.isAxiosError(err)) {
    message = err.response?.data?.message ?? fallback;
  }
  const msg = Array.isArray(message) ? message.join(', ') : String(message);
  toast.error(msg);
}
