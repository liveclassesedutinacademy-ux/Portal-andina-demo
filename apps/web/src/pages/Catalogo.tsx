import { useEffect, useState } from 'react';
import { api, type Producto } from '../lib/api';

const CATEGORIAS = ['Abarrotes', 'Bebidas', 'Aseo', 'Snacks'];

export function Catalogo() {
  const [categoria, setCategoria] = useState('');
  const [productos, setProductos] = useState<Producto[]>([]);

  useEffect(() => {
    api.catalogo(categoria || undefined).then((r) => setProductos(r.productos));
  }, [categoria]);

  return (
    <section>
      <h1>Catálogo</h1>
      <label htmlFor="categoria">Categoría</label>
      <select id="categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
        <option value="">Todas</option>
        {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <table>
        <thead><tr><th>SKU</th><th>Producto</th><th>Categoría</th><th>Presentación</th></tr></thead>
        <tbody>
          {productos.map((p) => (
            <tr key={p.id}><td>{p.sku}</td><td>{p.nombre}</td><td>{p.categoria}</td><td>{p.presentacion}</td></tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
