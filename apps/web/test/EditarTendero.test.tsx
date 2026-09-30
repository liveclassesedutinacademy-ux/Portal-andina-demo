import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EditarTendero } from '../src/pages/EditarTendero';

const tendero = {
  id: 1, tipoDocumento: 'DI', numeroDocumento: '999100137', nombre: 'Ana Prueba', nombreTienda: 'Tienda La Esquina',
  telefono: '555-0101', correo: 'tienda1@ejemplo.test', direccion: 'Calle Ficticia 3 n.º 11', zona: 'Norte', vendedorId: 1, estado: 'activo',
};

afterEach(() => vi.unstubAllGlobals());

function renderizar() {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ tendero }), { status: 200 })));
  render(
    <MemoryRouter initialEntries={['/tenderos/1/editar']}>
      <Routes><Route path="/tenderos/:id/editar" element={<EditarTendero />} /></Routes>
    </MemoryRouter>,
  );
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
});
