import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
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

const tendero = {
  id: 16, tipoDocumento: 'DI', numeroDocumento: '999124011', nombre: 'Prueba Norte', nombreTienda: 'Tienda Prueba Norte',
  telefono: '5550000001', correo: 'prueba@ejemplo.test', direccion: 'Dirección de prueba 1', zona: 'Norte', vendedorId: 1, estado: 'activo',
};

afterEach(() => vi.unstubAllGlobals());

function renderizar(entrada: string | { pathname: string; state: unknown }) {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ tenderos: [tendero] }), { status: 200 })));
  render(
    <MemoryRouter initialEntries={[entrada]}>
      <Tenderos />
    </MemoryRouter>,
  );
}

describe('Tenderos', () => {
  it('muestra «Tendero registrado» al volver del registro y pide la lista del vendedor (CA25)', async () => {
    renderizar({ pathname: '/tenderos', state: { mensaje: 'Tendero registrado' } });
    expect(screen.getByRole('status')).toHaveTextContent('Tendero registrado');
    expect(await screen.findByText('Tienda Prueba Norte')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith('/api/tenderos?vendedorId=1', expect.anything());
  });

  it('si la lista no carga, muestra el error de la API', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: 'Vendedor no encontrado' }), { status: 404 })));
    render(
      <MemoryRouter initialEntries={['/tenderos']}>
        <Tenderos />
      </MemoryRouter>,
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('Vendedor no encontrado');
  });

  it('sin ese estado no muestra el mensaje', async () => {
    renderizar('/tenderos');
    expect(await screen.findByText('Tienda Prueba Norte')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
