// Sucursales cercanas — AutoRed. Ubicación: src/Sucursales/Sucursales.jsx (+ Sucursales.css en la misma carpeta).
// Reutiliza los estilos ax- (index.css). Lo propio de esta pantalla lleva prefijo axs- y está en ./Sucursales.css.
//
// Requiere el mapa (Leaflet + OpenStreetMap, sin llaves de API):   npm i leaflet
// Ruta:  <Route path="/sucursales" element={<Sucursales />} />     (acepta ?q=balatas para mostrar la pieza buscada)
//
// Animación nueva: "radar". Al ubicarte, un barrido gira desde tu punto y las sucursales aparecen en orden de cercanía.
// Privacidad: la ubicación solo se usa en el navegador para calcular distancias; no se envía a ningún servidor.
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Badge, Reveal } from '../autored-ui';
import Nav from '../Components/Nav';
import Footer from '../Components/Footer';
import '../index.css';
import './Sucursales.css';
import {
  MapPin, NavigationArrow, Crosshair, WhatsappLogo, Phone, Clock, CircleNotch, WarningCircle, CheckCircle, X,
  ArrowRight, Storefront, MapTrifold, ListBullets, CaretDown, Lightning,
} from '@phosphor-icons/react';

const cx = (...c) => c.filter(Boolean).join(' ');
const W = 'duotone';
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ======================= DATOS (sustituye por tu API) ======================= */
// TODO: GET /sucursales → [{ id, nombre, tienda, direccion, lat, lng, tel, sem, sab, dom, stock }]
//   · sem / sab / dom: [abre, cierra] en horas (9 = 09:00, 14.5 = 14:30) o null si cierra ese día.
//   · stock: 'ok' | 'warn' | 'none' (disponibilidad de la pieza buscada; con ?q= pídelo a tu API).
// Datos de muestra: nombres, direcciones y teléfonos ficticios (la zona es solo para la demostración).
const SUCURSALES = [
  { id: 's1', nombre: 'AutoPartes Neza Centro', tienda: 'AutoPartes Neza', direccion: 'Zona Centro, Cd. Nezahualcóyotl', lat: 19.4006, lng: -99.0148, tel: '5215500000011', sem: [9, 19], sab: [9, 15], dom: null, stock: 'ok' },
  { id: 's2', nombre: 'El Buen Freno · Chimalhuacán', tienda: 'Refaccionaria El Buen Freno', direccion: 'Av. Chimalhuacán, Cd. Nezahualcóyotl', lat: 19.4129, lng: -99.0347, tel: '5215500000012', sem: [8.5, 19.5], sab: [9, 16], dom: [10, 14], stock: 'ok' },
  { id: 's3', nombre: 'Suspensiones Rápidas Oriente', tienda: 'Suspensiones Rápidas', direccion: 'Col. Benito Juárez, Cd. Nezahualcóyotl', lat: 19.3890, lng: -98.999, tel: '5215500000013', sem: [9, 18], sab: [9, 14], dom: null, stock: 'warn' },
  { id: 's4', nombre: 'Frenos y Suspensión Aragón', tienda: 'Frenos y Suspensión', direccion: 'Zona Aragón, Gustavo A. Madero', lat: 19.469, lng: -99.083, tel: '5215500000014', sem: [9, 20], sab: [9, 17], dom: null, stock: 'ok' },
  { id: 's5', nombre: 'Refacciones Iztapalapa', tienda: 'Refacciones Iztapalapa', direccion: 'Zona Oriente, Iztapalapa', lat: 19.355, lng: -99.062, tel: '5215500000015', sem: [8, 18], sab: [8, 14], dom: null, stock: 'none' },
  { id: 's6', nombre: 'Refaccionaria La Paz', tienda: 'Refaccionaria La Paz', direccion: 'Centro, La Paz, Edo. Méx.', lat: 19.361, lng: -98.961, tel: '5215500000016', sem: [9, 19], sab: [9, 15], dom: null, stock: 'warn' },
  { id: 's7', nombre: 'AutoRed Centro Histórico', tienda: 'AutoRed Distribuidora', direccion: 'Centro Histórico, Cuauhtémoc', lat: 19.4326, lng: -99.1332, tel: '5215500000017', sem: [9, 18], sab: [9, 14], dom: null, stock: 'ok' },
  { id: 's8', nombre: 'Refacciones Ecatepec Norte', tienda: 'Refacciones Ecatepec', direccion: 'Zona Norte, Ecatepec', lat: 19.601, lng: -99.05, tel: '5215500000018', sem: [9, 19], sab: [9, 15], dom: null, stock: 'ok' },
  { id: 's9', nombre: 'Autopartes Coyoacán', tienda: 'Autopartes Coyoacán', direccion: 'Zona Sur, Coyoacán', lat: 19.3467, lng: -99.1617, tel: '5215500000019', sem: [9, 19], sab: [10, 15], dom: null, stock: 'warn' },
  { id: 's10', nombre: 'Autopartes Tlalnepantla', tienda: 'Autopartes Tlalnepantla', direccion: 'Zona Industrial, Tlalnepantla', lat: 19.54, lng: -99.195, tel: '5215500000020', sem: [8, 18], sab: [8, 13], dom: null, stock: 'ok' },
];
const CENTRO = [19.42, -99.07]; // vista inicial (antes de ubicarte)
const STOCK_TXT = { ok: 'Con stock', warn: 'Poco stock', none: 'Sin stock' };
const STOCK_TONE = { ok: 'ok', warn: 'warn', none: 'danger' };
const RADIOS = [{ v: 0, t: 'Todas' }, { v: 3, t: '3 km' }, { v: 5, t: '5 km' }, { v: 10, t: '10 km' }];

/* ======================= UTILIDADES ======================= */
const rad = (g) => (g * Math.PI) / 180;
// Distancia en línea recta (haversine). Las rutas reales son más largas: por eso se marca como "aprox."
const distKm = (a, b) => {
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};
const fmtKm = (k) => (k < 1 ? `${Math.max(50, Math.round(k * 10) * 100)} m` : `${k.toFixed(k < 10 ? 1 : 0)} km`);
const eta = (k) => Math.max(1, Math.round(((k * 1.35) / 28) * 60)); // 28 km/h promedio urbano, ruta 35 % más larga
const fmtH = (h) => `${String(Math.floor(h)).padStart(2, '0')}:${h % 1 ? '30' : '00'}`;
const apertura = (s, now) => {
  const d = new Date(now), dia = d.getDay();
  const h = dia === 0 ? s.dom : dia === 6 ? s.sab : s.sem;
  const hh = d.getHours() + d.getMinutes() / 60;
  if (h && hh >= h[0] && hh < h[1]) return { abierta: true, txt: `Abierto · cierra ${fmtH(h[1])}` };
  if (h && hh < h[0]) return { abierta: false, txt: `Cerrado · abre hoy ${fmtH(h[0])}` };
  return { abierta: false, txt: 'Cerrado ahora' };
};
const urlComoLlegar = (s, u) => `https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}${u ? `&origin=${u.lat},${u.lng}` : ''}&travelmode=driving`;

/* ======================= HOOKS ======================= */
function useInView(threshold = 0.25) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) { setSeen(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, seen];
}

// Inclinación con resorte de la escena 3D (decorativa: solo puntero fino)
function useSceneTilt(max = 9) {
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
    const move = (e) => {
      const r = surface.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      kick();
    };
    const leave = () => { tx = 0; ty = 0; kick(); };
    surface.addEventListener('pointermove', move);
    surface.addEventListener('pointerleave', leave);
    return () => { surface.removeEventListener('pointermove', move); surface.removeEventListener('pointerleave', leave); cancelAnimationFrame(raf); };
  }, [max]);
  return { surfaceRef, stageRef };
}

/* ======================= PIEZAS ======================= */
function Words({ text, em = false, base = 0 }) {
  return text.split(' ').map((w, i) => (
    <span className="ax-line" key={`${w}-${i}`}>
      <span className={cx('ax-word', em && 'ax-em')} style={{ '--i': base + i }}>{w}</span>{' '}
    </span>
  ));
}
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
function GearBg({ gears }) {
  return (
    <div className="ax-bg" aria-hidden="true">
      {gears.map((g, i) => (
        <span key={i} className={cx('ax-bg-g', g.rev && 'rev')} style={{ '--s': g.s, '--l': g.l, '--t': g.t, '--dur': g.dur || '90s' }}>
          <svg viewBox="0 0 200 200"><path d={gearPath(g.n, 96, 80)} /><circle cx="100" cy="100" r="34" /><circle cx="100" cy="100" r="62" /></svg>
        </span>
      ))}
    </div>
  );
}
function Counter({ to, duration = 1000 }) {
  const [ref, seen] = useInView(0.6);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!seen) return;
    if (reduced()) { setN(to); return; }
    const t0 = performance.now();
    let raf = 0;
    const f = (t) => {
      const k = Math.min(((t || t0) - t0) / duration, 1);
      setN(Math.round(to * (1 - Math.pow(1 - k, 4))));
      if (k < 1) raf = requestAnimationFrame(f);
    };
    raf = requestAnimationFrame(f);
    return () => cancelAnimationFrame(raf);
  }, [seen, to, duration]);
  return <span ref={ref}>{n}</span>;
}

/* ======================= ESCENA 3D DEL HERO: RADAR ======================= */
const RADAR_PINS = [[50, 50, 0], [24, 30, 1], [74, 26, 2], [30, 74, 3], [78, 70, 4], [58, 14, 5]]; // x, y (%), orden de aparición
function Radar3D({ estado, cerca }) {
  return (
    <div className={cx('axs-radar3d', `is-${estado}`)}>
      <div className="axs-plate">
        <i className="axs-ring r1" /><i className="axs-ring r2" /><i className="axs-ring r3" /><i className="axs-cross" />
        <i className="axs-sweep" />
        {RADAR_PINS.map(([x, y, i]) => (
          <span key={i} className={cx('axs-bpin', i === 0 && 'is-me')} style={{ '--x': x, '--y': y, '--i': i }}><b /></span>
        ))}
      </div>
      <div className="axs-r3-chip ax-glass ax-row">
        {estado === 'ok' ? <><CheckCircle size={18} weight="fill" />{cerca} {cerca === 1 ? 'sucursal cerca' : 'sucursales cerca'}</>
          : estado === 'buscando' ? <><CircleNotch className="axs-spin" size={18} weight="bold" />Buscando tu zona…</>
          : <><MapPin size={18} weight="fill" />Sucursales a tu alrededor</>}
      </div>
    </div>
  );
}

/* ======================= MAPA (Leaflet) ======================= */
const pinHtml = (s, delay, cerca) => `<span class="axs-pin${s.abierta ? '' : ' is-closed'}${cerca ? ' is-near' : ''}" style="--d:${delay}ms"><svg viewBox="0 0 40 48" aria-hidden="true"><path d="M20 46C20 46 4 30 4 18a16 16 0 0 1 32 0c0 12-16 28-16 28z"/><circle cx="20" cy="18" r="6"/></svg></span>`;
const meHtml = '<span class="axs-sweep-map"></span><span class="axs-pulse"></span><span class="axs-pulse r2"></span><span class="axs-pulse r3"></span><span class="axs-dot"></span><span class="axs-you">Tú</span>';

function MapaLeaflet({ todas, visibles, ubi, sel, onSel, manual, onElegir, onMover, escaneo }) {
  const box = useRef(null);
  const map = useRef(null);
  const pins = useRef(new Map());
  const me = useRef(null);
  const ruta = useRef(null);
  const cb = useRef({});
  cb.current = { onSel, onElegir, onMover, manual, todas, ubi };
  const ids = visibles.map((s) => s.id).join();

  // Crea el mapa una sola vez (OpenStreetMap; para producción cambia a un proveedor de teselas con llave)
  useEffect(() => {
    const m = L.map(box.current, { zoomControl: false, scrollWheelZoom: false, zoomSnap: 0.5, worldCopyJump: true }).setView(CENTRO, 10.5);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>' }).addTo(m);
    L.control.zoom({ position: 'topright', zoomInTitle: 'Acercar', zoomOutTitle: 'Alejar' }).addTo(m);
    // La rueda del mouse solo acerca después de hacer clic en el mapa (no atrapa el scroll de la página)
    m.on('click', (e) => {
      m.scrollWheelZoom.enable();
      if (cb.current.manual) cb.current.onElegir({ lat: e.latlng.lat, lng: e.latlng.lng });
    });
    m.getContainer().addEventListener('mouseleave', () => m.scrollWheelZoom.disable());
    map.current = m;
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => m.invalidateSize()) : null;
    ro?.observe(box.current);
    const pinsMap = pins.current;
    return () => { ro?.disconnect(); m.remove(); map.current = null; pinsMap.clear(); me.current = null; ruta.current = null; };
  }, []);

  // Cursor de "marcar mi zona"
  useEffect(() => { box.current?.classList.toggle('axs-pick', manual); }, [manual]);

  // Al ubicarte se vuelven a crear los pines para que aparezcan en orden de cercanía (efecto radar)
  useEffect(() => { pins.current.forEach((mk) => mk.remove()); pins.current.clear(); }, [escaneo]);
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const quiero = new Map(visibles.map((s) => [s.id, s]));
    pins.current.forEach((mk, id) => { if (!quiero.has(id)) { mk.remove(); pins.current.delete(id); } });
    quiero.forEach((s, id) => {
      if (pins.current.has(id)) return;
      const icon = L.divIcon({ className: 'axs-mk', html: pinHtml(s, 450 + s.rank * 110, s.rank === 0 && !!cb.current.ubi), iconSize: [40, 48], iconAnchor: [20, 46] });
      const mk = L.marker([s.lat, s.lng], { icon, title: s.nombre, alt: s.nombre, keyboard: true, riseOnHover: true }).addTo(m);
      const nombre = document.createElement('span'); // textContent: nunca se interpreta como HTML
      nombre.textContent = s.nombre;
      mk.bindTooltip(nombre, { direction: 'top', offset: [0, -42], className: 'axs-tip', opacity: 1 });
      mk.on('click', () => cb.current.onSel(id));
      pins.current.set(id, mk);
    });
  }, [ids, escaneo]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pin seleccionado: más grande, con su nombre visible; el mapa vuela hasta él
  useEffect(() => {
    pins.current.forEach((mk, id) => {
      mk.getElement()?.classList.toggle('is-sel', id === sel);
      mk.setZIndexOffset(id === sel ? 1000 : 0);
      if (id === sel) mk.openTooltip(); else mk.closeTooltip();
    });
  }, [sel, ids, escaneo]);
  useEffect(() => {
    const m = map.current, s = cb.current.todas.find((x) => x.id === sel);
    if (!m || !s) return;
    const z = Math.max(m.getZoom(), 14);
    if (reduced()) m.setView([s.lat, s.lng], z, { animate: false });
    else m.flyTo([s.lat, s.lng], z, { duration: 0.9 });
  }, [sel]);

  // Tu ubicación: radar al ubicarte; se puede arrastrar para ajustarla
  useEffect(() => {
    const m = map.current, u = cb.current.ubi;
    me.current?.remove(); me.current = null;
    if (!m || !u) return;
    const mk = L.marker([u.lat, u.lng], {
      icon: L.divIcon({ className: 'axs-me', html: meHtml, iconSize: [0, 0] }),
      draggable: true, zIndexOffset: 2000, title: 'Tu ubicación (arrastra para ajustarla)', alt: 'Tu ubicación', keyboard: false,
    }).addTo(m);
    mk.on('dragend', () => { const p = mk.getLatLng(); cb.current.onMover({ lat: p.lat, lng: p.lng }); });
    me.current = mk;
    const cerca = cb.current.todas.filter((s) => s.km != null).slice(0, 3).map((s) => [s.lat, s.lng]);
    m.fitBounds(L.latLngBounds([[u.lat, u.lng], ...cerca]), { padding: [70, 70], maxZoom: 15, animate: !reduced() });
  }, [escaneo]);
  useEffect(() => { if (me.current && ubi) me.current.setLatLng([ubi.lat, ubi.lng]); }, [ubi]);

  // Línea de ruta (animada) desde tu ubicación hasta la sucursal elegida
  useEffect(() => {
    const m = map.current;
    ruta.current?.remove(); ruta.current = null;
    const s = cb.current.todas.find((x) => x.id === sel);
    if (!m || !s || !ubi) return;
    ruta.current = L.polyline([[ubi.lat, ubi.lng], [s.lat, s.lng]], { color: '#c81e2b', weight: 4, opacity: 0.9, dashArray: '2 10', lineCap: 'round', className: 'axs-route', interactive: false }).addTo(m);
  }, [sel, ubi]);

  return <div ref={box} className="axs-leaflet" role="region" aria-label="Mapa de sucursales. La lista de al lado tiene la misma información." />;
}

/* ======================= TARJETA DE SUCURSAL ======================= */
function Tarjeta({ s, i, ubi, sel, onSel }) {
  const abierta = sel === s.id;
  const wa = `https://wa.me/${s.tel}?text=${encodeURIComponent(`Hola, vi la sucursal ${s.nombre} en AutoRed. ¿Tienen disponible la pieza que busco?`)}`;
  return (
    <li id={`axs-c-${s.id}`} className={cx('axs-card', abierta && 'is-sel', s.rank === 0 && ubi && 'is-near')} style={{ '--i': i }}>
      <button type="button" className="axs-card-main" onClick={() => onSel(abierta ? null : s.id)} aria-expanded={abierta}>
        <span className="axs-rank ax-num" aria-hidden="true">{ubi ? s.rank + 1 : <MapPin size={20} weight="fill" />}</span>
        <span className="axs-info">
          <span className="axs-n">{s.nombre}{s.rank === 0 && ubi && <em>Más cercana</em>}</span>
          <span className="axs-a">{s.direccion}</span>
          <span className="axs-badges">
            <Badge tone={s.abierta ? 'ok' : 'danger'}>{s.horario}</Badge>
            <Badge tone={STOCK_TONE[s.stock]}>{STOCK_TXT[s.stock]}</Badge>
          </span>
        </span>
        <span className="axs-d">
          {s.km != null ? <><b className="ax-num">{fmtKm(s.km)}</b><small>≈ {eta(s.km)} min en auto</small></> : <small>Activa tu ubicación</small>}
        </span>
        <CaretDown className="axs-caret" size={18} weight="bold" aria-hidden="true" />
      </button>
      <div className="axs-card-body"><div>
        <div className="axs-actions">
          <a className="axs-btn" href={urlComoLlegar(s, ubi)} target="_blank" rel="noopener noreferrer"><NavigationArrow size={18} weight="fill" aria-hidden="true" />Cómo llegar</a>
          <a className="axs-btn axs-btn-wa" href={wa} target="_blank" rel="noopener noreferrer"><WhatsappLogo size={18} weight="fill" aria-hidden="true" />WhatsApp</a>
          <a className="axs-btn axs-btn-ghost" href={`tel:+${s.tel}`}><Phone size={18} weight="bold" aria-hidden="true" />Llamar</a>
        </div>
        <p className="axs-hint"><Clock size={14} weight="bold" aria-hidden="true" />Distancia en línea recta; el tiempo es una estimación.</p>
      </div></div>
    </li>
  );
}

/* ======================= PÁGINA ======================= */
export default function Sucursales() {
  const uid = useId().replace(/:/g, '');
  const [sp] = useSearchParams();
  const pieza = (sp.get('q') || '').slice(0, 60);
  const { surfaceRef, stageRef } = useSceneTilt(9);
  const [ubi, setUbi] = useState(null);
  const [estado, setEstado] = useState('idle'); // idle | buscando | ok | denegado | tiempo | error | nosoporta
  const [manual, setManual] = useState(false);
  const [escaneo, setEscaneo] = useState(0);
  const [filtros, setFiltros] = useState({ abiertas: false, stock: false, radio: 0 });
  const [sel, setSel] = useState(null);
  const [vista, setVista] = useState('mapa'); // solo en pantallas chicas
  const [ahora, setAhora] = useState(() => Date.now());
  const listaRef = useRef(null);

  useEffect(() => { const t = setInterval(() => setAhora(Date.now()), 60000); return () => clearInterval(t); }, []);

  // Todas las sucursales con distancia, horario y posición por cercanía
  const todas = useMemo(() => {
    const base = SUCURSALES.map((s) => {
      const a = apertura(s, ahora);
      return { ...s, abierta: a.abierta, horario: a.txt, km: ubi ? distKm(ubi, s) : null };
    });
    base.sort((a, b) => (ubi ? a.km - b.km : a.nombre.localeCompare(b.nombre, 'es')));
    return base.map((s, rank) => ({ ...s, rank }));
  }, [ubi, ahora]);
  const visibles = useMemo(() => todas.filter((s) => (!filtros.abiertas || s.abierta) && (!filtros.stock || s.stock !== 'none') && (!filtros.radio || (s.km != null && s.km <= filtros.radio))), [todas, filtros]);

  // Si la sucursal elegida deja de cumplir los filtros, se deselecciona
  useEffect(() => { if (sel && !visibles.some((s) => s.id === sel)) setSel(null); }, [visibles, sel]);
  // Elegir un pin del mapa lleva la lista hasta su tarjeta
  useEffect(() => {
    if (!sel) return;
    document.getElementById(`axs-c-${sel}`)?.scrollIntoView({ block: 'nearest', behavior: reduced() ? 'auto' : 'smooth' });
  }, [sel]);

  const abiertasN = todas.filter((s) => s.abierta).length;
  const cercaN = ubi ? todas.filter((s) => s.km <= 5).length : 0;
  const masCerca = ubi ? todas[0] : null;

  /* ---- ubicación ---- */
  const encontrada = (u) => { setUbi(u); setEstado('ok'); setManual(false); setEscaneo((n) => n + 1); setSel(null); };
  const localizar = () => {
    if (!('geolocation' in navigator)) { setEstado('nosoporta'); setManual(true); return; }
    setEstado('buscando'); setManual(false);
    navigator.geolocation.getCurrentPosition(
      (p) => encontrada({ lat: p.coords.latitude, lng: p.coords.longitude, manual: false }),
      (e) => { setEstado(e.code === 1 ? 'denegado' : e.code === 3 ? 'tiempo' : 'error'); setManual(true); },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  };
  // Si ya diste permiso antes, se ubica sola (sin volver a preguntar)
  useEffect(() => {
    let vivo = true;
    navigator.permissions?.query({ name: 'geolocation' }).then((r) => { if (vivo && r.state === 'granted') localizar(); }).catch(() => {});
    return () => { vivo = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const MENSAJES = {
    idle: 'Permite tu ubicación para ordenar las sucursales por cercanía. Solo se usa en tu navegador para calcular distancias.',
    buscando: 'Buscando tu ubicación…',
    ok: masCerca ? `Listo: la más cercana, ${masCerca.nombre}, está a ${fmtKm(masCerca.km)}.${ubi?.manual ? ' (Ubicación marcada por ti.)' : ''}` : '',
    denegado: 'No pudimos usar tu ubicación porque el permiso está bloqueado. Actívalo en el candado junto a la dirección del navegador, o marca tu zona tocando el mapa.',
    tiempo: 'Tu ubicación tardó demasiado en responder. Inténtalo de nuevo o marca tu zona tocando el mapa.',
    error: 'No pudimos obtener tu ubicación. Inténtalo de nuevo o marca tu zona tocando el mapa.',
    nosoporta: 'Tu navegador no ofrece ubicación. Marca tu zona tocando el mapa.',
  };
  const fallo = ['denegado', 'tiempo', 'error', 'nosoporta'].includes(estado);

  const anuncio = ubi
    ? `${visibles.length} ${visibles.length === 1 ? 'sucursal' : 'sucursales'} encontradas${visibles[0] ? `; la más cercana a ${fmtKm(visibles[0].km)}` : ''}.`
    : `${visibles.length} sucursales en el mapa.`;

  return (
    <div className="ax">
      <Nav />

      <main>
        {/* ===== HERO: ubícate y mira el radar ===== */}
        <section className="ax-hero ax-dark axs-hero" aria-labelledby={`${uid}-h`}>
          <GearBg gears={[{ n: 14, s: '38rem', l: '-12rem', t: '-8rem', dur: '120s' }, { n: 10, s: '26rem', l: '64%', t: '60%', rev: true, dur: '90s' }]} />
          <div className="ax-wrap ax-hero-grid axs-grid">
            <div>
              <Reveal><span className="axs-eyebrow"><MapPin size={18} weight="fill" aria-hidden="true" />Sucursales</span></Reveal>
              <h1 id={`${uid}-h`} className="ax-h1" style={{ marginTop: '1.25rem' }}>
                <Words text="La pieza está" />
                <Words text="más cerca de lo que crees." em base={3} />
              </h1>
              <Reveal delay={200}>
                <p className="ax-lede">Mira en el mapa las refaccionarias de la red, ordenadas por cercanía, con horario y disponibilidad.</p>
                {pieza && <p className="axs-pieza"><Storefront size={18} weight={W} aria-hidden="true" />Buscando: <b>{pieza}</b></p>}

                <div className="axs-cta">
                  <button type="button" className="axs-go" onClick={localizar} disabled={estado === 'buscando'} aria-busy={estado === 'buscando'}>
                    {estado === 'buscando' ? <CircleNotch className="axs-spin" size={20} weight="bold" aria-hidden="true" /> : <Crosshair size={20} weight="bold" aria-hidden="true" />}
                    {estado === 'buscando' ? 'Buscando…' : estado === 'ok' ? 'Actualizar mi ubicación' : 'Usar mi ubicación'}
                  </button>
                  <button type="button" className="axs-go axs-go-ghost" onClick={() => { setManual((v) => !v); setVista('mapa'); }} aria-pressed={manual}>
                    <MapPin size={20} weight="bold" aria-hidden="true" />{manual ? 'Toca el mapa…' : 'Marcar mi zona'}
                  </button>
                </div>
                <p className={cx('axs-status', fallo && 'is-err', estado === 'ok' && 'is-ok')} role="status">
                  {fallo ? <WarningCircle size={18} weight="fill" aria-hidden="true" /> : estado === 'ok' ? <CheckCircle size={18} weight="fill" aria-hidden="true" /> : null}
                  <span>{MENSAJES[estado]}</span>
                </p>

                <div className="axs-stats">
                  {[[todas.length, 'sucursales en la red'], [abiertasN, 'abiertas ahora'], [ubi ? cercaN : null, 'a menos de 5 km']].map(([v, l]) => (
                    <div key={l} className="axs-stat"><span className="ax-num">{v == null ? '–' : <Counter to={v} />}</span><p>{l}</p></div>
                  ))}
                </div>
              </Reveal>
            </div>

            <div ref={surfaceRef} className="ax-scene axs-scene" aria-hidden="true">
              <div ref={stageRef} className="ax-stage">
                <div className="ax-glow" />
                <div className="ax-floor"><div className="ax-floor-grid" /></div>
                <Radar3D estado={estado} cerca={cercaN} />
              </div>
            </div>
          </div>
        </section>

        {/* ===== MAPA + LISTA ===== */}
        <section id="mapa" className="ax-sec ax-light axs-sec" aria-labelledby={`${uid}-m`}>
          <div className="ax-wrap">
            <Reveal>
              <div className="ax-sechead">
                <p className="ax-eyebrow">Cerca de ti</p>
                <h2 id={`${uid}-m`} className="ax-h2">Mapa de <em className="ax-em">sucursales</em></h2>
              </div>
            </Reveal>

            {/* filtros */}
            <div className="axs-filters">
              <div className="axs-chips" role="group" aria-label="Filtros">
                <button type="button" className="ax-chipbtn" aria-pressed={filtros.abiertas} onClick={() => setFiltros((f) => ({ ...f, abiertas: !f.abiertas }))}><Clock size={16} weight="bold" aria-hidden="true" />Abiertas ahora</button>
                <button type="button" className="ax-chipbtn" aria-pressed={filtros.stock} onClick={() => setFiltros((f) => ({ ...f, stock: !f.stock }))}><Lightning size={16} weight="bold" aria-hidden="true" />Con stock</button>
              </div>
              <div className={cx('axs-radios', !ubi && 'is-off')} role="radiogroup" aria-label="Distancia máxima">
                {RADIOS.map((r) => (
                  <button key={r.v} type="button" role="radio" aria-checked={filtros.radio === r.v} disabled={!ubi && r.v !== 0} onClick={() => setFiltros((f) => ({ ...f, radio: r.v }))}>{r.t}</button>
                ))}
              </div>
              <p className="axs-count" aria-live="polite">{anuncio}{!ubi && ' Usa tu ubicación para filtrar por distancia.'}</p>
            </div>

            {/* alternar mapa/lista en pantallas chicas */}
            <div className="axs-seg" role="radiogroup" aria-label="Vista" style={{ '--n': vista === 'mapa' ? 0 : 1 }}>
              <span className="axs-seg-thumb" aria-hidden="true" />
              <button type="button" role="radio" aria-checked={vista === 'mapa'} onClick={() => setVista('mapa')}><MapTrifold size={18} weight="bold" aria-hidden="true" />Mapa</button>
              <button type="button" role="radio" aria-checked={vista === 'lista'} onClick={() => setVista('lista')}><ListBullets size={18} weight="bold" aria-hidden="true" />Lista <b className="ax-num">{visibles.length}</b></button>
            </div>

            <div className={cx('axs-board', `v-${vista}`)}>
              <div className="axs-listcol">
                {visibles.length === 0 ? (
                  <div className="axs-empty">
                    <MapPin size={40} weight={W} aria-hidden="true" />
                    <h3 className="ax-card-t">Ninguna sucursal cumple estos filtros</h3>
                    <p>Prueba con una distancia mayor o quita algún filtro.</p>
                    <button type="button" className="axs-btn" onClick={() => setFiltros({ abiertas: false, stock: false, radio: 0 })}>Quitar filtros</button>
                  </div>
                ) : (
                  <ul ref={listaRef} className="axs-list" aria-label="Sucursales">
                    {visibles.map((s, i) => <Tarjeta key={`${s.id}-${escaneo}`} s={s} i={i} ubi={ubi} sel={sel} onSel={setSel} />)}
                  </ul>
                )}
              </div>

              <div className="axs-mapcol">
                <div className="axs-map">
                  <MapaLeaflet todas={todas} visibles={visibles} ubi={ubi} sel={sel} onSel={setSel} manual={manual} escaneo={escaneo}
                    onElegir={encontrada} onMover={(p) => { setUbi({ ...p, manual: true }); setEstado('ok'); }} />
                  {manual && (
                    <p className="axs-pickmsg" role="status"><Crosshair size={18} weight="bold" aria-hidden="true" />Toca el mapa para marcar dónde estás
                      <button type="button" onClick={() => setManual(false)} aria-label="Cancelar"><X size={16} weight="bold" aria-hidden="true" /></button></p>
                  )}
                  {/* resumen de la sucursal elegida (solo pantallas chicas) */}
                  {sel && (() => {
                    const s = todas.find((x) => x.id === sel);
                    return s ? (
                      <div className="axs-peek" key={s.id}>
                        <div><p className="axs-peek-n">{s.nombre}</p><p className="axs-peek-m">{s.km != null ? `${fmtKm(s.km)} · ≈ ${eta(s.km)} min · ` : ''}{s.horario}</p></div>
                        <a className="axs-btn" href={urlComoLlegar(s, ubi)} target="_blank" rel="noopener noreferrer"><NavigationArrow size={18} weight="fill" aria-hidden="true" />Ir</a>
                        <button type="button" className="axs-peek-x" onClick={() => setSel(null)} aria-label="Cerrar resumen"><X size={18} weight="bold" aria-hidden="true" /></button>
                      </div>
                    ) : null;
                  })()}
                </div>
                <p className="axs-credit">Mapa © OpenStreetMap. Distancias en línea recta, aproximadas.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== CIERRE ===== */}
        <section className="ax-sec ax-dark2 axs-close" aria-label="Registra tu sucursal">
          <GearBg gears={[{ n: 16, s: '34rem', l: '-10rem', t: '-6rem', dur: '140s' }, { n: 12, s: '24rem', l: '72%', t: '50%', rev: true, dur: '100s' }]} />
          <div className="ax-wrap">
            <Reveal>
              <h2 className="ax-h2">¿Tienes una refaccionaria? <em className="ax-em">Súmala al mapa.</em></h2>
              <p className="ax-lede">Registra tu sucursal y deja que los clientes cercanos te encuentren, vean tu horario y te escriban por WhatsApp.</p>
              <Link to="/registro?rol=refaccionaria" className="axs-big">Registrar mi sucursal<ArrowRight size={20} weight="bold" aria-hidden="true" /></Link>
            </Reveal>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
