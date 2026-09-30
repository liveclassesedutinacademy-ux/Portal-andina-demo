import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EditarTendero } from '../src/pages/EditarTendero';
import { ConSesion } from './ayuda';

// «Tienda La Esquina» de test-data/ (zona Norte, la de V-101).
const tendero = {
  id: 1, tipoDocumento: 'DI', numeroDocumento: '999100137', nombre: 'Ana Prueba', nombreTienda: 'Tienda La Esquina',
  telefono: '555-0101', correo: 'tienda1@ejemplo.test', direccion: 'Calle Ficticia 3 n.º 11', zona: 'Norte', vendedorId: 1, estado: 'activo',
};

afterEach(() => vi.unstubAllGlobals());

/** Ruta de prueba de la lista: muestra el mensaje que deja la edición en el estado de la navegación. */
function ListaDePrueba() {
  const mensaje = (useLocation().state as { mensaje?: string } | null)?.mensaje;
  return <p>Lista de tenderos: {mensaje}</p>;
}

/**
 * `GET` devuelve el tendero (con los cambios indicados); `PUT` responde con `estadoPut` y `cuerpoPut`.
 * Devuelve el `fetch` simulado para revisar las llamadas.
 */
function renderizar({
  cambios = {},
  estadoPut = 200,
  cuerpoPut = { tendero } as unknown,
}: { cambios?: Partial<typeof tendero>; estadoPut?: number; cuerpoPut?: unknown } = {}) {
  const fetchSimulado = vi.fn(async (_ruta: string, opciones?: RequestInit) =>
    opciones?.method === 'PUT'
      ? new Response(JSON.stringify(cuerpoPut), { status: estadoPut })
      : new Response(JSON.stringify({ tendero: { ...tendero, ...cambios } }), { status: 200 }),
  );
  vi.stubGlobal('fetch', fetchSimulado);
  render(
    <ConSesion>
      <MemoryRouter initialEntries={['/tenderos/1/editar']}>
        <Routes>
          <Route path="/tenderos/:id/editar" element={<EditarTendero />} />
          <Route path="/tenderos" element={<ListaDePrueba />} />
        </Routes>
      </MemoryRouter>
    </ConSesion>,
  );
  return fetchSimulado;
}

const llamadasPut = (fetchSimulado: ReturnType<typeof renderizar>) =>
  fetchSimulado.mock.calls.filter(([, opciones]) => opciones?.method === 'PUT');

async function escribir(etiqueta: string, valor: string) {
  const usuario = userEvent.setup();
  await usuario.clear(screen.getByLabelText(etiqueta));
  await usuario.type(screen.getByLabelText(etiqueta), valor);
  return usuario;
}

describe('EditarTendero', () => {
  it('carga los datos del tendero en el formulario', async () => {
    renderizar();
    expect(await screen.findByDisplayValue('Tienda La Esquina')).toBeInTheDocument();
    expect(screen.getByLabelText('Correo')).toHaveValue('tienda1@ejemplo.test');
  });

  it('cada campo muestra el valor que devuelve GET (CA1)', async () => {
    renderizar();
    await screen.findByDisplayValue('Tienda La Esquina');
    expect(screen.getByLabelText('Nombre del tendero')).toHaveValue(tendero.nombre);
    expect(screen.getByLabelText('Nombre de la tienda')).toHaveValue(tendero.nombreTienda);
    expect(screen.getByLabelText('Teléfono')).toHaveValue(tendero.telefono);
    expect(screen.getByLabelText('Correo')).toHaveValue(tendero.correo);
    expect(screen.getByLabelText('Dirección')).toHaveValue(tendero.direccion);
  });

  it('solo los 5 campos de P1 c son editables (CA1)', async () => {
    renderizar();
    await screen.findByDisplayValue('Tienda La Esquina');
    const editables = screen
      .getAllByRole('textbox')
      .filter((campo) => !(campo as HTMLInputElement).disabled && !(campo as HTMLInputElement).readOnly);
    expect(editables.map((campo) => campo.id)).toEqual(['nombre', 'nombreTienda', 'telefono', 'correo', 'direccion']);
    for (const valor of [tendero.numeroDocumento, tendero.zona, tendero.estado]) {
      expect(editables.some((campo) => (campo as HTMLInputElement).value === valor)).toBe(false);
    }
  });

  it('un teléfono con letras muestra el mensaje, conserva lo escrito y no envía el PUT (CA4)', async () => {
    const fetchSimulado = renderizar();
    await screen.findByDisplayValue('Tienda La Esquina');
    const usuario = await escribir('Teléfono', '555-ABC-1234');
    await usuario.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('El teléfono solo puede tener números.');
    expect(screen.getByLabelText('Teléfono')).toHaveValue('555-ABC-1234');
    expect(llamadasPut(fetchSimulado)).toHaveLength(0);
  });

  it('un correo inválido muestra el mensaje, conserva lo escrito y no envía el PUT (CA5)', async () => {
    const fetchSimulado = renderizar();
    await screen.findByDisplayValue('Tienda La Esquina');
    const usuario = await escribir('Correo', 'esquina.ejemplo.test');
    await usuario.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('El correo no es válido.');
    expect(screen.getByLabelText('Correo')).toHaveValue('esquina.ejemplo.test');
    expect(llamadasPut(fetchSimulado)).toHaveLength(0);
  });

  it('si la API rechaza, muestra su mensaje y conserva lo escrito', async () => {
    renderizar({ estadoPut: 403, cuerpoPut: { error: 'Este tendero no es de tu zona.' } });
    await screen.findByDisplayValue('Tienda La Esquina');
    const usuario = await escribir('Teléfono', '5551112222');
    await usuario.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Este tendero no es de tu zona.');
    expect(screen.getByLabelText('Teléfono')).toHaveValue('5551112222');
    expect(screen.getByLabelText('Nombre de la tienda')).toHaveValue('Tienda La Esquina');
  });

  it('al volver a guardar muestra solo el mensaje nuevo', async () => {
    renderizar({ estadoPut: 403, cuerpoPut: { error: 'Este tendero no es de tu zona.' } });
    await screen.findByDisplayValue('Tienda La Esquina');
    const usuario = await escribir('Teléfono', '555-ABC-1234');
    await usuario.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('El teléfono solo puede tener números.');

    await escribir('Teléfono', '5559876543');
    await usuario.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByText('Este tendero no es de tu zona.')).toBeInTheDocument();
    expect(screen.getAllByRole('alert')).toHaveLength(1);
  });

  it('envía los 5 campos con el vendedor de la sesión en la consulta', async () => {
    const fetchSimulado = renderizar();
    await screen.findByDisplayValue('Tienda La Esquina');
    const usuario = await escribir('Teléfono', '5559876543');
    await usuario.click(screen.getByRole('button', { name: 'Guardar' }));

    await screen.findByText(/Lista de tenderos/);
    const [[ruta, opciones]] = llamadasPut(fetchSimulado);
    expect(ruta).toBe('/api/tenderos/1?vendedorId=1');
    expect(JSON.parse(String(opciones?.body))).toEqual({
      nombre: tendero.nombre,
      nombreTienda: tendero.nombreTienda,
      telefono: '5559876543',
      correo: tendero.correo,
      direccion: tendero.direccion,
    });
  });

  it('un tendero inactivo no se puede editar ni se envía el PUT (CA16, P6 b)', async () => {
    const fetchSimulado = renderizar({ cambios: { estado: 'inactivo' } });
    expect(await screen.findByRole('alert')).toHaveTextContent('Este tendero está inactivo y no se puede editar.');
    for (const etiqueta of ['Nombre del tendero', 'Nombre de la tienda', 'Teléfono', 'Correo', 'Dirección']) {
      expect(screen.getByLabelText(etiqueta)).toBeDisabled();
    }
    const boton = screen.getByRole('button', { name: 'Guardar' });
    expect(boton).toBeDisabled();

    // Aunque se intente enviar el formulario (p. ej. con Enter), no sale ningún PUT.
    const usuario = userEvent.setup();
    await usuario.click(boton);
    boton.closest('form')!.requestSubmit();
    expect(llamadasPut(fetchSimulado)).toHaveLength(0);
  });

  it('al guardar vuelve a la lista con «Datos actualizados» (CA18)', async () => {
    renderizar();
    await screen.findByDisplayValue('Tienda La Esquina');
    const usuario = await escribir('Teléfono', '5559876543');
    await usuario.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByText(/Lista de tenderos/)).toHaveTextContent('Lista de tenderos: Datos actualizados');
    expect(screen.queryByRole('heading', { name: 'Editar datos del tendero' })).not.toBeInTheDocument();
  });
});
