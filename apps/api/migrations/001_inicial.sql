-- Esquema inicial del Portal Andina. Datos ficticios.
CREATE TABLE IF NOT EXISTS vendedores (
  id INTEGER PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  zona TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS productos (
  id INTEGER PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  categoria TEXT NOT NULL,
  presentacion TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tenderos (
  id INTEGER PRIMARY KEY,
  tipo_documento TEXT NOT NULL,
  numero_documento TEXT NOT NULL,
  nombre TEXT NOT NULL,
  nombre_tienda TEXT NOT NULL,
  telefono TEXT,
  correo TEXT,
  direccion TEXT NOT NULL,
  zona TEXT NOT NULL,
  vendedor_id INTEGER NOT NULL REFERENCES vendedores(id),
  estado TEXT NOT NULL DEFAULT 'activo',
  creado_en TEXT NOT NULL DEFAULT (datetime('now'))
);
