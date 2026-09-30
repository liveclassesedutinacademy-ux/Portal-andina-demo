// Validación del registro de tenderos (HU-101). Las reglas de teléfono y correo valen también para HU-102 (D8).
import { z } from 'zod';
import { MENSAJES_DOCUMENTO, normalizarDocumento, TIPOS_DOCUMENTO, validarDocumento } from './documento.js';

/** Mensajes aprobados en la historia y en las decisiones del equipo (D1). */
const MENSAJE = {
  vendedor: 'Falta el vendedor.',
  tipoDocumento: 'Elige el tipo de documento: DI, RT o PA.',
  nombre: 'El nombre del tendero es obligatorio.',
  nombreTienda: 'El nombre de la tienda es obligatorio.',
  telefono: 'El teléfono es obligatorio.',
  telefonoInvalido: 'El teléfono debe tener de 7 a 10 dígitos.',
  correoInvalido: 'El correo no es válido.',
  direccion: 'La dirección es obligatoria.',
  maximo: 'Cada campo admite máximo 100 caracteres.',
} as const;

/**
 * Texto para las reglas que no tienen mensaje aprobado: número de documento vacío o que no es texto,
 * campo de texto con otro tipo de dato y cuerpo que no es un objeto. Se reemplaza cuando se apruebe su texto.
 */
export const MENSAJE_GENERAL = 'Revisa los datos del tendero.';

/** Todos los textos que puede devolver la validación del registro. */
export const MENSAJES: readonly string[] = [
  ...Object.values(MENSAJE),
  ...Object.values(MENSAJES_DOCUMENTO),
  MENSAJE_GENERAL,
];

const MAXIMO = 100;
const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Orden del formulario (D3); el vendedor no es un campo del formulario y va primero. */
const ORDEN = ['vendedorId', 'tipoDocumento', 'numeroDocumento', 'nombre', 'nombreTienda', 'telefono', 'correo', 'direccion'];

/** Un campo ausente o nulo es «obligatorio»; otro tipo de dato no tiene mensaje aprobado. */
const errorDeTipo = (obligatorio: string) => (issue: { input?: unknown }) =>
  issue.input === undefined || issue.input === null ? obligatorio : MENSAJE_GENERAL;

/** Texto obligatorio: sin los espacios de los extremos (D2), no vacío (PT3) y de máximo 100 caracteres. */
const textoObligatorio = (mensaje: string) =>
  z.string({ error: errorDeTipo(mensaje) }).trim().min(1, { error: mensaje }).max(MAXIMO, { error: MENSAJE.maximo });

/** Teléfono obligatorio: sin espacios ni guiones deben quedar de 7 a 10 dígitos; se devuelve como se escribió (P2). */
export const esquemaTelefono = z
  .string({ error: errorDeTipo(MENSAJE.telefono) })
  .trim()
  .min(1, { error: MENSAJE.telefono })
  .max(MAXIMO, { error: MENSAJE.maximo })
  .refine((v) => v === '' || /^\d{7,10}$/.test(v.replace(/[ -]/g, '')), { error: MENSAJE.telefonoInvalido });

/** Correo opcional (P3 a); vacío o con solo espacios cuenta como no escrito y queda nulo (D4). */
export const esquemaCorreo = z
  .string({ error: MENSAJE.correoInvalido })
  .trim()
  .max(MAXIMO, { error: MENSAJE.maximo })
  .refine((v) => v === '' || FORMATO_CORREO.test(v), { error: MENSAJE.correoInvalido })
  .nullish()
  .transform((v) => v || null);

export const esquemaRegistroTendero = z
  .object(
    {
      vendedorId: z.int({ error: MENSAJE.vendedor }).positive({ error: MENSAJE.vendedor }),
      tipoDocumento: z.enum(TIPOS_DOCUMENTO, { error: MENSAJE.tipoDocumento }),
      // Se valida abajo, porque el mensaje depende del tipo de documento.
      numeroDocumento: z.unknown().optional(),
      nombre: textoObligatorio(MENSAJE.nombre),
      nombreTienda: textoObligatorio(MENSAJE.nombreTienda),
      telefono: esquemaTelefono,
      correo: esquemaCorreo,
      direccion: textoObligatorio(MENSAJE.direccion),
    },
    { error: MENSAJE_GENERAL },
  )
  .superRefine(
    (datos, ctx) => {
      const tipo = datos?.tipoDocumento;
      if (!TIPOS_DOCUMENTO.includes(tipo)) return; // El tipo ya tiene su propio error.
      const numero = datos.numeroDocumento;
      if (typeof numero !== 'string' || numero.trim() === '') {
        ctx.addIssue({ code: 'custom', path: ['numeroDocumento'], message: MENSAJE_GENERAL });
      } else if (!validarDocumento(tipo, numero).valido) {
        ctx.addIssue({ code: 'custom', path: ['numeroDocumento'], message: MENSAJES_DOCUMENTO[tipo] });
      }
    },
    // Se ejecuta aunque otro campo haya fallado, para respetar el orden de D3.
    { when: () => true },
  )
  // Solo llega aquí si todo es válido: el número ya pasó validarDocumento.
  .transform((datos) => ({ ...datos, numeroDocumento: normalizarDocumento(datos.tipoDocumento, datos.numeroDocumento as string) }));

export type RegistroTendero = z.output<typeof esquemaRegistroTendero>;

/** Mensaje del primer campo que falla, en el orden del formulario (D3). */
export function primerError(resultado: { error: z.ZodError }): string {
  const posicion = (campo: PropertyKey | undefined) => ORDEN.indexOf(String(campo));
  const [primero] = [...resultado.error.issues].sort((a, b) => posicion(a.path[0]) - posicion(b.path[0]));
  return primero.message;
}
