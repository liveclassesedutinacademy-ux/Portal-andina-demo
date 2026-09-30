// Validación del documento del tendero según docs/reglas-documento-tendero.md.

export const TIPOS_DOCUMENTO = ['DI', 'RT', 'PA'] as const;
export type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number];

/** Mensajes aprobados en la historia HU-101 (CA5, CA7 y CA10). */
export const MENSAJES_DOCUMENTO: Record<TipoDocumento, string> = {
  DI: 'El documento de identidad debe tener de 6 a 10 dígitos.',
  RT: 'El registro tributario no es válido.',
  PA: 'El pasaporte debe tener de 6 a 9 letras mayúsculas o dígitos.',
};

const FORMATOS: Record<TipoDocumento, RegExp> = {
  DI: /^\d{6,10}$/,
  RT: /^\d{9}-\d$/,
  PA: /^[A-Z0-9]{6,9}$/,
};

export type ResultadoDocumento = { valido: true; numero: string } | { valido: false; error: string };

/**
 * Quita espacios y puntos. En PA pasa a mayúsculas (P11 b); solo las letras a–z,
 * para que caracteres como «ß» o «á» no se conviertan en letras válidas.
 */
export function normalizarDocumento(tipo: TipoDocumento, numero: string): string {
  const limpio = numero.replace(/[ .]/g, '');
  return tipo === 'PA' ? limpio.replace(/[a-z]/g, (letra) => letra.toUpperCase()) : limpio;
}

/** Dígito de control del RT: pesos del 2 al 10 desde la derecha, residuo de 11; si es 10, el dígito es 0. */
export function digitoControlRT(base: string): number {
  let suma = 0;
  const digitos = base.split('').reverse();
  digitos.forEach((d, i) => {
    suma += Number(d) * (i + 2);
  });
  const residuo = suma % 11;
  return residuo === 10 ? 0 : residuo;
}

/** Devuelve el número normalizado o el mensaje aprobado del tipo de documento. */
export function validarDocumento(tipo: TipoDocumento, numero: string): ResultadoDocumento {
  const normalizado = normalizarDocumento(tipo, numero);
  const error = { valido: false, error: MENSAJES_DOCUMENTO[tipo] } as const;
  if (!FORMATOS[tipo].test(normalizado)) return error;
  if (tipo === 'RT') {
    const [base, digito] = normalizado.split('-');
    if (digitoControlRT(base) !== Number(digito)) return error;
  }
  return { valido: true, numero: normalizado };
}
