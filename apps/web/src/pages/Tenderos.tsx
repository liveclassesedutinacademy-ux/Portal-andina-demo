import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api, type Tendero } from '../lib/api';
import { useSesion } from '../lib/sesion';

/** Con menos caracteres, sin los espacios de los extremos, se muestra la lista completa de la zona (HU-103 CA3, P3). */
const MINIMO_BUSQUEDA = 3;

export function Tenderos() {
  const { vendedor } = useSesion();
  const [tenderos, setTenderos] = useState<Tendero[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  // Texto con el que respondió la API; el mensaje sin resultados solo vale para una búsqueda activa (CA4).
  const [buscado, setBuscado] = useState('');
  // Mensaje que deja el registro de un tendero al volver a la lista (HU-101, P9 a).
  const mensaje = (useLocation().state as { mensaje?: string } | null)?.mensaje;
  // El filtro lo aplica la API (P1); solo se le envía el texto cuando llega al mínimo.
  const texto = busqueda.trim().length >= MINIMO_BUSQUEDA ? busqueda.trim() : '';

  useEffect(() => {
    if (!vendedor) return;
    // Si el texto cambia antes de que llegue la respuesta, esa respuesta se descarta (P5).
    let vigente = true;
    setError(null);
    api
      .tenderos(vendedor.id, texto)
      .then((r) => {
        if (!vigente) return;
        setTenderos(r.tenderos);
        setBuscado(texto);
      })
      .catch((err) => {
        if (vigente) setError(err instanceof Error ? err.message : 'No se pudo cargar la lista de tenderos');
      });
    return () => {
      vigente = false;
    };
  }, [vendedor, texto]);

  return (
    <section>
      <h1>Tenderos de la zona {vendedor?.zona}</h1>
      {mensaje && <p role="status">{mensaje}</p>}
      {error && <p role="alert" className="error">{error}</p>}
      <Link to="/tenderos/nuevo">Registrar tendero</Link>
      <label htmlFor="buscar-tienda">Buscar tienda</label>
      <input id="buscar-tienda" type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
      <table>
        <thead><tr><th>Tienda</th><th>Tendero</th><th>Documento</th><th>Teléfono</th><th></th></tr></thead>
        <tbody>
          {tenderos.map((t) => (
            <tr key={t.id}>
              <td>{t.nombreTienda}</td>
              <td>{t.nombre}</td>
              <td>{t.tipoDocumento} {t.numeroDocumento}</td>
              <td>{t.telefono ?? '—'}</td>
              <td><Link to={`/tenderos/${t.id}/editar`}>Editar</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
      {buscado && !error && tenderos.length === 0 && <p>No hay tiendas con ese nombre en tu zona</p>}
    </section>
  );
}
