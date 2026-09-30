import { describe, expect, it } from 'vitest';
import { validarEdicionTendero } from '../src/lib/validacionTendero';
import type { DatosEdicionTendero } from '../src/lib/api';

// «Tienda La Esquina» de test-data/; cada prueba cambia un campo. Los valores son los del paso 1 del plan.
const esquina: DatosEdicionTendero = {
  nombre: 'Ana Prueba',
  nombreTienda: 'Tienda La Esquina',
  telefono: '555-0101',
  correo: 'tienda1@ejemplo.test',
  direccion: 'Calle Ficticia 3 n.º 11',
};

const con = (cambios: Partial<DatosEdicionTendero>) => validarEdicionTendero({ ...esquina, ...cambios });

describe('validarEdicionTendero', () => {
  it('acepta los datos de test-data/ sin cambios', () => {
    expect(validarEdicionTendero(esquina)).toBeNull();
  });

  it.each(['5559876543', '555 123 4567'])('acepta el teléfono %s (CA2, CA6)', (telefono) => {
    expect(con({ telefono })).toBeNull();
  });

  it('un teléfono con letras produce el mensaje de CA4', () => {
    expect(con({ telefono: '555-ABC-1234' })).toBe('El teléfono solo puede tener números.');
  });

  it.each(['555', '5551234567890123'])('rechaza el teléfono %s por su longitud (CA6)', (telefono) => {
    expect(con({ telefono })).toBe('El teléfono debe tener de 7 a 10 dígitos.');
  });

  it.each(['', '   '])('el teléfono %j es obligatorio (CA7, P4 b)', (telefono) => {
    expect(con({ telefono })).toBe('El teléfono es obligatorio.');
  });

  it.each(['esquina.ejemplo.test', 'tendero3.ejemplo.test'])('rechaza el correo %s (CA5)', (correo) => {
    expect(con({ correo })).toBe('El correo no es válido.');
  });

  it.each(['', '   '])('el correo %j es opcional (CA7, P4 b)', (correo) => {
    expect(con({ correo })).toBeNull();
  });

  it('acepta el correo con espacios en los extremos y mayúsculas (CA8, P5)', () => {
    expect(con({ correo: ' Tendero3@Ejemplo.TEST ' })).toBeNull();
  });

  it('un campo de más de 100 caracteres produce el mensaje de HU-101 (P5)', () => {
    expect(con({ nombre: 'a'.repeat(101) })).toBe('Cada campo admite máximo 100 caracteres.');
    expect(con({ nombre: 'a'.repeat(100) })).toBeNull();
  });

  it.each([
    ['nombre', 'El nombre del tendero es obligatorio.'],
    ['nombreTienda', 'El nombre de la tienda es obligatorio.'],
    ['direccion', 'La dirección es obligatoria.'],
  ] as const)('%s con solo espacios es obligatorio', (campo, mensaje) => {
    expect(con({ [campo]: '  ' })).toBe(mensaje);
  });

  it('si fallan varios campos, da el mensaje del primero en el orden del formulario', () => {
    expect(con({ nombre: '', telefono: '555-ABC-1234', correo: 'esquina.ejemplo.test' })).toBe(
      'El nombre del tendero es obligatorio.',
    );
    expect(con({ telefono: '555-ABC-1234', correo: 'esquina.ejemplo.test' })).toBe('El teléfono solo puede tener números.');
  });

  it("acepta el nombre D'Luis (CA14)", () => {
    expect(con({ nombre: "D'Luis" })).toBeNull();
  });
});
