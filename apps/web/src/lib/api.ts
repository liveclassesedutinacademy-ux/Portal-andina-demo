// Cliente de la API del portal. Todas las llamadas pasan por aquí.

export type Vendedor = { id: number; codigo: string; nombre: string; zona: string };
export type Producto = { id: number; sku: string; nombre: string; categoria: string; presentacion: string };
export type Tendero = {
  id: number;
  tipoDocumento: string;
  numeroDocumento: string;
  nombre: string;
  nombreTienda: string;
  telefono: string | null;
  correo: string | null;
  direccion: string;
  zona: string;
  vendedorId: number;
  estado: string;
};
export type DatosEdicionTendero = Pick<Tendero, 'nombre' | 'nombreTienda' | 'telefono' | 'correo' | 'direccion'>;

export class ErrorApi extends Error {
  constructor(public estado: number, mensaje: string) {
    super(mensaje);
  }
}

async function llamar<T>(ruta: string, opciones?: RequestInit): Promise<T> {
  const res = await fetch(ruta, { headers: { 'Content-Type': 'application/json' }, ...opciones });
  const cuerpo = await res.json().catch(() => ({}));
  if (!res.ok) throw new ErrorApi(res.status, cuerpo.error ?? 'Error de comunicación con el servidor');
  return cuerpo as T;
}

export const api = {
  iniciarSesion: (codigoVendedor: string) =>
    llamar<{ vendedor: Vendedor }>('/api/sesion', { method: 'POST', body: JSON.stringify({ codigoVendedor }) }),
  catalogo: (categoria?: string) =>
    llamar<{ productos: Producto[] }>(`/api/catalogo${categoria ? `?categoria=${encodeURIComponent(categoria)}` : ''}`),
  tenderos: (vendedorId: number) => llamar<{ tenderos: Tendero[] }>(`/api/tenderos?vendedorId=${vendedorId}`),
  tendero: (id: number) => llamar<{ tendero: Tendero }>(`/api/tenderos/${id}`),
  // El endpoint de edición todavía no existe: lo construye la historia «edición de datos del tendero».
  actualizarTendero: (id: number, datos: DatosEdicionTendero) =>
    llamar<{ tendero: Tendero }>(`/api/tenderos/${id}`, { method: 'PUT', body: JSON.stringify(datos) }),
};
