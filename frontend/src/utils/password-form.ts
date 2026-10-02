/** Mínimo que exige el backend (ChangePasswordDto), para la actual y la nueva. */
export const MIN_PASSWORD_LENGTH = 6;

/**
 * Contraseña nueva con su repetición (sin la actual): alta de un cajero o de un negocio, o
 * cambiarle la contraseña a otra persona. Sin errores mientras un campo está vacío.
 */
export function newPasswordErrors(password: string, confirm?: string) {
  const errors = {
    password: password && password.length < MIN_PASSWORD_LENGTH ? `Debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres` : undefined,
    confirm:  confirm && confirm !== password ? 'Las contraseñas no coinciden' : undefined,
  };
  const valid = password.length >= MIN_PASSWORD_LENGTH && (confirm === undefined || confirm === password);
  return { errors, valid };
}

export interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Errores por campo mientras se escribe. Un campo vacío no muestra error (todavía no se usó),
 * pero el formulario no es válido hasta que los tres cumplen.
 */
export function validatePasswordForm(f: PasswordForm) {
  const errors: Partial<Record<keyof PasswordForm, string>> = {};

  if (f.newPassword && f.newPassword.length < MIN_PASSWORD_LENGTH) {
    errors.newPassword = `Debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`;
  } else if (f.newPassword && f.newPassword === f.currentPassword) {
    errors.newPassword = 'La nueva debe ser distinta de la actual';
  }
  if (f.confirmPassword && f.confirmPassword !== f.newPassword) {
    errors.confirmPassword = 'Las contraseñas no coinciden';
  }

  // Una actual más corta que el mínimo no puede ser correcta: el servidor la rechazaría con un
  // mensaje técnico en inglés, así que ni se envía.
  const valid = f.currentPassword.length >= MIN_PASSWORD_LENGTH
    && f.newPassword.length >= MIN_PASSWORD_LENGTH
    && f.confirmPassword === f.newPassword
    && Object.keys(errors).length === 0;

  return { errors, valid };
}
