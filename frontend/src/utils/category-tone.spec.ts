import { describe, it, expect } from 'vitest';
import type { CategoryDto } from '@pos/shared';
import { buildCategoryTones, productInitial, CATEGORY_TONES } from './category-tone';

const cat = (id: string, name: string, sortOrder: number): CategoryDto => ({ id, name, sortOrder, isActive: true });

describe('buildCategoryTones', () => {
  it('asigna el tono por orden de la categoría, no por el orden en que llega la lista', () => {
    const a = buildCategoryTones([cat('b', 'Bebidas', 2), cat('p', 'Platos', 1)]);
    const b = buildCategoryTones([cat('p', 'Platos', 1), cat('b', 'Bebidas', 2)]);
    expect(a.get('p')).toBe(CATEGORY_TONES[0]);
    expect(a.get('b')).toBe(CATEGORY_TONES[1]);
    expect(a).toEqual(b);
  });

  it('con más categorías que tonos, repite la paleta', () => {
    const many = Array.from({ length: CATEGORY_TONES.length + 1 }, (_, i) => cat(`c${i}`, `C${i}`, i));
    expect(buildCategoryTones(many).get(`c${CATEGORY_TONES.length}`)).toBe(CATEGORY_TONES[0]);
  });
});

describe('productInitial', () => {
  it('toma la primera letra, en mayúscula', () => {
    expect(productInitial('salteña de pollo')).toBe('S');
    expect(productInitial('  (2x) Api')).toBe('2');
    expect(productInitial('ñandú')).toBe('Ñ');
  });
});
