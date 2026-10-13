// Primera vista del USUARIO (rol "comprador") — AutoRed. Ubicación: src/Usuario/Inicio.jsx
// Reutiliza los estilos ax- (index.css). Lo propio de esta pantalla lleva prefijo axu- y está en ./Usuario.css.
//
// Ruta:  <Route path="/usuario" element={<Inicio usuario={usuario} />} />
// Login: en RUTA_POR_ROL pon  comprador: '/usuario'  (la refaccionaria sigue en '/refaccionaria' con su propia interfaz).
//
// Secciones: Mis vehículos · Mis cotizaciones activas · Búsquedas recientes.
// Animación nueva: al entrar por primera vez en la sesión, "se abre la puerta del garage" (se puede saltar).
import { useEffect, useId, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Badge, Reveal } from '../autored-ui';
import Nav from '../Components/Nav';
import Footer from '../Components/Footer';
import '../index.css';
import {
  Car, Plus, MagnifyingGlass, ClockCounterClockwise, FileText, Storefront, WhatsappLogo, CaretDown, CaretLeft,
  CaretRight, X, ArrowRight, Wrench, Check, WarningCircle, ArrowClockwise, Trash, Gear, Lightning,
} from '@phosphor-icons/react';

const cx = (...c) => c.filter(Boolean).join(' ');
const W = 'duotone';
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const MIN = 60e3, H = 36e5, D = 864e5;
const LLAVE_GARAGE = 'autored-garage';

/* ======================= DATOS (sustituye por tu API) ======================= */
// TODO: GET /usuario/resumen → { vehiculos, cotizaciones, busquedas }  (PHP/MySQL, con la sesión por cookie).
//   · Vehículos:    POST /usuario/vehiculos           (agregar)  · DELETE /usuario/vehiculos/:id
//   · Cotizaciones: solo las ACTIVAS (vence > ahora); las ofertas llegan de las refaccionarias.
//   · Búsquedas:    DELETE /usuario/busquedas/:id  · DELETE /usuario/busquedas (borrar historial)
// Los teléfonos de ejemplo no son reales.
const muestra = () => {
  const t = Date.now();
  return {
    vehiculos: [
      { id: 'v1', marca: 'Nissan', modelo: 'Versa', anio: 2018, placa: 'ABC-123-A', km: 84200, color: '#c81e2b', servicio: { txt: 'Cambio de aceite', faltan: 1200, de: 5000 } },
      { id: 'v2', marca: 'Chevrolet', modelo: 'Aveo', anio: 2014, placa: 'XYZ-987-B', km: 132500, color: '#3b4a5e', servicio: { txt: 'Revisión de frenos', faltan: 400, de: 15000 } },
    ],
    cotizaciones: [
      { id: 'c1', pieza: 'Balatas delanteras', veh: 'v1', enviada: t - 2 * H, vence: t + 21 * H, dur: 24 * H, consultadas: 8, ofertas: [
        { id: 'o1', tienda: 'Refaccionaria El Buen Freno', zona: 'Centro · 1.2 km', precio: 849, stock: 'ok', txt: 'En stock', tel: '5215500000001' },
        { id: 'o2', tienda: 'AutoPartes Norte', zona: 'Norte · 3.8 km', precio: 690, stock: 'warn', txt: 'Poco stock', tel: '5215500000002' },
        { id: 'o3', tienda: 'Frenos y Suspensión Sur', zona: 'Sur · 5.1 km', precio: 910, stock: 'ok', txt: 'En stock', tel: '5215500000003' },
      ] },
      { id: 'c2', pieza: 'Amortiguadores traseros', veh: 'v2', enviada: t - 20 * H, vence: t + 2.5 * H, dur: 24 * H, consultadas: 6, ofertas: [
        { id: 'o4', tienda: 'Suspensiones Rápidas', zona: 'Centro · 2.0 km', precio: 1380, stock: 'ok', txt: 'En stock', tel: '5215500000004' },
      ] },
      { id: 'c3', pieza: 'Bujías (juego de 4)', veh: 'v1', enviada: t - 12 * MIN, vence: t + 47 * H, dur: 48 * H, consultadas: 5, ofertas: [] },
    ],
    busquedas: [
      { id: 'b1', q: 'Balatas Versa 2018', veh: 'v1', cuando: t - 35 * MIN, res: 24 },
      { id: 'b2', q: 'Filtro de aceite', veh: 'v2', cuando: t - 3 * H, res: 41 },
      { id: 'b3', q: 'Bomba de agua', veh: 'v1', cuando: t - 1 * D, res: 12 },
      { id: 'b4', q: 'Faro delantero izquierdo', veh: null, cuando: t - 3 * D, res: 9 },
    ],
  };
};

const COLORES = ['#c81e2b', '#3b4a5e', '#a16207', '#0f766e', '#6d28d9', '#475569'];
const MARCAS = ['Nissan', 'Chevrolet', 'Volkswagen', 'Toyota', 'Ford', 'Honda', 'Mazda', 'Kia', 'Hyundai', 'SEAT', 'Renault', 'Suzuki', 'Dodge', 'Jeep'];

const nombreVeh = (v) => (v ? `${v.marca} ${v.modelo}` : 'Cualquier vehículo');
const money = (n) => `$${n.toLocaleString('es-MX')}`;
const km = (n) => `${n.toLocaleString('es-MX')} km`;
const saludo = () => { const h = new Date().getHours(); return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'; };
const hace = (ms) => {
  const m = Math.floor(ms / MIN);
  if (m < 1) return 'hace un momento';
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'ayer' : `hace ${d} días`;
};
const restante = (ms) => {
  if (ms <= 0) return 'Vencida';
  const m = Math.round(ms / MIN);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), r = m % 60;
  if (h >= 24) return `${Math.floor(h / 24)} d ${h % 24} h`;
  return r ? `${h} h ${r} min` : `${h} h`;
};
const urlBusqueda = (q, veh) => `/catalogo?${new URLSearchParams({ q, ...(veh ? { vehiculo: veh } : {}) })}`;

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

function SecHead({ eyebrow, title, children, aside }) {
  return (
    <div className="axu-sechead">
      <div className="ax-sechead">
        <p className="ax-eyebrow">{eyebrow}</p>
        <h2 className="ax-h2">{title}</h2>
        {children && <p className="ax-lede">{children}</p>}
      </div>
      {aside}
    </div>
  );
}

// Número que sube hasta su valor al aparecer
function Counter({ to, duration = 1000 }) {
  const [ref, seen] = useInView(0.6);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!seen) return;
    if (reduced()) { setN(to); return; }
    const t0 = performance.now();
    let raf = 0;
    const f = (t) => {
      const k = Math.min((t - t0) / duration, 1);
      setN(Math.round(to * (1 - Math.pow(1 - k, 4))));
      if (k < 1) raf = requestAnimationFrame(f);
    };
    raf = requestAnimationFrame(f);
    return () => cancelAnimationFrame(raf);
  }, [seen, to, duration]);
  return <span ref={ref}>{n}</span>;
}

// Tarjeta con inclinación 3D suave y foco de luz que sigue al cursor
function Tilt({ max = 5, className, children, ...props }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || reduced() || !finePointer()) return;
    let tx = 0, ty = 0, px = 0, py = 0, raf = 0;
    const tick = () => {
      px += (tx - px) * 0.14; py += (ty - py) * 0.14;
      const quiet = Math.abs(tx - px) < 0.002 && Math.abs(ty - py) < 0.002;
      if (quiet && tx === 0 && ty === 0) { el.style.transform = ''; raf = 0; return; }
      el.style.transform = `perspective(900px) rotateX(${-py * max}deg) rotateY(${px * max}deg)`;
      raf = quiet ? 0 : requestAnimationFrame(tick);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const move = (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      tx = (x - 0.5) * 2; ty = (y - 0.5) * 2;
      el.style.setProperty('--mx', `${x * 100}%`);
      el.style.setProperty('--my', `${y * 100}%`);
      kick();
    };
    const leave = () => { tx = 0; ty = 0; kick(); };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); cancelAnimationFrame(raf); };
  }, [max]);
  return <div ref={ref} className={cx('ax-tilt', className)} {...props}>{children}</div>;
}

// Carrusel scroll-snap: botones, teclado, arrastre con mouse y puntos. Si se agrega un elemento, se desplaza hasta él.
function Carousel({ label, children }) {
  const track = useRef(null);
  const drag = useRef(null);
  const prevN = useRef(0);
  const items = Array.isArray(children) ? children : [children];
  const n = items.length;
  const [idx, setIdx] = useState(0);
  const step = () => {
    const el = track.current, c = el?.children[0];
    if (!c) return 0;
    return c.getBoundingClientRect().width + (parseFloat(getComputedStyle(el).columnGap) || 0);
  };
  const go = (d) => track.current?.scrollBy({ left: d * step(), behavior: reduced() ? 'auto' : 'smooth' });
  useEffect(() => {
    if (prevN.current && n > prevN.current && track.current) {
      track.current.scrollTo({ left: Math.max(0, n - 2) * step(), behavior: reduced() ? 'auto' : 'smooth' });
    }
    prevN.current = n;
  }, [n]);
  const onScroll = () => { const s = step(); if (s) setIdx(Math.min(n - 1, Math.max(0, Math.round(track.current.scrollLeft / s)))); };
  const down = (e) => { if (e.pointerType !== 'mouse' || e.target.closest('button, input, a, label, form')) return; drag.current = { x: e.clientX, left: track.current.scrollLeft }; track.current.classList.add('is-drag'); };
  const move = (e) => { if (drag.current) track.current.scrollLeft = drag.current.left - (e.clientX - drag.current.x); };
  const up = () => { drag.current = null; track.current?.classList.remove('is-drag'); };
  const key = (e) => {
    if (e.target !== track.current) return; // no secuestra las flechas dentro de los campos
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
  };
  return (
    <div role="region" aria-roledescription="carrusel" aria-label={label}>
      <div className="ax-car-head">
        <div className="ax-dots" aria-hidden="true">{items.map((_, i) => <i key={i} className={i === idx ? 'on' : ''} />)}</div>
        <div className="ax-ctls">
          <button type="button" className="ax-ctl" onClick={() => go(-1)} disabled={idx === 0} aria-label="Anterior"><CaretLeft size={22} weight="bold" aria-hidden="true" /></button>
          <span className="ax-count ax-num" aria-live="polite">{String(idx + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}</span>
          <button type="button" className="ax-ctl" onClick={() => go(1)} disabled={idx === n - 1} aria-label="Siguiente"><CaretRight size={22} weight="bold" aria-hidden="true" /></button>
        </div>
      </div>
      <div ref={track} className="ax-track axu-track" tabIndex={0} onScroll={onScroll} onKeyDown={key}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} onPointerCancel={up}>
        {items.map((it, i) => (
          <div key={it?.key ?? i} className="ax-slide" role="group" aria-roledescription="diapositiva" aria-label={`${i + 1} de ${n}`}>{it}</div>
        ))}
      </div>
    </div>
  );
}

// Auto de perfil (SVG propio); el color de la carrocería viene del vehículo
function CarArt({ color = '#c81e2b', id = 'c' }) {
  return (
    <svg viewBox="0 0 250 112" className="axu-carsvg" focusable="false">
      <defs>
        <linearGradient id={`${id}-b`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} /><stop offset="1" stopColor={color} stopOpacity=".72" /></linearGradient>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#c9dbe6" /><stop offset="1" stopColor="#4b6272" /></linearGradient>
      </defs>
      <ellipse cx="125" cy="104" rx="104" ry="6" fill="#000" opacity=".28" />
      <path d="M14 80 L14 68 Q14 60 25 58 L62 52 Q80 27 112 25 L152 25 Q178 27 194 47 L222 55 Q236 59 236 70 L236 80 Q236 86 229 86 L21 86 Q14 86 14 80Z" fill={`url(#${id}-b)`} stroke="#fff" strokeOpacity=".28" />
      <path d="M72 52 Q86 34 112 33 L128 33 L128 52Z" fill={`url(#${id}-g)`} />
      <path d="M136 33 L152 33 Q168 35 181 52 L136 52Z" fill={`url(#${id}-g)`} />
      <path d="M20 66 L34 66" stroke="#fff" strokeOpacity=".6" strokeWidth="3" strokeLinecap="round" />
      <rect x="222" y="62" width="12" height="7" rx="3" fill="#ffe9b0" />
      <rect x="16" y="62" width="9" height="7" rx="3" fill="#ff8d85" />
      {[64, 186].map((x) => (
        <g key={x}>
          <circle cx={x} cy="88" r="19" fill="#120a0b" />
          <g className="axu-wheel">
            <circle cx={x} cy="88" r="11" fill="#9aa7b2" stroke="#fff" strokeOpacity=".4" />
            {[0, 72, 144, 216, 288].map((a) => <line key={a} x1={x} y1="88" x2={x + 10 * Math.cos((a * Math.PI) / 180)} y2={88 + 10 * Math.sin((a * Math.PI) / 180)} stroke="#2a1618" strokeWidth="2.4" strokeLinecap="round" />)}
            <circle cx={x} cy="88" r="3" fill="#2a1618" />
          </g>
        </g>
      ))}
    </svg>
  );
}

/* ======================= ANIMACIÓN NUEVA: PUERTA DE GARAGE ======================= */
const yaVisto = () => { try { return sessionStorage.getItem(LLAVE_GARAGE) === '1'; } catch { return false; } };
const marcarVisto = () => { try { sessionStorage.setItem(LLAVE_GARAGE, '1'); } catch { /* sin almacenamiento */ } };

function Garaje({ nombre, onFin }) {
  const [abre, setAbre] = useState(false);
  const [fuera, setFuera] = useState(false);
  const fin = useRef(onFin);
  fin.current = onFin;

  useEffect(() => {
    const b = document.body, ov = b.style.overflow;
    b.style.overflow = 'hidden';
    const t1 = setTimeout(() => setAbre(true), 550);
    const t2 = setTimeout(() => setFuera(true), 1900);
    const t3 = setTimeout(() => { marcarVisto(); fin.current(); }, 2300);
    return () => { b.style.overflow = ov; [t1, t2, t3].forEach(clearTimeout); };
  }, []);

  // Cualquier clic o tecla la salta
  const saltar = () => { setAbre(true); setFuera(true); setTimeout(() => { marcarVisto(); fin.current(); }, 260); };
  useEffect(() => {
    const k = () => saltar();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);

  return (
    <div className={cx('axu-garage', abre && 'is-open', fuera && 'is-gone')} onClick={saltar} role="status" aria-live="polite">
      <div className="axu-door" aria-hidden="true">
        {Array.from({ length: 8 }, (_, i) => <i key={i} className="axu-slat" style={{ '--i': i }} />)}
      </div>
      <div className="axu-garage-txt">
        <Gear size={34} weight="fill" aria-hidden="true" />
        <p className="axu-garage-t">Bienvenido, {nombre}</p>
        <p className="axu-garage-s">Abriendo tu garage…</p>
      </div>
      <p className="axu-garage-skip" aria-hidden="true">Toca para saltar</p>
    </div>
  );
}

/* ======================= MIS VEHÍCULOS ======================= */
// Tarjeta que se voltea (3D) y muestra un formulario corto para agregar un vehículo
function AgregarVehiculo({ onAdd }) {
  const uid = useId().replace(/:/g, '');
  const abrirRef = useRef(null);
  const marcaRef = useRef(null);
  const formRef = useRef(null);
  const [flip, setFlip] = useState(false);
  const [f, setF] = useState({ marca: '', modelo: '', anio: '', placa: '' });
  const [er, setEr] = useState({});
  const anioMax = new Date().getFullYear() + 1;

  // La cara oculta no recibe foco ni se lee con lector de pantalla
  useEffect(() => {
    if (abrirRef.current) abrirRef.current.inert = flip;
    if (formRef.current) formRef.current.inert = !flip;
  }, [flip]);

  const abrir = () => { setFlip(true); setTimeout(() => marcaRef.current?.focus({ preventScroll: true }), reduced() ? 0 : 380); };
  const cerrar = () => { setFlip(false); setEr({}); setTimeout(() => abrirRef.current?.focus({ preventScroll: true }), reduced() ? 0 : 380); };
  const cambia = (k) => (e) => { const v = k === 'placa' ? e.target.value.toUpperCase() : e.target.value; setF((x) => ({ ...x, [k]: v })); if (er[k]) setEr((x) => ({ ...x, [k]: '' })); };
  const guardar = (e) => {
    e.preventDefault();
    const x = {};
    if (f.marca.trim().length < 2) x.marca = 'Escribe la marca.';
    if (!f.modelo.trim()) x.modelo = 'Escribe el modelo.';
    const a = Number(f.anio);
    if (!(a >= 1980 && a <= anioMax)) x.anio = `Entre 1980 y ${anioMax}.`;
    setEr(x);
    if (Object.keys(x).length) { requestAnimationFrame(() => formRef.current?.querySelector('[aria-invalid="true"]')?.focus()); return; }
    onAdd({ marca: f.marca.trim(), modelo: f.modelo.trim(), anio: a, placa: f.placa.trim() });
    setF({ marca: '', modelo: '', anio: '', placa: '' }); setFlip(false);
  };

  return (
    <div className={cx('axu-add', flip && 'is-flip')}>
      <div className="axu-add-in">
        <button ref={abrirRef} type="button" className="axu-add-face axu-add-front" onClick={abrir} aria-expanded={flip}>
          <span className="axu-add-plus"><Plus size={30} weight="bold" aria-hidden="true" /></span>
          <b>Agregar vehículo</b>
          <small>Guarda tu auto y te mostramos solo piezas compatibles.</small>
        </button>
        <form ref={formRef} className="axu-add-face axu-add-back" noValidate onSubmit={guardar} onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); cerrar(); } }} aria-label="Agregar vehículo">
          <p className="axu-add-t">Nuevo vehículo</p>
          <div className="axu-f2">
            <div className={cx('axu-f', er.marca && 'has-err')}>
              <label htmlFor={`${uid}-m`}>Marca</label>
              <input ref={marcaRef} id={`${uid}-m`} list={`${uid}-ml`} autoComplete="off" value={f.marca} onChange={cambia('marca')} aria-invalid={er.marca ? 'true' : undefined} />
              <datalist id={`${uid}-ml`}>{MARCAS.map((m) => <option key={m} value={m} />)}</datalist>
              {er.marca && <p className="axu-ferr" role="alert">{er.marca}</p>}
            </div>
            <div className={cx('axu-f', er.modelo && 'has-err')}>
              <label htmlFor={`${uid}-mo`}>Modelo</label>
              <input id={`${uid}-mo`} autoComplete="off" value={f.modelo} onChange={cambia('modelo')} aria-invalid={er.modelo ? 'true' : undefined} />
              {er.modelo && <p className="axu-ferr" role="alert">{er.modelo}</p>}
            </div>
            <div className={cx('axu-f', er.anio && 'has-err')}>
              <label htmlFor={`${uid}-a`}>Año</label>
              <input id={`${uid}-a`} inputMode="numeric" maxLength={4} autoComplete="off" value={f.anio} onChange={(e) => cambia('anio')({ target: { value: e.target.value.replace(/\D/g, '') } })} aria-invalid={er.anio ? 'true' : undefined} />
              {er.anio && <p className="axu-ferr" role="alert">{er.anio}</p>}
            </div>
            <div className="axu-f">
              <label htmlFor={`${uid}-p`}>Placa <span>(opcional)</span></label>
              <input id={`${uid}-p`} autoComplete="off" maxLength={10} value={f.placa} onChange={cambia('placa')} />
            </div>
          </div>
          <div className="axu-add-btns">
            <button type="button" className="axu-btn axu-btn-ghost" onClick={cerrar}>Cancelar</button>
            <button type="submit" className="axu-btn"><Check size={18} weight="bold" aria-hidden="true" />Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ======================= MIS COTIZACIONES ======================= */
const FILTROS = [{ k: 'todas', t: 'Todas' }, { k: 'ofertas', t: 'Con ofertas' }, { k: 'vencer', t: 'Por vencer' }];

function Cotizacion({ q, veh, ahora, abierta, onToggle, i }) {
  const uid = useId().replace(/:/g, '');
  const [ref, seen] = useInView(0.25);
  const rest = q.vence - ahora;
  const pct = Math.max(0, Math.min(100, (rest / q.dur) * 100));
  const urgente = rest < 3 * H;
  const mejor = q.ofertas.length ? Math.min(...q.ofertas.map((o) => o.precio)) : null;
  const wa = (o) => `https://wa.me/${o.tel}?text=${encodeURIComponent(`Hola, vi tu oferta de ${q.pieza} (${money(o.precio)}) en AutoRed. ¿La sigues teniendo?`)}`;

  return (
    <article ref={ref} className={cx('axu-q', urgente && 'is-urg', seen && 'is-in', abierta && 'is-open')} style={{ '--i': i, '--p': seen ? pct : 0 }}>
      <header className="axu-q-head">
        <span className="ax-ico"><FileText size={26} weight={W} aria-hidden="true" /></span>
        <div className="axu-q-title">
          <h3 className="ax-card-t">{q.pieza}</h3>
          <p>{nombreVeh(veh)} · enviada {hace(ahora - q.enviada)}</p>
        </div>
        <div className="axu-ring" role="img" aria-label={`Vence en ${restante(rest)}`}>
          <span className="ax-num">{restante(rest).replace(' min', ' m').replace(' h ', 'h ')}</span>
        </div>
      </header>

      {mejor !== null ? (
        <div className="axu-q-sum">
          <p className="axu-q-from">Desde <b className="ax-num">{money(mejor)}</b></p>
          <p className="axu-q-note">{q.ofertas.length} de {q.consultadas} refaccionarias respondieron</p>
          <div className="axu-meter" aria-hidden="true"><i style={{ '--v': q.ofertas.length / q.consultadas }} /></div>
        </div>
      ) : (
        <div className="axu-q-sum">
          <p className="axu-q-wait"><span className="ax-typing" aria-hidden="true"><i /><i /><i /></span>Consultando a {q.consultadas} refaccionarias…</p>
          <p className="axu-q-note">Te avisamos cuando lleguen las primeras ofertas.</p>
        </div>
      )}

      {q.ofertas.length > 0 && (
        <>
          <button type="button" className="axu-q-toggle" onClick={onToggle} aria-expanded={abierta} aria-controls={`${uid}-o`}>
            {abierta ? 'Ocultar ofertas' : `Ver ${q.ofertas.length} ${q.ofertas.length === 1 ? 'oferta' : 'ofertas'}`}<CaretDown size={18} weight="bold" aria-hidden="true" />
          </button>
          <div id={`${uid}-o`} className="axu-q-body"><div>
            <ul className="axu-offers">
              {[...q.ofertas].sort((a, b) => a.precio - b.precio).map((o, k) => (
                <li key={o.id} style={{ '--k': k }}>
                  <span className="axu-off-ico"><Storefront size={20} weight={W} aria-hidden="true" /></span>
                  <div className="axu-off-main">
                    <p className="axu-off-n">{o.tienda}{o.precio === mejor && q.ofertas.length > 1 && <em>Mejor precio</em>}</p>
                    <p className="axu-off-z">{o.zona} · <Badge tone={o.stock}>{o.txt}</Badge></p>
                  </div>
                  <span className="axu-off-p ax-num">{money(o.precio)}</span>
                  <a className="axu-wa" href={wa(o)} target="_blank" rel="noopener noreferrer" aria-label={`Escribir por WhatsApp a ${o.tienda}`}><WhatsappLogo size={20} weight="fill" aria-hidden="true" /></a>
                </li>
              ))}
            </ul>
          </div></div>
        </>
      )}
    </article>
  );
}

/* ======================= PÁGINA ======================= */
export default function InicioUsuario({ usuario }) {
  const ir = useNavigate();
  const { surfaceRef, stageRef } = useSceneTilt(9);
  const [intro, setIntro] = useState(() => !reduced() && !yaVisto());
  const intro0 = useRef(intro).current; // para retrasar las animaciones de entrada hasta que se abra la puerta
  const [datos] = useState(muestra);
  const [vehiculos, setVehiculos] = useState(datos.vehiculos);
  const [cotizaciones] = useState(datos.cotizaciones);
  const [busquedas, setBusquedas] = useState(datos.busquedas);
  const [vehSel, setVehSel] = useState(datos.vehiculos[0]?.id ?? null);
  const [consulta, setConsulta] = useState('');
  const [errBusq, setErrBusq] = useState('');
  const [filtro, setFiltro] = useState('todas');
  const [abierta, setAbierta] = useState(null);
  const [ahora, setAhora] = useState(() => Date.now());
  const [saliendo, setSaliendo] = useState(null);
  const [toast, setToast] = useState(null);
  const inputRef = useRef(null);
  const listaRef = useRef(null);
  const nombre = (usuario?.nombre || 'Carlos').trim().split(' ')[0];

  // El reloj de las cotizaciones avanza cada 30 s
  useEffect(() => { const t = setInterval(() => setAhora(Date.now()), 30000); return () => clearInterval(t); }, []);
  // Aviso con "Deshacer": desaparece solo
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 6500); return () => clearTimeout(t); }, [toast]);

  const veh = vehiculos.find((v) => v.id === vehSel) || null;
  const vehPorId = (id) => vehiculos.find((v) => v.id === id) || null;
  const activas = cotizaciones.filter((q) => q.vence > ahora).sort((a, b) => a.vence - b.vence);
  const porVencer = (q) => q.vence - ahora < 3 * H;
  const lista = activas.filter((q) => (filtro === 'ofertas' ? q.ofertas.length > 0 : filtro === 'vencer' ? porVencer(q) : true));
  const cuenta = { todas: activas.length, ofertas: activas.filter((q) => q.ofertas.length).length, vencer: activas.filter(porVencer).length };
  const totalOfertas = activas.reduce((s, q) => s + q.ofertas.length, 0);

  /* ---- búsqueda ---- */
  const registrar = (q, vid) => setBusquedas((l) => [{ id: `b${Date.now()}`, q, veh: vid, cuando: Date.now(), res: null }, ...l.filter((b) => b.q.toLowerCase() !== q.toLowerCase())].slice(0, 12));
  const buscar = (e) => {
    e.preventDefault();
    const q = consulta.trim();
    if (!q) { setErrBusq('Escribe la pieza que buscas, por ejemplo "balatas delanteras".'); inputRef.current?.focus(); return; }
    registrar(q, vehSel);
    ir(urlBusqueda(q, vehSel));
  };
  const repetir = (b) => { registrar(b.q, b.veh); ir(urlBusqueda(b.q, b.veh)); };
  const quitar = (id) => {
    const i = busquedas.findIndex((b) => b.id === id);
    const b = busquedas[i];
    if (!b) return;
    setSaliendo(id);
    setTimeout(() => {
      setBusquedas((l) => l.filter((x) => x.id !== id));
      setSaliendo(null);
      setToast({ txt: 'Búsqueda eliminada', undo: () => setBusquedas((l) => { const n = [...l]; n.splice(Math.min(i, n.length), 0, b); return n; }) });
      listaRef.current?.focus();
    }, reduced() ? 0 : 220);
  };
  const borrarTodo = () => {
    const prev = busquedas;
    setBusquedas([]);
    setToast({ txt: 'Historial borrado', undo: () => setBusquedas(prev) });
  };

  /* ---- vehículos ---- */
  const agregarVeh = (v) => {
    const nuevo = { ...v, id: `v${Date.now()}`, km: null, color: COLORES[vehiculos.length % COLORES.length], servicio: null };
    setVehiculos((l) => [...l, nuevo]);
    setVehSel(nuevo.id);
    setToast({ txt: `${nombreVeh(nuevo)} agregado`, undo: () => { setVehiculos((l) => l.filter((x) => x.id !== nuevo.id)); setVehSel((s) => (s === nuevo.id ? vehiculos[0]?.id ?? null : s)); } });
  };
  const usarParaBuscar = (id) => {
    setVehSel(id);
    window.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' });
    setTimeout(() => inputRef.current?.focus({ preventScroll: true }), reduced() ? 0 : 450);
  };

  const d0 = intro0 ? 900 : 0;
  const w0 = intro0 ? 12 : 0;

  return (
    <div className="ax">
      {intro && <Garaje nombre={nombre} onFin={() => setIntro(false)} />}
      <Nav />

      <main>
        {/* ===== HERO: saludo + búsqueda + escena con tu auto ===== */}
        <section className="ax-hero ax-dark axu-hero" aria-labelledby="axu-titulo">
          <GearBg gears={[{ n: 14, s: '38rem', l: '-12rem', t: '-8rem', dur: '120s' }, { n: 10, s: '26rem', l: '64%', t: '60%', rev: true, dur: '90s' }]} />
          <div className="ax-wrap ax-hero-grid axu-grid">
            <div>
              <Reveal delay={d0}><Badge tone="brand">{saludo()}</Badge></Reveal>
              <h1 id="axu-titulo" className="ax-h1" style={{ marginTop: '1.25rem' }}>
                <Words text={`Hola, ${nombre}.`} base={w0} />
                <Words text="¿Qué pieza buscas?" em base={w0 + 2} />
              </h1>

              <Reveal delay={d0 + 200}>
                <form className="axu-search" role="search" onSubmit={buscar} noValidate>
                  <MagnifyingGlass size={22} weight="bold" aria-hidden="true" className="axu-search-ico" />
                  <label htmlFor="axu-q" className="axu-sr">Buscar una refacción</label>
                  <input ref={inputRef} id="axu-q" type="search" enterKeyHint="search" autoComplete="off" placeholder={veh ? `Ej. balatas para ${nombreVeh(veh)} ${veh.anio}` : 'Ej. balatas delanteras'}
                    value={consulta} onChange={(e) => { setConsulta(e.target.value); if (errBusq) setErrBusq(''); }} aria-invalid={errBusq ? 'true' : undefined} aria-describedby={errBusq ? 'axu-q-e' : undefined} />
                  <button type="submit">Buscar<ArrowRight size={18} weight="bold" aria-hidden="true" /></button>
                </form>
                {errBusq && <p id="axu-q-e" className="axu-search-err" role="alert"><WarningCircle size={16} weight="fill" aria-hidden="true" />{errBusq}</p>}

                {vehiculos.length > 0 && (
                  <div className="axu-vchips" role="group" aria-label="Buscar para">
                    <span>Para:</span>
                    {vehiculos.map((v) => (
                      <button key={v.id} type="button" aria-pressed={vehSel === v.id} onClick={() => setVehSel(v.id)}><Car size={16} weight="fill" aria-hidden="true" />{v.marca} {v.modelo} {v.anio}</button>
                    ))}
                    <button type="button" aria-pressed={vehSel === null} onClick={() => setVehSel(null)}>Todos</button>
                  </div>
                )}

                <div className="axu-stats">
                  {[[vehiculos.length, 'vehículos'], [activas.length, 'cotizaciones activas'], [totalOfertas, 'ofertas recibidas']].map(([v, l]) => (
                    <div key={l} className="axu-stat"><span className="ax-num"><Counter to={v} /></span><p>{l}</p></div>
                  ))}
                </div>
              </Reveal>
            </div>

            {/* ---- Escena 3D: tu auto sobre la pista ---- */}
            <div ref={surfaceRef} className="ax-scene axu-scene" aria-hidden="true">
              <div ref={stageRef} className="ax-stage">
                <div className="ax-glow" />
                <div className="ax-floor"><div className="ax-floor-grid" /></div>
                <div className="axu-car">
                  <div key={veh?.id ?? 'x'} className="axu-car-in"><CarArt color={veh?.color || '#c81e2b'} id="hero" /></div>
                </div>
                <div className="axu-chip axu-chip-a"><div className="ax-fc-in ax-glass ax-row" style={{ '--d': '0s' }}><Car size={18} weight="fill" />{veh ? `${nombreVeh(veh)} ${veh.anio}` : 'Todos tus vehículos'}</div></div>
                {veh?.servicio && <div className="axu-chip axu-chip-b"><div className="ax-fc-in ax-glass ax-row" style={{ '--d': '-2.4s' }}><Wrench size={18} weight="fill" />{veh.servicio.txt} en {km(veh.servicio.faltan)}</div></div>}
              </div>
            </div>
          </div>
        </section>

        {/* ===== MIS VEHÍCULOS (carrusel) ===== */}
        <section id="vehiculos" className="ax-sec ax-light" aria-labelledby="axu-h-veh">
          <div className="ax-wrap">
            <Reveal><SecHead eyebrow="Mi garage" title={<span id="axu-h-veh">Mis <em className="ax-em">vehículos</em></span>}>
              Guarda tus autos y busca solo piezas que les queden. Toca "Buscar piezas" para empezar con uno.
            </SecHead></Reveal>
            <Carousel label="Mis vehículos">
              {[...vehiculos.map((v) => (
                <Tilt key={v.id} max={4} className={cx('axu-vcard', vehSel === v.id && 'is-cur')}>
                  <div className="axu-vstage"><CarArt color={v.color} id={`v-${v.id}`} /></div>
                  <div>
                    <h3 className="ax-card-t">{v.marca} {v.modelo}</h3>
                    <p className="axu-vsub">{v.anio}{v.placa ? ` · ${v.placa}` : ''}{v.km ? ` · ${km(v.km)}` : ''}</p>
                  </div>
                  {v.servicio ? (
                    <div className="axu-svc">
                      <p><Wrench size={16} weight="fill" aria-hidden="true" />{v.servicio.txt} en <b className="ax-num">{km(v.servicio.faltan)}</b></p>
                      <div className="axu-meter" aria-hidden="true"><i style={{ '--v': 1 - v.servicio.faltan / v.servicio.de, '--c': v.servicio.faltan / v.servicio.de < 0.1 ? '#b45309' : undefined }} /></div>
                    </div>
                  ) : <p className="axu-svc-none">Aún sin recordatorios de servicio.</p>}
                  <button type="button" className="axu-btn" aria-pressed={vehSel === v.id} onClick={() => usarParaBuscar(v.id)}>
                    <MagnifyingGlass size={18} weight="bold" aria-hidden="true" />{vehSel === v.id ? 'Buscando para este' : 'Buscar piezas'}
                  </button>
                </Tilt>
              )), <AgregarVehiculo key="add" onAdd={agregarVeh} />]}
            </Carousel>
          </div>
        </section>

        {/* ===== MIS COTIZACIONES ACTIVAS ===== */}
        <section id="cotizaciones" className="ax-sec ax-dark2" aria-labelledby="axu-h-cot">
          <GearBg gears={[{ n: 16, s: '34rem', l: '-10rem', t: '-6rem', dur: '140s' }, { n: 12, s: '24rem', l: '72%', t: '50%', rev: true, dur: '100s' }]} />
          <div className="ax-wrap">
            <Reveal><SecHead eyebrow="Cotizaciones" title={<span id="axu-h-cot">Mis cotizaciones <em className="ax-em">activas</em></span>}
              aside={activas.length > 0 && (
                <div className="axu-seg" role="radiogroup" aria-label="Filtrar cotizaciones" style={{ '--n': FILTROS.findIndex((f) => f.k === filtro) }}
                  onKeyDown={(e) => {
                    const i = FILTROS.findIndex((f) => f.k === filtro);
                    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
                    if (!d) return;
                    e.preventDefault();
                    const n = FILTROS[(i + d + FILTROS.length) % FILTROS.length].k;
                    setFiltro(n);
                    e.currentTarget.querySelector(`[data-k="${n}"]`)?.focus();
                  }}>
                  <span className="axu-seg-thumb" aria-hidden="true" />
                  {FILTROS.map((f) => (
                    <button key={f.k} data-k={f.k} type="button" role="radio" aria-checked={filtro === f.k} tabIndex={filtro === f.k ? 0 : -1} onClick={() => setFiltro(f.k)}>
                      {f.t} <b className="ax-num">{cuenta[f.k]}</b>
                    </button>
                  ))}
                </div>
              )}>
              Aquí aparecen solo las que siguen vigentes, con las ofertas que te van mandando las refaccionarias.
            </SecHead></Reveal>

            {activas.length === 0 ? (
              <div className="axu-empty">
                <FileText size={44} weight={W} aria-hidden="true" />
                <h3 className="ax-card-t">Aún no tienes cotizaciones activas</h3>
                <p>Pide precio a varias refaccionarias a la vez y compara sus ofertas aquí.</p>
                <Link to="/catalogo" className="axu-btn axu-btn-light">Buscar y cotizar<ArrowRight size={18} weight="bold" aria-hidden="true" /></Link>
              </div>
            ) : lista.length === 0 ? (
              <div className="axu-empty">
                <p>Ninguna cotización cumple este filtro.</p>
                <button type="button" className="axu-btn axu-btn-light" onClick={() => setFiltro('todas')}>Ver todas</button>
              </div>
            ) : (
              <div className="axu-qgrid" key={filtro}>
                {lista.map((q, i) => (
                  <Cotizacion key={q.id} q={q} veh={vehPorId(q.veh)} ahora={ahora} i={i} abierta={abierta === q.id} onToggle={() => setAbierta((a) => (a === q.id ? null : q.id))} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ===== BÚSQUEDAS RECIENTES ===== */}
        <section id="busquedas" className="ax-sec ax-light2" aria-labelledby="axu-h-rec">
          <div className="ax-wrap">
            <Reveal><SecHead eyebrow="Historial" title={<span id="axu-h-rec">Búsquedas <em className="ax-em">recientes</em></span>}
              aside={busquedas.length > 0 && <button type="button" className="axu-btn axu-btn-ghost axu-clear" onClick={borrarTodo}><Trash size={18} weight={W} aria-hidden="true" />Borrar historial</button>}>
              Retoma una búsqueda con un toque.
            </SecHead></Reveal>

            {busquedas.length === 0 ? (
              <div className="axu-empty axu-empty-l">
                <ClockCounterClockwise size={44} weight={W} aria-hidden="true" />
                <h3 className="ax-card-t">Sin búsquedas recientes</h3>
                <p>Lo que busques aparecerá aquí para que lo repitas rápido.</p>
              </div>
            ) : (
              <ul ref={listaRef} tabIndex={-1} className="axu-recent" aria-label="Búsquedas recientes">
                {busquedas.map((b, i) => (
                  <li key={b.id} className={cx(saliendo === b.id && 'is-out')} style={{ '--i': i }}>
                    <span className="axu-r-ico"><ClockCounterClockwise size={22} weight={W} aria-hidden="true" /></span>
                    <div className="axu-r-main">
                      <p className="axu-r-q">{b.q}</p>
                      <p className="axu-r-m">{nombreVeh(vehPorId(b.veh))} · {hace(ahora - b.cuando)}{b.res != null ? ` · ${b.res} resultados` : ''}</p>
                    </div>
                    <button type="button" className="axu-r-again" onClick={() => repetir(b)} aria-label={`Repetir búsqueda: ${b.q}`}><ArrowClockwise size={18} weight="bold" aria-hidden="true" />Repetir</button>
                    <button type="button" className="axu-r-x" onClick={() => quitar(b.id)} aria-label={`Quitar de recientes: ${b.q}`}><X size={18} weight="bold" aria-hidden="true" /></button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>

      <Footer />

      {toast && (
        <div className="axu-toast" role="status" key={toast.txt}>
          <span><Lightning size={18} weight="fill" aria-hidden="true" />{toast.txt}</span>
          <button type="button" onClick={() => { toast.undo(); setToast(null); }}>Deshacer</button>
        </div>
      )}
    </div>
  );
}
