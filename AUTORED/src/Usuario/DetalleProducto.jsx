// Detalle de producto — AutoRed. Ubicación: src/Catalogo/DetalleProducto.jsx
// Comparte datos (./datos.js) e ilustraciones (./piezas.jsx) con el catálogo.
//
// Las tarjetas del catálogo ya enlazan aquí (/producto/br-20418) y le pasan los filtros en
// location.state.desde, así "Volver a los resultados" regresa al catálogo tal como estaba.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { Badge, Reveal } from '../autored-ui';
import Nav from '../Components/NavUsuario';
import Footer from '../Components/Footer';
import '../index.css';
import './Catalogo.css'; // las animaciones de las piezas (axc-spin, axc-pump…) viven aquí
import './DetalleProducto.css';
import { CAT, PRODUCTOS, SUCURSALES, dinero, kmTxt, reduced, useUbicacion } from './datos';
import { Defs, Pieza, useSceneTilt } from './piezas';
import {
  CaretRight, CaretLeft, ArrowLeft, ShareNetwork, CheckCircle, XCircle, WhatsappLogo, Scales, MapPin,
  NavigationArrow, CircleNotch, Pause, Play, Package, Robot,
} from '@phosphor-icons/react';

const cx = (...c) => c.filter(Boolean).join(' ');
const W = 'duotone';
const AUTOS = [...new Set(PRODUCTOS.flatMap((x) => x.compat))].sort((a, b) => a.localeCompare(b, 'es'));

// Marco común: Nav + contenido + Footer (también para el estado "no encontrado")
function Marco({ rol, usuario, onSalir, children }) {
  return (
    <div className="ax">
      <Defs />
      <Nav rol={rol} usuario={usuario} onSalir={onSalir} />
      {children}
      <Footer />
    </div>
  );
}

function NoEncontrado({ id }) {
  useEffect(() => { document.title = 'Producto no encontrado · AutoRed'; }, []);
  return (
    <main className="ax-light axd-top">
      <div className="ax-wrap">
        <div className="axd-nf">
          <span className="ico"><Package size={48} weight={W} aria-hidden="true" /></span>
          <h1>No encontramos este producto</h1>
          <p>Puede que ya no esté disponible o que el enlace esté incompleto{id ? <> (<code>{id}</code>)</> : null}.</p>
          <div className="axd-nf-btns">
            <Link to="/catalogo" className="axd-btn axd-btn-main">Ir al catálogo</Link>
            <Link to="/asistente" className="axd-btn axd-btn-ghost"><Robot size={18} weight={W} aria-hidden="true" />Preguntar al asistente IA</Link>
          </div>
        </div>
      </div>
    </main>
  );
}

function MiniTarjeta({ p, desde }) {
  return (
    <Link to={`/producto/${p.id}`} state={{ desde }} className="axd-mini">
      <span className="pic"><Pieza cat={p.cat} /></span>
      <span className="nm">{p.nombre}</span>
      <span className="pr ax-num">{dinero(p.precio)}</span>
    </Link>
  );
}

function Detalle({ p }) {
  const loc = useLocation();
  const desde = loc.state?.desde || '';
  const { ubic, dist, pedirUbic } = useUbicacion();
  const { surfaceRef, stageRef } = useSceneTilt(9);
  const ctaRef = useRef(null);
  const barraRef = useRef(null);
  const pista = useRef(null);
  const [vivo, setVivo] = useState(() => !reduced());
  const [auto, setAuto] = useState('');
  const [compartido, setCompartido] = useState('idle'); // idle | ok | err
  const [barra, setBarra] = useState(false);

  useEffect(() => {
    const t = document.title;
    document.title = `${p.nombre} · AutoRed`;
    return () => { document.title = t; };
  }, [p.nombre]);

  // Existencias por sucursal, ordenadas por distancia
  const filas = useMemo(() => SUCURSALES.map((b) => ({ b, km: dist[b.id], qty: p.st[b.id] || 0 })).sort((a, b) => a.km - b.km), [dist, p]);
  const cercana = filas.find((x) => x.qty > 0);
  const total = filas.reduce((a, x) => a + x.qty, 0);
  const maxQty = Math.max(1, ...filas.map((x) => x.qty));
  const tone = !cercana ? 'danger' : total <= 3 ? 'warn' : 'ok';
  const txt = !cercana ? 'Sin existencias' : total <= 3 ? 'Poco stock' : 'En stock';

  const wa = (b) => `https://wa.me/${b.tel}?text=${encodeURIComponent(`Hola, ¿tienen ${p.nombre} (SKU ${p.sku}) disponible${auto ? ` para mi ${auto}` : ''}?`)}`;

  const relacionados = useMemo(() => {
    const misma = PRODUCTOS.filter((x) => x.cat === p.cat && x.id !== p.id);
    const otras = PRODUCTOS.filter((x) => x.cat !== p.cat && x.compat.some((c) => p.compat.includes(c)));
    return { lista: [...misma, ...otras].slice(0, 6), similares: misma.slice(0, 2) };
  }, [p]);

  // Barra fija en móvil: aparece cuando el botón principal ya salió de pantalla hacia arriba
  useEffect(() => {
    const el = ctaRef.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => setBarra(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const mostrarBarra = barra && !!cercana;
  useEffect(() => {
    const el = barraRef.current;
    if (!el) return;
    if (mostrarBarra) el.removeAttribute('inert'); else el.setAttribute('inert', '');
  }, [mostrarBarra]);

  const compartir = async () => {
    const datos = { title: p.nombre, text: `${p.nombre} en AutoRed`, url: window.location.href };
    try {
      if (navigator.share) { await navigator.share(datos); return; }
      await navigator.clipboard.writeText(datos.url);
      setCompartido('ok');
    } catch (e) {
      if (e?.name === 'AbortError') return; // el usuario cerró el panel de compartir
      setCompartido('err');
    }
    setTimeout(() => setCompartido('idle'), 2500);
  };

  const mover = (d) => pista.current?.scrollBy({ left: d * (pista.current.firstElementChild?.getBoundingClientRect().width + 16 || 240), behavior: reduced() ? 'auto' : 'smooth' });
  const compatible = auto ? p.compat.includes(auto) : null;
  const Cat = CAT[p.cat];

  return (
    <main>
      <section className="ax-light axd-top">
        <div className="ax-wrap">
          <nav className="axd-crumbs" aria-label="Ruta">
            <ol>
              <li><Link to="/catalogo">Catálogo</Link></li>
              <li><CaretRight size={14} weight="bold" aria-hidden="true" /><Link to={`/catalogo?cat=${p.cat}`}>{Cat.t}</Link></li>
              <li><CaretRight size={14} weight="bold" aria-hidden="true" /><span aria-current="page">{p.nombre}</span></li>
            </ol>
          </nav>

          <div className="axd-grid">
            {/* ---- Visor 3D ---- */}
            <figure className="axd-viewcol">
              <div ref={surfaceRef} className="axd-viewer">
                <div ref={stageRef} className={cx('axd-stage', vivo && 'axc-on')} aria-hidden="true">
                  <div className="axd-glow" />
                  <div className="axd-floor"><div className="axd-floor-grid" /></div>
                  <div className="axd-piece"><div className="axd-float"><Pieza cat={p.cat} /></div></div>
                  <div className="axd-chip axd-chip-a"><div className="axd-float axd-glass" style={{ '--d': '-1s' }}><Cat.icon size={16} weight="fill" />{Cat.t}</div></div>
                  <div className="axd-chip axd-chip-b"><div className="axd-float axd-glass" style={{ '--d': '-3s' }}><MapPin size={16} weight="fill" />{cercana ? `${cercana.b.n.replace('AutoRed ', '')} · ${kmTxt(cercana.km)} km` : 'Sin existencias'}</div></div>
                </div>
                <button type="button" className="axd-pause" aria-pressed={!vivo} onClick={() => setVivo((v) => !v)}>
                  {vivo ? <Pause size={16} weight="fill" aria-hidden="true" /> : <Play size={16} weight="fill" aria-hidden="true" />}
                  {vivo ? 'Pausar animación' : 'Reanudar animación'}
                </button>
              </div>
              <figcaption className="axc-sr">Ilustración de {p.nombre}. Imagen de referencia.</figcaption>
            </figure>

            {/* ---- Información y compra ---- */}
            <div className="axd-info">
              <Link to={`/catalogo${desde}`} className="axd-back"><ArrowLeft size={18} weight="bold" aria-hidden="true" />Volver a los resultados</Link>
              <p className="axd-catchip"><Cat.icon size={16} weight="fill" aria-hidden="true" />{Cat.t}</p>
              <h1 className="axd-h1">{p.nombre}</h1>
              <p className="axd-meta">SKU {p.sku} · {p.marca} · {p.fab}</p>

              <div className="axd-priceRow">
                <p className="axd-price ax-num">{dinero(p.precio)}</p>
                <Badge tone={tone}>{txt}</Badge>
              </div>
              <p className={cx('axd-near', !cercana && 'is-none')}>
                <MapPin size={18} weight="fill" aria-hidden="true" />
                {cercana ? <>Más cerca: <b>{cercana.b.n}</b> · {kmTxt(cercana.km)} km · {cercana.qty} {cercana.qty === 1 ? 'pieza' : 'piezas'}</> : 'Ninguna sucursal tiene existencias por ahora.'}
              </p>

              <div ref={ctaRef} className="axd-cta">
                {cercana ? (
                  <a className="axd-btn axd-btn-wa" href={wa(cercana.b)} target="_blank" rel="noopener noreferrer">
                    <WhatsappLogo size={22} weight="fill" aria-hidden="true" />Pedir por WhatsApp<span className="axc-sr"> (se abre en una pestaña nueva)</span>
                  </a>
                ) : (
                  <span className="axd-btn axd-btn-off" aria-disabled="true">Sin existencias</span>
                )}
                <button type="button" className="axd-btn axd-btn-ghost" onClick={compartir}>
                  <ShareNetwork size={20} weight={W} aria-hidden="true" />
                  {compartido === 'ok' ? 'Enlace copiado' : compartido === 'err' ? 'No se pudo copiar' : 'Compartir'}
                </button>
              </div>
              <p className="axc-sr" role="status">{compartido === 'ok' ? 'Enlace copiado al portapapeles.' : compartido === 'err' ? 'No se pudo copiar el enlace.' : ''}</p>
              {relacionados.similares.length > 0 && (
                <Link to={`/comparar?ids=${[p.id, ...relacionados.similares.map((x) => x.id)].join(',')}`} className="axd-comparar">
                  <Scales size={18} weight={W} aria-hidden="true" />Comparar con {relacionados.similares.length === 1 ? 'un producto similar' : 'productos similares'}
                </Link>
              )}

              {/* ¿Le queda a mi auto? */}
              <div className="axd-compat">
                <label htmlFor="axd-auto">¿Le queda a mi auto?</label>
                <select id="axd-auto" value={auto} onChange={(e) => setAuto(e.target.value)}>
                  <option value="">Elige tu auto…</option>
                  {AUTOS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
                <div className="res" role="status" aria-live="polite">
                  {auto && (
                    <p key={auto} className={cx('axd-res', compatible ? 'is-ok' : 'is-no')}>
                      {compatible ? <CheckCircle size={22} weight="fill" aria-hidden="true" /> : <XCircle size={22} weight="fill" aria-hidden="true" />}
                      <span>
                        {compatible
                          ? <>Sí: aparece como compatible con <b>{auto}</b>.</>
                          : <>No aparece como compatible con <b>{auto}</b>. Confírmalo con la sucursal o <Link to={`/catalogo?q=${encodeURIComponent(auto)}&cat=${p.cat}`}>ve piezas de {Cat.t.toLowerCase()} para {auto}</Link>.</>}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Disponibilidad y especificaciones ===== */}
      <section className="ax-light2 axd-sec" aria-label="Disponibilidad y especificaciones">
        <div className="ax-wrap axd-two">
          <Reveal>
            <h2 className="axd-h2">Disponibilidad por sucursal</h2>
            <button type="button" className="axd-loc" onClick={pedirUbic} disabled={ubic.estado === 'buscando'}>
              {ubic.estado === 'buscando' ? <CircleNotch className="axd-spinner" size={18} weight="bold" aria-hidden="true" /> : <NavigationArrow size={18} weight="fill" aria-hidden="true" />}
              {ubic.estado === 'buscando' ? 'Buscando tu ubicación…' : ubic.fuente === 'gps' ? 'Actualizar mi ubicación' : 'Usar mi ubicación'}
            </button>
            <p className={cx('axd-note', ubic.estado === 'error' && 'is-err')} role="status">
              {ubic.estado === 'error' ? ubic.msg : ubic.fuente === 'gps' ? 'Distancias desde tu ubicación actual.' : 'Distancias desde la ubicación de referencia.'}
            </p>
            <ul className="axd-stock">
              {filas.map(({ b, km, qty }, i) => (
                <li key={b.id} className={cx(qty === 0 && 'is-zero')} style={{ '--i': i }}>
                  <div className="who"><b>{b.n}</b><span>{kmTxt(km)} km</span></div>
                  <div className="bar" aria-hidden="true"><i style={{ '--v': qty / maxQty }} /></div>
                  <p className="qty">{qty === 0 ? 'Sin existencias' : `${qty} ${qty === 1 ? 'pieza' : 'piezas'}`}</p>
                  {qty > 0 ? (
                    <a className="go" href={wa(b)} target="_blank" rel="noopener noreferrer" aria-label={`Escribir por WhatsApp a ${b.n}`}><WhatsappLogo size={20} weight="fill" aria-hidden="true" /></a>
                  ) : <span className="go is-off" aria-hidden="true" />}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={80}>
            <h2 className="axd-h2">Especificaciones</h2>
            <dl className="axd-specs">
              <div><dt>SKU</dt><dd className="mono">{p.sku}</dd></div>
              <div><dt>Marca</dt><dd>{p.marca}</dd></div>
              <div><dt>Fabricante</dt><dd>{p.fab}</dd></div>
              <div><dt>Categoría</dt><dd>{Cat.t}</dd></div>
              <div><dt>Precio</dt><dd>{dinero(p.precio)}</dd></div>
              <div><dt>Existencias en la red</dt><dd>{total} {total === 1 ? 'pieza' : 'piezas'}</dd></div>
              <div className="full"><dt>Compatible con</dt><dd><ul className="axd-tags">{p.compat.map((c) => <li key={c}>{c}</li>)}</ul></dd></div>
            </dl>
            <p className="axd-foot">Ejemplo ilustrativo · producto, precios y existencias de muestra.</p>
          </Reveal>
        </div>
      </section>

      {/* ===== Relacionados ===== */}
      {relacionados.lista.length > 0 && (
        <section className="ax-light axd-sec" aria-label="Productos relacionados">
          <div className="ax-wrap">
            <div className="axd-rel-head">
              <h2 className="axd-h2">También te puede interesar</h2>
              <div className="axd-ctls">
                <button type="button" onClick={() => mover(-1)} aria-label="Anterior"><CaretLeft size={20} weight="bold" aria-hidden="true" /></button>
                <button type="button" onClick={() => mover(1)} aria-label="Siguiente"><CaretRight size={20} weight="bold" aria-hidden="true" /></button>
              </div>
            </div>
            <ul ref={pista} className="axd-rel" tabIndex={0} aria-label="Productos relacionados">
              {relacionados.lista.map((x) => <li key={x.id}><MiniTarjeta p={x} desde={desde} /></li>)}
            </ul>
          </div>
        </section>
      )}

      {/* Barra fija (móvil): precio + WhatsApp cuando el botón principal ya pasó */}
      <div ref={barraRef} className={cx('axd-sticky', mostrarBarra && 'is-on')}>
        <div className="txt"><p>{p.nombre}</p><b className="ax-num">{dinero(p.precio)}</b></div>
        {cercana && <a className="axd-btn axd-btn-wa" href={wa(cercana.b)} target="_blank" rel="noopener noreferrer"><WhatsappLogo size={20} weight="fill" aria-hidden="true" />WhatsApp<span className="axc-sr"> (se abre en una pestaña nueva)</span></a>}
      </div>
    </main>
  );
}

export default function DetalleProducto(props) {
  const { id } = useParams();
  const p = PRODUCTOS.find((x) => x.id === id);
  return (
    <Marco {...props}>
      {p ? <Detalle key={p.id} p={p} /> : <NoEncontrado id={id} />}
    </Marco>
  );
}
