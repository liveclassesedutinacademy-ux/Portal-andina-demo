// Búsqueda de tenderos por nombre de tienda (HU-103). Las reglas P2 a P4 son propuestas pendientes de aprobación
// (docs/planes/HU-103-decisiones-propuestas.md).
import { z } from 'zod';
import { MENSAJE_GENERAL } from './tendero.js';

/** Con menos caracteres se devuelve la lista completa de la zona (CA3, P3). */
export const MINIMO_BUSQUEDA = 3;

/** Texto en minúsculas y sin marcas diacríticas (tildes, diéresis y la de la ñ), para comparar nombres de tienda (CA2, P2). */
export function comparable(texto: string): string {
  return texto.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
}

/**
 * `?buscar=` de la lista: texto opcional que se compara sin los espacios de los extremos (P3).
 * Da el texto comparable, o '' si tiene menos de 3 caracteres y no hay que filtrar.
 * Si no es texto (parámetro repetido), el mensaje general de D10 (P4).
 */
export const esquemaBusqueda = z
  .string({ error: MENSAJE_GENERAL })
  .optional()
  .transform((texto) => {
    const limpio = comparable(texto?.trim() ?? '');
    return limpio.length >= MINIMO_BUSQUEDA ? limpio : '';
  });
