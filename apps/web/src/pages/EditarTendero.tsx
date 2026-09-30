import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, type DatosEdicionTendero } from '../lib/api';
import { useSesion } from '../lib/sesion';
import { validarEdicionTendero } from '../lib/validacionTendero';

const VACIO: DatosEdicionTendero = { nombre: '', nombreTienda: '', telefono: '', correo: '', direccion: '' };

/** Mensaje aprobado de HU-102 (P6 b); es el mismo que responde la API con 409. */
const MENSAJE_INACTIVO = 'Este tendero está inactivo y no se puede editar.';

/**
 * Formulario de edición de datos del tendero (HU-102).
 * Valida con las reglas de la API antes de enviar; si la API rechaza, muestra su mensaje y conserva lo escrito.
 * Un tendero inactivo se muestra con los campos y el botón deshabilitados (P6 b).
 */
export function EditarTendero() {
  const { id } = useParams();
  const { vendedor } = useSesion();
  const navigate = useNavigate();
  const [datos, setDatos] = useState<DatosEdicionTendero>(VACIO);
  const [inactivo, setInactivo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.tendero(Number(id)).then(({ tendero }) => {
      setDatos({
        nombre: tendero.nombre,
        nombreTienda: tendero.nombreTienda,
        telefono: tendero.telefono ?? '',
        correo: tendero.correo ?? '',
        direccion: tendero.direccion,
      });
      setInactivo(tendero.estado === 'inactivo');
    });
  }, [id]);

  const cambiar = (campo: keyof DatosEdicionTendero) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDatos({ ...datos, [campo]: e.target.value });

  async function guardar(e: FormEvent) {
    e.preventDefault();
    if (!vendedor || inactivo) return;
    // No se reinician los campos: el vendedor corrige lo que escribió.
    const invalido = validarEdicionTendero(datos);
    setError(invalido);
    if (invalido) return;
    try {
      await api.actualizarTendero(Number(id), datos, vendedor.id);
      navigate('/tenderos', { state: { mensaje: 'Datos actualizados' } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
    }
  }

  return (
    <section className="tarjeta">
      <h1>Editar datos del tendero</h1>
      {inactivo && <p role="alert" className="error">{MENSAJE_INACTIVO}</p>}
      <form onSubmit={guardar}>
        <label htmlFor="nombre">Nombre del tendero</label>
        <input id="nombre" disabled={inactivo} value={datos.nombre} onChange={cambiar('nombre')} />
        <label htmlFor="nombreTienda">Nombre de la tienda</label>
        <input id="nombreTienda" disabled={inactivo} value={datos.nombreTienda} onChange={cambiar('nombreTienda')} />
        <label htmlFor="telefono">Teléfono</label>
        <input id="telefono" disabled={inactivo} value={datos.telefono ?? ''} onChange={cambiar('telefono')} />
        {/* Sin type="email": la regla del correo es la de la API (P9 a), no la del navegador. */}
        <label htmlFor="correo">Correo</label>
        <input id="correo" disabled={inactivo} value={datos.correo ?? ''} onChange={cambiar('correo')} />
        <label htmlFor="direccion">Dirección</label>
        <input id="direccion" disabled={inactivo} value={datos.direccion} onChange={cambiar('direccion')} />
        <button type="submit" disabled={inactivo}>Guardar</button>
        {error && <p role="alert" className="error">{error}</p>}
      </form>
    </section>
  );
}
