import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RegistrarTendero } from '../src/pages/RegistrarTendero';
import { Tenderos } from '../src/pages/Tenderos';

// La sesión es el mismo objeto en cada render, como en la app: Tenderos carga la lista cuando cambia el vendedor.
vi.mock('../src/lib/sesion', () => {
  const sesion = {
    vendedor: { id: 1, codigo: 'V-101', nombre: 'Vendedor Ruta Norte', zona: 'Norte' },
    entrar: vi.fn(),
    salir: vi.fn(),
  };
  return { useSesion: () => sesion };
});

afterEach(() => vi.unstubAllGlobals());

function simularRespuesta(estado: number, cuerpo: unknown) {
  const fetchSimulado = vi.fn(async (_ruta: string, _opciones?: RequestInit) => new Response(JSON.stringify(cuerpo), { status: estado }));
  vi.stubGlobal('fetch', fetchSimulado);
  return fetchSimulado;
}

/** Llena el formulario con los datos válidos base de la historia HU-101. */
async function llenarDatosBase(numeroDocumento: string, tipoDocumento = 'DI') {
  const usuario = userEvent.setup();
  render(
    <MemoryRouter>
      <RegistrarTendero />
    </MemoryRouter>,
  );
  await usuario.selectOptions(screen.getByLabelText('Tipo de documento'), tipoDocumento);
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

  it.each([
    ['RT', '999123456-1'],
    ['PA', '999ABC'],
  ])('envía el tipo de documento elegido: %s', async (tipoDocumento, numeroDocumento) => {
    const fetchSimulado = simularRespuesta(201, { tendero: {} });
    const usuario = await llenarDatosBase(numeroDocumento, tipoDocumento);
    await usuario.click(screen.getByRole('button', { name: 'Guardar' }));

    const cuerpo = JSON.parse(String(fetchSimulado.mock.calls[0][1]?.body));
    expect(cuerpo).toMatchObject({ tipoDocumento, numeroDocumento });
  });

  it('ante un duplicado muestra el mensaje de la API y conserva lo escrito (CA22)', async () => {
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

  // El mensaje lo decide la API (CA5 se prueba allí); aquí solo se comprueba que el formulario lo muestra (PT6).
  it('ante un 400 muestra el mensaje de la API y conserva lo escrito (PT6)', async () => {
    simularRespuesta(400, { error: 'El documento de identidad debe tener de 6 a 10 dígitos.' });
    const usuario = await llenarDatosBase('99912');
    await usuario.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('El documento de identidad debe tener de 6 a 10 dígitos.');
    expect(screen.getByLabelText('Número de documento')).toHaveValue('99912');
  });

  it('al volver a guardar muestra solo el mensaje nuevo de la API', async () => {
    const fetchSimulado = vi.fn(async (_ruta: string, _opciones?: RequestInit) =>
      new Response(JSON.stringify({ error: 'Este tendero ya está registrado.' }), { status: 409 }),
    );
    fetchSimulado.mockImplementationOnce(async () =>
      new Response(JSON.stringify({ error: 'El documento de identidad debe tener de 6 a 10 dígitos.' }), { status: 400 }),
    );
    vi.stubGlobal('fetch', fetchSimulado);
    const usuario = await llenarDatosBase('99912');
    await usuario.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('El documento de identidad debe tener de 6 a 10 dígitos.');

    await usuario.clear(screen.getByLabelText('Número de documento'));
    await usuario.type(screen.getByLabelText('Número de documento'), '999.123.456');
    await usuario.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByText('Este tendero ya está registrado.')).toBeInTheDocument();
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(screen.queryByText('El documento de identidad debe tener de 6 a 10 dígitos.')).not.toBeInTheDocument();
  });

  it('al guardar con éxito vuelve a la lista con «Tendero registrado» y la recarga con el tendero nuevo (CA25)', async () => {
    // Tendero 1 de test-data/ (zona Norte) y el tendero nuevo con los datos válidos base de la historia.
    const existente = {
      id: 1, tipoDocumento: 'DI', numeroDocumento: '999100137', nombre: 'Ana Prueba', nombreTienda: 'Tienda La Esquina',
      telefono: '555-0101', correo: 'tienda1@ejemplo.test', direccion: 'Calle Ficticia 3 n.º 11', zona: 'Norte', vendedorId: 1, estado: 'activo',
    };
    const nuevo = {
      id: 16, tipoDocumento: 'DI', numeroDocumento: '999124011', nombre: 'Prueba Norte', nombreTienda: 'Tienda Prueba Norte',
      telefono: '5550000001', correo: 'prueba@ejemplo.test', direccion: 'Dirección de prueba 1', zona: 'Norte', vendedorId: 1, estado: 'activo',
    };
    // La API simulada guarda estado: GET solo devuelve el tendero nuevo si antes llegó el POST.
    let registrado = false;
    const fetchSimulado = vi.fn(async (_ruta: string, opciones?: RequestInit) => {
      if (opciones?.method === 'POST') {
        registrado = true;
        return new Response(JSON.stringify({ tendero: nuevo }), { status: 201 });
      }
      return new Response(JSON.stringify({ tenderos: registrado ? [existente, nuevo] : [existente] }), { status: 200 });
    });
    vi.stubGlobal('fetch', fetchSimulado);
    const usuario = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/tenderos/nuevo']}>
        <Routes>
          <Route path="/tenderos/nuevo" element={<RegistrarTendero />} />
          <Route path="/tenderos" element={<Tenderos />} />
        </Routes>
      </MemoryRouter>,
    );
    await usuario.type(screen.getByLabelText('Número de documento'), '999124011');
    await usuario.type(screen.getByLabelText('Nombre del tendero'), 'Prueba Norte');
    await usuario.type(screen.getByLabelText('Nombre de la tienda'), 'Tienda Prueba Norte');
    await usuario.type(screen.getByLabelText('Teléfono'), '5550000001');
    await usuario.type(screen.getByLabelText('Correo'), 'prueba@ejemplo.test');
    await usuario.type(screen.getByLabelText('Dirección'), 'Dirección de prueba 1');
    await usuario.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Tendero registrado');
    expect(screen.getByRole('heading', { name: 'Tenderos de la zona Norte' })).toBeInTheDocument();
    expect(await screen.findByText('Tienda Prueba Norte')).toBeInTheDocument();
    expect(screen.getByText('Tienda La Esquina')).toBeInTheDocument();
    // La lista se pidió después del POST, no antes.
    expect(fetchSimulado.mock.calls.map(([ruta, opciones]) => `${opciones?.method ?? 'GET'} ${ruta}`)).toEqual([
      'POST /api/tenderos',
      'GET /api/tenderos?vendedorId=1',
    ]);
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
