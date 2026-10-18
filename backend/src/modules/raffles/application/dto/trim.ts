import { TransformFnParams } from 'class-transformer';

/** Quita los espacios de los extremos: un texto de solo espacios queda vacío y lo rechaza la validación. */
export const trim = ({ value }: TransformFnParams): unknown => (typeof value === 'string' ? value.trim() : value);
