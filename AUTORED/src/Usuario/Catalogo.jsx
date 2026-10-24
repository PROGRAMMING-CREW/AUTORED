// Catálogo de refacciones — AutoRed. Ubicación: src/Catalogo/Catalogo.jsx
// Mismos estilos ax- (index.css) que Index, Registro y Login; lo propio lleva prefijo axc- en ./Catalogo.css.
//
// Ruta:  <Route path="/catalogo" element={<Catalogo rol="comprador" usuario={usuario} onSalir={cerrarSesion} />} />
// Los filtros viven en la URL (?q=balatas&cat=frenos&min=200&max=900&km=15), así que se pueden
// compartir, y el botón "atrás" del navegador funciona.
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Badge, Reveal } from '../autored-ui';
import Nav from '../Components/NavUsuario';
import Footer from '../Components/Footer';
import '../index.css';
import './Catalogo.css';
import ChatBot from '../Components/ChatBot';
import {
  MagnifyingGlass, X, Funnel, MapPin, NavigationArrow, WhatsappLogo, Scales, CheckCircle, CircleNotch,
  ArrowCounterClockwise, Engine, Lightning, Gear, ArrowsVertical, Disc, Package, Check, WarningCircle, Robot,
} from '@phosphor-icons/react';

const cx = (...c) => c.filter(Boolean).join(' ');
const W = 'duotone';
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ======================= DATOS DE MUESTRA (sustituye por tu API) ======================= */
// TODO: carga estos datos desde tu backend (PHP/MySQL). Cada producto trae sus existencias por sucursal (st).
const CATEGORIAS = [
  { id: 'frenos', t: 'Frenos', icon: Disc },
  { id: 'motor', t: 'Motor', icon: Engine },
  { id: 'encendido', t: 'Encendido', icon: Lightning },
  { id: 'filtros', t: 'Filtros', icon: Funnel },
  { id: 'transmision', t: 'Transmisión', icon: Gear },
  { id: 'suspension', t: 'Suspensión', icon: ArrowsVertical },
];
const CAT = Object.fromEntries(CATEGORIAS.map((c) => [c.id, c]));

// Coordenadas aproximadas de muestra. Referencia por defecto: Cd. Nezahualcóyotl (cámbiala si quieres).
const REFERENCIA = { lat: 19.4046, lng: -99.0136, nombre: 'Cd. Nezahualcóyotl' };
const SUCURSALES = [
  { id: 'neza', n: 'AutoRed Neza Centro', lat: 19.4006, lng: -99.0148, tel: '5215500000001' },
  { id: 'chim', n: 'AutoRed Chimalhuacán', lat: 19.4217, lng: -98.9456, tel: '5215500000002' },
  { id: 'izta', n: 'AutoRed Iztapalapa', lat: 19.3574, lng: -99.0926, tel: '5215500000003' },
  { id: 'tex', n: 'AutoRed Texcoco', lat: 19.5172, lng: -98.8829, tel: '5215500000004' },
  { id: 'ecat', n: 'AutoRed Ecatepec', lat: 19.601, lng: -99.051, tel: '5215500000005' },
];

const P = (id, nombre, cat, marca, fab, precio, compat, st) => ({ id, nombre, sku: id.toUpperCase(), cat, marca, fab, precio, compat, st });
const PRODUCTOS = [
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
const MARCAS = [...new Set(PRODUCTOS.map((p) => p.marca))].sort();

const PMIN = 0;
const PMAX = Math.ceil(Math.max(...PRODUCTOS.map((p) => p.precio)) / 100) * 100;
const PSTEP = 10;
const KMAX = 50; // 50 km = "sin límite"
const NB = 10;   // barras del histograma
const ORDENES = [
  { id: 'relevancia', t: 'Relevancia' },
  { id: 'cercano', t: 'Más cercano' },
  { id: 'precio-asc', t: 'Precio: menor a mayor' },
  { id: 'precio-desc', t: 'Precio: mayor a menor' },
  { id: 'nombre', t: 'Nombre A–Z' },
];
const EJEMPLOS = ['Balatas', 'Filtro de aceite', 'Bujías', 'Versa 2018'];

/* ======================= UTILIDADES ======================= */
const norm = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const toks = (q) => norm(q).split(/\s+/).filter(Boolean);
const dinero = (n) => `$${n.toLocaleString('es-MX')}`;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const num = (v, d) => { const n = Number(v); return v !== null && v !== '' && Number.isFinite(n) ? n : d; };
const csv = (v) => (v ? v.split(',').filter(Boolean) : []);
const kmTxt = (km) => (km < 10 ? km.toFixed(1) : Math.round(km));

// Distancia entre dos coordenadas (fórmula de Haversine), en km
function distanciaKm(a, b) {
  const R = 6371, rad = (x) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const INDICE = Object.fromEntries(PRODUCTOS.map((p) => [p.id, norm([p.nombre, p.sku, p.marca, p.fab, CAT[p.cat].t, ...p.compat].join(' '))]));
const coincide = (p, q) => toks(q).every((t) => INDICE[p.id].includes(t));
const puntaje = (p, q) => toks(q).reduce((a, t) => a + 1 + (norm(p.nombre).includes(t) ? 3 : 0) + (norm(p.sku).includes(t) ? 4 : 0), 0);

/* ======================= FILTROS EN LA URL ======================= */
const parsear = (sp) => ({
  q: sp.get('q') || '',
  cats: csv(sp.get('cat')).filter((c) => CAT[c]),
  marcas: csv(sp.get('marca')).filter((m) => MARCAS.includes(m)),
  suc: csv(sp.get('suc')).filter((s) => SUCURSALES.some((b) => b.id === s)),
  min: clamp(num(sp.get('min'), PMIN), PMIN, PMAX),
  max: clamp(num(sp.get('max'), PMAX), PMIN, PMAX),
  km: clamp(num(sp.get('km'), KMAX), 5, KMAX),
  stock: sp.get('stock') === '1',
  orden: ORDENES.some((o) => o.id === sp.get('orden')) ? sp.get('orden') : 'relevancia',
});
function serializar(f) {
  const sp = new URLSearchParams();
  if (f.q.trim()) sp.set('q', f.q.trim());
  if (f.cats.length) sp.set('cat', f.cats.join(','));
  if (f.marcas.length) sp.set('marca', f.marcas.join(','));
  if (f.suc.length) sp.set('suc', f.suc.join(','));
  if (f.min > PMIN) sp.set('min', String(f.min));
  if (f.max < PMAX) sp.set('max', String(f.max));
  if (f.km < KMAX) sp.set('km', String(f.km));
  if (f.stock) sp.set('stock', '1');
  if (f.orden !== 'relevancia') sp.set('orden', f.orden);
  return sp;
}
function useFiltros() {
  const [sp, setSp] = useSearchParams();
  const f = useMemo(() => parsear(sp), [sp]);
  const set = useCallback((patch) => {
    setSp((prev) => {
      const sig = { ...parsear(prev), ...patch };
      if (sig.min > sig.max) { if ('min' in patch) sig.max = sig.min; else sig.min = sig.max; }
      return serializar(sig);
    }, { replace: true });
  }, [setSp]);
  const limpiar = useCallback(() => setSp(new URLSearchParams(), { replace: true }), [setSp]);
  return { f, set, limpiar };
}

/* ======================= LÓGICA DE FILTRADO ======================= */
const sucActivo = (f) => f.suc.length > 0 || f.km < KMAX;
const consideradas = (f, dist) => SUCURSALES.filter((b) => (f.suc.length ? f.suc.includes(b.id) : dist[b.id] <= f.km));
function cerca(p, dist, cons) {
  let best = null, qty = 0;
  for (const b of cons) {
    const s = p.st[b.id] || 0;
    if (s > 0) { qty += s; if (!best || dist[b.id] < dist[best.id]) best = b; }
  }
  return best ? { b: best, km: dist[best.id], qty } : null;
}
function aplica(f, p, dist, omit) {
  if (omit !== 'q' && f.q.trim() && !coincide(p, f.q)) return false;
  if (omit !== 'cats' && f.cats.length && !f.cats.includes(p.cat)) return false;
  if (omit !== 'marcas' && f.marcas.length && !f.marcas.includes(p.marca)) return false;
  if (omit !== 'precio' && (p.precio < f.min || p.precio > f.max)) return false;
  if (sucActivo(f)) { if (!cerca(p, dist, consideradas(f, dist))) return false; }
  else if (f.stock && !Object.values(p.st).some((v) => v > 0)) return false;
  return true;
}

/* ======================= HOOKS ======================= */
// Inclinación 3D de la escena del hero (decorativa; solo puntero fino)
function useSceneTilt(max = 8) {
  const surfaceRef = useRef(null);
  const stageRef = useRef(null);
  useEffect(() => {
    const surface = surfaceRef.current, stage = stageRef.current;
    if (!surface || !stage || reduced() || !finePointer()) return;
    let tx = 0, ty = 0, px = 0, py = 0, raf = 0;
    const tick = () => {
      px += (tx - px) * 0.08; py += (ty - py) * 0.08;
      stage.style.transform = `rotateX(${-py * max}deg) rotateY(${px * max}deg)`;
      raf = Math.abs(tx - px) > 0.001 || Math.abs(ty - py) > 0.001 ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const move = (e) => { const r = surface.getBoundingClientRect(); tx = ((e.clientX - r.left) / r.width - 0.5) * 2; ty = ((e.clientY - r.top) / r.height - 0.5) * 2; kick(); };
    const leave = () => { tx = 0; ty = 0; kick(); };
    surface.addEventListener('pointermove', move);
    surface.addEventListener('pointerleave', leave);
    return () => { surface.removeEventListener('pointermove', move); surface.removeEventListener('pointerleave', leave); cancelAnimationFrame(raf); };
  }, [max]);
  return { surfaceRef, stageRef };
}

// Tarjeta con inclinación suave y foco de luz que sigue al cursor
function Tilt({ className, children, max = 5, ...props }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || reduced() || !finePointer()) return;
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    const tick = () => {
      cx += (tx - cx) * 0.14; cy += (ty - cy) * 0.14;
      const quiet = Math.abs(tx - cx) < 0.002 && Math.abs(ty - cy) < 0.002;
      if (quiet && tx === 0 && ty === 0) { el.style.transform = ''; raf = 0; return; }
      el.style.transform = `perspective(900px) rotateX(${-cy * max}deg) rotateY(${cx * max}deg)`;
      raf = quiet ? 0 : requestAnimationFrame(tick);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const move = (e) => {
      const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      tx = (px - 0.5) * 2; ty = (py - 0.5) * 2;
      el.style.setProperty('--mx', `${px * 100}%`); el.style.setProperty('--my', `${py * 100}%`);
      kick();
    };
    const leave = () => { tx = 0; ty = 0; kick(); };
    el.addEventListener('pointermove', move); el.addEventListener('pointerleave', leave);
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); cancelAnimationFrame(raf); };
  }, [max]);
  return <div ref={ref} className={cx('axc-tilt', className)} {...props}>{children}</div>;
}

/* ======================= ILUSTRACIONES (SVG propio) ======================= */
function gearPath(teeth, ro, ri, c = 100) {
  const step = (Math.PI * 2) / teeth;
  let d = '';
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const pts = [[a - step * 0.32, ri], [a - step * 0.17, ro], [a + step * 0.17, ro], [a + step * 0.32, ri]]
      .map(([t, r]) => `${(c + Math.cos(t) * r).toFixed(2)} ${(c + Math.sin(t) * r).toFixed(2)}`);
    d += `${i === 0 ? 'M' : 'L'}${pts[0]} L${pts[1]} L${pts[2]} L${pts[3]} `;
  }
  return `${d}Z`;
}
const ring = (n, r, c = 100) => Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2; return [c + Math.cos(a) * r, c + Math.sin(a) * r]; });
const resorte = (() => { let d = 'M60 46'; for (let i = 0; i < 9; i++) d += ` L${i % 2 ? 28 : 92} ${52 + i * 11}`; return `${d} L60 150`; })();

// Los degradados se declaran UNA vez para toda la página (evita ids repetidos en cada tarjeta)
function Defs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="cg-disc" cx="40%" cy="35%" r="75%"><stop offset="0" stopColor="#9a8486" /><stop offset=".6" stopColor="#4a3638" /><stop offset="1" stopColor="#2a1618" /></radialGradient>
        <linearGradient id="cg-cal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ff5a4f" /><stop offset="1" stopColor="#9b111e" /></linearGradient>
        <linearGradient id="cg-gear" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ff8d85" /><stop offset="1" stopColor="#9b111e" /></linearGradient>
        <linearGradient id="cg-pis" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stopColor="#6b5456" /><stop offset=".5" stopColor="#e3d2d3" /><stop offset="1" stopColor="#6b5456" /></linearGradient>
        <linearGradient id="cg-cer" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stopColor="#c9b4b6" /><stop offset=".5" stopColor="#fff1f0" /><stop offset="1" stopColor="#c9b4b6" /></linearGradient>
        <linearGradient id="cg-can" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stopColor="#9b111e" /><stop offset=".45" stopColor="#ff5a4f" /><stop offset="1" stopColor="#7a0f1b" /></linearGradient>
      </defs>
    </svg>
  );
}

// Una pieza por categoría. Las clases axc-spin / axc-pump / axc-spark / axc-drop / axc-comp
// solo se animan al pasar el cursor por la tarjeta (o siempre dentro de .axc-on, en el hero).
function Pieza({ cat }) {
  switch (cat) {
    case 'frenos':
      return (
        <svg viewBox="0 0 200 200">
          <g className="axc-spin">
            <circle cx="100" cy="100" r="96" fill="url(#cg-disc)" stroke="#ffc2bc" strokeOpacity=".35" />
            {ring(14, 66).map(([x, y], i) => <circle key={i} cx={x} cy={y} r="5.5" fill="#120a0b" />)}
            <circle cx="100" cy="100" r="40" fill="#5b4244" stroke="#ffc2bc" strokeOpacity=".3" />
            {ring(5, 26).map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3.6" fill="#120a0b" />)}
            <circle cx="100" cy="100" r="11" fill="#120a0b" />
            <circle cx="100" cy="13" r="4" fill="#ff5a4f" />
          </g>
          <path d="M142 46 L176 68 Q182 100 176 132 L142 154 Q150 100 142 46Z" fill="url(#cg-cal)" />
        </svg>
      );
    case 'motor':
      return (
        <svg viewBox="0 0 120 215">
          <g className="axc-pump">
            <rect x="16" y="12" width="88" height="96" rx="12" fill="url(#cg-pis)" stroke="#fff1f0" strokeOpacity=".35" />
            {[28, 40, 52].map((y) => <rect key={y} x="16" y={y} width="88" height="4" fill="#120a0b" opacity=".75" />)}
            <circle cx="60" cy="86" r="11" fill="#120a0b" stroke="#ff8d85" strokeWidth="2" />
            <path d="M52 96 L50 182 L70 182 L68 96Z" fill="#a89092" />
            <circle cx="60" cy="192" r="15" fill="#c81e2b" stroke="#fff1f0" strokeOpacity=".4" />
            <circle cx="60" cy="192" r="6" fill="#120a0b" />
          </g>
        </svg>
      );
    case 'encendido':
      return (
        <svg viewBox="0 0 80 215">
          <rect x="32" y="4" width="16" height="12" rx="3" fill="#c81e2b" />
          <rect x="24" y="14" width="32" height="76" rx="8" fill="url(#cg-cer)" stroke="#fff1f0" strokeOpacity=".35" />
          {[34, 48, 62].map((y) => <rect key={y} x="24" y={y} width="32" height="3" fill="#c81e2b" opacity=".55" />)}
          <rect x="16" y="90" width="48" height="26" rx="4" fill="#4a3638" stroke="#ffc2bc" strokeOpacity=".3" />
          <rect x="26" y="116" width="28" height="52" fill="#8d7b7d" />
          {[124, 132, 140, 148, 156].map((y) => <rect key={y} x="26" y={y} width="28" height="2" fill="#2a1618" opacity=".6" />)}
          <path d="M40 168 V182 H56 V174" stroke="#e3d2d3" strokeWidth="3" fill="none" strokeLinejoin="round" />
          <g className="axc-spark">
            <circle cx="52" cy="186" r="13" fill="#ff5a4f" opacity=".35" />
            <path d="M52 180 l-6 12 l8 -3 l-6 14" stroke="#fff1f0" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </svg>
      );
    case 'filtros':
      return (
        <svg viewBox="0 0 120 175">
          <rect x="30" y="8" width="60" height="22" rx="5" fill="#4a3638" stroke="#ffc2bc" strokeOpacity=".3" />
          <path d="M18 38 q0 -8 12 -8 h60 q12 0 12 8 v108 q0 12 -12 12 h-60 q-12 0 -12 -12z" fill="url(#cg-can)" stroke="#fff1f0" strokeOpacity=".35" />
          <rect x="18" y="72" width="84" height="38" fill="#fff1f0" opacity=".93" />
          <rect x="30" y="84" width="34" height="6" rx="3" fill="#c81e2b" />
          <rect x="30" y="95" width="52" height="5" rx="2.5" fill="#4a3638" opacity=".5" />
          {[48, 56].map((y) => <rect key={y} x="18" y={y} width="84" height="2" fill="#120a0b" opacity=".35" />)}
          <circle className="axc-drop" cx="60" cy="166" r="4.5" fill="#ff8d85" />
        </svg>
      );
    case 'transmision':
      return (
        <svg viewBox="0 0 200 200">
          <g className="axc-spin">
            <path d={gearPath(12, 96, 76)} fill="url(#cg-gear)" stroke="#fff1f0" strokeOpacity=".4" />
            <circle cx="100" cy="100" r="56" fill="none" stroke="#fff1f0" strokeOpacity=".35" />
            {ring(6, 40).map(([x, y], i) => <line key={i} x1="100" y1="100" x2={x} y2={y} stroke="#fff1f0" strokeOpacity=".3" strokeWidth="3" />)}
            <circle cx="100" cy="100" r="22" fill="#120a0b" stroke="#ffc2bc" strokeOpacity=".5" />
          </g>
        </svg>
      );
    default: // suspensión
      return (
        <svg viewBox="0 0 120 200">
          <rect x="38" y="6" width="44" height="14" rx="4" fill="#4a3638" stroke="#ffc2bc" strokeOpacity=".3" />
          <rect x="54" y="20" width="12" height="28" fill="#c9b4b6" />
          <g className="axc-comp"><path d={resorte} stroke="#ff8d85" strokeWidth="7" fill="none" strokeLinejoin="round" strokeLinecap="round" /></g>
          <rect x="40" y="148" width="40" height="44" rx="6" fill="url(#cg-pis)" stroke="#fff1f0" strokeOpacity=".35" />
          <rect x="40" y="160" width="40" height="4" fill="#c81e2b" />
        </svg>
      );
  }
}

/* ======================= PIEZAS DE INTERFAZ ======================= */
function Words({ text, em = false, base = 0 }) {
  return text.split(' ').map((w, i) => (
    <span className="ax-line" key={`${w}-${i}`}>
      <span className={cx('ax-word', em && 'ax-em')} style={{ '--i': base + i }}>{w}</span>{' '}
    </span>
  ));
}

// Resalta lo que el usuario buscó dentro del nombre (sin romper acentos)
function Resaltar({ texto, q }) {
  const t = toks(q);
  if (!t.length) return texto;
  const n = norm(texto);
  if (n.length !== texto.length) return texto;
  const m = new Array(texto.length).fill(false);
  t.forEach((k) => { let i = n.indexOf(k); while (i !== -1) { for (let j = i; j < i + k.length; j++) m[j] = true; i = n.indexOf(k, i + k.length); } });
  const out = []; let ini = 0;
  for (let i = 1; i <= texto.length; i++) {
    if (i === texto.length || m[i] !== m[ini]) { const seg = texto.slice(ini, i); out.push(m[ini] ? <mark key={ini}>{seg}</mark> : seg); ini = i; }
  }
  return out;
}

function Rango({ idp, f, set, hist }) {
  const pct = (v) => ((v - PMIN) / (PMAX - PMIN)) * 100;
  const maxH = Math.max(1, ...hist);
  const paso = (PMAX - PMIN) / NB;
  const cambiaMin = (v) => set({ min: clamp(Number(v) || PMIN, PMIN, f.max) });
  const cambiaMax = (v) => set({ max: clamp(Number(v) || PMAX, f.min, PMAX) });
  return (
    <div className="axc-range">
      <div className="axc-hist" aria-hidden="true">
        {hist.map((h, i) => {
          const a = PMIN + i * paso, b = a + paso;
          return <i key={i} className={b > f.min && a < f.max ? 'on' : ''} style={{ '--h': h / maxH }} />;
        })}
      </div>
      <div className="axc-rail">
        <span className="axc-fill" style={{ left: `${pct(f.min)}%`, right: `${100 - pct(f.max)}%` }} />
        <input type="range" className="axc-thumb" min={PMIN} max={PMAX} step={PSTEP} value={f.min} aria-label="Precio mínimo"
          onChange={(e) => cambiaMin(e.target.value)} style={{ zIndex: f.min > PMAX - (PMAX - PMIN) * 0.15 ? 3 : 2 }} />
        <input type="range" className="axc-thumb" min={PMIN} max={PMAX} step={PSTEP} value={f.max} aria-label="Precio máximo"
          onChange={(e) => cambiaMax(e.target.value)} />
      </div>
      <div className="axc-prices">
        <label htmlFor={`${idp}-pmin`}>Mínimo<span><b>$</b><input id={`${idp}-pmin`} type="number" inputMode="numeric" min={PMIN} max={PMAX} step={PSTEP} value={f.min} onChange={(e) => cambiaMin(e.target.value)} /></span></label>
        <span aria-hidden="true" className="axc-dash">–</span>
        <label htmlFor={`${idp}-pmax`}>Máximo<span><b>$</b><input id={`${idp}-pmax`} type="number" inputMode="numeric" min={PMIN} max={PMAX} step={PSTEP} value={f.max} onChange={(e) => cambiaMax(e.target.value)} /></span></label>
      </div>
    </div>
  );
}

// Panel de filtros (se usa en la barra lateral y en la hoja móvil, con ids distintos)
function Panel({ idp, f, set, limpiar, conteo, hist, dist, ubic, pedirUbic, nActivos }) {
  const toggle = (k, v) => set({ [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v] });
  const ordenadas = useMemo(() => [...SUCURSALES].sort((a, b) => dist[a.id] - dist[b.id]), [dist]);
  return (
    <div className="axc-panel">
      <div className="axc-panel-head">
        <h2 className="axc-panel-t"><Funnel size={20} weight={W} aria-hidden="true" />Filtros</h2>
        <button type="button" className="axc-link" onClick={limpiar} disabled={!nActivos}>Limpiar todo</button>
      </div>

      <details className="axc-grp" open>
        <summary>Categoría</summary>
        <div className="axc-chips" role="group" aria-label="Categorías">
          {CATEGORIAS.map((c) => (
            <button key={c.id} type="button" className="axc-chip" aria-pressed={f.cats.includes(c.id)} data-vacio={conteo.cats[c.id] === 0 || undefined} onClick={() => toggle('cats', c.id)}>
              <c.icon size={18} weight={W} aria-hidden="true" />{c.t}<span className="n">{conteo.cats[c.id]}</span>
            </button>
          ))}
        </div>
      </details>

      <details className="axc-grp" open>
        <summary>Precio</summary>
        <Rango idp={idp} f={f} set={set} hist={hist} />
      </details>

      <details className="axc-grp" open>
        <summary>Sucursales cercanas</summary>
        <button type="button" className="axc-loc" onClick={pedirUbic} disabled={ubic.estado === 'buscando'}>
          {ubic.estado === 'buscando' ? <CircleNotch className="axc-spinner" size={18} weight="bold" aria-hidden="true" /> : <NavigationArrow size={18} weight="fill" aria-hidden="true" />}
          {ubic.estado === 'buscando' ? 'Buscando tu ubicación…' : ubic.fuente === 'gps' ? 'Actualizar mi ubicación' : 'Usar mi ubicación'}
        </button>
        <p className={cx('axc-note', ubic.estado === 'error' && 'is-err')} role="status">
          {ubic.estado === 'error' ? ubic.msg : ubic.fuente === 'gps' ? 'Distancias desde tu ubicación actual.' : `Distancias desde ${REFERENCIA.nombre} (referencia).`}
        </p>
        <label className="axc-radio" htmlFor={`${idp}-km`}>
          <span>Hasta <b>{f.km >= KMAX ? 'sin límite' : `${f.km} km`}</b></span>
          <input id={`${idp}-km`} type="range" min="5" max={KMAX} step="5" value={f.km} onChange={(e) => set({ km: Number(e.target.value) })} />
        </label>
        <ul className="axc-list">
          {ordenadas.map((b) => {
            const dentro = f.suc.length ? f.suc.includes(b.id) : dist[b.id] <= f.km;
            return (
              <li key={b.id}>
                <label className={cx('axc-opt', !dentro && 'is-fuera')}>
                  <input type="checkbox" checked={f.suc.includes(b.id)} onChange={() => toggle('suc', b.id)} />
                  <span className="t"><MapPin size={16} weight="fill" aria-hidden="true" />{b.n}</span>
                  <span className="km">{kmTxt(dist[b.id])} km</span>
                </label>
              </li>
            );
          })}
        </ul>
        <p className="axc-note">{f.suc.length ? 'Solo productos con existencias en las sucursales elegidas.' : 'Sin elegir ninguna: se usan las que están dentro del radio.'}</p>
      </details>

      <details className="axc-grp" open>
        <summary>Marca</summary>
        <ul className="axc-list">
          {MARCAS.map((m) => (
            <li key={m}>
              <label className="axc-opt">
                <input type="checkbox" checked={f.marcas.includes(m)} onChange={() => toggle('marcas', m)} />
                <span className="t">{m}</span><span className="km">{conteo.marcas[m]}</span>
              </label>
            </li>
          ))}
        </ul>
      </details>

      <div className="axc-switchrow">
        <span id={`${idp}-sw`}>Solo con existencias</span>
        <button type="button" role="switch" aria-checked={f.stock} aria-labelledby={`${idp}-sw`} className="axc-switch" onClick={() => set({ stock: !f.stock })}><i /></button>
      </div>
    </div>
  );
}

function Tarjeta({ p, q, info, sinFiltroSuc, comp, onComp, i }) {
  const sin = !info;
  const bajo = info && info.qty <= 3;
  const tone = sin ? 'danger' : bajo ? 'warn' : 'ok';
  const txt = sin ? 'Sin existencias' : bajo ? 'Poco stock' : 'En stock';
  const msj = encodeURIComponent(`Hola, ¿tienen ${p.nombre} (SKU ${p.sku}) disponible?`);
  return (
    <li className="axc-item" style={{ '--i': Math.min(i, 8) }}>
      <Tilt className="axc-card">
        <div className="axc-art">
          <span className="axc-cat">{(() => { const I = CAT[p.cat].icon; return <I size={14} weight="fill" aria-hidden="true" />; })()}{CAT[p.cat].t}</span>
          <label className={cx('axc-cmp', comp && 'on')}>
            <input type="checkbox" checked={comp} onChange={() => onComp(p.id)} />
            <Scales size={16} weight={comp ? 'fill' : W} aria-hidden="true" /><span>Comparar</span>
            <span className="axc-sr"> {p.nombre}</span>
          </label>
          <div className="axc-pic"><Pieza cat={p.cat} /></div>
        </div>
        <div className="axc-body">
          <h3 className="axc-name"><Resaltar texto={p.nombre} q={q} /></h3>
          <p className="axc-sku">SKU {p.sku} · {p.marca} · {p.fab}</p>
          <p className="axc-compat">{p.compat.slice(0, 3).join(' · ')}</p>
          <div className="axc-priceRow">
            <p className="axc-price ax-num">{dinero(p.precio)}</p>
            <Badge tone={tone}>{txt}</Badge>
          </div>
          <p className={cx('axc-near', sin && 'is-none')}>
            <MapPin size={16} weight="fill" aria-hidden="true" />
            {sin ? (sinFiltroSuc ? 'Sin existencias en ninguna sucursal' : 'Sin existencias en tus sucursales') : <>{info.b.n.replace('AutoRed ', '')} · <b>{kmTxt(info.km)} km</b></>}
          </p>
          {sin ? (
            <span className="axc-wa is-off" aria-disabled="true">Sin existencias</span>
          ) : (
            <a className="axc-wa" href={`https://wa.me/${info.b.tel}?text=${msj}`} target="_blank" rel="noopener noreferrer">
              <WhatsappLogo size={20} weight="fill" aria-hidden="true" />Pedir por WhatsApp<span className="axc-sr"> (se abre en una pestaña nueva)</span>
            </a>
          )}
        </div>
      </Tilt>
    </li>
  );
}

/* ======================= PÁGINA ======================= */
export default function Catalogo({ rol, usuario, onSalir }) {
  const ir = useNavigate();
  const { f, set, limpiar } = useFiltros();
  const { surfaceRef, stageRef } = useSceneTilt(8);
  const uid = useId().replace(/:/g, '');
  const buscarRef = useRef(null);
  const sheet = useRef(null);
  const trayRef = useRef(null);
  const [qLocal, setQLocal] = useState(f.q);
  const [ubic, setUbic] = useState({ lat: REFERENCIA.lat, lng: REFERENCIA.lng, fuente: 'ref', estado: 'idle', msg: '' });
  const [comp, setComp] = useState([]);
  const [avisoComp, setAvisoComp] = useState('');

  // Buscador: se escribe rápido y la URL se actualiza al dejar de teclear
  useEffect(() => { setQLocal(f.q); }, [f.q]);
  useEffect(() => {
    if (qLocal === f.q) return;
    const t = setTimeout(() => set({ q: qLocal }), 220);
    return () => clearTimeout(t);
  }, [qLocal, f.q, set]);
  // Atajo "/" para ir al buscador
  useEffect(() => {
    const k = (e) => {
      const t = e.target, escribiendo = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
      if (e.key === '/' && !escribiendo && !e.metaKey && !e.ctrlKey) { e.preventDefault(); buscarRef.current?.focus(); }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);
  // Bandeja cerrada = inert: el teclado no entra a botones ocultos
  useEffect(() => {
    const el = trayRef.current;
    if (!el) return;
    if (comp.length) el.removeAttribute('inert'); else el.setAttribute('inert', '');
  }, [comp.length]);
  // Si se agranda la ventana con la hoja móvil abierta, se cierra
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const c = (e) => { if (e.matches && sheet.current?.open) sheet.current.close(); };
    mq.addEventListener('change', c);
    return () => mq.removeEventListener('change', c);
  }, []);

  const dist = useMemo(() => Object.fromEntries(SUCURSALES.map((b) => [b.id, distanciaKm(ubic, b)])), [ubic.lat, ubic.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  const pedirUbic = () => {
    if (!navigator.geolocation) { setUbic((u) => ({ ...u, estado: 'error', msg: 'Tu navegador no permite ubicarte. Usamos la referencia.' })); return; }
    setUbic((u) => ({ ...u, estado: 'buscando' }));
    navigator.geolocation.getCurrentPosition(
      (pos) => setUbic({ lat: pos.coords.latitude, lng: pos.coords.longitude, fuente: 'gps', estado: 'idle', msg: '' }),
      (err) => setUbic((u) => ({ ...u, estado: 'error', msg: err.code === 1 ? 'No diste permiso de ubicación. Usamos la referencia; puedes elegir sucursales a mano.' : 'No pudimos obtener tu ubicación. Usamos la referencia.' })),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
  };

  // Resultados, conteos por faceta e histograma de precios
  const { lista, conteo, hist, total } = useMemo(() => {
    const act = sucActivo(f);
    const cons = act ? consideradas(f, dist) : SUCURSALES;
    let rs = PRODUCTOS.filter((p) => aplica(f, p, dist)).map((p) => ({ p, info: cerca(p, dist, cons) }));
    if (f.orden === 'precio-asc') rs.sort((a, b) => a.p.precio - b.p.precio);
    else if (f.orden === 'precio-desc') rs.sort((a, b) => b.p.precio - a.p.precio);
    else if (f.orden === 'nombre') rs.sort((a, b) => a.p.nombre.localeCompare(b.p.nombre, 'es'));
    else if (f.orden === 'cercano') rs.sort((a, b) => (a.info?.km ?? Infinity) - (b.info?.km ?? Infinity));
    else if (f.q.trim()) rs.sort((a, b) => puntaje(b.p, f.q) - puntaje(a.p, f.q));
    const cats = Object.fromEntries(CATEGORIAS.map((c) => [c.id, PRODUCTOS.filter((p) => p.cat === c.id && aplica(f, p, dist, 'cats')).length]));
    const marcas = Object.fromEntries(MARCAS.map((m) => [m, PRODUCTOS.filter((p) => p.marca === m && aplica(f, p, dist, 'marcas')).length]));
    const h = new Array(NB).fill(0);
    PRODUCTOS.forEach((p) => { if (aplica(f, p, dist, 'precio')) h[Math.min(NB - 1, Math.floor(((p.precio - PMIN) / (PMAX - PMIN)) * NB))] += 1; });
    return { lista: rs, conteo: { cats, marcas }, hist: h, total: rs.length };
  }, [f, dist]);

  // Filtros activos como chips que se pueden quitar uno a uno
  const activos = [];
  if (f.q.trim()) activos.push({ k: 'q', t: `Búsqueda: “${f.q.trim()}”`, quitar: () => set({ q: '' }) });
  f.cats.forEach((c) => activos.push({ k: `c-${c}`, t: CAT[c].t, quitar: () => set({ cats: f.cats.filter((x) => x !== c) }) }));
  f.marcas.forEach((m) => activos.push({ k: `m-${m}`, t: m, quitar: () => set({ marcas: f.marcas.filter((x) => x !== m) }) }));
  if (f.min > PMIN || f.max < PMAX) activos.push({ k: 'p', t: `${dinero(f.min)} – ${dinero(f.max)}`, quitar: () => set({ min: PMIN, max: PMAX }) });
  f.suc.forEach((s) => activos.push({ k: `s-${s}`, t: SUCURSALES.find((b) => b.id === s).n.replace('AutoRed ', ''), quitar: () => set({ suc: f.suc.filter((x) => x !== s) }) }));
  if (f.km < KMAX) activos.push({ k: 'km', t: `Hasta ${f.km} km`, quitar: () => set({ km: KMAX }) });
  if (f.stock) activos.push({ k: 'st', t: 'Con existencias', quitar: () => set({ stock: false }) });

  const onComp = (id) => {
    setAvisoComp('');
    setComp((c) => {
      if (c.includes(id)) return c.filter((x) => x !== id);
      if (c.length >= 3) { setAvisoComp('Puedes comparar hasta 3 productos.'); return c; }
      return [...c, id];
    });
  };
  const compProd = comp.map((id) => PRODUCTOS.find((p) => p.id === id));
  const panelProps = { f, set, limpiar, conteo, hist, dist, ubic, pedirUbic, nActivos: activos.length };

  return (
    <div className="ax">
      <Defs />
      <Nav rol={rol} usuario={usuario} onSalir={onSalir} />

      <main>
        {/* ===== HERO con buscador ===== */}
        <section className="ax-dark axc-hero" aria-labelledby={`${uid}-t`}>
          <div className="ax-wrap axc-hero-grid">
            <div>
              <Reveal><Badge tone="brand">Catálogo de refacciones</Badge></Reveal>
              <h1 id={`${uid}-t`} className="ax-h1 axc-h1" style={{ marginTop: '1.1rem' }}>
                <Words text="Encuentra la pieza" />
                <Words text="exacta." em base={3} />
              </h1>
              <Reveal delay={180}>
                <form className="axc-search" role="search" onSubmit={(e) => { e.preventDefault(); set({ q: qLocal }); }}>
                  <label htmlFor={`${uid}-q`} className="axc-sr">Buscar refacciones</label>
                  <MagnifyingGlass className="lupa" size={24} weight={W} aria-hidden="true" />
                  <input id={`${uid}-q`} ref={buscarRef} type="search" enterKeyHint="search" autoComplete="off" spellCheck="false"
                    placeholder="Busca por pieza, SKU, marca o auto (Versa 2018)" value={qLocal}
                    onChange={(e) => setQLocal(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Escape' && qLocal) { e.preventDefault(); setQLocal(''); set({ q: '' }); } }} />
                  {qLocal ? (
                    <button type="button" className="clear" aria-label="Borrar búsqueda" onClick={() => { setQLocal(''); set({ q: '' }); buscarRef.current?.focus(); }}><X size={18} weight="bold" aria-hidden="true" /></button>
                  ) : (
                    <kbd className="axc-kbd" aria-hidden="true">/</kbd>
                  )}
                </form>
                <div className="axc-ex">
                  <span>Prueba con:</span>
                  {EJEMPLOS.map((x) => <button key={x} type="button" onClick={() => { setQLocal(x); set({ q: x }); }}>{x}</button>)}
                </div>
              </Reveal>
            </div>

            <div ref={surfaceRef} className="axc-scene" aria-hidden="true">
              <div ref={stageRef} className="axc-stage axc-on">
                <div className="axc-glow" />
                <div className="axc-p" style={{ '--x': 30, '--y': 50, '--w': 40, '--z': '60px', '--d': '-1s' }}><div className="axc-pin"><Pieza cat="frenos" /></div></div>
                <div className="axc-p" style={{ '--x': 70, '--y': 26, '--w': 14, '--z': '120px', '--d': '-3s' }}><div className="axc-pin"><Pieza cat="motor" /></div></div>
                <div className="axc-p" style={{ '--x': 72, '--y': 72, '--w': 22, '--z': '90px', '--d': '-2s' }}><div className="axc-pin"><Pieza cat="filtros" /></div></div>
                <div className="axc-p" style={{ '--x': 92, '--y': 50, '--w': 9, '--z': '150px', '--d': '-4s' }}><div className="axc-pin"><Pieza cat="encendido" /></div></div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== Resultados ===== */}
        <section className="ax-light axc-results" aria-label="Productos">
          <div className="ax-wrap axc-layout">
            <aside className="axc-aside" aria-label="Filtros">
              <Panel idp={`${uid}-s`} {...panelProps} />
            </aside>

            <div className="axc-main">
              <div className="axc-toolbar">
                <button type="button" className="axc-filterbtn" onClick={() => sheet.current?.showModal()}>
                  <Funnel size={20} weight={W} aria-hidden="true" />Filtros{activos.length > 0 && <span className="n">{activos.length}</span>}
                </button>
                <p className="axc-count" role="status" aria-live="polite">
                  <b className="ax-num">{total}</b> {total === 1 ? 'producto' : 'productos'}
                </p>
                <label className="axc-sort">
                  <span>Ordenar</span>
                  <select value={f.orden} onChange={(e) => set({ orden: e.target.value })}>
                    {ORDENES.map((o) => <option key={o.id} value={o.id}>{o.t}</option>)}
                  </select>
                </label>
              </div>

              {activos.length > 0 && (
                <ul className="axc-active" aria-label="Filtros aplicados">
                  {activos.map((a) => (
                    <li key={a.k}><button type="button" onClick={a.quitar} aria-label={`Quitar filtro: ${a.t}`}>{a.t}<X size={14} weight="bold" aria-hidden="true" /></button></li>
                  ))}
                  <li><button type="button" className="all" onClick={limpiar}><ArrowCounterClockwise size={14} weight="bold" aria-hidden="true" />Limpiar todo</button></li>
                </ul>
              )}

              {total > 0 ? (
                <ul className="axc-grid">
                  {lista.map(({ p, info }, i) => (
                    <Tarjeta key={p.id} p={p} q={f.q} info={info} sinFiltroSuc={!sucActivo(f)} comp={comp.includes(p.id)} onComp={onComp} i={i} />
                  ))}
                </ul>
              ) : (
                <div className="axc-empty">
                  <span className="ico"><Package size={44} weight={W} aria-hidden="true" /></span>
                  <h2>No encontramos esa pieza con esos filtros</h2>
                  <p>Prueba quitando alguno, ampliando el rango de precio o el radio de sucursales.</p>
                  <div className="axc-empty-btns">
                    <button type="button" className="axc-btn" onClick={limpiar}><ArrowCounterClockwise size={18} weight="bold" aria-hidden="true" />Limpiar filtros</button>
                    <Link to="/asistente" className="axc-btn axc-btn-ghost"><Robot size={18} weight={W} aria-hidden="true" />Preguntar al asistente IA</Link>
                  </div>
                </div>
              )}
              <p className="axc-foot">Ejemplo ilustrativo · productos, precios y existencias de muestra.</p>
            </div>
          </div>
        </section>
      </main>

      {/* ===== Bandeja de comparación ===== */}
      <div ref={trayRef} className={cx('axc-tray', comp.length > 0 && 'is-open')} role="region" aria-label="Comparador">
        <ul>
          {compProd.map((p) => (
            <li key={p.id}>
              <span className="thumb"><Pieza cat={p.cat} /></span>
              <span className="nm">{p.nombre}</span>
              <button type="button" onClick={() => onComp(p.id)} aria-label={`Quitar ${p.nombre} de la comparación`}><X size={14} weight="bold" aria-hidden="true" /></button>
            </li>
          ))}
        </ul>
        <p className="aviso" role="status">{avisoComp || (comp.length < 2 ? 'Elige al menos 2 para comparar.' : '')}</p>
        <button type="button" className="axc-btn" disabled={comp.length < 2} onClick={() => ir(`/comparar?ids=${comp.join(',')}`)}>
          <Scales size={18} weight="bold" aria-hidden="true" />Comparar ({comp.length})
        </button>
      </div>

      {/* ===== Hoja de filtros (móvil) ===== */}
      <dialog ref={sheet} className="axc-sheet" aria-label="Filtros" onClick={(e) => { if (e.target === sheet.current) sheet.current.close(); }}>
        <div className="axc-sheet-in">
          <div className="axc-sheet-head">
            <h2>Filtros</h2>
            <button type="button" onClick={() => sheet.current?.close()} aria-label="Cerrar filtros"><X size={22} weight="bold" aria-hidden="true" /></button>
          </div>
          <Panel idp={`${uid}-m`} {...panelProps} />
          <div className="axc-sheet-foot">
            <button type="button" className="axc-btn" onClick={() => sheet.current?.close()}>Ver {total} {total === 1 ? 'resultado' : 'resultados'}</button>
          </div>
        </div>
      </dialog>
      <ChatBot />
      <Footer />
    </div>
  );
}
