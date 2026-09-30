// Genera los datos sintéticos del Portal Andina. Todos los valores son inventados.
// Regla de datos de prueba: los documentos empiezan por 999, los teléfonos usan el
// prefijo ficticio 555 y los correos el dominio reservado ejemplo.test.
// Uso: node test-data/generar.mjs
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));

/** Dígito de control del registro tributario (RT), según el anexo de reglas del documento de Andina. */
export function digitoControlRT(base) {
  let suma = 0;
  const digitos = base.split('').reverse();
  digitos.forEach((d, i) => { suma += Number(d) * ((i % 9) + 2); });
  const r = suma % 11;
  return r === 10 ? 0 : r;
}

const vendedores = [
  { id: 1, codigo: 'V-101', nombre: 'Vendedor Ruta Norte', zona: 'Norte' },
  { id: 2, codigo: 'V-102', nombre: 'Vendedor Ruta Sur', zona: 'Sur' },
  { id: 3, codigo: 'V-103', nombre: 'Vendedor Ruta Centro', zona: 'Centro' },
];

const productos = [
  ['AB-001', 'Arroz blanco', 'Abarrotes', 'Bolsa 1 kg'],
  ['AB-002', 'Aceite vegetal', 'Abarrotes', 'Botella 1 L'],
  ['AB-003', 'Azúcar', 'Abarrotes', 'Bolsa 1 kg'],
  ['AB-004', 'Pasta larga', 'Abarrotes', 'Paquete 500 g'],
  ['BE-001', 'Agua sin gas', 'Bebidas', 'Botella 600 ml'],
  ['BE-002', 'Jugo de naranja', 'Bebidas', 'Caja 1 L'],
  ['BE-003', 'Café molido', 'Bebidas', 'Bolsa 250 g'],
  ['AS-001', 'Jabón de barra', 'Aseo', 'Unidad 250 g'],
  ['AS-002', 'Detergente en polvo', 'Aseo', 'Bolsa 1 kg'],
  ['AS-003', 'Papel higiénico', 'Aseo', 'Paquete x4'],
  ['SN-001', 'Galletas de sal', 'Snacks', 'Paquete x6'],
  ['SN-002', 'Maní salado', 'Snacks', 'Bolsa 100 g'],
].map(([sku, nombre, categoria, presentacion], i) => ({ id: i + 1, sku, nombre, categoria, presentacion }));

const tiendas = [
  ['Tienda La Esquina', 'Norte'], ['Minimercado El Roble', 'Norte'], ['Tienda Doña Rosa', 'Norte'],
  ['Autoservicio La 20', 'Norte'], ['Tienda El Parque', 'Norte'],
  ['Tienda San José', 'Sur'], ['Minimercado Los Pinos', 'Sur'], ['Tienda El Ahorro', 'Sur'],
  ['Granero La Cosecha', 'Sur'], ['Tienda Las Palmas', 'Sur'],
  ['Tienda Central', 'Centro'], ['Minimercado La Plaza', 'Centro'], ['Tienda El Faro', 'Centro'],
  ['Autoservicio Mi Barrio', 'Centro'], ['Tienda La Estación', 'Centro'],
];
const nombres = ['Ana Prueba', 'Luis Ficticio', 'Marta Ejemplo', 'Carlos Muestra', 'Elena Sintética',
  'Jorge Inventado', 'Rosa Demo', 'Pedro Ficticio', 'Lucía Prueba', 'Andrés Ejemplo',
  'Sofía Muestra', 'Diego Demo', 'Clara Inventada', 'Tomás Prueba', 'Irene Ejemplo'];

const tenderos = tiendas.map(([nombreTienda, zona], i) => {
  const n = i + 1;
  const esEmpresa = n % 5 === 0;
  let tipoDocumento = 'DI';
  let numeroDocumento = `999${String(100000 + n * 137).slice(-6)}`;
  if (esEmpresa) {
    const base = `999${String(200000 + n * 71).padStart(6, '0')}`;
    tipoDocumento = 'RT';
    numeroDocumento = `${base}-${digitoControlRT(base)}`;
  }
  const vendedorId = vendedores.find((v) => v.zona === zona).id;
  return {
    id: n,
    tipoDocumento,
    numeroDocumento,
    nombre: nombres[i],
    nombreTienda,
    telefono: n % 4 === 0 ? null : `555-01${String(n).padStart(2, '0')}`,
    correo: n % 3 === 0 ? null : `tienda${n}@ejemplo.test`,
    direccion: `Calle Ficticia ${n * 3} n.º ${10 + n}`,
    zona,
    vendedorId,
  };
});

const escribir = (archivo, datos) => writeFileSync(join(aqui, archivo), JSON.stringify(datos, null, 2) + '\n');
escribir('vendedores.json', vendedores);
escribir('productos.json', productos);
escribir('tenderos.json', tenderos);
console.log(`Datos sintéticos generados: ${vendedores.length} vendedores, ${productos.length} productos, ${tenderos.length} tenderos.`);
