import { useEffect, type ReactNode } from 'react';
import type { Vendedor } from '../src/lib/api';
import { ProveedorSesion, useSesion } from '../src/lib/sesion';

/** V-101 de test-data/vendedores.json. */
export const V101: Vendedor = { id: 1, codigo: 'V-101', nombre: 'Vendedor Ruta Norte', zona: 'Norte' };

function Entrar({ vendedor, children }: { vendedor: Vendedor; children: ReactNode }) {
  const { vendedor: actual, entrar } = useSesion();
  useEffect(() => entrar(vendedor), [entrar, vendedor]);
  return actual ? <>{children}</> : null;
}

/** Sesión real (ProveedorSesion) con el vendedor ya dentro; muestra los hijos cuando hay sesión, sin tocar sesion.tsx. */
export function ConSesion({ vendedor = V101, children }: { vendedor?: Vendedor; children: ReactNode }) {
  return (
    <ProveedorSesion>
      <Entrar vendedor={vendedor}>{children}</Entrar>
    </ProveedorSesion>
  );
}
