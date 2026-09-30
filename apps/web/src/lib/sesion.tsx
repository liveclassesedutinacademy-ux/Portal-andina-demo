import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Vendedor } from './api';

type ContextoSesion = { vendedor: Vendedor | null; entrar: (v: Vendedor) => void; salir: () => void };
const Sesion = createContext<ContextoSesion | null>(null);

export function ProveedorSesion({ children }: { children: ReactNode }) {
  const [vendedor, setVendedor] = useState<Vendedor | null>(null);
  return (
    <Sesion.Provider value={{ vendedor, entrar: setVendedor, salir: () => setVendedor(null) }}>{children}</Sesion.Provider>
  );
}

export function useSesion() {
  const ctx = useContext(Sesion);
  if (!ctx) throw new Error('useSesion debe usarse dentro de ProveedorSesion');
  return ctx;
}
