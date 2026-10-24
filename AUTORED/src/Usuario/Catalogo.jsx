// Catálogo de refacciones — AutoRed. Ubicación: src/Catalogo/Catalogo.jsx
// Mismos estilos ax- (index.css) que Index, Registro y Login; lo propio lleva prefijo axc- en ./Catalogo.css.
//
// Datos en ./datos.js e ilustraciones en ./piezas.jsx (los comparte con DetalleProducto.jsx).
// Los filtros viven en la URL (?q=balatas&cat=frenos&min=200&max=900&km=15), así que se pueden
// compartir, y el botón "atrás" del navegador funciona.
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { Badge, Reveal } from '../autored-ui';
import Nav from '../Components/NavUsuario';
import Footer from '../Components/Footer';
import '../index.css';
import './Catalogo.css';
import {
  CATEGORIAS, CAT, SUCURSALES, PRODUCTOS, MARCAS, REFERENCIA, PMIN, PMAX, PSTEP, KMAX, NB, ORDENES,
  reduced, finePointer, norm, toks, dinero, clamp, num, csv, kmTxt, useUbicacion,
} from './datos';
import { Defs, Pieza, useSceneTilt } from './piezas';
import {
  MagnifyingGlass, X, Funnel, MapPin, NavigationArrow, WhatsappLogo, Scales, CircleNotch,
  ArrowCounterClockwise, Package, Robot,
} from '@phosphor-icons/react';

const cx = (...c) => c.filter(Boolean).join(' ');
const W = 'duotone';

const EJEMPLOS = ['Balatas', 'Filtro de aceite', 'Bujías', 'Versa 2018'];

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

function Tarjeta({ p, q, info, sinFiltroSuc, comp, onComp, i, desde }) {
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
          <h3 className="axc-name"><Link to={`/producto/${p.id}`} state={{ desde }}><Resaltar texto={p.nombre} q={q} /></Link></h3>
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
  const { search } = useLocation();
  const { f, set, limpiar } = useFiltros();
  const { surfaceRef, stageRef } = useSceneTilt(8);
  const uid = useId().replace(/:/g, '');
  const buscarRef = useRef(null);
  const sheet = useRef(null);
  const trayRef = useRef(null);
  const [qLocal, setQLocal] = useState(f.q);
  const { ubic, dist, pedirUbic } = useUbicacion(); // misma ubicación que el detalle de producto
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
                    <Tarjeta key={p.id} p={p} q={f.q} info={info} sinFiltroSuc={!sucActivo(f)} comp={comp.includes(p.id)} onComp={onComp} i={i} desde={search} />
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

      <Footer />
    </div>
  );
}
