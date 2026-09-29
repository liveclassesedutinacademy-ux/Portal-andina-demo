import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Tendero } from '../lib/api';
import { useSesion } from '../lib/sesion';

export function Tenderos() {
  const { vendedor } = useSesion();
  const [tenderos, setTenderos] = useState<Tendero[]>([]);

  useEffect(() => {
    if (vendedor) api.tenderos(vendedor.id).then((r) => setTenderos(r.tenderos));
  }, [vendedor]);

  return (
    <section>
      <h1>Tenderos de la zona {vendedor?.zona}</h1>
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
