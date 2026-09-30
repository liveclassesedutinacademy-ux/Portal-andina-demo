import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EditarTendero } from '../src/pages/EditarTendero';

const tendero = {
  id: 1, tipoDocumento: 'DI', numeroDocumento: '999100137', nombre: 'Ana Prueba', nombreTienda: 'Tienda La Esquina',
  telefono: '555-0101', correo: 'tienda1@ejemplo.test', direccion: 'Calle Ficticia 3 n.º 11', zona: 'Norte', vendedorId: 1, estado: 'activo',
};

afterEach(() => vi.unstubAllGlobals());

describe('EditarTendero', () => {
  it('carga los datos del tendero en el formulario', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ tendero }), { status: 200 })));
    render(
      <MemoryRouter initialEntries={['/tenderos/1/editar']}>
        <Routes><Route path="/tenderos/:id/editar" element={<EditarTendero />} /></Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByDisplayValue('Tienda La Esquina')).toBeInTheDocument();
    expect(screen.getByLabelText('Correo')).toHaveValue('tienda1@ejemplo.test');
  });
});
