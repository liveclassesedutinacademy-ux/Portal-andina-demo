import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Tenderos } from '../src/pages/Tenderos';

// HU-103 en la lista de tenderos. El filtro lo hace la API (P1): aquí se simula su respuesta según `buscar`
// y se comprueba qué envía la pantalla y qué muestra. Tiendas de la zona Norte de test-data/.

// La sesión es el mismo objeto en cada render, como en la app: Tenderos carga la lista cuando cambia el vendedor.
vi.mock('../src/lib/sesion', () => {
  const sesion = {
    vendedor: { id: 1, codigo: 'V-101', nombre: 'Vendedor Ruta Norte', zona: 'Norte' },
    entrar: vi.fn(),
    salir: vi.fn(),
  };
  return { useSesion: () => sesion };
});

const tienda = (id: number, nombreTienda: string) => ({
  id, tipoDocumento: 'DI', numeroDocumento: `99910000${id}`, nombre: `Tendero ${id}`, nombreTienda,
  telefono: '555-0101', correo: null, direccion: 'Calle Ficticia 1 n.º 1', zona: 'Norte', vendedorId: 1, estado: 'activo',
});
const ESQUINA = tienda(1, 'Tienda La Esquina');
const ROBLE = tienda(2, 'Minimercado El Roble');
const DONA_ROSA = tienda(3, 'Tienda Doña Rosa');

/** Respuesta simulada de la API para cada valor de `buscar` ('' = sin buscar). */
function simularApi(respuestas: Record<string, unknown[]>) {
  const fetchSimulado = vi.fn(async (ruta: string, _opciones?: RequestInit) => {
    const buscar = new URL(ruta, 'http://localhost').searchParams.get('buscar') ?? '';
    return new Response(JSON.stringify({ tenderos: respuestas[buscar] ?? [] }), { status: 200 });
  });
  vi.stubGlobal('fetch', fetchSimulado);
  return fetchSimulado;
}

const rutasPedidas = (fetchSimulado: ReturnType<typeof simularApi>) => fetchSimulado.mock.calls.map(([ruta]) => ruta);

function renderizar() {
  render(
    <MemoryRouter initialEntries={['/tenderos']}>
      <Tenderos />
    </MemoryRouter>,
  );
  return userEvent.setup();
}

const filas = () => screen.getAllByRole('row').slice(1).map((fila) => within(fila).getAllByRole('cell')[0].textContent);

const SIN_RESULTADOS = 'No hay tiendas con ese nombre en tu zona';

afterEach(() => vi.unstubAllGlobals());

describe('Tenderos · Buscar tienda (HU-103)', () => {
  it('CA1: la lista tiene un campo «Buscar tienda»', async () => {
    simularApi({ '': [ESQUINA, ROBLE] });
    renderizar();
    expect(await screen.findByText('Tienda La Esquina')).toBeInTheDocument();
    expect(screen.getByLabelText('Buscar tienda')).toHaveRole('searchbox');
  });

  it('CA2: con 3 caracteres pide a la API solo las tiendas que coinciden y muestra solo esas', async () => {
    const fetchSimulado = simularApi({ '': [ESQUINA, ROBLE, DONA_ROSA], esq: [ESQUINA] });
    const usuario = renderizar();
    await screen.findByText('Minimercado El Roble');

    await usuario.type(screen.getByLabelText('Buscar tienda'), 'esq');

    expect(await screen.findByText('Tienda La Esquina')).toBeInTheDocument();
    expect(screen.queryByText('Minimercado El Roble')).not.toBeInTheDocument();
    expect(filas()).toEqual(['Tienda La Esquina']);
    expect(rutasPedidas(fetchSimulado)).toEqual(['/api/tenderos?vendedorId=1', '/api/tenderos?vendedorId=1&buscar=esq']);
  });

  it('CA2: envía el texto como lo escribió (mayúsculas y tildes las compara la API), sin los espacios de los extremos', async () => {
    const fetchSimulado = simularApi({ '': [ESQUINA, ROBLE, DONA_ROSA], ROBLE: [ROBLE], 'Doña': [DONA_ROSA] });
    const usuario = renderizar();
    await screen.findByText('Tienda La Esquina');
    const campo = screen.getByLabelText('Buscar tienda');

    await usuario.type(campo, '  ROBLE ');
    await vi.waitFor(() => expect(filas()).toEqual(['Minimercado El Roble']));
    await usuario.clear(campo);
    await usuario.type(campo, 'Doña');
    await vi.waitFor(() => expect(filas()).toEqual(['Tienda Doña Rosa']));

    expect(rutasPedidas(fetchSimulado)).toContain('/api/tenderos?vendedorId=1&buscar=ROBLE');
    expect(rutasPedidas(fetchSimulado)).toContain('/api/tenderos?vendedorId=1&buscar=Do%C3%B1a');
  });

  it('CA3: con 1 o 2 caracteres no filtra ni vuelve a llamar a la API', async () => {
    const fetchSimulado = simularApi({ '': [ESQUINA, ROBLE, DONA_ROSA] });
    const usuario = renderizar();
    await screen.findByText('Tienda La Esquina');

    await usuario.type(screen.getByLabelText('Buscar tienda'), 'es');

    expect(filas()).toEqual(['Tienda La Esquina', 'Minimercado El Roble', 'Tienda Doña Rosa']);
    expect(rutasPedidas(fetchSimulado)).toEqual(['/api/tenderos?vendedorId=1']);
  });

  it('CA3: al borrar hasta menos de 3 caracteres o vaciar el campo vuelve la lista completa', async () => {
    const fetchSimulado = simularApi({ '': [ESQUINA, ROBLE, DONA_ROSA], esq: [ESQUINA] });
    const usuario = renderizar();
    await screen.findByText('Minimercado El Roble');
    const campo = screen.getByLabelText('Buscar tienda');

    await usuario.type(campo, 'esq');
    await vi.waitFor(() => expect(filas()).toEqual(['Tienda La Esquina']));
    await usuario.type(campo, '{Backspace}');
    await vi.waitFor(() => expect(filas()).toHaveLength(3));
    await usuario.type(campo, 'q');
    await vi.waitFor(() => expect(filas()).toEqual(['Tienda La Esquina']));
    await usuario.clear(campo);
    await vi.waitFor(() => expect(filas()).toHaveLength(3));

    expect(rutasPedidas(fetchSimulado).at(-1)).toBe('/api/tenderos?vendedorId=1');
  });

  it('CA3: un texto de solo espacios cuenta como vacío (P3)', async () => {
    const fetchSimulado = simularApi({ '': [ESQUINA, ROBLE] });
    const usuario = renderizar();
    await screen.findByText('Tienda La Esquina');

    await usuario.type(screen.getByLabelText('Buscar tienda'), '     ');

    expect(filas()).toEqual(['Tienda La Esquina', 'Minimercado El Roble']);
    expect(rutasPedidas(fetchSimulado)).toEqual(['/api/tenderos?vendedorId=1']);
  });

  it('CA4: si ninguna tienda coincide, muestra «No hay tiendas con ese nombre en tu zona»', async () => {
    simularApi({ '': [ESQUINA, ROBLE], pinos: [] });
    const usuario = renderizar();
    await screen.findByText('Tienda La Esquina');
    expect(screen.queryByText(SIN_RESULTADOS)).not.toBeInTheDocument();

    await usuario.type(screen.getByLabelText('Buscar tienda'), 'pinos');

    expect(await screen.findByText(SIN_RESULTADOS)).toBeInTheDocument();
    expect(filas()).toEqual([]);
  });

  it('CA4: el mensaje desaparece al volver a la lista completa', async () => {
    simularApi({ '': [ESQUINA, ROBLE], pinos: [] });
    const usuario = renderizar();
    await screen.findByText('Tienda La Esquina');
    const campo = screen.getByLabelText('Buscar tienda');

    await usuario.type(campo, 'pinos');
    await screen.findByText(SIN_RESULTADOS);
    await usuario.clear(campo);

    expect(await screen.findByText('Tienda La Esquina')).toBeInTheDocument();
    expect(screen.queryByText(SIN_RESULTADOS)).not.toBeInTheDocument();
  });

  it('P5: sin búsqueda, una zona sin tenderos no muestra el mensaje de búsqueda', async () => {
    simularApi({ '': [] });
    renderizar();
    await vi.waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(screen.queryByText(SIN_RESULTADOS)).not.toBeInTheDocument();
  });

  it('P5: descarta la respuesta de un texto que ya cambió', async () => {
    let responderEsq: (r: Response) => void = () => {};
    vi.stubGlobal(
      'fetch',
      vi.fn((ruta: string) => {
        const buscar = new URL(ruta, 'http://localhost').searchParams.get('buscar') ?? '';
        if (buscar === 'esq') return new Promise<Response>((resolver) => (responderEsq = resolver));
        const lista = buscar === 'esqu' ? [ESQUINA] : [ESQUINA, ROBLE];
        return Promise.resolve(new Response(JSON.stringify({ tenderos: lista }), { status: 200 }));
      }),
    );
    const usuario = renderizar();
    await screen.findByText('Minimercado El Roble');

    await usuario.type(screen.getByLabelText('Buscar tienda'), 'esqu');
    await vi.waitFor(() => expect(filas()).toEqual(['Tienda La Esquina']));
    responderEsq(new Response(JSON.stringify({ tenderos: [] }), { status: 200 }));

    await new Promise((resolver) => setTimeout(resolver, 0));
    expect(filas()).toEqual(['Tienda La Esquina']);
    expect(screen.queryByText(SIN_RESULTADOS)).not.toBeInTheDocument();
  });
});
