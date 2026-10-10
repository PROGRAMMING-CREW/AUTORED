// Presentación de AutoRed — experiencia 3D inmersiva (CSS 3D + scroll, sin librerías extra).
// Estilos en ./Index.css (prefijo ax-). Paleta en rojos; las piezas del hero son SVG propios. Nav y Footer son componentes aparte.
import { useEffect, useRef, useState } from 'react';
import { Button, Badge, Reveal } from './autored-ui';
import Nav from './Components/Nav';
import Footer from './Components/Footer';
import './index.css';
import {
  MagnifyingGlass, PhoneCall, Question, Package, ShieldWarning, ArrowsClockwise, SlidersHorizontal,
  Robot, ShieldCheck, Storefront, ClipboardText, ListMagnifyingGlass, MapPin, WhatsappLogo, Scales,
  Handshake, Eye, Lightbulb, UsersThree, Headset, Target, Flag, CheckCircle, Database, Rocket, Lock,
  CaretLeft, CaretRight, ArrowDown, ArrowClockwise, Gear, Wrench, Lightning, Drop, Engine,
} from '@phosphor-icons/react';

const cx = (...c) => c.filter(Boolean).join(' ');
const W = 'duotone';
const irA = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ======================= HOOKS ======================= */

// Entra en pantalla una sola vez
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

// Barra de progreso: escribe el transform directo en su elemento (no en variables heredadas)
function useScrollBar() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const upd = () => {
      raf = 0;
      const h = document.documentElement.scrollHeight - window.innerHeight;
      el.style.transform = `scaleX(${h > 0 ? Math.min(1, window.scrollY / h) : 0})`;
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(upd); };
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    upd();
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on); cancelAnimationFrame(raf); };
  }, []);
  return ref;
}

// Inclinación del escenario del hero con resorte (decorativa: solo con puntero fino)
function useStageTilt(max = 9) {
  const surfaceRef = useRef(null);
  const stageRef = useRef(null);
  useEffect(() => {
    const surface = surfaceRef.current, stage = stageRef.current;
    if (!surface || !stage || reduced() || !finePointer()) return;
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    const tick = () => {
      cx += (tx - cx) * 0.07; cy += (ty - cy) * 0.07;
      stage.style.transform = `rotateX(${-cy * max}deg) rotateY(${cx * max}deg)`;
      raf = Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001 ? requestAnimationFrame(tick) : 0;
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

// Tarjeta con inclinación 3D suave y foco de luz que sigue al cursor
function Tilt({ as: Tag = 'div', max = 6, className, children, ...props }) {
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
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      tx = (px - 0.5) * 2; ty = (py - 0.5) * 2;
      el.style.setProperty('--mx', `${px * 100}%`);
      el.style.setProperty('--my', `${py * 100}%`);
      kick();
    };
    const leave = () => { tx = 0; ty = 0; kick(); };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); cancelAnimationFrame(raf); };
  }, [max]);
  return <Tag ref={ref} className={cx('ax-tilt', className)} {...props}>{children}</Tag>;
}

// Número que sube hasta su valor al aparecer
function Counter({ to, duration = 1100 }) {
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

// Titular que entra palabra por palabra
function Words({ text, em = false, base = 0 }) {
  return text.split(' ').map((w, i) => (
    <span className="ax-line" key={`${w}-${i}`}>
      <span className={cx('ax-word', em && 'ax-em')} style={{ '--i': base + i }}>{w}</span>{' '}
    </span>
  ));
}

// Párrafo cuyas palabras se "encienden" al hacer scroll
function LitText({ parts }) {
  const ref = useRef(null);
  const words = parts.flatMap((p, pi) => p.t.split(' ').filter(Boolean).map((w, i) => ({ w, em: p.em, k: `${pi}-${i}` })));
  const label = parts.map((p) => p.t).join('');
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const spans = el.querySelectorAll('.ax-w');
    if (reduced()) { spans.forEach((s) => s.classList.add('on')); return; }
    let raf = 0;
    const upd = () => {
      raf = 0;
      const r = el.getBoundingClientRect(), vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.3)));
      const n = Math.round(p * spans.length);
      spans.forEach((s, i) => s.classList.toggle('on', i < n));
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(upd); };
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    upd();
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on); cancelAnimationFrame(raf); };
  }, []);
  return (
    <p ref={ref} className="ax-lit" aria-label={label}>
      {words.map((x) => <span key={x.k} className={cx('ax-w', x.em && 'em')} aria-hidden="true">{x.w} </span>)}
    </p>
  );
}

function SecHead({ eyebrow, title, children, className }) {
  return (
    <div className={cx('ax-sechead', className)}>
      <p className="ax-eyebrow">{eyebrow}</p>
      <h2 className="ax-h2">{title}</h2>
      {children && <p className="ax-lede">{children}</p>}
    </div>
  );
}

// Carrusel con scroll-snap: botones, teclado, arrastre con mouse y puntos
function Carousel({ label, children }) {
  const track = useRef(null);
  const drag = useRef(null);
  const items = Array.isArray(children) ? children : [children];
  const n = items.length;
  const [idx, setIdx] = useState(0);

  const step = () => {
    const el = track.current, c = el?.children[0];
    if (!c) return 0;
    return c.getBoundingClientRect().width + (parseFloat(getComputedStyle(el).columnGap) || 0);
  };
  const go = (d) => track.current?.scrollBy({ left: d * step(), behavior: reduced() ? 'auto' : 'smooth' });
  const onScroll = () => {
    const s = step();
    if (s) setIdx(Math.min(n - 1, Math.max(0, Math.round(track.current.scrollLeft / s))));
  };
  const down = (e) => { if (e.pointerType !== 'mouse') return; drag.current = { x: e.clientX, left: track.current.scrollLeft }; track.current.classList.add('is-drag'); };
  const move = (e) => { if (drag.current) track.current.scrollLeft = drag.current.left - (e.clientX - drag.current.x); };
  const up = () => { drag.current = null; track.current?.classList.remove('is-drag'); };
  const key = (e) => { if (e.key === 'ArrowRight') { e.preventDefault(); go(1); } if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); } };

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
      <div ref={track} className="ax-track" tabIndex={0} onScroll={onScroll} onKeyDown={key}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} onPointerCancel={up}>
        {items.map((it, i) => (
          <div key={i} className="ax-slide" role="group" aria-roledescription="diapositiva" aria-label={`${i + 1} de ${n}`}>{it}</div>
        ))}
      </div>
    </div>
  );
}

// Carrusel 3D tipo coverflow para los valores
function CoverFlow({ items }) {
  const n = items.length;
  const [a, setA] = useState(0);
  const [paused, setPaused] = useState(false);
  const off = (i) => { let d = i - a; if (d > n / 2) d -= n; if (d < -n / 2) d += n; return d; };
  const mover = (d) => setA((v) => (v + d + n) % n);

  useEffect(() => {
    if (paused || reduced()) return;
    const id = setInterval(() => { if (!document.hidden) setA((v) => (v + 1) % n); }, 4500);
    return () => clearInterval(id);
  }, [paused, n]);

  return (
    <div role="region" aria-roledescription="carrusel" aria-label="Valores de AutoRed" tabIndex={0}
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
      onKeyDown={(e) => { if (e.key === 'ArrowRight') mover(1); if (e.key === 'ArrowLeft') mover(-1); }}>
      <div className="ax-cf">
        {items.map((v, i) => {
          const o = off(i), ab = Math.abs(o);
          return (
            <div key={v.t} className={cx('ax-cf-card', o === 0 && 'is-a')}
              aria-hidden={o !== 0} onClick={() => setA(i)}
              style={{
                transform: `translate(-50%, -50%) translateX(${o * 56}%) translateZ(${-ab * 130}px) rotateY(${-o * 30}deg) scale(${1 - Math.min(ab, 3) * 0.06})`,
                opacity: ab > 2 ? 0 : 1 - ab * 0.2,
                zIndex: 10 - ab,
                pointerEvents: ab > 2 ? 'none' : 'auto',
              }}>
              <div className="ax-cf-face">
                <span className="ax-ico"><v.icon size={28} weight={W} aria-hidden="true" /></span>
                <h4 className="ax-card-t">{v.t}</h4>
                <p className="ax-card-p">{v.d}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="ax-cf-nav">
        <button type="button" className="ax-ctl" onClick={() => mover(-1)} aria-label="Valor anterior"><CaretLeft size={22} weight="bold" aria-hidden="true" /></button>
        <div className="ax-dots" aria-hidden="true">{items.map((_, i) => <i key={i} className={i === a ? 'on' : ''} />)}</div>
        <button type="button" className="ax-ctl" onClick={() => mover(1)} aria-label="Valor siguiente"><CaretRight size={22} weight="bold" aria-hidden="true" /></button>
      </div>
    </div>
  );
}

/* ======================= ILUSTRACIONES DE REFACCIONES (SVG propio, animado con CSS) ======================= */

// Contorno de engrane: dientes trapezoidales alrededor de un centro
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

// Engranes de línea fina para fondos de sección
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

function DiscArt() {
  return (
    <svg viewBox="0 0 200 200">
      <defs>
        <radialGradient id="gm-disc" cx="40%" cy="35%" r="75%"><stop offset="0" stopColor="#9a8486" /><stop offset=".6" stopColor="#4a3638" /><stop offset="1" stopColor="#2a1618" /></radialGradient>
        <linearGradient id="gm-cal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ff5a4f" /><stop offset="1" stopColor="#9b111e" /></linearGradient>
      </defs>
      <g className="ax-rot">
        <circle cx="100" cy="100" r="96" fill="url(#gm-disc)" stroke="#ffc2bc" strokeOpacity=".35" />
        <circle cx="100" cy="100" r="82" fill="none" stroke="#fff" strokeOpacity=".12" />
        {ring(14, 66).map(([x, y], i) => <circle key={i} cx={x} cy={y} r="5.5" fill="#120a0b" />)}
        <circle cx="100" cy="100" r="40" fill="#5b4244" stroke="#ffc2bc" strokeOpacity=".3" />
        {ring(5, 26).map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3.6" fill="#120a0b" />)}
        <circle cx="100" cy="100" r="11" fill="#120a0b" />
        <circle cx="100" cy="13" r="4" fill="#ff5a4f" />
      </g>
      <path d="M142 46 L176 68 Q182 100 176 132 L142 154 Q150 100 142 46Z" fill="url(#gm-cal)" />
      <path d="M150 64 L168 75" stroke="#fff" strokeOpacity=".55" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function GearArt() {
  return (
    <svg viewBox="0 0 200 200">
      <defs><linearGradient id="gm-gear" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ff8d85" /><stop offset="1" stopColor="#9b111e" /></linearGradient></defs>
      <g className="ax-rot">
        <path d={gearPath(12, 96, 76)} fill="url(#gm-gear)" stroke="#fff1f0" strokeOpacity=".4" />
        <circle cx="100" cy="100" r="56" fill="none" stroke="#fff1f0" strokeOpacity=".35" />
        {ring(6, 40).map(([x, y], i) => <line key={i} x1="100" y1="100" x2={x} y2={y} stroke="#fff1f0" strokeOpacity=".3" strokeWidth="3" />)}
        <circle cx="100" cy="100" r="22" fill="#120a0b" stroke="#ffc2bc" strokeOpacity=".5" />
      </g>
    </svg>
  );
}

function PistonArt() {
  return (
    <svg viewBox="0 0 120 215">
      <defs><linearGradient id="gm-pis" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stopColor="#6b5456" /><stop offset=".5" stopColor="#e3d2d3" /><stop offset="1" stopColor="#6b5456" /></linearGradient></defs>
      <g className="ax-pump">
        <rect x="16" y="12" width="88" height="96" rx="12" fill="url(#gm-pis)" stroke="#fff1f0" strokeOpacity=".35" />
        {[28, 40, 52].map((y) => <rect key={y} x="16" y={y} width="88" height="4" fill="#120a0b" opacity=".75" />)}
        <circle cx="60" cy="86" r="11" fill="#120a0b" stroke="#ff8d85" strokeWidth="2" />
        <path d="M52 96 L50 182 L70 182 L68 96Z" fill="#a89092" />
        <circle cx="60" cy="192" r="15" fill="#c81e2b" stroke="#fff1f0" strokeOpacity=".4" />
        <circle cx="60" cy="192" r="6" fill="#120a0b" />
      </g>
    </svg>
  );
}

function PlugArt() {
  return (
    <svg viewBox="0 0 80 215">
      <defs><linearGradient id="gm-cer" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stopColor="#c9b4b6" /><stop offset=".5" stopColor="#fff1f0" /><stop offset="1" stopColor="#c9b4b6" /></linearGradient></defs>
      <rect x="32" y="4" width="16" height="12" rx="3" fill="#c81e2b" />
      <rect x="24" y="14" width="32" height="76" rx="8" fill="url(#gm-cer)" stroke="#fff1f0" strokeOpacity=".35" />
      {[34, 48, 62].map((y) => <rect key={y} x="24" y={y} width="32" height="3" fill="#c81e2b" opacity=".55" />)}
      <rect x="16" y="90" width="48" height="26" rx="4" fill="#4a3638" stroke="#ffc2bc" strokeOpacity=".3" />
      <rect x="26" y="116" width="28" height="52" fill="#8d7b7d" />
      {[124, 132, 140, 148, 156].map((y) => <rect key={y} x="26" y={y} width="28" height="2" fill="#2a1618" opacity=".6" />)}
      <path d="M40 168 V182 H56 V174" stroke="#e3d2d3" strokeWidth="3" fill="none" strokeLinejoin="round" />
      <g className="ax-spark">
        <circle cx="52" cy="186" r="13" fill="#ff5a4f" opacity=".35" />
        <path d="M52 180 l-6 12 l8 -3 l-6 14" stroke="#fff1f0" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

function FilterArt() {
  return (
    <svg viewBox="0 0 120 175">
      <defs><linearGradient id="gm-can" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stopColor="#9b111e" /><stop offset=".45" stopColor="#ff5a4f" /><stop offset="1" stopColor="#7a0f1b" /></linearGradient></defs>
      <rect x="30" y="8" width="60" height="22" rx="5" fill="#4a3638" stroke="#ffc2bc" strokeOpacity=".3" />
      <path d="M18 38 q0 -8 12 -8 h60 q12 0 12 8 v108 q0 12 -12 12 h-60 q-12 0 -12 -12z" fill="url(#gm-can)" stroke="#fff1f0" strokeOpacity=".35" />
      <rect x="18" y="72" width="84" height="38" fill="#fff1f0" opacity=".93" />
      <rect x="30" y="84" width="34" height="6" rx="3" fill="#c81e2b" />
      <rect x="30" y="95" width="52" height="5" rx="2.5" fill="#4a3638" opacity=".5" />
      {[48, 56].map((y) => <rect key={y} x="18" y={y} width="84" height="2" fill="#120a0b" opacity=".35" />)}
      <circle className="ax-drop" cx="60" cy="166" r="4.5" fill="#ff8d85" />
    </svg>
  );
}

// Red: nodos en el centro de cada pieza; los paquetes viajan por las líneas (SMIL, sin JS)
const redNodos = [[50, 50], [15, 20], [84, 20], [14, 82], [86, 80]];
const redLineas = ['M15 20 Q30 24 50 50', 'M84 20 Q70 26 50 50', 'M14 82 Q30 76 50 50', 'M86 80 Q70 74 50 50', 'M15 20 Q50 6 84 20', 'M14 82 Q50 96 86 80'];
const redPaquetes = [
  { d: 'M15 20 Q30 24 50 50', dur: '3.2s', b: '0s' }, { d: 'M50 50 Q70 26 84 20', dur: '3.6s', b: '-1.2s' },
  { d: 'M50 50 Q30 76 14 82', dur: '3.4s', b: '-2s' }, { d: 'M86 80 Q70 74 50 50', dur: '3s', b: '-0.6s' },
];

/* ======================= DATOS ======================= */
const problemas = [
  { icon: MagnifyingGlass, t: 'Piezas difíciles de localizar', d: 'Encontrar una refacción rápido depende de la memoria de quien atiende y de cuántos lugares alcance a revisar.' },
  { icon: PhoneCall, t: 'Llamadas y visitas físicas', d: 'Cada consulta de existencias exige marcar, esperar o ir al mostrador. Tiempo perdido para el taller y para el cliente.' },
  { icon: Question, t: 'Información incompleta', d: 'Falta claridad sobre compatibilidad, fabricante, calidad y disponibilidad de cada refacción.' },
  { icon: Package, t: 'Mala administración del inventario', d: 'Con registros manuales, el inventario se desactualiza: se vende lo que no hay y se pierde lo que sí.' },
  { icon: ShieldWarning, t: 'Riesgos de seguridad', d: 'Sin mecanismos adecuados, la información de clientes e inventarios queda expuesta.' },
];

const categorias = ['Frenos', 'Suspensión', 'Motor', 'Sistema eléctrico', 'Filtros', 'Encendido', 'Transmisión', 'Enfriamiento', 'Dirección', 'Escape'];
const iconosCinta = [Gear, Wrench, Lightning, Drop, Engine];

const guion = [
  { de: 'yo', t: '¿Qué balatas le quedan a mi Versa 2018?' },
  { de: 'ia', k: 'producto' },
  { de: 'yo', t: '¿Y si no hay en mi zona?' },
  { de: 'ia', k: 'alternativas' },
  { de: 'ia', k: 'wa' },
];

const catalogo = [
  { sku: 'BR-20418', n: 'Balatas cerámicas', precio: 849, ub: 'Centro', stock: 'ok', txt: 'En stock' },
  { sku: 'BR-20990', n: 'Balatas semimetálicas', precio: 690, ub: 'Norte', stock: 'warn', txt: 'Poco stock' },
  { sku: 'FL-10231', n: 'Filtro de aceite', precio: 189, ub: 'Sur', stock: 'ok', txt: 'En stock' },
];

const opciones = [
  { id: 'A', precio: 849, vida: 40000, stock: 'ok', txt: 'Sí' },
  { id: 'B', precio: 690, vida: 28000, stock: 'warn', txt: 'Poco' },
  { id: 'C', precio: 1120, vida: 55000, stock: 'danger', txt: 'No' },
];

const sucursales = [
  { id: 'c', n: 'Sucursal Centro · disponible hoy', x: '25%', y: '62%' },
  { id: 'n', n: 'Sucursal Norte · disponible hoy', x: '58%', y: '44%' },
  { id: 's', n: 'Sucursal Sur · poco stock', x: '80%', y: '82%' },
];

const valores = [
  { icon: Handshake, t: 'Confianza', d: 'Datos verificables y una red de distribuidores en la que se puede confiar.' },
  { icon: ShieldCheck, t: 'Seguridad', d: 'Cuidamos la información de clientes e inventarios como si fuera nuestra.' },
  { icon: Eye, t: 'Transparencia', d: 'Precio, compatibilidad, fabricante y disponibilidad siempre a la vista.' },
  { icon: Lightbulb, t: 'Innovación', d: 'Inteligencia artificial y tiempo real al servicio de la refaccionaria de barrio.' },
  { icon: UsersThree, t: 'Colaboración', d: 'Distribuidores y refaccionarias trabajando juntos en una misma red.' },
  { icon: Headset, t: 'Servicio', d: 'Respuestas rápidas y contacto directo: el cliente va primero.' },
];

const objetivos = [
  { icon: Database, t: 'Inventarios al día', d: 'Mantener el registro y la actualización de inventarios en tiempo real.' },
  { icon: SlidersHorizontal, t: 'Búsqueda precisa', d: 'Permitir filtrar por marca, modelo, fabricante, precio y ubicación.' },
  { icon: Robot, t: 'Asistente inteligente', d: 'Recomendar piezas compatibles y alternativas cuando una refacción no esté disponible.' },
  { icon: Lock, t: 'Información protegida', d: 'Gestionar de forma segura los datos de clientes e inventarios en una plataforma centralizada.' },
  { icon: WhatsappLogo, t: 'Contacto y decisión', d: 'Facilitar el contacto directo y la comparación de productos para comprar mejor.' },
];

/* ======================= DEMOS INTERACTIVAS ======================= */

// Chatbot que "escribe" solo al entrar en pantalla
function ChatDemo() {
  const [ref, seen] = useInView(0.35);
  const [n, setN] = useState(0);
  const [typing, setTyping] = useState(false);
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (!seen) return;
    if (reduced()) { setN(guion.length); setTyping(false); return; }
    setN(0); setTyping(false);
    const ids = [];
    let t = 500;
    guion.forEach((m, i) => {
      if (m.de === 'ia') { ids.push(setTimeout(() => setTyping(true), t)); t += 950; }
      ids.push(setTimeout(() => { setTyping(false); setN(i + 1); }, t));
      t += 800;
    });
    return () => ids.forEach(clearTimeout);
  }, [seen, run]);

  const fin = n >= guion.length;
  const render = (m) => {
    if (m.de === 'yo') return m.t;
    if (m.k === 'producto') {
      return (
        <>
          Te recomiendo estas balatas delanteras:
          <div className="ax-prod">
            <div className="top"><span>Balatas cerámicas BR-20418</span><Badge tone="ok">En stock</Badge></div>
            <dl>
              <dt>Compatibilidad</dt><dd>Versa 2018 ✓</dd>
              <dt>Vida útil estimada</dt><dd>≈ 40,000 km</dd>
              <dt>Disponibilidad</dt><dd>3 sucursales</dd>
            </dl>
          </div>
        </>
      );
    }
    if (m.k === 'alternativas') return <>Te muestro alternativas compatibles: <b>BR-20990</b> y <b>BR-21107</b>.</>;
    return <span className="ax-row"><WhatsappLogo size={18} weight="fill" aria-hidden="true" />¿Te comunico con el distribuidor?</span>;
  };

  return (
    <div ref={ref}>
    <Tilt max={4} className="ax-phone">
      <div className="ax-chat-head">
        <span className="ax-dot"><Robot size={22} weight="fill" aria-hidden="true" /></span>
        <div><p style={{ fontWeight: 700 }}>AutoRed IA</p><p style={{ fontSize: '0.78rem', color: 'rgb(255 241 240 / 0.78)' }}>Chatbot con inteligencia artificial</p></div>
        <span className="live">En línea</span>
      </div>
      <div className="ax-chat-body" role="log" aria-live="polite" aria-label="Conversación de ejemplo">
        {guion.slice(0, n).map((m, i) => (
          <div key={i} className={cx('ax-msg', m.de === 'yo' ? 'ax-msg-user' : 'ax-msg-bot')}>{render(m)}</div>
        ))}
        {typing && <div className="ax-msg ax-msg-bot ax-typing" aria-hidden="true"><i /><i /><i /></div>}
      </div>
      <div className="ax-chat-foot">
        <span>Ejemplo ilustrativo · datos de muestra</span>
        {fin && <button type="button" className="ax-replay" onClick={() => setRun((v) => v + 1)}><ArrowClockwise size={16} weight="bold" aria-hidden="true" />Repetir</button>}
      </div>
    </Tilt>
    </div>
  );
}

function Catalogo() {
  const [ub, setUb] = useState('Todas');
  const [asc, setAsc] = useState(false);
  let lista = catalogo.filter((p) => ub === 'Todas' || p.ub === ub);
  if (asc) lista = [...lista].sort((a, b) => a.precio - b.precio);
  return (
    <>
      <div className="ax-chips" role="group" aria-label="Filtrar por ubicación">
        {['Todas', 'Centro', 'Norte', 'Sur'].map((u) => (
          <button key={u} type="button" className="ax-chipbtn" aria-pressed={ub === u} onClick={() => setUb(u)}>{u}</button>
        ))}
        <button type="button" className="ax-chipbtn" aria-pressed={asc} onClick={() => setAsc((v) => !v)}>Precio: menor a mayor</button>
      </div>
      <ul className="ax-plist" key={`${ub}-${asc}`} aria-live="polite">
        {lista.map((p, i) => (
          <li key={p.sku} style={{ '--i': i }}>
            <span className="n">{p.n}</span><span className="pr">${p.precio}</span>
            <span className="sku">SKU {p.sku}</span>
            <span className="meta"><Badge tone={p.stock}>{p.txt}</Badge>{p.ub}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

function Comparador() {
  const [sel, setSel] = useState(0);
  const costo = (o) => o.precio / (o.vida / 1000);
  const mejor = opciones.filter((o) => o.stock !== 'danger').reduce((a, b) => (costo(a) <= costo(b) ? a : b));
  const o = opciones[sel];
  return (
    <div className="ax-cmp" role="radiogroup" aria-label="Opciones de la misma refacción">
      <div className="ax-cmp-head" aria-hidden="true"><span>Op.</span><span>Precio</span><span>Vida útil</span><span>Stock</span></div>
      {opciones.map((x, i) => (
        <button key={x.id} type="button" role="radio" aria-checked={sel === i} className={cx('ax-cmp-row', sel === i && 'is-sel')} onClick={() => setSel(i)}>
          <b>{x.id}</b>
          <span className="ax-num">${x.precio.toLocaleString('es-MX')}</span>
          <span className="ax-bar" aria-label={`${x.vida.toLocaleString('es-MX')} km`}><i style={{ '--v': x.vida / 55000 }} /></span>
          <Badge tone={x.stock}>{x.txt}</Badge>
        </button>
      ))}
      <p className="ax-cmp-note" aria-live="polite">
        Opción {o.id}: ${costo(o).toFixed(2)} por cada 1,000 km{o.id === mejor.id ? ' · mejor costo entre las disponibles' : ''}.
      </p>
    </div>
  );
}

function Mapa() {
  const [on, setOn] = useState('n');
  return (
    <div className="ax-map">
      {sucursales.map((s) => (
        <button key={s.id} type="button" className={cx('ax-pin', on === s.id && 'on')} style={{ left: s.x, top: s.y }}
          aria-label={s.n} aria-pressed={on === s.id} onClick={() => setOn(s.id)} onMouseEnter={() => setOn(s.id)} onFocus={() => setOn(s.id)}>
          <MapPin size={34} weight="fill" aria-hidden="true" />
          <span className="ax-tip" aria-hidden="true">{s.n}</span>
        </button>
      ))}
    </div>
  );
}

/* ======================= LÍNEA DE TIEMPO ======================= */
function Objetivos() {
  const box = useRef(null);
  const fill = useRef(null);
  useEffect(() => {
    const el = box.current, f = fill.current;
    if (!el || !f) return;
    const items = [...el.querySelectorAll('.ax-tl-item')];
    if (reduced()) { items.forEach((i) => i.classList.add('is-on')); f.style.transform = 'scaleY(1)'; return; }
    let raf = 0;
    const upd = () => {
      raf = 0;
      const line = window.innerHeight * 0.62;
      const r = el.getBoundingClientRect();
      f.style.transform = `scaleY(${Math.min(1, Math.max(0, (line - r.top) / r.height))})`;
      items.forEach((i) => i.classList.toggle('is-on', i.getBoundingClientRect().top + 24 < line));
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(upd); };
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    upd();
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on); cancelAnimationFrame(raf); };
  }, []);
  return (
    <ol ref={box} className="ax-tl">
      <span className="ax-tl-line" aria-hidden="true" />
      <span ref={fill} className="ax-tl-fill" aria-hidden="true" />
      {objetivos.map((o) => (
        <li key={o.t} className="ax-tl-item">
          <span className="ax-tl-dot"><o.icon size={22} weight={W} aria-hidden="true" /></span>
          <h4>{o.t}</h4>
          <p>{o.d}</p>
        </li>
      ))}
    </ol>
  );
}

/* ======================= PÁGINA ======================= */
export default function App() {
  const barRef = useScrollBar();
  const { surfaceRef, stageRef } = useStageTilt(9);

  return (
    <div className="ax">
      <div className="ax-progress" aria-hidden="true"><span ref={barRef} /></div>
      <Nav />

      <main>
        {/* ===== HERO 3D ===== */}
        <section ref={surfaceRef} className="ax-hero ax-dark" aria-labelledby="hero-titulo">
          <GearBg gears={[{ n: 14, s: '38rem', l: '-12rem', t: '-8rem', dur: '120s' }, { n: 10, s: '26rem', l: '62%', t: '58%', rev: true, dur: '90s' }]} />
          <div className="ax-wrap ax-hero-grid">
            <div>
              <Reveal><Badge tone="brand">Red de refaccionarias y distribuidoras</Badge></Reveal>
              <h1 id="hero-titulo" className="ax-h1" style={{ marginTop: '1.25rem' }}>
                <Words text="Toda la red de refacciones," />
                <Words text="en un solo lugar." em base={5} />
              </h1>
              <Reveal delay={200}>
                <p className="ax-lede">
                  AutoRed es una plataforma web inteligente que conecta refaccionarias y distribuidoras en una red segura, para consultar piezas y gestionar el inventario sin llamadas ni visitas.
                </p>
                <div className="ax-hero-cta">
                  <Button size="lg" effect="ring" arrow onClick={() => irA('funciones')}>Explorar la plataforma</Button>
                  <Button size="lg" variant="secondary" effect="fill" onClick={() => irA('solucion')}>Ver el chatbot</Button>
                </div>
                <ul className="ax-checks">
                  {['Inventario en tiempo real', 'Búsqueda por filtros', 'Chatbot con IA', 'Red segura'].map((x) => (
                    <li key={x}><CheckCircle size={18} weight="fill" aria-hidden="true" />{x}</li>
                  ))}
                </ul>
              </Reveal>
            </div>

            <div className="ax-scene" aria-hidden="true">
              <div ref={stageRef} className="ax-stage">
                <div className="ax-glow" />
                <div className="ax-floor"><div className="ax-floor-grid" /></div>
                <svg className="ax-net" viewBox="0 0 100 100">
                  {redLineas.map((d) => <path key={d} className="ln" d={d} />)}
                  {redNodos.map(([x, y]) => <circle key={`${x}-${y}`} className="nd" cx={x} cy={y} r="1.1" />)}
                  {redPaquetes.map((p) => (
                    <circle key={p.d} className="pkt" r="1">
                      <animateMotion dur={p.dur} begin={p.b} repeatCount="indefinite" path={p.d} />
                    </circle>
                  ))}
                </svg>

                <div className="ax-part" style={{ '--x': 50, '--y': 50, '--w': 46, '--z': '40px' }}><div className="ax-part-in" style={{ '--d': '-1s' }}><DiscArt /></div></div>
                <div className="ax-part" style={{ '--x': 15, '--y': 20, '--w': 25, '--z': '110px' }}><div className="ax-part-in" style={{ '--d': '0s' }}><GearArt /></div></div>
                <div className="ax-part" style={{ '--x': 84, '--y': 21, '--w': 15, '--z': '140px' }}><div className="ax-part-in" style={{ '--d': '-2.4s' }}><PistonArt /></div></div>
                <div className="ax-part" style={{ '--x': 14, '--y': 80, '--w': 11, '--z': '90px' }}><div className="ax-part-in" style={{ '--d': '-3.6s' }}><PlugArt /></div></div>
                <div className="ax-part" style={{ '--x': 86, '--y': 79, '--w': 19, '--z': '120px' }}><div className="ax-part-in" style={{ '--d': '-1.8s' }}><FilterArt /></div></div>

                <div className="ax-fc ax-fc-1"><div className="ax-fc-in ax-glass" style={{ '--d': '0s' }}>
                  <div className="ax-row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div><p className="t">Balatas delanteras</p><p className="s">SKU BR-20418</p></div>
                    <Badge tone="ok">En stock</Badge>
                  </div>
                  <p className="s" style={{ marginTop: '0.4rem', color: '#86efac' }}>Compatible con tu Versa 2018</p>
                  <p className="ax-price">$849.00</p>
                </div></div>

                <div className="ax-fc ax-fc-2"><div className="ax-fc-in ax-glass ax-row" style={{ '--d': '-2.2s' }}>
                  <span className="ax-dot"><MapPin size={20} weight="fill" /></span>
                  <div><p className="t">3 sucursales cerca</p><p className="s">Disponible hoy</p></div>
                </div></div>
              </div>
            </div>
          </div>
          <div className="ax-cue" aria-hidden="true"><span>Desliza</span><ArrowDown size={18} weight="bold" /></div>
        </section>

        {/* ===== CINTA DE CATEGORÍAS ===== */}
        <div className="ax-marquee" aria-label="Categorías de refacciones">
          <div className="ax-marquee-track">
            {[0, 1].map((dup) => categorias.map((c, i) => {
              const I = iconosCinta[i % iconosCinta.length];
              return <span key={`${dup}-${c}`} aria-hidden={dup === 1 ? 'true' : undefined}><I size={22} weight={W} aria-hidden="true" />{c}</span>;
            }))}
          </div>
        </div>

        {/* ===== PRESENTACIÓN ===== */}
        <section className="ax-sec ax-light" aria-label="Presentación">
          <div className="ax-wrap">
            <p className="ax-eyebrow">Presentación</p>
            <LitText parts={[
              { t: 'Muchas refaccionarias aún llevan sus inventarios y ventas ' },
              { t: 'de forma manual', em: true },
              { t: '. Eso complica la búsqueda de piezas y limita la comunicación entre distribuidores y clientes.' },
            ]} />
            <Reveal><p className="ax-lede">
              Para resolverlo surge <strong>AutoRed</strong>: una plataforma web inteligente que conecta refaccionarias y distribuidoras en una red segura, facilita la consulta de refacciones y mejora la gestión del inventario.
            </p></Reveal>
            <div className="ax-stats">
              {[[5, 'filtros de búsqueda'], [7, 'funcionalidades en una sola plataforma'], [1, 'red segura y centralizada']].map(([v, l], i) => (
                <Reveal key={l} delay={i * 70}><div className="ax-stat"><span className="ax-num"><Counter to={v} /></span><p>{l}</p></div></Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ===== PROBLEMÁTICA (carrusel) ===== */}
        <section id="problema" className="ax-sec ax-light2">
          <div className="ax-wrap">
            <Reveal><SecHead eyebrow="Problemática" title={<>Cada refaccionaria trabajando <em className="ax-em">por su lado.</em></>}>
              Las pequeñas y medianas refaccionarias operan de forma independiente. Esa falta de conexión provoca problemas que se repiten todos los días en el mostrador.
            </SecHead></Reveal>
            <Carousel label="Problemas de las refaccionarias">
              {problemas.map((p) => (
                <Tilt key={p.t} className="ax-pcard">
                  <p.icon className="mark" size={150} weight="duotone" aria-hidden="true" />
                  <span className="ax-ico"><p.icon size={28} weight={W} aria-hidden="true" /></span>
                  <h3 className="ax-card-t">{p.t}</h3>
                  <p className="ax-card-p">{p.d}</p>
                </Tilt>
              ))}
            </Carousel>
          </div>
        </section>

        {/* ===== SOLUCIÓN ===== */}
        <section id="solucion" className="ax-sec ax-dark2">
          <GearBg gears={[{ n: 16, s: '34rem', l: '-10rem', t: '-6rem', dur: '140s' }, { n: 12, s: '24rem', l: '72%', t: '50%', rev: true, dur: '100s' }]} />
          <div className="ax-wrap">
            <Reveal><SecHead eyebrow="Solución" title={<>Una red que <em className="ax-em">centraliza</em> la información.</>}>
              AutoRed reúne a refaccionarias y distribuidoras en una sola plataforma para encontrar autopartes de forma rápida y confiable.
            </SecHead></Reveal>
            <div className="ax-sol-grid">
              <div className="ax-stack">
                <Reveal><Tilt max={4} className="ax-fcard">
                  <span className="ax-ico"><ArrowsClockwise size={28} weight={W} aria-hidden="true" /></span>
                  <div><h3 className="ax-card-t">Inventarios en tiempo real</h3><p className="ax-card-p" style={{ marginTop: '0.4rem' }}>Registro y actualización de existencias al momento, para que lo que ves sea lo que hay.</p></div>
                </Tilt></Reveal>
                <Reveal delay={70}><Tilt max={4} className="ax-fcard">
                  <span className="ax-ico"><SlidersHorizontal size={28} weight={W} aria-hidden="true" /></span>
                  <div><h3 className="ax-card-t">Búsqueda con filtros</h3><p className="ax-card-p" style={{ marginTop: '0.4rem' }}>Encuentra la pieza justa combinando criterios.</p>
                    <div className="ax-pills">{['Marca', 'Modelo', 'Fabricante', 'Precio', 'Ubicación'].map((f) => <span key={f} className="ax-pill">{f}</span>)}</div></div>
                </Tilt></Reveal>
                <Reveal delay={140}><Tilt max={4} className="ax-fcard">
                  <span className="ax-ico"><ShieldCheck size={28} weight={W} aria-hidden="true" /></span>
                  <div><h3 className="ax-card-t">Gestión segura</h3><p className="ax-card-p" style={{ marginTop: '0.4rem' }}>Información de clientes e inventarios protegida en una plataforma centralizada.</p></div>
                </Tilt></Reveal>
              </div>
              <Reveal delay={100}><ChatDemo /></Reveal>
            </div>
          </div>
        </section>

        {/* ===== FUNCIONALIDADES (bento interactivo) ===== */}
        <section id="funciones" className="ax-sec ax-light">
          <div className="ax-wrap">
            <Reveal><SecHead eyebrow="Funcionalidades" title={<>Todo lo que necesita una refaccionaria <em className="ax-em">y su cliente.</em></>}>
              Una plataforma que integra gestión y consulta para mejorar la experiencia de ambos lados del mostrador. Prueba las demos: son interactivas.
            </SecHead></Reveal>

            <div className="ax-bento">
              <Reveal className="ax-b7"><Tilt max={3} className="ax-bcard">
                <div className="ax-bcard-top"><span className="ax-ico"><Storefront size={28} weight={W} aria-hidden="true" /></span><Badge tone="brand">Marca · Compatibilidad · Precio</Badge></div>
                <h3 className="ax-card-t">Catálogo de refacciones</h3>
                <p className="ax-card-p">Busca productos disponibles y consulta marca, fabricante, compatibilidad, precio y disponibilidad.</p>
                <Catalogo />
                <p className="ax-note">Ejemplo ilustrativo · datos de muestra</p>
              </Tilt></Reveal>

              <Reveal className="ax-b5" delay={70}><Tilt max={3} className="ax-bcard">
                <div className="ax-bcard-top"><span className="ax-ico"><Scales size={28} weight={W} aria-hidden="true" /></span></div>
                <h3 className="ax-card-t">Comparación de productos</h3>
                <p className="ax-card-p">Evalúa opciones de una misma refacción: marca, fabricante, precio, compatibilidad, disponibilidad y vida útil estimada.</p>
                <Comparador />
              </Tilt></Reveal>

              <Reveal className="ax-b4"><Tilt max={4} className="ax-bcard">
                <span className="ax-ico"><MapPin size={28} weight={W} aria-hidden="true" /></span>
                <h3 className="ax-card-t">Consulta de sucursales</h3>
                <p className="ax-card-p">Mira las refaccionarias registradas y su ubicación para localizar la pieza más cerca.</p>
                <Mapa />
              </Tilt></Reveal>

              <Reveal className="ax-b4" delay={70}><Tilt max={4} className="ax-bcard">
                <span className="ax-ico"><WhatsappLogo size={28} weight={W} aria-hidden="true" /></span>
                <h3 className="ax-card-t">Contacto por WhatsApp</h3>
                <p className="ax-card-p">Escribe al distribuidor al instante para pedir información o concretar la compra de una pieza.</p>
                <div className="ax-bub" aria-hidden="true">Hola, ¿tienen las balatas BR-20418?</div>
                <div className="ax-wa" aria-hidden="true"><WhatsappLogo size={20} weight="fill" />Escribir ahora</div>
              </Tilt></Reveal>

              <Reveal className="ax-b4" delay={140}><Tilt max={4} className="ax-bcard">
                <span className="ax-ico"><ClipboardText size={28} weight={W} aria-hidden="true" /></span>
                <h3 className="ax-card-t">Registro de refaccionarias</h3>
                <p className="ax-card-p">Un formulario sencillo para que cada negocio forme parte de la plataforma.</p>
                <div className="ax-form" aria-hidden="true">
                  {['Nombre del negocio', 'Ciudad y sucursal', 'WhatsApp de contacto'].map((f) => (
                    <div key={f} className="ax-field">{f}<b><CheckCircle size={18} weight="fill" /></b></div>
                  ))}
                </div>
              </Tilt></Reveal>

              <Reveal className="ax-b6"><Tilt max={3} className="ax-bcard">
                <span className="ax-ico"><ListMagnifyingGlass size={28} weight={W} aria-hidden="true" /></span>
                <h3 className="ax-card-t">Alta y gestión de productos</h3>
                <p className="ax-card-p">Registra nuevas refacciones, actualiza su información y mantén tu inventario disponible para consulta.</p>
                <ul className="ax-inv" aria-hidden="true">
                  <li><i className="ax-st" />Balatas cerámicas<span>12</span></li>
                  <li><i className="ax-st warn" />Filtro de aceite<span>4</span></li>
                  <li><i className="ax-st off" />Bujías<span>0</span></li>
                </ul>
              </Tilt></Reveal>

              <Reveal className="ax-b6" delay={70}><Tilt max={3} className="ax-bcard">
                <span className="ax-ico"><Robot size={28} weight={W} aria-hidden="true" /></span>
                <h3 className="ax-card-t">Chatbot con inteligencia artificial</h3>
                <p className="ax-card-p">Responde dudas, recomienda piezas compatibles y te guía a cada apartado de la plataforma.</p>
                <div className="ax-ai-line" aria-hidden="true"><span className="ax-typing"><i /><i /><i /></span>Buscando piezas compatibles…</div>
              </Tilt></Reveal>
            </div>
          </div>
        </section>

        {/* ===== IDENTIDAD: MISIÓN, VISIÓN, VALORES ===== */}
        <section id="identidad" className="ax-sec ax-ident ax-dark">
          <GearBg gears={[{ n: 18, s: '40rem', l: '60%', t: '-12rem', dur: '160s' }, { n: 12, s: '22rem', l: '-6rem', t: '55%', rev: true, dur: '110s' }]} />
          <div className="ax-wrap">
            <Reveal><SecHead eyebrow="Nuestra identidad" title={<>Misión, visión y valores de <em className="ax-em">AutoRed.</em></>} /></Reveal>
            <div className="ax-mv">
              <Reveal><Tilt max={4} className="ax-mvcard">
                <Target className="mark" size={220} weight="duotone" aria-hidden="true" />
                <span className="ax-ico"><Target size={30} weight={W} aria-hidden="true" /></span>
                <h3>Misión</h3>
                <p>Conectar refaccionarias y distribuidoras en una red digital segura que simplifique la búsqueda de autopartes, la gestión del inventario y la comunicación con los clientes, para que la pieza correcta llegue al auto correcto sin pérdida de tiempo.</p>
              </Tilt></Reveal>
              <Reveal delay={80}><Tilt max={4} className="ax-mvcard">
                <Rocket className="mark" size={220} weight="duotone" aria-hidden="true" />
                <span className="ax-ico"><Rocket size={30} weight={W} aria-hidden="true" /></span>
                <h3>Visión</h3>
                <p>Ser la red de refacciones automotrices de referencia en México, donde cualquier refaccionaria, pequeña o grande, digitalice su operación y cualquier conductor encuentre la pieza exacta con confianza.</p>
              </Tilt></Reveal>
            </div>

            <div className="ax-sub">
              <Reveal><p className="ax-eyebrow">Valores</p><h3>Lo que <em className="ax-em">nos guía</em></h3></Reveal>
              <CoverFlow items={valores} />
            </div>
          </div>
        </section>

        {/* ===== OBJETIVOS (línea de tiempo) ===== */}
        <section className="ax-sec ax-light" aria-label="Objetivos">
          <div className="ax-wrap">
            <div className="ax-tl-grid">
              <div className="ax-tl-aside">
                <Reveal>
                  <SecHead eyebrow="Objetivos" title={<>Hacia <em className="ax-em">dónde vamos.</em></>} />
                  <div className="ax-goal">
                    <strong><Flag size={24} weight={W} aria-hidden="true" />Objetivo general</strong>
                    Centralizar la información de refaccionarias y distribuidoras en una plataforma web que facilite la búsqueda, consulta y compra de autopartes.
                  </div>
                </Reveal>
              </div>
              <Objetivos />
            </div>
          </div>
        </section>

        {/* ===== CIERRE ===== */}
        <section className="ax-sec ax-cta">
          <GearBg gears={[{ n: 20, s: '46rem', l: '-14rem', t: '-12rem', dur: '150s' }, { n: 14, s: '34rem', l: '70%', t: '20%', rev: true, dur: '110s' }, { n: 10, s: '18rem', l: '44%', t: '62%', dur: '70s' }]} />
          <div className="ax-wrap">
            <Reveal>
              <h2 className="ax-h2">Lleva tu refaccionaria a <em className="ax-em">la red.</em></h2>
              <p className="ax-lede">Registra tu negocio, publica tu inventario y deja que los clientes te encuentren.</p>
              <div className="ax-cta-btns">
                <Button size="lg" variant="secondary" effect="fill" arrow>Registrar mi refaccionaria</Button>
                <Button size="lg" variant="ghost" className="ax-ghost">Ver el catálogo</Button>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}