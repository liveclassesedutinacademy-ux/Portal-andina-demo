import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useSesion } from '../lib/sesion';

export function Ingreso() {
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { entrar } = useSesion();
  const navegar = useNavigate();

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const { vendedor } = await api.iniciarSesion(codigo);
      entrar(vendedor);
      navegar('/catalogo');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión');
    }
  }

  return (
    <section className="tarjeta">
      <h1>Ingreso del vendedor</h1>
      <form onSubmit={enviar}>
        <label htmlFor="codigo">Código de vendedor</label>
        <input id="codigo" value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="V-101" />
        <button type="submit">Entrar</button>
        {error && <p role="alert" className="error">{error}</p>}
      </form>
    </section>
  );
}
