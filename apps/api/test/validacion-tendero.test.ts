import { describe, expect, it } from 'vitest';
import { esquemaRegistroTendero, MENSAJE_POR_DEFINIR, MENSAJES, primerError } from '../src/validaciones/tendero.js';

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

  it.each(['555\t0000001', '555\n0000001'])('en el teléfono solo quita espacios y guiones: rechaza %j (P2)', (telefono) => {
    expect(errorDe(datosBase({ telefono }))).toBe('El teléfono debe tener de 7 a 10 dígitos.');
  });

  it.each([
    ['numeroDocumento vacío', { numeroDocumento: '' }],
    ['numeroDocumento ausente', { numeroDocumento: undefined }],
    ['numeroDocumento como número', { numeroDocumento: 999123456 }],
    ['telefono como número', { telefono: 5550000001 }],
    ['nombre como número', { nombre: 123 }],
  ])('sin mensaje aprobado: %s → MENSAJE_POR_DEFINIR', (_caso, extra) => {
    expect(errorDe(datosBase(extra))).toBe(MENSAJE_POR_DEFINIR);
  });

  it('un cuerpo que no es un objeto no tiene mensaje aprobado', () => {
    expect(errorDe(null)).toBe(MENSAJE_POR_DEFINIR);
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

  it.each([
    ['{}', {}],
    ['vendedorId: "abc"', datosBase({ vendedorId: 'abc' })],
    ['tipoDocumento: 5', datosBase({ tipoDocumento: 5 })],
    ['nombre: 123', datosBase({ nombre: 123 })],
    ['numeroDocumento: 999123456', datosBase({ numeroDocumento: 999123456 })],
    ['correo: 5', datosBase({ correo: 5 })],
    ['cuerpo nulo', null],
  ])('con %s el error es uno de los mensajes aprobados', (_caso, cuerpo) => {
    expect(MENSAJES).toContain(errorDe(cuerpo));
  });
});
