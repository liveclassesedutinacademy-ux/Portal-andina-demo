import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { ProveedorSesion, useSesion } from './lib/sesion';
import { Ingreso } from './pages/Ingreso';
import { Catalogo } from './pages/Catalogo';
import { Tenderos } from './pages/Tenderos';
import { EditarTendero } from './pages/EditarTendero';

function Encabezado() {
  const { vendedor, salir } = useSesion();
  return (
    <header className="encabezado">
      <strong>Portal Andina</strong>
      {vendedor && (
        <nav>
          <Link to="/catalogo">Catálogo</Link>
          <Link to="/tenderos">Tenderos</Link>
          <span className="vendedor">{vendedor.nombre} · zona {vendedor.zona}</span>
          <button type="button" onClick={salir}>Salir</button>
        </nav>
      )}
    </header>
  );
}

function Protegida({ children }: { children: React.ReactNode }) {
  const { vendedor } = useSesion();
  return vendedor ? <>{children}</> : <Navigate to="/" replace />;
}

export function App() {
  return (
    <ProveedorSesion>
      <Encabezado />
      <main>
        <Routes>
          <Route path="/" element={<Ingreso />} />
          <Route path="/catalogo" element={<Protegida><Catalogo /></Protegida>} />
          <Route path="/tenderos" element={<Protegida><Tenderos /></Protegida>} />
          <Route path="/tenderos/:id/editar" element={<Protegida><EditarTendero /></Protegida>} />
        </Routes>
      </main>
      <footer className="pie">Distribuidora Andina y Nodo Software son empresas ficticias. Datos de práctica.</footer>
    </ProveedorSesion>
  );
}
