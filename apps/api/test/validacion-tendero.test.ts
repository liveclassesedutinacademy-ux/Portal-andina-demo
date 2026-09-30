import { describe, expect, it } from 'vitest';
import {
  esquemaEdicionTendero,
  esquemaRegistroTendero,
  MENSAJE_GENERAL,
  MENSAJE_TELEFONO_SOLO_NUMEROS,
  MENSAJES,
  primerError,
} from '../src/validaciones/tendero.js';

/** Datos válidos base de la historia HU-101. */
const datosBase = (extra: Record<string, unknown> = {}) => ({
  vendedorId: 1,
  tipoDocumento: 'DI',
  numeroDocumento: '999123456',
  nombre: 'Prueba Norte',
  nombreTienda: 'Tienda Prueba Norte',
  telefono: '5550000001',
  correo: 'prueba@ejemplo.test',
  direccion: 'Dirección de prueba 1',
  ...extra,
});

function errorDe(cuerpo: unknown) {
  const resultado = esquemaRegistroTendero.safeParse(cuerpo);
  if (resultado.success) throw new Error('Se esperaba un error de validación');
  return primerError(resultado);
}

function datosDe(cuerpo: unknown) {
  const resultado = esquemaRegistroTendero.safeParse(cuerpo);
  if (!resultado.success) throw new Error(`Error inesperado: ${primerError(resultado)}`);
  return resultado.data;
}

describe('esquemaRegistroTendero', () => {
  it('acepta los datos válidos base', () => {
    expect(datosDe(datosBase())).toEqual(datosBase());
  });

  it('entrega el documento normalizado (CA12, CA11)', () => {
    expect(datosDe(datosBase({ numeroDocumento: '999.124.001' })).numeroDocumento).toBe('999124001');
    expect(datosDe(datosBase({ tipoDocumento: 'RT', numeroDocumento: '999 000 024-4' })).numeroDocumento).toBe('999000024-4');
    expect(datosDe(datosBase({ tipoDocumento: 'PA', numeroDocumento: '999abc' })).numeroDocumento).toBe('999ABC');
  });

  it('rechaza el documento con el mensaje de su tipo (CA5, CA7, CA10)', () => {
    expect(errorDe(datosBase({ numeroDocumento: '99912' }))).toBe('El documento de identidad debe tener de 6 a 10 dígitos.');
    expect(errorDe(datosBase({ tipoDocumento: 'RT', numeroDocumento: '999123456-2' }))).toBe('El registro tributario no es válido.');
    expect(errorDe(datosBase({ tipoDocumento: 'PA', numeroDocumento: '999AB' }))).toBe(
      'El pasaporte debe tener de 6 a 9 letras mayúsculas o dígitos.',
    );
  });

  it('rechaza un tipo de documento inválido', () => {
    expect(errorDe(datosBase({ tipoDocumento: 'CC' }))).toBe('Elige el tipo de documento: DI, RT o PA.');
  });

  it('un nombre de la tienda con solo espacios cuenta como vacío (CA18)', () => {
    expect(errorDe(datosBase({ numeroDocumento: '999124007', nombreTienda: '   ' }))).toBe('El nombre de la tienda es obligatorio.');
  });

  it('pide el nombre, el teléfono y la dirección', () => {
    expect(errorDe(datosBase({ nombre: '' }))).toBe('El nombre del tendero es obligatorio.');
    expect(errorDe(datosBase({ telefono: ' ' }))).toBe('El teléfono es obligatorio.');
    expect(errorDe(datosBase({ direccion: undefined }))).toBe('La dirección es obligatoria.');
  });

  it('quita los espacios de los extremos y conserva el interior (D2, CA23)', () => {
    const datos = datosDe(datosBase({ nombre: "  D'Luis  ", direccion: ' Dirección de prueba 1 ' }));
    expect(datos.nombre).toBe("D'Luis");
    expect(datos.direccion).toBe('Dirección de prueba 1');
  });

  it.each(['abc', '555 000', '55500000011'])('rechaza el teléfono %s (CA19)', (telefono) => {
    expect(errorDe(datosBase({ numeroDocumento: '999124008', telefono }))).toBe('El teléfono debe tener de 7 a 10 dígitos.');
  });

  it.each(['555-0101', '5550000001'])('acepta el teléfono %s y lo entrega como se escribió (P2)', (telefono) => {
    expect(datosDe(datosBase({ telefono })).telefono).toBe(telefono);
  });

  it('rechaza un correo sin arroba (CA20)', () => {
    expect(errorDe(datosBase({ numeroDocumento: '999124009', correo: 'sin-arroba' }))).toBe('El correo no es válido.');
  });

  it.each([undefined, null, '', '   '])('el correo %j cuenta como no escrito y queda nulo (P3 a, D4)', (correo) => {
    expect(datosDe(datosBase({ correo })).correo).toBeNull();
  });

  it('rechaza un texto de 101 caracteres y acepta uno de 100', () => {
    expect(errorDe(datosBase({ nombre: 'a'.repeat(101) }))).toBe('Cada campo admite máximo 100 caracteres.');
    expect(datosDe(datosBase({ nombre: 'a'.repeat(100) })).nombre).toHaveLength(100);
  });

  it.each([
    ['nombreTienda', 'a'.repeat(101)],
    ['direccion', 'a'.repeat(101)],
    ['correo', `${'a'.repeat(88)}@ejemplo.test`],
    ['telefono', `555${'-'.repeat(91)}0000001`],
  ])('rechaza %s de 101 caracteres (P1)', (campo, valor) => {
    expect(valor).toHaveLength(101);
    expect(errorDe(datosBase({ [campo]: valor }))).toBe('Cada campo admite máximo 100 caracteres.');
  });

  it.each(['555\t0000001', '555\n0000001', '+57 5550001', '(555) 0000001', '555.0000001'])('en el teléfono solo quita espacios y guiones: rechaza %j (P2)', (telefono) => {
    expect(errorDe(datosBase({ telefono }))).toBe('El teléfono debe tener de 7 a 10 dígitos.');
  });

  it.each([
    ['numeroDocumento vacío', { numeroDocumento: '' }],
    ['numeroDocumento ausente', { numeroDocumento: undefined }],
    ['numeroDocumento como número', { numeroDocumento: 999123456 }],
    ['telefono como número', { telefono: 5550000001 }],
    ['nombre como número', { nombre: 123 }],
  ])('sin mensaje aprobado: %s → MENSAJE_GENERAL', (_caso, extra) => {
    expect(errorDe(datosBase(extra))).toBe(MENSAJE_GENERAL);
  });

  it('un cuerpo que no es un objeto no tiene mensaje aprobado', () => {
    expect(errorDe(null)).toBe(MENSAJE_GENERAL);
  });

  it('descarta zona y estado del cuerpo (CA3)', () => {
    const datos = datosDe(datosBase({ numeroDocumento: '999124005', zona: 'Sur', estado: 'inactivo' }));
    expect(datos).not.toHaveProperty('zona');
    expect(datos).not.toHaveProperty('estado');
  });

  it('pide el vendedor', () => {
    expect(errorDe(datosBase({ vendedorId: undefined }))).toBe('Falta el vendedor.');
    expect(errorDe(datosBase({ vendedorId: 0 }))).toBe('Falta el vendedor.');
  });

  it('devuelve el primer error en el orden del formulario (D3)', () => {
    const cuerpo = datosBase({ numeroDocumento: '99912', nombre: '', telefono: 'abc', direccion: '' });
    expect(errorDe(cuerpo)).toBe('El documento de identidad debe tener de 6 a 10 dígitos.');
    expect(errorDe({ ...cuerpo, numeroDocumento: '999123456' })).toBe('El nombre del tendero es obligatorio.');
  });

  // Ningún mensaje por defecto de zod: cada caso da el mensaje aprobado que le toca, no uno cualquiera de MENSAJES.
  it.each([
    ['{}', {}, 'Falta el vendedor.'],
    ['vendedorId: "abc"', datosBase({ vendedorId: 'abc' }), 'Falta el vendedor.'],
    ['vendedorId: "1"', datosBase({ vendedorId: '1' }), 'Falta el vendedor.'],
    ['vendedorId: -1', datosBase({ vendedorId: -1 }), 'Falta el vendedor.'],
    ['vendedorId: 1.5', datosBase({ vendedorId: 1.5 }), 'Falta el vendedor.'],
    ['tipoDocumento: 5', datosBase({ tipoDocumento: 5 }), 'Elige el tipo de documento: DI, RT o PA.'],
    ['tipoDocumento: "di"', datosBase({ tipoDocumento: 'di' }), 'Elige el tipo de documento: DI, RT o PA.'],
    ['nombre: 123', datosBase({ nombre: 123 }), MENSAJE_GENERAL],
    ['numeroDocumento: 999123456', datosBase({ numeroDocumento: 999123456 }), MENSAJE_GENERAL],
    ['correo: 5', datosBase({ correo: 5 }), 'El correo no es válido.'],
    ['cuerpo nulo', null, MENSAJE_GENERAL],
    ['cuerpo que es un arreglo', [datosBase()], MENSAJE_GENERAL],
  ])('con %s el error es el mensaje aprobado que corresponde', (_caso, cuerpo, mensaje) => {
    expect(errorDe(cuerpo)).toBe(mensaje);
    expect(MENSAJES).toContain(mensaje);
  });
});

/** Los 5 campos editables de «Tienda La Esquina» en test-data/ (HU-102, P1 c). */
const edicionBase = (extra: Record<string, unknown> = {}) => ({
  nombre: 'Ana Prueba',
  nombreTienda: 'Tienda La Esquina',
  telefono: '555-0101',
  correo: 'tienda1@ejemplo.test',
  direccion: 'Calle Ficticia 3 n.º 11',
  ...extra,
});

function errorDeEdicion(cuerpo: unknown) {
  const resultado = esquemaEdicionTendero.safeParse(cuerpo);
  if (resultado.success) throw new Error('Se esperaba un error de validación');
  return primerError(resultado);
}

function datosDeEdicion(cuerpo: unknown) {
  const resultado = esquemaEdicionTendero.safeParse(cuerpo);
  if (!resultado.success) throw new Error(`Error inesperado: ${primerError(resultado)}`);
  return resultado.data;
}

describe('esquemaEdicionTendero', () => {
  it('acepta los 5 campos editables', () => {
    expect(datosDeEdicion(edicionBase())).toEqual(edicionBase());
  });

  it.each(['5559876543', '555 123 4567'])('acepta el teléfono %s y lo entrega como se escribió (CA2, CA6)', (telefono) => {
    expect(datosDeEdicion(edicionBase({ telefono })).telefono).toBe(telefono);
  });

  it('un teléfono con letras produce el mensaje de CA4', () => {
    expect(errorDeEdicion(edicionBase({ telefono: '555-ABC-1234' }))).toBe('El teléfono solo puede tener números.');
    expect(MENSAJE_TELEFONO_SOLO_NUMEROS).toBe('El teléfono solo puede tener números.');
  });

  it.each(['555', '5551234567890123'])('rechaza el teléfono %s por su longitud (CA6)', (telefono) => {
    expect(errorDeEdicion(edicionBase({ telefono }))).toBe('El teléfono debe tener de 7 a 10 dígitos.');
  });

  it.each(['', '   ', null, undefined])('el teléfono %j es obligatorio (CA7, P4 b)', (telefono) => {
    expect(errorDeEdicion(edicionBase({ telefono }))).toBe('El teléfono es obligatorio.');
  });

  it.each(['esquina.ejemplo.test', 'tendero3.ejemplo.test'])('rechaza el correo %s (CA5)', (correo) => {
    expect(errorDeEdicion(edicionBase({ correo }))).toBe('El correo no es válido.');
  });

  it.each(['', '   ', null])('el correo %j queda nulo (CA7, P4 b)', (correo) => {
    expect(datosDeEdicion(edicionBase({ correo })).correo).toBeNull();
  });

  it('un correo que no es texto no es válido, igual que en el registro', () => {
    expect(errorDeEdicion(edicionBase({ correo: 5 }))).toBe('El correo no es válido.');
  });

  it('el correo tiene que venir en el cuerpo, aunque sea vacío', () => {
    expect(errorDeEdicion(edicionBase({ correo: undefined }))).toBe(MENSAJE_GENERAL);
  });

  it('quita los espacios de los extremos del correo y conserva las mayúsculas (CA8, P5)', () => {
    expect(datosDeEdicion(edicionBase({ correo: ' Tendero3@Ejemplo.TEST ' })).correo).toBe('Tendero3@Ejemplo.TEST');
  });

  it('quita los espacios de los extremos de todos los campos y conserva el interior', () => {
    const datos = datosDeEdicion(
      edicionBase({
        nombre: "  D'Luis ",
        nombreTienda: ' Tienda La Esquina ',
        telefono: ' 555 123 4567 ',
        direccion: ' Calle Ficticia 3 n.º 11 ',
      }),
    );
    expect(datos).toEqual(edicionBase({ nombre: "D'Luis", telefono: '555 123 4567' }));
  });

  it.each([
    ['nombre', 'El nombre del tendero es obligatorio.'],
    ['nombreTienda', 'El nombre de la tienda es obligatorio.'],
    ['direccion', 'La dirección es obligatoria.'],
  ])('%s vacío o con solo espacios es obligatorio', (campo, mensaje) => {
    expect(errorDeEdicion(edicionBase({ [campo]: '' }))).toBe(mensaje);
    expect(errorDeEdicion(edicionBase({ [campo]: '   ' }))).toBe(mensaje);
  });

  it.each([
    ['nombre', 'a'.repeat(101)],
    ['nombreTienda', 'a'.repeat(101)],
    ['direccion', 'a'.repeat(101)],
    ['correo', `${'a'.repeat(88)}@ejemplo.test`],
    ['telefono', `555${'-'.repeat(91)}0000001`],
  ])('rechaza %s de 101 caracteres (P5)', (campo, valor) => {
    expect(valor).toHaveLength(101);
    expect(errorDeEdicion(edicionBase({ [campo]: valor }))).toBe('Cada campo admite máximo 100 caracteres.');
  });

  it('acepta un campo de 100 caracteres', () => {
    expect(datosDeEdicion(edicionBase({ nombre: 'a'.repeat(100) })).nombre).toHaveLength(100);
  });

  it('rechaza un cuerpo con solo zona y estado (CA12)', () => {
    expect(errorDeEdicion({ zona: 'Sur', estado: 'inactivo' })).toBe(MENSAJE_GENERAL);
  });

  it.each([
    ['zona', 'Sur'],
    ['estado', 'inactivo'],
    ['vendedorId', 2],
    ['tipoDocumento', 'RT'],
    ['numeroDocumento', '999123456-1'],
  ])('rechaza el campo no editable %s aunque el resto sea válido (CA12, P1 c)', (campo, valor) => {
    expect(errorDeEdicion(edicionBase({ [campo]: valor }))).toBe(MENSAJE_GENERAL);
  });

  it.each([
    ['nombre como número', edicionBase({ nombre: 123 })],
    ['telefono como número', edicionBase({ telefono: 5559876543 })],
    ['cuerpo nulo', null],
    ['cuerpo como lista', [edicionBase()]],
  ])('sin mensaje aprobado: %s → MENSAJE_GENERAL', (_caso, cuerpo) => {
    expect(errorDeEdicion(cuerpo)).toBe(MENSAJE_GENERAL);
  });
});
