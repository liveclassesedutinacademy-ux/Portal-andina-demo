import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api, type Tendero } from '../lib/api';
import { useSesion } from '../lib/sesion';

export function Tenderos() {
  const { vendedor } = useSesion();
  const [tenderos, setTenderos] = useState<Tendero[]>([]);
  const [error, setError] = useState<string | null>(null);
  // Mensaje que deja el registro (HU-101, P9 a) o la edición (HU-102, P7) de un tendero al volver a la lista.
  const mensaje = (useLocation().state as { mensaje?: string } | null)?.mensaje;

  useEffect(() => {
    if (!vendedor) return;
    setError(null);
    api
      .tenderos(vendedor.id)
      .then((r) => setTenderos(r.tenderos))
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar la lista de tenderos'));
  }, [vendedor]);

  return (
    <section>
      <h1>Tenderos de la zona {vendedor?.zona}</h1>
      {mensaje && <p role="status">{mensaje}</p>}
      {error && <p role="alert" className="error">{error}</p>}
      <Link to="/tenderos/nuevo">Registrar tendero</Link>
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
    </section>
  );
}
