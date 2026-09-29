import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { api, type DatosEdicionTendero } from '../lib/api';

const VACIO: DatosEdicionTendero = { nombre: '', nombreTienda: '', telefono: '', correo: '', direccion: '' };

/**
 * Formulario de edición de datos del tendero.
 * Todavía no valida los campos ni tiene endpoint para guardar: eso lo construye la historia
 * «edición de datos del tendero» del backlog.
 */
export function EditarTendero() {
  const { id } = useParams();
  const [datos, setDatos] = useState<DatosEdicionTendero>(VACIO);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    api.tendero(Number(id)).then(({ tendero }) =>
      setDatos({
        nombre: tendero.nombre,
        nombreTienda: tendero.nombreTienda,
        telefono: tendero.telefono ?? '',
        correo: tendero.correo ?? '',
        direccion: tendero.direccion,
      }),
    );
  }, [id]);

  const cambiar = (campo: keyof DatosEdicionTendero) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDatos({ ...datos, [campo]: e.target.value });

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setMensaje(null);
    try {
      await api.actualizarTendero(Number(id), datos);
      setMensaje('Datos guardados');
    } catch (err) {
      setMensaje(err instanceof Error ? `No se pudo guardar: ${err.message}` : 'No se pudo guardar');
    }
  }

  return (
    <section className="tarjeta">
      <h1>Editar datos del tendero</h1>
      <form onSubmit={guardar}>
        <label htmlFor="nombre">Nombre del tendero</label>
        <input id="nombre" value={datos.nombre} onChange={cambiar('nombre')} />
        <label htmlFor="nombreTienda">Nombre de la tienda</label>
        <input id="nombreTienda" value={datos.nombreTienda} onChange={cambiar('nombreTienda')} />
        <label htmlFor="telefono">Teléfono</label>
        <input id="telefono" value={datos.telefono ?? ''} onChange={cambiar('telefono')} />
        <label htmlFor="correo">Correo</label>
        <input id="correo" value={datos.correo ?? ''} onChange={cambiar('correo')} />
        <label htmlFor="direccion">Dirección</label>
        <input id="direccion" value={datos.direccion} onChange={cambiar('direccion')} />
        <button type="submit">Guardar</button>
        {mensaje && <p role="status">{mensaje}</p>}
      </form>
    </section>
  );
}
