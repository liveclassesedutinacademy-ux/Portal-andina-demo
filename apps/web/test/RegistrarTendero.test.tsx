import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RegistrarTendero } from '../src/pages/RegistrarTendero';

vi.mock('../src/lib/sesion', () => ({
  useSesion: () => ({
    vendedor: { id: 1, codigo: 'V-101', nombre: 'Vendedor Ruta Norte', zona: 'Norte' },
    entrar: vi.fn(),
    salir: vi.fn(),
  }),
}));

afterEach(() => vi.unstubAllGlobals());

function simularRespuesta(estado: number, cuerpo: unknown) {
  const fetchSimulado = vi.fn(async (_ruta: string, _opciones?: RequestInit) => new Response(JSON.stringify(cuerpo), { status: estado }));
  vi.stubGlobal('fetch', fetchSimulado);
  return fetchSimulado;
}

/** Llena el formulario con los datos válidos base de la historia HU-101. */
async function llenarDatosBase(numeroDocumento: string) {
  const usuario = userEvent.setup();
  render(
    <MemoryRouter>
      <RegistrarTendero />
    </MemoryRouter>,
  );
  await usuario.selectOptions(screen.getByLabelText('Tipo de documento'), 'DI');
  await usuario.type(screen.getByLabelText('Número de documento'), numeroDocumento);
  await usuario.type(screen.getByLabelText('Nombre del tendero'), 'Prueba Norte');
  await usuario.type(screen.getByLabelText('Nombre de la tienda'), 'Tienda Prueba Norte');
  await usuario.type(screen.getByLabelText('Teléfono'), '5550000001');
  await usuario.type(screen.getByLabelText('Correo'), 'prueba@ejemplo.test');
  await usuario.type(screen.getByLabelText('Dirección'), 'Dirección de prueba 1');
  return usuario;
}

describe('RegistrarTendero', () => {
  it('envía los campos escritos con el vendedor de la sesión', async () => {
    const fetchSimulado = simularRespuesta(201, { tendero: {} });
    const usuario = await llenarDatosBase('999124011');
    await usuario.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(fetchSimulado).toHaveBeenCalledOnce();
    const [ruta, opciones] = fetchSimulado.mock.calls[0];
    expect(ruta).toBe('/api/tenderos');
    expect(opciones?.method).toBe('POST');
    expect(JSON.parse(String(opciones?.body))).toEqual({
      vendedorId: 1,
      tipoDocumento: 'DI',
      numeroDocumento: '999124011',
      nombre: 'Prueba Norte',
      nombreTienda: 'Tienda Prueba Norte',
      telefono: '5550000001',
      correo: 'prueba@ejemplo.test',
      direccion: 'Dirección de prueba 1',
    });
  });

  it('ante un duplicado muestra el mensaje de la API y conserva lo escrito (CA22, CA13)', async () => {
    simularRespuesta(409, { error: 'Este tendero ya está registrado.' });
    const usuario = await llenarDatosBase('999.123.456');
    await usuario.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Este tendero ya está registrado.');
    expect(screen.getByLabelText('Tipo de documento')).toHaveValue('DI');
    expect(screen.getByLabelText('Número de documento')).toHaveValue('999.123.456');
    expect(screen.getByLabelText('Nombre del tendero')).toHaveValue('Prueba Norte');
    expect(screen.getByLabelText('Nombre de la tienda')).toHaveValue('Tienda Prueba Norte');
    expect(screen.getByLabelText('Teléfono')).toHaveValue('5550000001');
    expect(screen.getByLabelText('Correo')).toHaveValue('prueba@ejemplo.test');
    expect(screen.getByLabelText('Dirección')).toHaveValue('Dirección de prueba 1');
  });

  it('ante un DI inválido muestra el mensaje de la API (CA5)', async () => {
    simularRespuesta(400, { error: 'El documento de identidad debe tener de 6 a 10 dígitos.' });
    const usuario = await llenarDatosBase('99912');
    await usuario.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('El documento de identidad debe tener de 6 a 10 dígitos.');
    expect(screen.getByLabelText('Número de documento')).toHaveValue('99912');
  });

  it('marca como obligatorios todos los campos menos el correo, con máximo 100 caracteres (PT6)', () => {
    render(
      <MemoryRouter>
        <RegistrarTendero />
      </MemoryRouter>,
    );
    expect(screen.getByLabelText('Tipo de documento')).toBeRequired();
    for (const etiqueta of ['Número de documento', 'Nombre del tendero', 'Nombre de la tienda', 'Teléfono', 'Dirección']) {
      expect(screen.getByLabelText(etiqueta)).toBeRequired();
      expect(screen.getByLabelText(etiqueta)).toHaveAttribute('maxLength', '100');
    }
    expect(screen.getByLabelText('Correo')).not.toBeRequired();
    expect(screen.getByLabelText('Correo')).toHaveAttribute('maxLength', '100');
  });
});
