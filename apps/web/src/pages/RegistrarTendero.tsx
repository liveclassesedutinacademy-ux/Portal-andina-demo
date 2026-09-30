import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type DatosRegistroTendero, type TipoDocumento } from '../lib/api';
import { useSesion } from '../lib/sesion';

type Campos = Omit<DatosRegistroTendero, 'vendedorId'>;

const VACIO: Campos = {
  tipoDocumento: 'DI',
  numeroDocumento: '',
  nombre: '',
  nombreTienda: '',
  telefono: '',
  correo: '',
  direccion: '',
};

const MAXIMO = 100;

/**
 * Formulario de registro de tenderos (HU-101).
 * Solo valida campos obligatorios y longitud máxima (PT6); las reglas de documento,
 * teléfono y correo las valida la API y aquí se muestra su mensaje.
 */
export function RegistrarTendero() {
  const { vendedor } = useSesion();
  const navigate = useNavigate();
  const [datos, setDatos] = useState<Campos>(VACIO);
  const [error, setError] = useState<string | null>(null);

  const cambiar = (campo: keyof Campos) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDatos({ ...datos, [campo]: e.target.value });

  async function guardar(e: FormEvent) {
    e.preventDefault();
    if (!vendedor) return;
    setError(null);
    try {
      await api.registrarTendero({ vendedorId: vendedor.id, ...datos });
      navigate('/tenderos', { state: { mensaje: 'Tendero registrado' } });
    } catch (err) {
      // No se reinician los campos: el vendedor corrige lo que escribió.
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
    }
  }

  return (
    <section className="tarjeta">
      <h1>Registrar tendero</h1>
      <form onSubmit={guardar}>
        <label htmlFor="tipoDocumento">Tipo de documento</label>
        <select
          id="tipoDocumento"
          required
          value={datos.tipoDocumento}
          onChange={(e) => setDatos({ ...datos, tipoDocumento: e.target.value as TipoDocumento })}
        >
          <option value="DI">DI · Documento de identidad</option>
          <option value="RT">RT · Registro tributario</option>
          <option value="PA">PA · Pasaporte</option>
        </select>
        <label htmlFor="numeroDocumento">Número de documento</label>
        <input id="numeroDocumento" required maxLength={MAXIMO} value={datos.numeroDocumento} onChange={cambiar('numeroDocumento')} />
        <label htmlFor="nombre">Nombre del tendero</label>
        <input id="nombre" required maxLength={MAXIMO} value={datos.nombre} onChange={cambiar('nombre')} />
        <label htmlFor="nombreTienda">Nombre de la tienda</label>
        <input id="nombreTienda" required maxLength={MAXIMO} value={datos.nombreTienda} onChange={cambiar('nombreTienda')} />
        <label htmlFor="telefono">Teléfono</label>
        <input id="telefono" required maxLength={MAXIMO} value={datos.telefono} onChange={cambiar('telefono')} />
        {/* Sin type="email": la regla del correo es la de la API (P3), no la del navegador. */}
        <label htmlFor="correo">Correo</label>
        <input id="correo" maxLength={MAXIMO} value={datos.correo} onChange={cambiar('correo')} />
        <label htmlFor="direccion">Dirección</label>
        <input id="direccion" required maxLength={MAXIMO} value={datos.direccion} onChange={cambiar('direccion')} />
        <button type="submit">Guardar</button>
        {error && <p role="alert" className="error">{error}</p>}
      </form>
    </section>
  );
}
