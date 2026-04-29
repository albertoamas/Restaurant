import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn() },
}));

vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>();
  return {
    ...actual,
    default: {
      ...actual.default,
      isAxiosError: vi.fn(),
    },
  };
});

import axios from 'axios';
import toast from 'react-hot-toast';
import { handleApiError } from './api-error';

const mockedIsAxiosError = vi.mocked(axios.isAxiosError);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('handleApiError', () => {
  it('muestra el mensaje string de la respuesta cuando es AxiosError', () => {
    mockedIsAxiosError.mockReturnValue(true);
    const err = { response: { data: { message: 'Producto no encontrado' } } };
    handleApiError(err);
    expect(toast.error).toHaveBeenCalledWith('Producto no encontrado');
  });

  it('une el array de mensajes con coma cuando la respuesta es un array', () => {
    mockedIsAxiosError.mockReturnValue(true);
    const err = { response: { data: { message: ['Campo A requerido', 'Campo B inválido'] } } };
    handleApiError(err);
    expect(toast.error).toHaveBeenCalledWith('Campo A requerido, Campo B inválido');
  });

  it('muestra el fallback cuando es AxiosError sin message en data', () => {
    mockedIsAxiosError.mockReturnValue(true);
    const err = { response: { data: {} } };
    handleApiError(err, 'Error al guardar');
    expect(toast.error).toHaveBeenCalledWith('Error al guardar');
  });

  it('muestra el fallback para errores desconocidos (no Axios)', () => {
    mockedIsAxiosError.mockReturnValue(false);
    handleApiError(new Error('algo raro'), 'Ocurrió un error');
    expect(toast.error).toHaveBeenCalledWith('Ocurrió un error');
  });

  it('usa el fallback por defecto si no se pasa ninguno', () => {
    mockedIsAxiosError.mockReturnValue(false);
    handleApiError(new Error('cualquier cosa'));
    expect(toast.error).toHaveBeenCalledWith('Ocurrió un error');
  });
});
