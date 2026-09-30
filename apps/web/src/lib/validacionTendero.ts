// Validación del formulario de edición del tendero (HU-102, paso 4). La API sigue siendo la que decide.
// Usa el mismo esquema que la API en lugar de copiar sus reglas (decisiones del equipo: no se copian las reglas),
// así que el formulario acepta y rechaza los mismos valores y muestra los mismos mensajes.
import { esquemaEdicionTendero, primerError } from '../../../api/src/validaciones/tendero';
import type { DatosEdicionTendero } from './api';

/** Devuelve `null` si los datos son válidos o el mensaje del primer campo que falla, en el orden del formulario. */
export function validarEdicionTendero(datos: DatosEdicionTendero): string | null {
  const resultado = esquemaEdicionTendero.safeParse(datos);
  return resultado.success ? null : primerError(resultado);
}
