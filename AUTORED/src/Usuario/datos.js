// Datos y utilidades compartidas del catálogo y del detalle de producto.
// Ubicación: src/Catalogo/datos.js
import { useCallback, useMemo, useState } from 'react';
import { Disc, Engine, Lightning, Funnel, Gear, ArrowsVertical } from '@phosphor-icons/react';

export const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ======================= DATOS DE MUESTRA (sustituye por tu API) ======================= */
// TODO: carga estos datos desde tu backend (PHP/MySQL). Cada producto trae sus existencias por sucursal (st).
export const CATEGORIAS = [
  { id: 'frenos', t: 'Frenos', icon: Disc },
  { id: 'motor', t: 'Motor', icon: Engine },
  { id: 'encendido', t: 'Encendido', icon: Lightning },
  { id: 'filtros', t: 'Filtros', icon: Funnel },
  { id: 'transmision', t: 'Transmisión', icon: Gear },
  { id: 'suspension', t: 'Suspensión', icon: ArrowsVertical },
];
export const CAT = Object.fromEntries(CATEGORIAS.map((c) => [c.id, c]));

// Coordenadas aproximadas de muestra. Referencia por defecto: Cd. Nezahualcóyotl (cámbiala si quieres).
export const REFERENCIA = { lat: 19.4046, lng: -99.0136, nombre: 'Cd. Nezahualcóyotl' };
export const SUCURSALES = [
  { id: 'neza', n: 'AutoRed Neza Centro', lat: 19.4006, lng: -99.0148, tel: '5215500000001' },
  { id: 'chim', n: 'AutoRed Chimalhuacán', lat: 19.4217, lng: -98.9456, tel: '5215500000002' },
  { id: 'izta', n: 'AutoRed Iztapalapa', lat: 19.3574, lng: -99.0926, tel: '5215500000003' },
  { id: 'tex', n: 'AutoRed Texcoco', lat: 19.5172, lng: -98.8829, tel: '5215500000004' },
  { id: 'ecat', n: 'AutoRed Ecatepec', lat: 19.601, lng: -99.051, tel: '5215500000005' },
];

const P = (id, nombre, cat, marca, fab, precio, compat, st) => ({ id, nombre, sku: id.toUpperCase(), cat, marca, fab, precio, compat, st });
export const PRODUCTOS = [
  P('br-20418', 'Balatas cerámicas delanteras', 'frenos', 'Torque', 'Frenotec', 849, ['Versa 2018', 'March 2017', 'Sentra 2016'], { neza: 12, chim: 0, izta: 7, tex: 0, ecat: 4 }),
  P('br-20990', 'Balatas semimetálicas delanteras', 'frenos', 'Vortex', 'Frenotec', 690, ['Versa 2018', 'Aveo 2016'], { neza: 2, chim: 5, izta: 0, tex: 3, ecat: 0 }),
  P('dv-31002', 'Disco de freno ventilado', 'frenos', 'Delta', 'Frenotec', 1120, ['Versa 2018', 'Tsuru 2015'], { neza: 0, chim: 0, izta: 0, tex: 0, ecat: 2 }),
  P('mo-11540', 'Juego de pistones STD', 'motor', 'Nova', 'Motormax', 2340, ['Aveo 2016', 'Chevy 2012'], { neza: 0, chim: 3, izta: 1, tex: 0, ecat: 0 }),
  P('mo-11877', 'Banda de distribución', 'motor', 'Torque', 'Motormax', 560, ['Versa 2018', 'Aveo 2016', 'Chevy 2012'], { neza: 8, chim: 6, izta: 0, tex: 0, ecat: 3 }),
  P('mo-12003', 'Bomba de aceite', 'motor', 'Delta', 'Motormax', 1480, ['Sentra 2016', 'Tsuru 2015'], { neza: 0, chim: 0, izta: 4, tex: 0, ecat: 0 }),
  P('en-40111', 'Bujías de iridio (4 piezas)', 'encendido', 'Vortex', 'Ignix', 620, ['Versa 2018', 'March 2017', 'Aveo 2016'], { neza: 20, chim: 9, izta: 5, tex: 2, ecat: 7 }),
  P('en-40230', 'Bobina de encendido', 'encendido', 'Nova', 'Ignix', 780, ['Versa 2018', 'Sentra 2016'], { neza: 3, chim: 0, izta: 0, tex: 0, ecat: 0 }),
  P('en-40377', 'Cables de bujía', 'encendido', 'Torque', 'Ignix', 340, ['Tsuru 2015', 'Chevy 2012'], { neza: 0, chim: 2, izta: 6, tex: 4, ecat: 0 }),
  P('fi-10231', 'Filtro de aceite', 'filtros', 'Delta', 'Filtrex', 189, ['Versa 2018', 'March 2017', 'Aveo 2016', 'Tsuru 2015'], { neza: 30, chim: 12, izta: 9, tex: 5, ecat: 14 }),
  P('fi-10388', 'Filtro de aire', 'filtros', 'Vortex', 'Filtrex', 245, ['Versa 2018', 'Sentra 2016'], { neza: 6, chim: 0, izta: 3, tex: 0, ecat: 0 }),
  P('fi-10499', 'Filtro de gasolina', 'filtros', 'Nova', 'Filtrex', 310, ['Aveo 2016', 'Chevy 2012'], { neza: 0, chim: 0, izta: 0, tex: 1, ecat: 0 }),
  P('tr-50120', 'Kit de clutch completo', 'transmision', 'Torque', 'Transdrive', 2150, ['Versa 2018', 'March 2017'], { neza: 2, chim: 0, izta: 0, tex: 0, ecat: 1 }),
  P('tr-50288', 'Disco de clutch', 'transmision', 'Delta', 'Transdrive', 980, ['Aveo 2016', 'Tsuru 2015'], { neza: 0, chim: 4, izta: 2, tex: 0, ecat: 0 }),
  P('su-60105', 'Amortiguador delantero', 'suspension', 'Vortex', 'Suspro', 1260, ['Versa 2018', 'Sentra 2016'], { neza: 5, chim: 0, izta: 0, tex: 3, ecat: 0 }),
  P('su-60244', 'Rótula superior', 'suspension', 'Nova', 'Suspro', 410, ['Aveo 2016', 'Tsuru 2015', 'Chevy 2012'], { neza: 0, chim: 7, izta: 0, tex: 0, ecat: 5 }),
  P('su-60390', 'Resorte helicoidal', 'suspension', 'Torque', 'Suspro', 870, ['Versa 2018', 'March 2017'], { neza: 0, chim: 0, izta: 0, tex: 0, ecat: 0 }),
];
export const MARCAS = [...new Set(PRODUCTOS.map((p) => p.marca))].sort();

export const PMIN = 0;
export const PMAX = Math.ceil(Math.max(...PRODUCTOS.map((p) => p.precio)) / 100) * 100;
export const PSTEP = 10;
export const KMAX = 50; // 50 km = "sin límite"
export const NB = 10;   // barras del histograma
export const ORDENES = [
  { id: 'relevancia', t: 'Relevancia' },
  { id: 'cercano', t: 'Más cercano' },
  { id: 'precio-asc', t: 'Precio: menor a mayor' },
  { id: 'precio-desc', t: 'Precio: mayor a menor' },
  { id: 'nombre', t: 'Nombre A–Z' },
];

/* ======================= UTILIDADES ======================= */
export const norm = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export const toks = (q) => norm(q).split(/\s+/).filter(Boolean);
export const dinero = (n) => `$${n.toLocaleString('es-MX')}`;
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const num = (v, d) => { const n = Number(v); return v !== null && v !== '' && Number.isFinite(n) ? n : d; };
export const csv = (v) => (v ? v.split(',').filter(Boolean) : []);
export const kmTxt = (km) => (km < 10 ? km.toFixed(1) : Math.round(km));

// Distancia entre dos coordenadas (fórmula de Haversine), en km
export function distanciaKm(a, b) {
  const R = 6371, rad = (x) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}


/* ======================= UBICACIÓN DEL USUARIO ======================= */
// Se pide SOLO cuando el usuario pulsa "Usar mi ubicación". Las coordenadas se guardan en sessionStorage
// (se borran al cerrar la pestaña) para que el detalle de producto use las mismas distancias que el catálogo.
// Nunca se envían a ningún servidor desde este código.
const LLAVE_UBIC = 'autored-ubic';
function ubicInicial() {
  const base = { lat: REFERENCIA.lat, lng: REFERENCIA.lng, fuente: 'ref', estado: 'idle', msg: '' };
  try {
    const g = JSON.parse(sessionStorage.getItem(LLAVE_UBIC) || 'null');
    if (g && Number.isFinite(g.lat) && Number.isFinite(g.lng)) return { ...base, lat: g.lat, lng: g.lng, fuente: 'gps' };
  } catch { /* sin almacenamiento */ }
  return base;
}
export function useUbicacion() {
  const [ubic, setUbic] = useState(ubicInicial);
  const dist = useMemo(() => Object.fromEntries(SUCURSALES.map((b) => [b.id, distanciaKm(ubic, b)])), [ubic.lat, ubic.lng]); // eslint-disable-line react-hooks/exhaustive-deps
  const pedirUbic = useCallback(() => {
    if (!navigator.geolocation) { setUbic((u) => ({ ...u, estado: 'error', msg: 'Tu navegador no permite ubicarte. Usamos la referencia.' })); return; }
    setUbic((u) => ({ ...u, estado: 'buscando' }));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        try { sessionStorage.setItem(LLAVE_UBIC, JSON.stringify(c)); } catch { /* sin almacenamiento */ }
        setUbic({ ...c, fuente: 'gps', estado: 'idle', msg: '' });
      },
      (err) => setUbic((u) => ({ ...u, estado: 'error', msg: err.code === 1 ? 'No diste permiso de ubicación. Usamos la referencia; puedes elegir sucursales a mano.' : 'No pudimos obtener tu ubicación. Usamos la referencia.' })),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
  }, []);
  return { ubic, dist, pedirUbic };
}
