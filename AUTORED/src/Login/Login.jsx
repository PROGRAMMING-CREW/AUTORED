// Inicio de sesión — AutoRed. Ubicación: src/Login/Login.jsx (junto a Registro.jsx).
// Reutiliza los estilos ax- (index.css) y los del formulario de Registro (axr-).
// Lo propio de esta pantalla lleva prefijo axl- y está en ./Login.css.
//
// Ruta:  <Route path="/login" element={<Login onLogin={(u) => setUsuario(u)} />} />
// Idea: el formulario va a la IZQUIERDA (en Registro va a la derecha) y la escena 3D es un
// tablero de auto: la aguja sube y los testigos se encienden según avanzas, y al entrar "arranca el motor".
// "¿Olvidaste tu contraseña?" abre un modal de 3 pasos (correo → código → nueva contraseña) con un candado 3D.
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Badge, Reveal } from '../autored-ui';
import Nav, { resolverRol } from '../Components/Nav';
import Footer from '../Components/Footer';
import '../index.css';
import './Login.css';
import {
  Envelope, Lock, Eye, EyeSlash, CheckCircle, WarningCircle, CircleNotch, ArrowRight,
  Lightning, ShieldCheck, Storefront, Check, X,
} from '@phosphor-icons/react';

const cx = (...c) => c.filter(Boolean).join(' ');
const W = 'duotone';
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ======================= BACKEND (sustituye por el tuyo) ======================= */
// TODO: conecta con tu API (PHP/MySQL). Debe responder { nombre, rol } y dejar la sesión
//       en una cookie httpOnly. Google real: Firebase signInWithPopup o @react-oauth/google.
// Simulación para probar la interfaz:
//   · contraseña "incorrecta"        → error de credenciales
//   · correo con "admin"             → rol administrador
//   · correo con "tienda" o "refac"  → rol refaccionaria
//   · cualquier otro                 → rol comprador
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const titulo = (c) => c.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
async function iniciarSesion({ correo, password }) {
  await wait(1000);
  if (password.toLowerCase() === 'incorrecta') { const e = new Error('credenciales'); e.codigo = 'credenciales'; throw e; }
  const c = correo.trim().toLowerCase();
  const rol = c.includes('admin') ? 'admin' : c.includes('tienda') || c.includes('refac') ? 'refaccionaria' : 'comprador';
  return { nombre: titulo(c), correo: c, rol };
}
async function iniciarConGoogle() {
  await wait(900);
  return { Nombre: 'Carlos Ramírez', Correo: 'carlos.ramirez@gmail.com', rol: 'comprador' };
}

// ---- Recuperar contraseña (simulación; sustituye por tu API) ----
// 1) POST /recuperar            { correo }                    → envía un código de 6 dígitos (responde igual exista o no la cuenta)
// 2) POST /recuperar/verificar  { correo, codigo }            → true / false
// 3) POST /recuperar/cambiar    { correo, codigo, password }  → guarda la nueva contraseña (hash en el servidor)
const LONG = 6;
const MODO_DEMO = true;        // TODO: quítalo al conectar el backend
const CODIGO_DEMO = '123456';  // TODO: la validación real la hace tu backend
async function solicitarCodigo(/* correo */) { await wait(900); }
async function verificarCodigo(codigo /*, correo */) { await wait(900); return MODO_DEMO && codigo === CODIGO_DEMO; }
async function cambiarPassword(/* { correo, codigo, password } */) { await wait(1000); }

/* ======================= DESTINO TRAS ENTRAR ======================= */
const RUTA_POR_ROL = { admin: '/admin', comprador: '/catalogo', refaccionaria: '/refaccionaria' };
const ROL_TXT = { admin: 'administrador', comprador: 'comprador', refaccionaria: 'refaccionaria' };
// Solo rutas internas (evita redirecciones abiertas con ?next=https://sitio-malo.com)
const destinoSeguro = (n) => (typeof n === 'string' && /^\/(?![/\\])/.test(n) && !/^\/(login|registro)\b/.test(n) ? n : null);
const LLAVE_CORREO = 'autored-correo';

/* ======================= REGLAS ======================= */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DOMINIOS = { 'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gamil.com': 'gmail.com', 'gmail.con': 'gmail.com', 'gmail.co': 'gmail.com', 'hotmial.com': 'hotmail.com', 'hotmal.com': 'hotmail.com', 'hotmail.con': 'hotmail.com', 'outlok.com': 'outlook.com', 'outlook.con': 'outlook.com', 'yaho.com': 'yahoo.com', 'yahoo.con': 'yahoo.com' };
const sugerir = (c) => { const [u, d] = c.trim().toLowerCase().split('@'); return u && d && DOMINIOS[d] ? `${u}@${DOMINIOS[d]}` : ''; };
const reglas = {
  correo: (v) => (EMAIL.test(v.trim()) ? '' : 'Escribe un correo válido, por ejemplo nombre@correo.com.'),
  password: (v) => (v ? '' : 'Escribe tu contraseña.'), // en el login no se exige complejidad
};
// Requisitos de la NUEVA contraseña (solo se exigen al crearla, no al entrar)
const REQ = [
  { k: 'len', t: '8 caracteres o más', ok: (p) => p.length >= 8 },
  { k: 'case', t: 'Mayúscula y minúscula', ok: (p) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { k: 'num', t: 'Un número', ok: (p) => /\d/.test(p) },
];
const fuerza = (p) => REQ.filter((r) => r.ok(p)).length + (/[^A-Za-z0-9]/.test(p) && p.length >= 8 ? 1 : 0);
const ETQ = ['Muy débil', 'Débil', 'Aceptable', 'Buena', 'Fuerte'];

/* ======================= HOOK: inclinación 3D de la escena ======================= */
function useSceneTilt(max = 10) {
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

// Logotipo oficial de Google (4 colores)
function GoogleG() {
  return (
    <svg className="axr-g" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

// Mismo marcado que el Field de Registro (usa sus clases axr-*) + inputRef para poder enfocar
function Field({ id, label, error, note, icon: Icon, right, inputRef, ...input }) {
  return (
    <div className={cx('axr-field', error && 'has-err')}>
      <label htmlFor={id}>{label}</label>
      <div className="axr-ctl">
        {Icon && <Icon className="axr-fi" size={20} weight={W} aria-hidden="true" />}
        <input id={id} ref={inputRef} aria-invalid={error ? 'true' : undefined} aria-describedby={error ? `${id}-e` : undefined} {...input} />
        {right}
      </div>
      {error && <p id={`${id}-e`} className="axr-err" role="alert"><WarningCircle size={16} weight="fill" aria-hidden="true" />{error}</p>}
      {note}
    </div>
  );
}

/* ======================= TABLERO (escena 3D) ======================= */
const MIN = -120, MAX = 120; // la aguja barre 240°
const pol = (r, a) => { const t = (a * Math.PI) / 180; return [100 + r * Math.sin(t), 100 - r * Math.cos(t)]; };
const f2 = (n) => n.toFixed(2);
const arco = (r, a0, a1) => { const [x0, y0] = pol(r, a0), [x1, y1] = pol(r, a1); return `M${f2(x0)} ${f2(y0)} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${f2(x1)} ${f2(y1)}`; };
const MAYORES = Array.from({ length: 9 }, (_, i) => MIN + i * 30);
const MENORES = Array.from({ length: 41 }, (_, i) => MIN + i * 6).filter((a) => (a - MIN) % 30 !== 0);

function Tablero({ p, rev, errKey, estado }) {
  const deg = MIN + (MAX - MIN) * p;
  return (
    <div className={cx('axl-gauge', rev && 'is-rev')}>
      <div className="ax-fc-in" style={{ '--d': '-1s' }}>
        <div key={errKey} className={cx('axl-gauge-in', errKey > 0 && 'axl-shake')}>
          <svg viewBox="0 0 200 200" className="axl-svg" focusable="false">
            <defs>
              <radialGradient id="axl-face" cx="50%" cy="42%" r="70%"><stop offset="0" stopColor="#2e2018" /><stop offset="1" stopColor="#120a0b" /></radialGradient>
            </defs>
            <circle className="bezel" cx="100" cy="100" r="98" />
            <circle cx="100" cy="100" r="92" fill="url(#axl-face)" />
            <path className="track" d={arco(84, MIN, MAX)} />
            <path className="red" d={arco(84, 84, MAX)} />
            <path className="prog" d={arco(84, MIN, MAX)} pathLength="1" style={{ strokeDashoffset: 1 - p }} />
            {MENORES.map((a) => { const [x0, y0] = pol(74, a), [x1, y1] = pol(69, a); return <line key={a} className="tick" x1={f2(x0)} y1={f2(y0)} x2={f2(x1)} y2={f2(y1)} />; })}
            {MAYORES.map((a, i) => {
              const [x0, y0] = pol(74, a), [x1, y1] = pol(63, a), [tx, ty] = pol(52, a);
              return (
                <g key={a}>
                  <line className="tick M" x1={f2(x0)} y1={f2(y0)} x2={f2(x1)} y2={f2(y1)} />
                  <text className="num" x={f2(tx)} y={f2(ty)}>{i}</text>
                </g>
              );
            })}
            <text className="lbl" x="100" y="128">RPM ×1000</text>
            <g className="axl-needle" style={{ transform: `rotate(${deg}deg)` }}>
              <g className="axl-idle">
                <path className="needle" d="M100 100 L97.4 106 L100 22 L102.6 106Z" />
              </g>
            </g>
            <circle className="hub" cx="100" cy="100" r="10" />
            <circle className="hub-d" cx="100" cy="100" r="4" />
          </svg>
          <p className="axl-readout" key={estado}>{estado}</p>
        </div>
      </div>
    </div>
  );
}

/* ======================= MODAL: RECUPERAR CONTRASEÑA ======================= */
const PASOS = ['Correo', 'Código', 'Nueva clave'];
const CAPTION = ['Cerrado', 'Verificando que eres tú', 'Casi abierto', '¡Desbloqueado!'];

// Candado 3D: la argolla sube un poco en cada paso y, al terminar, se abre y el cuerpo se pone verde
function Candado({ paso }) {
  return (
    <div className={cx('axl-lock', `s${paso}`, paso === 3 && 'is-ok')}>
      <div className="axl-lock-sway">
        <i className="axl-shackle" />
        <i className="axl-body">{paso === 3 ? <Check className="axl-lock-ico" size="1.7em" weight="bold" /> : <b className="axl-keyhole" />}</i>
      </div>
      <i className="axl-lock-shadow" />
    </div>
  );
}

function RecuperarModal({ correoInicial, onClose, onDone, returnRef }) {
  const uid = useId().replace(/:/g, '');
  const { surfaceRef, stageRef } = useSceneTilt(8);
  const dlg = useRef(null);
  const otp = useRef(null);
  const lock = useRef(null);
  const cajas = useRef([]);
  const panes = useRef([]);
  const timers = useRef([]);
  const codigoOk = useRef('');

  const [paso, setPaso] = useState(0); // 0 correo · 1 código · 2 nueva contraseña · 3 listo
  const [alto, setAlto] = useState(0);
  const [saliendo, setSaliendo] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [errForm, setErrForm] = useState('');
  // paso 0
  const [correo, setCorreo] = useState(correoInicial || '');
  const [errCorreo, setErrCorreo] = useState('');
  const [sug, setSug] = useState('');
  // paso 1
  const [dig, setDig] = useState(() => Array(LONG).fill(''));
  const [estadoCod, setEstadoCod] = useState('idle'); // idle | verificando | ok
  const [errCod, setErrCod] = useState('');
  const [aviso, setAviso] = useState('');
  const [intentos, setIntentos] = useState(0);
  const [seg, setSeg] = useState(0);
  // paso 2
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [errPw, setErrPw] = useState('');
  const [errPw2, setErrPw2] = useState('');
  const [ver, setVer] = useState(false);
  const [caps, setCaps] = useState(false);

  const ocupado = cargando || estadoCod !== 'idle' || saliendo;
  const bloqueado = intentos >= 5;
  const fz = fuerza(pw);
  const foco = (i) => cajas.current[i]?.focus();
  const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.current.push(t); };

  // Bloquea el scroll de fondo (sin saltos por la barra de Windows) y devuelve el foco al cerrar
  useEffect(() => {
    const b = document.body, ov = b.style.overflow, pr = b.style.paddingRight;
    const sb = window.innerWidth - document.documentElement.clientWidth;
    b.style.overflow = 'hidden';
    if (sb > 0) b.style.paddingRight = `${sb}px`;
    const ts = timers.current;
    return () => { b.style.overflow = ov; b.style.paddingRight = pr; ts.forEach(clearTimeout); returnRef?.current?.focus(); };
  }, [returnRef]);

  // El diálogo mide el paso activo y anima su altura (sin saltos al cambiar de paso)
  useLayoutEffect(() => {
    const el = panes.current[paso];
    if (!el) return;
    const medir = () => setAlto(el.offsetHeight + 8);
    medir();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, [paso]);

  // Al cambiar de paso, el foco va al campo principal de ese paso
  useEffect(() => {
    const t = setTimeout(() => panes.current[paso]?.querySelector('[data-foco]')?.focus({ preventScroll: true }), 80);
    return () => clearTimeout(t);
  }, [paso]);

  // Cuenta regresiva del reenvío
  useEffect(() => {
    if (seg <= 0) return;
    const t = setTimeout(() => setSeg((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [seg]);

  const cerrar = (fn = onClose) => {
    if (ocupado) return;
    setSaliendo(true);
    later(fn, reduced() ? 0 : 200);
  };

  // Esc cierra y Tab no sale del diálogo
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); cerrar(); return; }
      if (e.key !== 'Tab' || !dlg.current) return;
      const f = [...dlg.current.querySelectorAll('button:not([disabled]), input:not([disabled])')].filter((el) => getComputedStyle(el).visibility !== 'hidden');
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  const sacudir = (el, px = 9) => {
    if (reduced() || !el?.animate) return;
    el.animate(
      [{ transform: 'translateX(0)' }, { transform: `translateX(${-px}px)` }, { transform: `translateX(${px}px)` }, { transform: `translateX(${-px * 0.65}px)` }, { transform: `translateX(${px * 0.65}px)` }, { transform: 'translateX(0)' }],
      { duration: 400, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
    );
  };

  /* ---- Paso 0: correo ---- */
  const enviarCorreo = async (e) => {
    e.preventDefault();
    const m = reglas.correo(correo);
    setErrCorreo(m);
    if (m) { requestAnimationFrame(() => panes.current[0]?.querySelector('[aria-invalid="true"]')?.focus()); return; }
    setCargando(true); setErrForm('');
    try {
      await solicitarCodigo(correo.trim());
      setDig(Array(LONG).fill('')); setErrCod(''); setAviso(''); setIntentos(0); setSeg(30);
      setPaso(1);
    } catch { setErrForm('No pudimos enviar el código. Revisa tu conexión e inténtalo de nuevo.'); }
    finally { setCargando(false); }
  };

  /* ---- Paso 1: código de 6 dígitos ---- */
  const verificar = async (codigo) => {
    if (bloqueado) return;
    if (codigo.length < LONG) {
      setErrCod('Escribe los 6 dígitos del código.'); sacudir(otp.current);
      foco(Math.max(0, dig.findIndex((d) => !d)));
      return;
    }
    setEstadoCod('verificando'); setErrCod(''); setAviso('');
    const ok = await verificarCodigo(codigo, correo);
    if (ok) {
      codigoOk.current = codigo;
      setEstadoCod('ok');
      later(() => { setEstadoCod('idle'); setPaso(2); }, reduced() ? 400 : 1000);
      return;
    }
    const n = intentos + 1;
    setEstadoCod('idle'); setIntentos(n);
    setErrCod(n >= 5 ? 'Demasiados intentos. Pide un código nuevo para continuar.' : 'Código incorrecto. Revisa tu correo e inténtalo de nuevo.');
    sacudir(otp.current); sacudir(lock.current, 7);
    later(() => { setDig(Array(LONG).fill('')); if (n < 5) foco(0); }, 450);
  };
  const poner = (desde, texto) => {
    if (ocupado || bloqueado) return;
    const nums = texto.replace(/\D/g, '').slice(0, LONG - desde).split('').filter(Boolean);
    if (!nums.length) return;
    const next = [...dig];
    nums.forEach((n, k) => { next[desde + k] = n; });
    setDig(next); setErrCod(''); setAviso('');
    foco(Math.min(desde + nums.length, LONG - 1));
    if (next.every(Boolean)) verificar(next.join(''));
  };
  const cambiar = (i, raw) => {
    const v = raw.replace(/\D/g, '');
    if (!v) { const n = [...dig]; n[i] = ''; setDig(n); return; }
    poner(i, v.length === 2 && dig[i] ? (v[0] === dig[i] ? v[1] : v[0]) : v);
  };
  const teclas = (i, e) => {
    if (e.key === 'Backspace' && !dig[i] && i > 0) { e.preventDefault(); const n = [...dig]; n[i - 1] = ''; setDig(n); foco(i - 1); }
    else if (e.key === 'ArrowLeft' && i > 0) { e.preventDefault(); foco(i - 1); }
    else if (e.key === 'ArrowRight' && i < LONG - 1) { e.preventDefault(); foco(i + 1); }
  };
  const reenviar = async () => {
    setSeg(30); setIntentos(0); setDig(Array(LONG).fill('')); setErrCod(''); setAviso('Te enviamos un código nuevo.'); foco(0);
    await solicitarCodigo(correo.trim());
  };

  /* ---- Paso 2: nueva contraseña ---- */
  const guardar = async (e) => {
    e.preventDefault();
    const m1 = REQ.every((r) => r.ok(pw)) ? '' : 'Tu contraseña aún no cumple los requisitos.';
    const m2 = !pw2 ? 'Repite tu contraseña.' : pw2 !== pw ? 'Las contraseñas no coinciden.' : '';
    setErrPw(m1); setErrPw2(m2);
    if (m1 || m2) { requestAnimationFrame(() => panes.current[2]?.querySelector('[aria-invalid="true"]')?.focus()); return; }
    setCargando(true); setErrForm('');
    try {
      await cambiarPassword({ correo: correo.trim(), codigo: codigoOk.current, password: pw });
      setPaso(3);
    } catch { setErrForm('No pudimos guardar tu contraseña. Inténtalo de nuevo.'); }
    finally { setCargando(false); }
  };
  const capsCheck = (e) => setCaps(!!e.getModifierState?.('CapsLock'));

  const pane = (i) => ({
    ref: (el) => { panes.current[i] = el; },
    className: cx('axl-pane', paso === i && 'is-active', paso > i && 'is-before'),
    'aria-hidden': paso !== i,
  });
  const ojo = (
    <button type="button" className="axr-eye" onClick={() => setVer((v) => !v)} aria-label={ver ? 'Ocultar contraseñas' : 'Mostrar contraseñas'} aria-pressed={ver}>
      {ver ? <EyeSlash size={22} weight={W} aria-hidden="true" /> : <Eye size={22} weight={W} aria-hidden="true" />}
    </button>
  );

  return createPortal(
    <div className={cx('ax axl-m-root', saliendo && 'is-out')}>
      <div className="axl-m-backdrop" aria-hidden="true" />
      <div ref={dlg} className="axl-modal" role="dialog" aria-modal="true" aria-label="Recuperar contraseña">

        {/* ---- Lado oscuro: candado 3D ---- */}
        <aside ref={surfaceRef} className="axl-m-side" aria-hidden="true">
          <svg className="axl-m-gear" viewBox="0 0 200 200"><path d={gearPath(16, 96, 80)} /><circle cx="100" cy="100" r="40" /><circle cx="100" cy="100" r="64" /></svg>
          <div ref={stageRef} className="axl-m-stage">
            <div className="ax-glow" />
            <div className="ax-floor"><div className="ax-floor-grid" /></div>
            <div ref={lock} className="axl-lock-wrap"><Candado paso={paso} /></div>
          </div>
          <p className="axl-m-cap" key={paso}>{CAPTION[paso]}</p>
        </aside>

        {/* ---- Lado claro: pasos ---- */}
        <div className="axl-m-main">
          <button type="button" className="axl-m-close" onClick={() => cerrar()} disabled={ocupado} aria-label="Cerrar"><X size={20} weight="bold" aria-hidden="true" /></button>

          <ol className="axl-m-steps" aria-label="Progreso de la recuperación">
            {PASOS.map((t, i) => (
              <li key={t} className={cx(paso > i && 'done', paso === i && 'now')} aria-current={paso === i ? 'step' : undefined}>
                <i aria-hidden="true" /><span>{i + 1}. {t}</span>
              </li>
            ))}
          </ol>

          <div className="axl-m-view" style={alto ? { height: alto } : undefined}>

            {/* Paso 0 · correo */}
            <form {...pane(0)} noValidate onSubmit={enviarCorreo}>
              <h3 className="axl-m-t">¿Olvidaste tu <em className="ax-em">contraseña</em>?</h3>
              <p className="axl-m-s">Escribe el correo de tu cuenta. Si existe, te enviamos un código de 6 dígitos para crear una nueva.</p>
              {errForm && paso === 0 && <p className="axr-alert" role="alert"><WarningCircle size={20} weight="fill" aria-hidden="true" />{errForm}</p>}
              <Field id={`${uid}-correo`} data-foco="1" name="correo" label="Correo electrónico" icon={Envelope} type="email" inputMode="email" autoComplete="username"
                value={correo} error={errCorreo}
                onChange={(e) => { setCorreo(e.target.value); setSug(''); if (errCorreo) setErrCorreo(reglas.correo(e.target.value)); }}
                onBlur={() => { if (correo) { setErrCorreo(reglas.correo(correo)); setSug(sugerir(correo)); } }}
                note={sug && !errCorreo ? (
                  <p className="axr-note axr-fade">¿Quisiste decir{' '}
                    <button type="button" className="axr-sug" onClick={() => { setCorreo(sug); setSug(''); setErrCorreo(''); }}>{sug}</button>?
                  </p>
                ) : null} />
              <button type="submit" className="axr-btn" disabled={cargando} aria-busy={cargando}>
                {cargando ? <><CircleNotch className="axr-spin" size={20} weight="bold" aria-hidden="true" />Enviando código…</> : <>Enviar código<ArrowRight size={20} weight="bold" aria-hidden="true" /></>}
              </button>
              <div className="axl-m-foot">
                <button type="button" className="axr-link" onClick={() => cerrar()} disabled={ocupado}>Volver a iniciar sesión</button>
              </div>
            </form>

            {/* Paso 1 · código */}
            <form {...pane(1)} noValidate onSubmit={(e) => { e.preventDefault(); verificar(dig.join('')); }}>
              <h3 className="axl-m-t">Revisa tu <em className="ax-em">correo</em></h3>
              <p className="axl-m-s">Si <b>{correo.trim()}</b> tiene una cuenta, te enviamos un código de 6 dígitos. Escríbelo aquí.</p>

              <div ref={otp} className={cx('axr-otp', errCod && 'is-err', estadoCod === 'ok' && 'is-ok')} role="group" aria-label="Código de recuperación">
                {dig.map((d, i) => (
                  <input key={i} ref={(el) => { cajas.current[i] = el; }} className={d ? 'has' : undefined} style={{ '--i': i }} data-foco={i === 0 ? '1' : undefined}
                    value={d} inputMode="numeric" pattern="[0-9]*" autoComplete={i === 0 ? 'one-time-code' : 'off'}
                    aria-label={`Dígito ${i + 1} de ${LONG}`} aria-invalid={errCod ? 'true' : undefined} readOnly={ocupado || bloqueado}
                    onFocus={(e) => e.target.select()} onChange={(e) => cambiar(i, e.target.value)} onKeyDown={(e) => teclas(i, e)}
                    onPaste={(e) => { e.preventDefault(); const t = e.clipboardData.getData('text'); poner(t.replace(/\D/g, '').length >= LONG ? 0 : i, t); }} />
                ))}
              </div>

              <div className="axr-m-status" aria-live="polite">
                {estadoCod === 'verificando' && <span className="axr-m-info"><CircleNotch className="axr-spin" size={18} weight="bold" aria-hidden="true" />Verificando…</span>}
                {estadoCod === 'ok' && <span className="axr-m-ok"><CheckCircle size={20} weight="fill" aria-hidden="true" />Código correcto. Un momento…</span>}
                {estadoCod === 'idle' && errCod && <p className="axr-err" role="alert"><WarningCircle size={16} weight="fill" aria-hidden="true" />{errCod}</p>}
                {estadoCod === 'idle' && !errCod && aviso && <span className="axr-m-info">{aviso}</span>}
              </div>

              <button type="submit" className="axr-btn" disabled={ocupado || bloqueado} aria-busy={estadoCod === 'verificando'}>
                {estadoCod === 'verificando' ? <><CircleNotch className="axr-spin" size={20} weight="bold" aria-hidden="true" />Verificando…</>
                  : estadoCod === 'ok' ? <><Check size={20} weight="bold" aria-hidden="true" />Código verificado</>
                  : <>Verificar código<ArrowRight size={20} weight="bold" aria-hidden="true" /></>}
              </button>

              <div className="axl-m-foot">
                {seg > 0
                  ? <p>¿No llegó? Puedes pedir otro en <b className="ax-num">0:{String(seg).padStart(2, '0')}</b></p>
                  : <button type="button" className="axr-link" onClick={reenviar} disabled={ocupado}>Reenviar código</button>}
                <button type="button" className="axr-link" onClick={() => setPaso(0)} disabled={ocupado}>Cambiar correo</button>
              </div>
              {MODO_DEMO && <p className="axr-demo">Modo demostración: usa el código <b className="ax-num">{CODIGO_DEMO}</b>.</p>}
            </form>

            {/* Paso 2 · nueva contraseña */}
            <form {...pane(2)} noValidate onSubmit={guardar}>
              <h3 className="axl-m-t">Crea tu nueva <em className="ax-em">clave</em></h3>
              <p className="axl-m-s">Elige una contraseña que no uses en otros sitios.</p>
              {errForm && paso === 2 && <p className="axr-alert" role="alert"><WarningCircle size={20} weight="fill" aria-hidden="true" />{errForm}</p>}

              <Field id={`${uid}-pw`} data-foco="1" name="password" label="Nueva contraseña" icon={Lock} type={ver ? 'text' : 'password'} autoComplete="new-password"
                value={pw} error={errPw} right={ojo}
                onChange={(e) => { setPw(e.target.value); if (errPw) setErrPw(REQ.every((r) => r.ok(e.target.value)) ? '' : 'Tu contraseña aún no cumple los requisitos.'); if (errPw2 && pw2) setErrPw2(pw2 === e.target.value ? '' : 'Las contraseñas no coinciden.'); }}
                onBlur={() => setCaps(false)} onKeyDown={capsCheck} onKeyUp={capsCheck}
                note={caps ? <p className="axr-note axr-fade" role="status"><WarningCircle size={16} weight="fill" aria-hidden="true" />Bloq Mayús está activado.</p> : null} />

              <ul className="axr-req" aria-label="Requisitos de la contraseña">
                {REQ.map((r) => {
                  const ok = r.ok(pw);
                  return (
                    <li key={r.k} className={ok ? 'ok' : ''}>
                      <span className="dot" aria-hidden="true"><Check size={12} weight="bold" /></span>
                      {r.t}<span className="axr-sr">{ok ? ' (cumplido)' : ' (pendiente)'}</span>
                    </li>
                  );
                })}
              </ul>
              <div className="axr-meter" data-s={fz} aria-live="polite">
                <div className="axr-meter-bars" aria-hidden="true">{[0, 1, 2, 3].map((i) => <i key={i} className={i < fz ? 'on' : ''} />)}</div>
                <span>{pw ? `Seguridad: ${ETQ[fz]}` : 'Más larga y variada es más segura.'}</span>
              </div>

              <Field id={`${uid}-pw2`} name="password2" label="Repite la contraseña" icon={Lock} type={ver ? 'text' : 'password'} autoComplete="new-password"
                value={pw2} error={errPw2}
                onChange={(e) => { setPw2(e.target.value); if (errPw2) setErrPw2(e.target.value === pw ? '' : 'Las contraseñas no coinciden.'); }}
                onBlur={() => { if (pw2) setErrPw2(pw2 === pw ? '' : 'Las contraseñas no coinciden.'); }} />

              <button type="submit" className="axr-btn" disabled={cargando} aria-busy={cargando}>
                {cargando ? <><CircleNotch className="axr-spin" size={20} weight="bold" aria-hidden="true" />Guardando…</> : <>Guardar contraseña<ArrowRight size={20} weight="bold" aria-hidden="true" /></>}
              </button>
            </form>

            {/* Paso 3 · listo */}
            <div {...pane(3)}>
              <div className="axr-burst" aria-hidden="true">
                {paso === 3 && Array.from({ length: 10 }, (_, i) => <i key={i} style={{ '--a': `${i * 36}deg`, '--k': i % 2 }} />)}
                {paso === 3 && <svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="34" /><path d="M24 41 l12 12 l21 -25" /></svg>}
              </div>
              <h3 className="axl-m-t">¡Contraseña <em className="ax-em">actualizada</em>!</h3>
              <p className="axl-m-s">Ya puedes iniciar sesión con tu nueva contraseña. Por seguridad, cerramos tus otras sesiones abiertas.</p>
              <button type="button" className="axr-btn" data-foco="1" onClick={() => cerrar(() => onDone(correo.trim()))} disabled={ocupado}>
                Ir a iniciar sesión<ArrowRight size={20} weight="bold" aria-hidden="true" />
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ======================= PÁGINA ======================= */
export default function Login({ onLogin }) {
  const { surfaceRef, stageRef } = useSceneTilt(10);
  const uid = useId().replace(/:/g, '');
  const id = (k) => `${uid}-${k}`;
  const ir = useNavigate();
  const [sp] = useSearchParams(); // /login?next=/catalogo vuelve ahí después de entrar
  const formRef = useRef(null);
  const headRef = useRef(null);
  const correoRef = useRef(null);
  const passRef = useRef(null);
  const olvidoRef = useRef(null);
  const mounted = useRef(false);

  const [data, setData] = useState({ correo: '', password: '' });
  const [errors, setErrors] = useState({});
  const [focusTick, setFocusTick] = useState(0);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(null); // 'google' | 'submit' | null
  const [formError, setFormError] = useState('');
  const [errTick, setErrTick] = useState(0);
  const [recordar, setRecordar] = useState(false);
  const [done, setDone] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const [caps, setCaps] = useState(false);
  const [sug, setSug] = useState('');
  const [olvido, setOlvido] = useState(false); // modal de recuperar contraseña
  const [aviso, setAviso] = useState('');

  const emailOk = EMAIL.test(data.correo.trim());
  const hayPass = data.password.length > 0;
  const destino = destinoSeguro(sp.get('next')) || RUTA_POR_ROL[resolverRol(usuario?.rol)] || '/';

  // Si el usuario pidió recordar su correo, lo recuperamos y enfocamos la contraseña
  useEffect(() => {
    let guardado = '';
    try { guardado = localStorage.getItem(LLAVE_CORREO) || ''; } catch { /* sin almacenamiento */ }
    if (guardado) { setData((d) => ({ ...d, correo: guardado })); setRecordar(true); passRef.current?.focus(); } else { correoRef.current?.focus(); }
  }, []);

  // Enfoca el primer campo con error solo cuando el usuario intenta enviar
  useEffect(() => {
    if (focusTick) formRef.current?.querySelector('[aria-invalid="true"]')?.focus();
  }, [focusTick]);

  // Al entrar: el foco va al saludo y, tras un momento, se redirige (con botón para no esperar)
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    if (done) headRef.current?.focus({ preventScroll: true });
  }, [done]);
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => ir(destino), 2600);
    return () => clearTimeout(t);
  }, [done, destino, ir]);

  const onChange = (k) => (e) => {
    const v = e.target.value;
    setData((d) => ({ ...d, [k]: v }));
    if (k === 'correo') setSug('');
    if (formError) setFormError('');
    if (errors[k]) setErrors((er) => ({ ...er, [k]: reglas[k](v) }));
  };
  const onBlur = (k) => () => {
    if (k === 'password') setCaps(false);
    if (k === 'correo') setSug(sugerir(data.correo));
    if (k === 'correo' && data.correo !== '') setErrors((er) => ({ ...er, correo: reglas.correo(data.correo) }));
  };
  const capsCheck = (e) => setCaps(!!e.getModifierState?.('CapsLock'));

  const terminar = (u) => {
    try { if (recordar) localStorage.setItem(LLAVE_CORREO, u.correo); else localStorage.removeItem(LLAVE_CORREO); } catch { /* sin almacenamiento */ }
    setUsuario(u);
    onLogin?.(u);
    setDone(true);
  };
  const falla = (e) => {
    const cred = e?.codigo === 'credenciales';
    // Mensaje genérico a propósito: no revela si el correo existe
    setFormError(cred ? 'El correo o la contraseña no coinciden. Revisa tus datos e inténtalo de nuevo.' : 'No pudimos iniciar tu sesión. Revisa tu conexión e inténtalo de nuevo.');
    setErrTick((t) => t + 1);
    if (cred) requestAnimationFrame(() => { passRef.current?.focus(); passRef.current?.select(); });
  };

  const google = async () => {
    setLoading('google'); setFormError(''); setAviso('');
    try { terminar(await iniciarConGoogle()); } catch (e) { falla(e); } finally { setLoading(null); }
  };

  const enviar = async (ev) => {
    ev.preventDefault();
    const er = {};
    ['correo', 'password'].forEach((k) => { const m = reglas[k](data[k]); if (m) er[k] = m; });
    setErrors(er);
    if (Object.keys(er).length) { setFocusTick((t) => t + 1); return; } // no se borra lo escrito
    setLoading('submit'); setFormError(''); setAviso('');
    try { terminar(await iniciarSesion(data)); } catch (e) { falla(e); } finally { setLoading(null); }
  };

  // Al terminar la recuperación: vuelve al login con el correo listo y el foco en la contraseña
  const recuperada = (correo) => {
    setOlvido(false);
    setData({ correo, password: '' });
    setErrors({}); setFormError(''); setSug('');
    setAviso('Contraseña actualizada. Inicia sesión con tu nueva contraseña.');
    requestAnimationFrame(() => passRef.current?.focus());
  };

  // Progreso del tablero: correo válido, contraseña escrita, enviando, éxito o error
  const p = done ? 1 : loading ? 0.88 : formError ? 0.06 : (emailOk ? 0.36 : 0.04) + (hayPass ? 0.36 : 0);
  const estado = done ? '¡Motor encendido!'
    : loading ? 'Arrancando…'
    : formError ? 'Revisa tus datos'
    : emailOk && hayPass ? 'Listo para arrancar'
    : emailOk ? 'Falta tu contraseña'
    : 'En espera';
  const luces = [
    { k: 'correo', icon: Envelope, t: 'Correo', on: emailOk },
    { k: 'clave', icon: Lock, t: 'Clave', on: hayPass },
    { k: 'arranque', icon: Lightning, t: 'Arranque', on: done },
  ];

  return (
    <div className="ax">
      <Nav />

      <main>
        <section className="ax-hero ax-dark" aria-labelledby="axl-titulo">
          <GearBg gears={[{ n: 14, s: '38rem', l: '-12rem', t: '-8rem', dur: '120s' }, { n: 10, s: '26rem', l: '64%', t: '60%', rev: true, dur: '90s' }]} />
          <div className="ax-wrap ax-hero-grid axl-grid">

            {/* ---- Formulario (IZQUIERDA en escritorio) ---- */}
            <div className="axl-formcol">
              <div className="axr-form-card">
                {!done ? (
                  <form ref={formRef} noValidate onSubmit={enviar} className="axr-panel" aria-labelledby={id('t')}>
                    <h2 id={id('t')} className="axr-form-t">Iniciar sesión</h2>
                    <p className="axr-form-s">Entra para consultar piezas o administrar tu inventario.</p>

                    <button type="button" className="axr-google" onClick={google} disabled={loading !== null} aria-busy={loading === 'google'}>
                      {loading === 'google' ? <CircleNotch className="axr-spin" size={22} weight="bold" aria-hidden="true" /> : <GoogleG />}
                      <span>{loading === 'google' ? 'Conectando con Google…' : 'Continuar con Google'}</span>
                    </button>

                    <div className="axr-or" role="separator"><span>o con tu correo</span></div>

                    {aviso && <p className="axl-okmsg" role="status"><CheckCircle size={20} weight="fill" aria-hidden="true" />{aviso}</p>}
                    {formError && <p className="axr-alert" role="alert"><WarningCircle size={20} weight="fill" aria-hidden="true" />{formError}</p>}

                    <Field id={id('correo')} inputRef={correoRef} name="correo" label="Correo electrónico" icon={Envelope} type="email" inputMode="email" autoComplete="username"
                      value={data.correo} onChange={onChange('correo')} onBlur={onBlur('correo')} error={errors.correo}
                      note={sug && !errors.correo ? (
                        <p className="axr-note axr-fade">¿Quisiste decir{' '}
                          <button type="button" className="axr-sug" onClick={() => { setData((d) => ({ ...d, correo: sug })); setSug(''); setErrors((er) => ({ ...er, correo: '' })); }}>{sug}</button>?
                        </p>
                      ) : null} />

                    <Field id={id('password')} inputRef={passRef} name="password" label="Contraseña" icon={Lock} type={showPass ? 'text' : 'password'} autoComplete="current-password"
                      value={data.password} onChange={onChange('password')} onBlur={onBlur('password')} onKeyDown={capsCheck} onKeyUp={capsCheck}
                      error={errors.password}
                      note={caps ? <p className="axr-note axr-fade" role="status"><WarningCircle size={16} weight="fill" aria-hidden="true" />Bloq Mayús está activado.</p> : null}
                      right={<button type="button" className="axr-eye" onClick={() => setShowPass((v) => !v)} aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={showPass}>{showPass ? <EyeSlash size={22} weight={W} aria-hidden="true" /> : <Eye size={22} weight={W} aria-hidden="true" />}</button>} />

                    <div className="axl-row">
                      <label className="axl-check">
                        <input type="checkbox" checked={recordar} onChange={(e) => setRecordar(e.target.checked)} />
                        Recordar mi correo
                      </label>
                      <button ref={olvidoRef} type="button" className="axl-forgot" onClick={() => setOlvido(true)} aria-haspopup="dialog">¿Olvidaste tu contraseña?</button>
                    </div>

                    <button type="submit" className="axr-btn" disabled={loading !== null} aria-busy={loading === 'submit'}>
                      {loading === 'submit'
                        ? <><CircleNotch className="axr-spin" size={20} weight="bold" aria-hidden="true" />Entrando…</>
                        : <>Iniciar sesión<ArrowRight size={20} weight="bold" aria-hidden="true" /></>}
                    </button>

                    <p className="axr-login">¿Aún no tienes cuenta? <Link to="/registro">Crear cuenta</Link></p>
                  </form>
                ) : (
                  <div className="axr-panel axr-done">
                    <div className="axr-burst" aria-hidden="true">
                      {Array.from({ length: 10 }, (_, i) => <i key={i} style={{ '--a': `${i * 36}deg`, '--k': i % 2 }} />)}
                      <svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="34" /><path d="M24 41 l12 12 l21 -25" /></svg>
                    </div>
                    <h2 className="axr-form-t" ref={headRef} tabIndex={-1}>¡Qué bueno verte, {(usuario?.nombre || '').trim().split(' ')[0] || 'de nuevo'}!</h2>
                    <p className="axr-form-s">Sesión iniciada como {ROL_TXT[resolverRol(usuario?.rol)] || 'usuario'}. Te estamos llevando a tu panel.</p>
                    <div className="axl-redirect" aria-hidden="true"><i /></div>
                    <div className="axr-actions axr-actions-col">
                      <Link to={destino} className="axr-btn">Entrar ahora<ArrowRight size={20} weight="bold" aria-hidden="true" /></Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ---- Mensaje (DERECHA, arriba) ---- */}
            <div className="axl-head">
              <Reveal><Badge tone="brand">Bienvenido de vuelta</Badge></Reveal>
              <h1 id="axl-titulo" className="ax-h1" style={{ marginTop: '1.25rem' }}>
                <Words text="Arranca tu" />
                <Words text="red de refacciones." em base={2} />
              </h1>
              <Reveal delay={200}>
                <p className="ax-lede">Inicia sesión para consultar piezas, comparar opciones o administrar tu inventario en tiempo real.</p>
                <ul className="ax-checks">
                  {['Inventario en tiempo real', 'Tus datos protegidos', 'Acceso según tu rol'].map((x) => (
                    <li key={x}><CheckCircle size={18} weight="fill" aria-hidden="true" />{x}</li>
                  ))}
                </ul>
              </Reveal>
            </div>

            {/* ---- Escena 3D: tablero que se enciende mientras avanzas ---- */}
            <div ref={surfaceRef} className="ax-scene axl-scene" aria-hidden="true">
              <div ref={stageRef} className="ax-stage">
                <div className="ax-glow" />
                <div className="ax-floor"><div className="ax-floor-grid" /></div>

                <Tablero p={p} rev={!!loading} errKey={errTick} estado={estado} />

                <div className="axl-lights">
                  {luces.map((l) => (
                    <span key={l.k} className={cx('axl-light', l.on && 'on')}><l.icon size={18} weight={l.on ? 'fill' : W} />{l.t}</span>
                  ))}
                  {formError && <span className="axl-light err"><WarningCircle size={18} weight="fill" />Revisar</span>}
                </div>

                <div className="axl-chip axl-chip-a"><div className="ax-fc-in ax-glass ax-row" style={{ '--d': '0s' }}><ShieldCheck size={18} weight="fill" />Sesión segura</div></div>
                <div className="axl-chip axl-chip-b"><div className="ax-fc-in ax-glass ax-row" style={{ '--d': '-2.4s' }}><Storefront size={18} weight="fill" />Panel según tu rol</div></div>
              </div>
            </div>

          </div>
        </section>
      </main>

      <Footer />

      {olvido && <RecuperarModal correoInicial={data.correo} returnRef={olvidoRef} onClose={() => setOlvido(false)} onDone={recuperada} />}
    </div>
  );
}