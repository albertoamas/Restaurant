import { describe, it, expect } from 'vitest';
import { validatePasswordForm } from './password-form';

const form = (currentPassword: string, newPassword: string, confirmPassword: string) =>
  ({ currentPassword, newPassword, confirmPassword });

describe('validatePasswordForm', () => {
  it('vacío: sin errores pero no válido', () => {
    expect(validatePasswordForm(form('', '', ''))).toEqual({ errors: {}, valid: false });
  });

  it('nueva corta, igual a la actual o sin coincidir', () => {
    expect(validatePasswordForm(form('abcdef', 'abc', '')).errors.newPassword).toMatch(/al menos 6/);
    expect(validatePasswordForm(form('abcdef', 'abcdef', 'abcdef')).errors.newPassword).toMatch(/distinta/);
    expect(validatePasswordForm(form('abcdef', 'nueva123', 'nueva12')).errors.confirmPassword).toMatch(/no coinciden/);
  });

  it('válido solo con los tres campos correctos', () => {
    expect(validatePasswordForm(form('abcdef', 'nueva123', 'nueva123')).valid).toBe(true);
    expect(validatePasswordForm(form('abc', 'nueva123', 'nueva123')).valid).toBe(false);
  });
});
