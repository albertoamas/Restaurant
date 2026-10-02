/**
 * Contacto de YankoPOS: lo usan la landing (pedir una demo, planes) y las páginas legales.
 * No hay registro público: todo interesado llega por WhatsApp con el mensaje ya escrito.
 */
export const CONTACT_EMAIL = 'albertoamasv@gmail.com';
export const WHATSAPP_DISPLAY = '+591 74526068';
const WHATSAPP_NUMBER = '59174526068';

export function whatsappUrl(message?: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
}
