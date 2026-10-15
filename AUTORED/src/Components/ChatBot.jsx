// Burbuja de chatbot — AutoRed. Ubicación: src/Components/ChatBot.jsx (+ ChatBot.css en la misma carpeta).
// Componente reutilizable: impórtalo en cualquier página y ponlo una sola vez, al final del JSX:
//
//   import ChatBot from '../Components/ChatBot';
//   ...
//   <ChatBot />                                   // lo mínimo
//   <ChatBot nombre="Carlos" whatsapp="5215512345678" />
//
// Props (todas opcionales):
//   nombre     Saluda por nombre.
//   whatsapp   Número (con lada, solo dígitos) para "Hablar con una persona".
//   responder  async (texto, historial) => mensajes  → conecta tu IA/backend (ver "RESPUESTAS" abajo).
//   posicion   'derecha' (por defecto) | 'izquierda'.
//   oculto     true para esconder la burbuja en una página (p. ej. dentro de un modal a pantalla completa).
//
// Mismo asistente "AutoRed IA" y mismo diseño del chat de la presentación (index.css); aquí vive como panel flotante.
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Link, useInRouterContext } from 'react-router';
import { Badge } from '../autored-ui';
import '../index.css';
import './ChatBot.css';
import {
  Robot, X, PaperPlaneRight, ArrowClockwise, ArrowDown, ArrowUpRight, WhatsappLogo, MapPin, Gear, CaretDown,
} from '@phosphor-icons/react';

const cx = (...c) => c.filter(Boolean).join(' ');
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const esMovil = () => window.matchMedia('(max-width: 520px)').matches;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const money = (n) => `$${n.toLocaleString('es-MX')}`;
const hora = (t) => new Date(t).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
let contador = 0;
const nuevoId = () => `m${Date.now().toString(36)}${(contador++).toString(36)}`;

// La conversación sobrevive al cambiar de página (misma pestaña); al cerrar la pestaña se borra
const LLAVE = 'autored-chat';
const LLAVE_TEASER = 'autored-chat-teaser';
const leer = () => { try { const v = JSON.parse(sessionStorage.getItem(LLAVE)); return Array.isArray(v) ? v : null; } catch { return null; } };
const guardar = (v) => { try { sessionStorage.setItem(LLAVE, JSON.stringify(v.slice(-40))); } catch { /* sin almacenamiento */ } };

// Usa <Link> si hay Router (sin recargar la página) y <a> si no
function Enlace({ to, children, ...p }) {
  const enRouter = useInRouterContext();
  return enRouter ? <Link to={to} {...p}>{children}</Link> : <a href={to} {...p}>{children}</a>;
}

/* ======================= RESPUESTAS ======================= */
// Contrato para conectar tu IA:  responder(texto, historial) → Promise< string | Mensaje | Mensaje[] >
//   Mensaje = { tipo: 'texto' | 'producto' | 'lista' | 'sucursales' | 'wa' | 'enlace', texto, datos, chips }
//   · texto       → { texto }
//   · producto    → { texto, datos: { key, n, sku, precio, stock, txt, compat, vida, disp, q } }
//   · lista       → { texto, datos: [{ n, precio, stock, txt, m }] }
//   · sucursales  → { texto, datos: [{ n, d, stock, txt }] }
//   · wa          → { texto }        (usa la prop whatsapp)
//   · enlace      → { texto, datos: { to, label } }
//   · chips       → ['Ver alternativas', ...]  respuestas rápidas bajo el mensaje
// Tu endpoint debe hablar con la IA desde el SERVIDOR (nunca pongas llaves de API en el navegador).
// Mientras no conectes nada, abajo hay un asistente local de ejemplo con datos de muestra.
const PRODUCTOS = {
  balatas: { key: 'balatas', n: 'Balatas cerámicas', sku: 'BR-20418', precio: 849, stock: 'ok', txt: 'En stock', compat: 'Versa 2018 ✓', vida: '≈ 40,000 km', disp: '3 sucursales', q: 'balatas' },
  filtro: { key: 'filtro', n: 'Filtro de aceite', sku: 'FL-10231', precio: 189, stock: 'ok', txt: 'En stock', compat: 'Versa 2018 ✓', vida: '≈ 10,000 km', disp: '2 sucursales', q: 'filtro de aceite' },
  bujias: { key: 'bujias', n: 'Bujías de iridio (4 pzas)', sku: 'EN-30877', precio: 620, stock: 'warn', txt: 'Poco stock', compat: 'Versa 2018 ✓', vida: '≈ 60,000 km', disp: '1 sucursal', q: 'bujías' },
};
const ALTERNATIVAS = {
  balatas: [
    { n: 'Balatas semimetálicas BR-20990', precio: 690, stock: 'warn', txt: 'Poco stock', m: 'Norte · 3.8 km' },
    { n: 'Balatas económicas BR-21107', precio: 560, stock: 'ok', txt: 'En stock', m: 'Sur · 5.1 km' },
  ],
  filtro: [{ n: 'Filtro de aceite FL-10240', precio: 165, stock: 'ok', txt: 'En stock', m: 'Centro · 1.2 km' }, { n: 'Filtro de aceite FL-10288', precio: 149, stock: 'ok', txt: 'En stock', m: 'Norte · 3.8 km' }],
  bujias: [{ n: 'Bujías de cobre EN-30112', precio: 340, stock: 'ok', txt: 'En stock', m: 'Centro · 1.2 km' }, { n: 'Bujías de platino EN-30560', precio: 480, stock: 'ok', txt: 'En stock', m: 'Sur · 5.1 km' }],
};
const SUCURSALES = [
  { n: 'Sucursal Centro', d: '1.2 km', stock: 'ok', txt: 'Disponible hoy' },
  { n: 'Sucursal Norte', d: '3.8 km', stock: 'warn', txt: 'Poco stock' },
  { n: 'Sucursal Sur', d: '5.1 km', stock: 'ok', txt: 'Disponible hoy' },
];
const CH_INICIO = ['Buscar una pieza', 'Comparar precios', 'Sucursales cerca', 'Hablar con una persona'];
const CH_PRODUCTO = ['Ver alternativas', '¿Dónde hay cerca?', 'Cotizar con varias tiendas'];

async function respuestaLocal(texto, { ultimo, whatsapp }) {
  const t = norm(texto);
  const has = (re) => re.test(t);
  const producto = (p) => [
    { tipo: 'texto', texto: 'Te recomiendo esta opción compatible con tu vehículo:' },
    { tipo: 'producto', datos: p, chips: CH_PRODUCTO },
  ];
  if (has(/gracias|excelente|perfecto/)) return [{ tipo: 'texto', texto: '¡Con gusto! Si necesitas otra pieza, aquí estoy.', chips: CH_INICIO }];
  if (has(/whatsapp|persona|humano|asesor|agente|distribuidor|contactar|hablar con/)) {
    return [{ tipo: 'wa', texto: whatsapp ? 'Claro, te comunico con una persona del equipo. Te abro WhatsApp con tu consulta lista:' : 'Desde cada oferta puedes escribir directo por WhatsApp a la refaccionaria que te interese.' }];
  }
  if (has(/balata|freno|pastilla/)) return producto(PRODUCTOS.balatas);
  if (has(/filtro|aceite/)) return producto(PRODUCTOS.filtro);
  if (has(/bujia|encendido/)) return producto(PRODUCTOS.bujias);
  if (has(/alternativ|otra opcion|otras opciones|barat|econom|no hay/)) {
    const k = ultimo && ALTERNATIVAS[ultimo] ? ultimo : 'balatas';
    return [{ tipo: 'lista', texto: 'Estas alternativas compatibles también están disponibles:', datos: ALTERNATIVAS[k], chips: ['¿Dónde hay cerca?', 'Cotizar con varias tiendas'] }];
  }
  if (has(/sucursal|cerca|donde|ubicacion|mapa|tienda/)) return [{ tipo: 'sucursales', texto: 'Estas son las refaccionarias más cercanas con tu pieza:', datos: SUCURSALES, chips: ['Cotizar con varias tiendas', 'Hablar con una persona'] }];
  if (has(/precio|cotiza|comparar|costo|cuanto/)) {
    return [{ tipo: 'enlace', texto: 'Puedes pedir precio a varias refaccionarias a la vez y comparar sus ofertas en un solo lugar.', datos: { to: '/catalogo', label: 'Ir al catálogo' }, chips: ['Buscar una pieza', 'Sucursales cerca'] }];
  }
  if (has(/registr|crear cuenta|unirme|mi refaccionaria/)) return [{ tipo: 'enlace', texto: 'Registrarte toma menos de un minuto. Puedes hacerlo como refaccionaria o como usuario.', datos: { to: '/registro', label: 'Crear mi cuenta' } }];
  if (has(/contrasena|sesion|login|entrar|acceso|olvid/)) return [{ tipo: 'enlace', texto: 'Desde el inicio de sesión puedes entrar o recuperar tu contraseña con un código a tu correo.', datos: { to: '/login', label: 'Ir a iniciar sesión' } }];
  if (has(/\b(hola|buenas|buen dia|buenos dias|hey|que tal)\b/)) return [{ tipo: 'texto', texto: '¡Hola! Te ayudo a encontrar piezas, comparar precios y ubicar sucursales. ¿Por dónde empezamos?', chips: CH_INICIO }];
  if (has(/buscar|pieza|refaccion|autoparte|necesito|busco/)) return [{ tipo: 'texto', texto: '¿Qué pieza necesitas y para qué vehículo? Por ejemplo: "balatas para Versa 2018".', chips: ['Balatas Versa 2018', 'Filtro de aceite', 'Bujías'] }];
  return [{ tipo: 'texto', texto: 'No estoy seguro de haber entendido. Puedo ayudarte a buscar piezas, comparar precios, ubicar sucursales o ponerte en contacto con una persona.', chips: CH_INICIO }];
}

/* ======================= MENSAJES ======================= */
function Mensaje({ m, whatsapp, ultimoUsuario, onReintentar }) {
  const yo = m.de === 'yo';
  const wa = (texto) => `https://wa.me/${whatsapp}?text=${encodeURIComponent(texto)}`;
  return (
    <div className={cx('axc-m', yo && 'is-me')}>
      <div className={cx('ax-msg', yo ? 'ax-msg-user' : 'ax-msg-bot', m.error && 'axc-err')}>
        {m.texto && <span>{m.texto}</span>}

        {m.tipo === 'producto' && (
          <>
            <div className="ax-prod">
              <div className="top"><span>{m.datos.n} {m.datos.sku}</span><Badge tone={m.datos.stock}>{m.datos.txt}</Badge></div>
              <dl>
                <dt>Compatibilidad</dt><dd>{m.datos.compat}</dd>
                <dt>Vida útil estimada</dt><dd>{m.datos.vida}</dd>
                <dt>Disponibilidad</dt><dd>{m.datos.disp}</dd>
                <dt>Precio</dt><dd>{money(m.datos.precio)}</dd>
              </dl>
            </div>
            <div className="axc-cta-row">
              <Enlace to={`/catalogo?q=${encodeURIComponent(m.datos.q)}`} className="axc-cta">Ver en catálogo<ArrowUpRight size={16} weight="bold" aria-hidden="true" /></Enlace>
            </div>
          </>
        )}

        {m.tipo === 'lista' && (
          <ul className="axc-list">
            {m.datos.map((a) => (
              <li key={a.n}>
                <span className="n">{a.n}</span><span className="p">{money(a.precio)}</span>
                <span className="m"><Badge tone={a.stock}>{a.txt}</Badge>{a.m}</span>
              </li>
            ))}
          </ul>
        )}

        {m.tipo === 'sucursales' && (
          <ul className="axc-list">
            {m.datos.map((s) => (
              <li key={s.n}>
                <span className="n axc-ln"><MapPin size={16} weight="fill" aria-hidden="true" />{s.n}</span><span className="p">{s.d}</span>
                <span className="m"><Badge tone={s.stock}>{s.txt}</Badge></span>
              </li>
            ))}
          </ul>
        )}

        {m.tipo === 'wa' && whatsapp && (
          <div className="axc-cta-row">
            <a className="axc-cta wa" href={wa(ultimoUsuario ? `Hola, vengo del asistente de AutoRed. ${ultimoUsuario}` : 'Hola, vengo del asistente de AutoRed y necesito ayuda.')} target="_blank" rel="noopener noreferrer">
              <WhatsappLogo size={18} weight="fill" aria-hidden="true" />Abrir WhatsApp
            </a>
          </div>
        )}

        {m.tipo === 'enlace' && m.datos && (
          <div className="axc-cta-row"><Enlace to={m.datos.to} className="axc-cta">{m.datos.label}<ArrowUpRight size={16} weight="bold" aria-hidden="true" /></Enlace></div>
        )}

        {m.error && <div className="axc-cta-row"><button type="button" className="axc-cta" onClick={onReintentar}><ArrowClockwise size={16} weight="bold" aria-hidden="true" />Reintentar</button></div>}
      </div>
      <time className="axc-time" dateTime={new Date(m.t).toISOString()}>{hora(m.t)}</time>
    </div>
  );
}

// Engrane de línea fina que gira alrededor de la burbuja
const GEAR = (() => {
  const teeth = 14, ro = 48, ri = 40, c = 50, step = (Math.PI * 2) / teeth;
  let d = '';
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const p = [[a - step * 0.32, ri], [a - step * 0.17, ro], [a + step * 0.17, ro], [a + step * 0.32, ri]].map(([t, r]) => `${(c + Math.cos(t) * r).toFixed(2)} ${(c + Math.sin(t) * r).toFixed(2)}`);
    d += `${i === 0 ? 'M' : 'L'}${p[0]} L${p[1]} L${p[2]} L${p[3]} `;
  }
  return `${d}Z`;
})();

/* ======================= COMPONENTE ======================= */
export default function ChatBot({ nombre, whatsapp, responder, posicion = 'derecha', oculto = false }) {
  const uid = useId().replace(/:/g, '');
  const primero = nombre ? nombre.trim().split(' ')[0] : '';
  const bienvenida = useCallback(() => [{
    id: nuevoId(), de: 'bot', tipo: 'texto', t: Date.now(), chips: CH_INICIO,
    texto: `¡Hola${primero ? `, ${primero}` : ''}! Soy AutoRed IA. Te ayudo a encontrar piezas compatibles, comparar precios y ubicar sucursales. ¿Qué buscas hoy?`,
  }], [primero]);

  const [msgs, setMsgs] = useState(() => leer() || bienvenida());
  const [abierto, setAbierto] = useState(false);
  const [visible, setVisible] = useState(false); // el panel sigue montado mientras sale
  const [escribiendo, setEscribiendo] = useState(false);
  const [texto, setTexto] = useState('');
  const [sinLeer, setSinLeer] = useState(() => (leer() ? 0 : 1));
  const [teaser, setTeaser] = useState(false);
  const [nuevos, setNuevos] = useState(false);
  const launcher = useRef(null);
  const log = useRef(null);
  const input = useRef(null);
  const alFondo = useRef(true);
  const msgsRef = useRef(msgs);
  const vivo = useRef(true);
  const timers = useRef([]);
  msgsRef.current = msgs;

  useEffect(() => { vivo.current = true; const ts = timers.current; return () => { vivo.current = false; ts.forEach(clearTimeout); }; }, []);
  const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.current.push(t); return t; };
  useEffect(() => { guardar(msgs.map(({ ...m }) => m)); }, [msgs]);

  // Sugerencia flotante: una sola vez por sesión, a los 3.5 s; se retira sola
  useEffect(() => {
    let visto = false;
    try { visto = sessionStorage.getItem(LLAVE_TEASER) === '1'; } catch { /* sin almacenamiento */ }
    if (visto || oculto) return;
    const t1 = setTimeout(() => { setTeaser(true); try { sessionStorage.setItem(LLAVE_TEASER, '1'); } catch { /* sin almacenamiento */ } }, 3500);
    const t2 = setTimeout(() => setTeaser(false), 13000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [oculto]);

  const abrir = () => {
    setTeaser(false); setSinLeer(0); setVisible(true); setAbierto(true);
    later(() => { input.current?.focus({ preventScroll: true }); }, reduced() ? 30 : 260);
  };
  const cerrar = useCallback(() => {
    setAbierto(false);
    launcher.current?.focus({ preventScroll: true });
    later(() => setVisible(false), reduced() ? 0 : 240);
  }, []);

  // Esc cierra; en móvil el panel ocupa la pantalla y se bloquea el scroll de fondo
  useEffect(() => {
    if (!abierto) return;
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); cerrar(); } };
    document.addEventListener('keydown', onKey);
    const b = document.body, ov = b.style.overflow, bloquear = esMovil();
    if (bloquear) b.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); if (bloquear) b.style.overflow = ov; };
  }, [abierto, cerrar]);

  // Desplazamiento: sigue la conversación si estás abajo; si no, avisa con "Mensajes nuevos"
  const aFondo = (suave = true) => {
    const el = log.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: suave && !reduced() ? 'smooth' : 'auto' });
    setNuevos(false);
  };
  const onScroll = () => {
    const el = log.current;
    if (!el) return;
    alFondo.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
    if (alFondo.current) setNuevos(false);
  };
  useEffect(() => { if (visible) { aFondo(false); alFondo.current = true; } }, [visible]);
  useEffect(() => {
    if (!visible) return;
    if (alFondo.current) aFondo(true); else setNuevos(true);
  }, [msgs.length, escribiendo, visible]);

  const agregar = (m) => setMsgs((l) => [...l, { id: nuevoId(), t: Date.now(), ...m }]);

  const enviar = async (valor) => {
    const t = (valor ?? texto).trim();
    if (!t || escribiendo) return;
    alFondo.current = true;
    agregar({ de: 'yo', tipo: 'texto', texto: t });
    setTexto('');
    if (input.current) input.current.style.height = '';
    setEscribiendo(true);
    const t0 = Date.now();
    const ultimo = [...msgsRef.current].reverse().find((m) => m.tipo === 'producto')?.datos?.key;
    let resp;
    try {
      resp = await (responder ? responder(t, msgsRef.current) : respuestaLocal(t, { ultimo, whatsapp }));
      if (typeof resp === 'string') resp = [{ tipo: 'texto', texto: resp }];
      if (resp && !Array.isArray(resp)) resp = [resp];
      if (!resp?.length) resp = [{ tipo: 'texto', texto: 'No encontré una respuesta para eso. ¿Puedes decirlo de otra forma?' }];
    } catch {
      resp = [{ tipo: 'texto', texto: 'Tuve un problema para responder. Revisa tu conexión e inténtalo de nuevo.', error: true }];
    }
    await wait(Math.max(0, (reduced() ? 250 : 800) + Math.min(t.length * 8, 500) - (Date.now() - t0)));
    for (let i = 0; i < resp.length; i++) {
      if (!vivo.current) return;
      if (i > 0) { setEscribiendo(true); await wait(reduced() ? 150 : 600); if (!vivo.current) return; }
      setEscribiendo(false);
      agregar({ de: 'bot', ...resp[i] });
      setSinLeer((n) => (abierto ? 0 : n + 1));
    }
    setEscribiendo(false);
  };

  const reintentar = (id) => {
    const lista = msgsRef.current;
    const ult = [...lista].reverse().find((m) => m.de === 'yo');
    setMsgs(lista.filter((m) => m.id !== id && m !== ult));
    if (ult) later(() => enviar(ult.texto), 0);
  };
  const reiniciar = () => {
    if (escribiendo) return;
    setMsgs(bienvenida()); setSinLeer(0); alFondo.current = true; setNuevos(false);
    input.current?.focus({ preventScroll: true });
  };

  const autoAlto = (e) => { const el = e.target; el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight, 112)}px`; };
  const teclas = (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); enviar(); } };

  if (oculto) return null;
  const ultimoMsg = msgs[msgs.length - 1];
  const chips = !escribiendo && ultimoMsg?.de === 'bot' ? ultimoMsg.chips : null;
  const ultimoUsuario = [...msgs].reverse().find((m) => m.de === 'yo')?.texto;

  return (
    <div className={cx('ax axc-root', posicion === 'izquierda' && 'is-izq', abierto && 'is-abierto')}>
      {teaser && !abierto && (
        <div className="axc-teaser">
          <button type="button" className="axc-teaser-main" onClick={abrir}>¿Buscas una refacción? <b>Te ayudo en segundos.</b></button>
          <button type="button" className="axc-teaser-x" onClick={() => setTeaser(false)} aria-label="Cerrar sugerencia"><X size={16} weight="bold" aria-hidden="true" /></button>
        </div>
      )}

      {visible && (
        <section id={`${uid}-p`} className={cx('axc-panel', !abierto && 'is-out')} role="dialog" aria-modal="false" aria-labelledby={`${uid}-t`}>
          <header className="axc-head">
            <span className="ax-dot"><Robot size={22} weight="fill" aria-hidden="true" /></span>
            <div className="axc-who">
              <p id={`${uid}-t`} className="axc-name">AutoRed IA</p>
              <p className="axc-sub"><i className="axc-live" aria-hidden="true" />En línea · Asistente virtual</p>
            </div>
            <button type="button" className="axc-ib" onClick={reiniciar} disabled={escribiendo} aria-label="Reiniciar conversación"><ArrowClockwise size={20} weight="bold" aria-hidden="true" /></button>
            <button type="button" className="axc-ib" onClick={cerrar} aria-label="Minimizar chat"><CaretDown size={22} weight="bold" aria-hidden="true" /></button>
          </header>

          <div className="axc-bodywrap">
            <div ref={log} className="axc-log" role="log" aria-live="polite" aria-relevant="additions" aria-label="Conversación con AutoRed IA" tabIndex={0} onScroll={onScroll}>
              {msgs.map((m) => <Mensaje key={m.id} m={m} whatsapp={whatsapp} ultimoUsuario={ultimoUsuario} onReintentar={() => reintentar(m.id)} />)}
              {escribiendo && <div className="ax-msg ax-msg-bot ax-typing" role="status" aria-label="AutoRed IA está escribiendo"><i /><i /><i /></div>}
            </div>
            {nuevos && <button type="button" className="axc-new" onClick={() => { alFondo.current = true; aFondo(true); }}><ArrowDown size={16} weight="bold" aria-hidden="true" />Mensajes nuevos</button>}
          </div>

          {chips && (
            <div className="axc-chips" role="group" aria-label="Respuestas rápidas" key={ultimoMsg.id}>
              {chips.map((c, i) => <button key={c} type="button" style={{ '--i': i }} onClick={() => enviar(c)}>{c}</button>)}
            </div>
          )}

          <form className="axc-form" onSubmit={(e) => { e.preventDefault(); enviar(); }}>
            <label htmlFor={`${uid}-i`} className="axc-sr">Escribe tu mensaje</label>
            <textarea ref={input} id={`${uid}-i`} rows={1} maxLength={500} placeholder="Escribe tu pregunta…" value={texto} enterKeyHint="send"
              onChange={(e) => { setTexto(e.target.value); autoAlto(e); }} onKeyDown={teclas} />
            <button type="submit" className="axc-send" disabled={!texto.trim() || escribiendo} aria-label="Enviar mensaje"><PaperPlaneRight size={20} weight="fill" aria-hidden="true" /></button>
          </form>
          <p className="axc-foot">{responder ? 'Asistente virtual · puede equivocarse, confirma con la refaccionaria' : 'Respuestas de ejemplo · datos de muestra'}</p>
        </section>
      )}

      <button ref={launcher} type="button" className={cx('axc-fab', abierto && 'is-open')} onClick={abierto ? cerrar : abrir}
        aria-expanded={abierto} aria-controls={visible ? `${uid}-p` : undefined} aria-haspopup="dialog"
        aria-label={abierto ? 'Cerrar chat del asistente' : `Abrir chat del asistente${sinLeer ? `, ${sinLeer} mensaje sin leer` : ''}`}>
        <span className="axc-fab-ring" aria-hidden="true" />
        <svg className="axc-fab-gear" viewBox="0 0 100 100" aria-hidden="true"><path d={GEAR} /></svg>
        <Robot className="axc-ico-bot" size={30} weight="fill" aria-hidden="true" />
        <X className="axc-ico-x" size={28} weight="bold" aria-hidden="true" />
        {sinLeer > 0 && !abierto && <span className="axc-badge" aria-hidden="true">{sinLeer}</span>}
      </button>
    </div>
  );
}
