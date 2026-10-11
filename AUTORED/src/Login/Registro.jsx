// Registro de usuario — AutoRed. Reutiliza los estilos de ./index.css (prefijo ax-).
// Los extras (formulario, credencial 3D, modal de verificación) llevan prefijo axr- y van al final de Index.css.
// Ubicación: src/Login/Registro.jsx
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router';
import { Badge, Reveal } from '../autored-ui';
import Nav from '../Components/Nav';
import Footer from '../Components/Footer';
import '../index.css';
import {
  Storefront, SteeringWheel, User, Envelope, Lock, Eye, EyeSlash, Check, CheckCircle,
  WarningCircle, CircleNotch, Gear, ArrowsClockwise, WhatsappLogo, ArrowRight, X,
} from '@phosphor-icons/react';

const cx = (...c) => c.filter(Boolean).join(' ');
const W = 'duotone';
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ======================= BACKEND (sustituye por el tuyo) ======================= */
// TODO: conecta con tu API / Firebase / Supabase.
//  · Google real: Firebase -> signInWithPopup(auth, new GoogleAuthProvider())
//                 o @react-oauth/google -> useGoogleLogin(). Devuelve { nombre, correo }.
//  · Crear cuenta: POST a tu endpoint con { tipo, nombre, correo, password, negocio }.
//    Con correo manual el backend envía un código de 6 dígitos y se abre el modal de verificación.
//  · Verificar: POST { correo, codigo }.  Reenviar: POST { correo }.
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function registrarConGoogle(/* tipo */) {
  await wait(900); // simulación
  return { nombre: 'Carlos Ramírez', correo: 'carlos.ramirez@gmail.com' };
}
async function crearCuenta(/* datos */) {
  await wait(1100); // simulación (con correo manual: crea la cuenta sin verificar y envía el código)
  return { ok: true };
}
const LONG = 6;
const MODO_DEMO = true;        // TODO: quítalo al conectar el backend
const CODIGO_DEMO = '123456';  // TODO: la validación real la hace tu backend
async function verificarCodigo(codigo /*, correo */) {
  await wait(900); // simulación
  return MODO_DEMO && codigo === CODIGO_DEMO;
}
async function reenviarCodigo(/* correo */) {
  await wait(600); // simulación
}

/* ======================= HOOKS ======================= */
// Inclinación con resorte del escenario 3D (decorativa: solo puntero fino, solo sobre la escena)
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

function Field({ id, label, error, note, icon: Icon, right, ...input }) {
  return (
    <div className={cx('axr-field', error && 'has-err')}>
      <label htmlFor={id}>{label}</label>
      <div className="axr-ctl">
        {Icon && <Icon className="axr-fi" size={20} weight={W} aria-hidden="true" />}
        <input id={id} aria-invalid={error ? 'true' : undefined} aria-describedby={error ? `${id}-e` : undefined} {...input} />
        {right}
      </div>
      {error && <p id={`${id}-e`} className="axr-err" role="alert"><WarningCircle size={16} weight="fill" aria-hidden="true" />{error}</p>}
      {note}
    </div>
  );
}

/* ======================= REGLAS DEL FORMULARIO ======================= */
const TIPOS = [
  { id: 'refaccionaria', icon: Storefront, t: 'Refaccionaria', d: 'Publico mi inventario' },
  { id: 'usuario', icon: SteeringWheel, t: 'Usuario', d: 'Busco refacciones' },
];
const TIPO_TXT = { refaccionaria: 'Refaccionaria', usuario: 'Usuario' };
const COPY = {
  refaccionaria: {
    sub: 'Publica tu inventario y recibe clientes por WhatsApp.',
    checks: ['Publica tu inventario en minutos', 'Clientes te escriben por WhatsApp', 'Tus datos protegidos'],
    cta: 'Crear cuenta de refaccionaria',
    listo: 'Siguiente paso: registra tu sucursal y publica tu inventario.',
  },
  usuario: {
    sub: 'Encuentra piezas compatibles con tu auto, sin llamadas ni visitas.',
    checks: ['Busca por marca, modelo y precio', 'Compara opciones y disponibilidad', 'Tus datos protegidos'],
    cta: 'Crear mi cuenta',
    listo: 'Ya puedes buscar piezas compatibles con tu auto.',
  },
};

// Errores de dedo comunes en el dominio del correo
const DOMINIOS = { 'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gamil.com': 'gmail.com', 'gmail.con': 'gmail.com', 'gmail.co': 'gmail.com', 'hotmial.com': 'hotmail.com', 'hotmal.com': 'hotmail.com', 'hotmail.con': 'hotmail.com', 'outlok.com': 'outlook.com', 'outlook.con': 'outlook.com', 'yaho.com': 'yahoo.com', 'yahoo.con': 'yahoo.com' };
const sugerir = (c) => { const [u, d] = c.trim().toLowerCase().split('@'); return u && d && DOMINIOS[d] ? `${u}@${DOMINIOS[d]}` : ''; };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const REQ = [
  { k: 'len', t: '8 caracteres o más', ok: (p) => p.length >= 8 },
  { k: 'case', t: 'Mayúscula y minúscula', ok: (p) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { k: 'num', t: 'Un número', ok: (p) => /\d/.test(p) },
];
const fuerza = (p) => REQ.filter((r) => r.ok(p)).length + (/[^A-Za-z0-9]/.test(p) && p.length >= 8 ? 1 : 0);
const ETQ = ['Muy débil', 'Débil', 'Aceptable', 'Buena', 'Fuerte'];

const reglas = {
  nombre: (v) => (v.trim().length < 2 ? 'Escribe tu nombre completo.' : ''),
  correo: (v) => (EMAIL.test(v.trim()) ? '' : 'Escribe un correo válido, por ejemplo nombre@correo.com.'),
  password: (v) => (REQ.every((r) => r.ok(v)) ? '' : 'Tu contraseña aún no cumple los requisitos.'),
  negocio: (v) => (v.trim().length < 2 ? 'Escribe el nombre de tu negocio.' : ''),
};

/* ======================= MODAL: VERIFICAR CORREO ======================= */
// Solo se abre cuando la cuenta se crea con correo y contraseña (no con Google).
function VerifyModal({ correo, onClose, onVerified, returnRef }) {
  const uid = useId().replace(/:/g, '');
  const dlg = useRef(null);
  const otp = useRef(null);
  const cajas = useRef([]);
  const timers = useRef([]);
  const [dig, setDig] = useState(() => Array(LONG).fill(''));
  const [estado, setEstado] = useState('idle'); // idle | verificando | ok
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [intentos, setIntentos] = useState(0);
  const [seg, setSeg] = useState(30);
  const [saliendo, setSaliendo] = useState(false);
  const ocupado = estado !== 'idle';
  const foco = (i) => cajas.current[i]?.focus();
  const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.current.push(t); };

  // Bloquea el scroll de fondo (sin saltos por la barra de Windows), enfoca el primer dígito y devuelve el foco al cerrar
  useEffect(() => {
    const b = document.body, ov = b.style.overflow, pr = b.style.paddingRight;
    const sb = window.innerWidth - document.documentElement.clientWidth;
    b.style.overflow = 'hidden';
    if (sb > 0) b.style.paddingRight = `${sb}px`;
    foco(0);
    const ts = timers.current;
    return () => { b.style.overflow = ov; b.style.paddingRight = pr; ts.forEach(clearTimeout); returnRef?.current?.focus(); };
  }, [returnRef]);

  // Cuenta regresiva del reenvío
  useEffect(() => {
    if (seg <= 0) return;
    const t = setTimeout(() => setSeg((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [seg]);

  const cerrar = () => {
    if (ocupado || saliendo) return;
    setSaliendo(true);
    later(onClose, reduced() ? 0 : 200);
  };

  // Esc cierra y Tab no sale del diálogo
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); cerrar(); return; }
      if (e.key !== 'Tab' || !dlg.current) return;
      const f = [...dlg.current.querySelectorAll('button:not([disabled]), input:not([disabled])')];
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  const sacudir = () => {
    if (reduced() || !otp.current?.animate) return;
    otp.current.animate(
      [{ transform: 'translateX(0)' }, { transform: 'translateX(-9px)' }, { transform: 'translateX(9px)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }],
      { duration: 400, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
    );
  };

  const verificar = async (codigo) => {
    if (codigo.length < LONG) {
      setError('Escribe los 6 dígitos del código.'); sacudir();
      foco(Math.max(0, dig.findIndex((d) => !d)));
      return;
    }
    setEstado('verificando'); setError(''); setAviso('');
    const ok = await verificarCodigo(codigo, correo);
    if (ok) { setEstado('ok'); later(onVerified, reduced() ? 700 : 1600); return; }
    setEstado('idle'); setIntentos((n) => n + 1);
    setError(intentos >= 2 ? 'Código incorrecto. Si no te llega, revisa spam o reenvía el código.' : 'Código incorrecto. Revisa tu correo e inténtalo de nuevo.');
    sacudir();
    later(() => { setDig(Array(LONG).fill('')); foco(0); }, 450);
  };

  // Reparte uno o varios dígitos (teclear, pegar o autocompletar del SMS/correo)
  const poner = (desde, texto) => {
    if (ocupado) return;
    const nums = texto.replace(/\D/g, '').slice(0, LONG - desde).split('').filter(Boolean);
    if (!nums.length) return;
    const next = [...dig];
    nums.forEach((n, k) => { next[desde + k] = n; });
    setDig(next); setError(''); setAviso('');
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
    else if (e.key === 'Enter') { e.preventDefault(); verificar(dig.join('')); }
  };
  const reenviar = async () => {
    setSeg(30); setDig(Array(LONG).fill('')); setError(''); setAviso('Te enviamos un código nuevo.'); foco(0);
    await reenviarCodigo(correo);
  };

  return createPortal(
    <div className={cx('ax axr-modal-root', saliendo && 'is-out')}>
      <div className="axr-backdrop" aria-hidden="true" />
      <div ref={dlg} className="axr-modal" role="dialog" aria-modal="true" aria-labelledby={`${uid}-t`} aria-describedby={`${uid}-d`}>
        <svg className="axr-m-gear" viewBox="0 0 200 200" aria-hidden="true"><path d={gearPath(14, 96, 80)} /><circle cx="100" cy="100" r="34" /><circle cx="100" cy="100" r="62" /></svg>
        <button type="button" className="axr-m-close" onClick={cerrar} disabled={ocupado} aria-label="Cerrar y cambiar correo"><X size={20} weight="bold" aria-hidden="true" /></button>

        <div className="axr-env" aria-hidden="true">
          <i className="axr-env-back" /><i className="axr-env-flap" /><i className="axr-env-letter"><b /><b /></i><i className="axr-env-front" />
        </div>

        <h2 id={`${uid}-t`} className="axr-m-t">Revisa tu <em className="ax-em">correo</em></h2>
        <p id={`${uid}-d`} className="axr-m-s">Enviamos un código de 6 dígitos a <b>{correo}</b>. Escríbelo para activar tu cuenta.</p>

        <div ref={otp} className={cx('axr-otp', error && 'is-err', estado === 'ok' && 'is-ok')} role="group" aria-label="Código de verificación">
          {dig.map((d, i) => (
            <input key={i} ref={(el) => { cajas.current[i] = el; }} className={d ? 'has' : undefined} style={{ '--i': i }}
              value={d} inputMode="numeric" pattern="[0-9]*" autoComplete={i === 0 ? 'one-time-code' : 'off'}
              aria-label={`Dígito ${i + 1} de ${LONG}`} aria-invalid={error ? 'true' : undefined} readOnly={ocupado}
              onFocus={(e) => e.target.select()} onChange={(e) => cambiar(i, e.target.value)} onKeyDown={(e) => teclas(i, e)}
              onPaste={(e) => { e.preventDefault(); const t = e.clipboardData.getData('text'); poner(t.replace(/\D/g, '').length >= LONG ? 0 : i, t); }} />
          ))}
        </div>

        <div className="axr-m-status" aria-live="polite">
          {estado === 'verificando' && <span className="axr-m-info"><CircleNotch className="axr-spin" size={18} weight="bold" aria-hidden="true" />Verificando…</span>}
          {estado === 'ok' && <span className="axr-m-ok"><CheckCircle size={20} weight="fill" aria-hidden="true" />¡Correo verificado! Entrando…</span>}
          {estado === 'idle' && error && <p className="axr-err" role="alert"><WarningCircle size={16} weight="fill" aria-hidden="true" />{error}</p>}
          {estado === 'idle' && !error && aviso && <span className="axr-m-info">{aviso}</span>}
        </div>

        <button type="button" className="axr-btn" onClick={() => verificar(dig.join(''))} disabled={ocupado} aria-busy={estado === 'verificando'}>
          {estado === 'verificando' ? <><CircleNotch className="axr-spin" size={20} weight="bold" aria-hidden="true" />Verificando…</>
            : estado === 'ok' ? <><Check size={20} weight="bold" aria-hidden="true" />Cuenta verificada</>
            : <>Verificar y crear cuenta<ArrowRight size={20} weight="bold" aria-hidden="true" /></>}
        </button>

        <div className="axr-m-foot">
          {seg > 0
            ? <p>¿No llegó? Puedes pedir otro código en <b className="ax-num">0:{String(seg).padStart(2, '0')}</b></p>
            : <button type="button" className="axr-link" onClick={reenviar} disabled={ocupado}>Reenviar código</button>}
          <button type="button" className="axr-link" onClick={cerrar} disabled={ocupado}>Cambiar correo</button>
        </div>

        {MODO_DEMO && <p className="axr-demo">Modo demostración: usa el código <b className="ax-num">{CODIGO_DEMO}</b>.</p>}
      </div>
    </div>,
    document.body,
  );
}

/* ======================= PÁGINA ======================= */
export default function Registro() {
  const { surfaceRef, stageRef } = useSceneTilt(10);
  const uid = useId().replace(/:/g, '');
  const id = (k) => `${uid}-${k}`;
  const formRef = useRef(null);
  const headRef = useRef(null);
  const mounted = useRef(false);

  const [sp, setSp] = useSearchParams(); // /registro?rol=usuario abre el rol directo
  const rolUrl = sp.get('rol') === 'usuario' ? 'usuario' : 'refaccionaria';
  const [data, setData] = useState({ tipo: rolUrl, nombre: '', correo: '', password: '', negocio: '' });
  const [errors, setErrors] = useState({});
  const [focusTick, setFocusTick] = useState(0);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(null); // 'google' | 'submit' | null
  const [formError, setFormError] = useState('');
  const [flip, setFlip] = useState(false);
  const [done, setDone] = useState(false);
  const [caps, setCaps] = useState(false);
  const [sug, setSug] = useState('');
  const [verif, setVerif] = useState(false);
  const [via, setVia] = useState('correo');
  const submitRef = useRef(null);

  const cardId = useMemo(() => `AR ${String(Math.floor(Math.random() * 9000) + 1000)} ${String(Math.floor(Math.random() * 9000) + 1000)}`, []);
  const esUsuario = data.tipo === 'usuario';
  const campos = esUsuario ? ['nombre', 'correo', 'password'] : ['nombre', 'correo', 'password', 'negocio'];
  const fz = fuerza(data.password);
  const nombreCard = esUsuario ? (data.nombre || 'Tu nombre') : (data.negocio || data.nombre || 'Tu negocio');

  // Enfoca el primer campo con error solo cuando el usuario intenta enviar
  useEffect(() => {
    if (focusTick) formRef.current?.querySelector('[aria-invalid="true"]')?.focus();
  }, [focusTick]);
  // Al terminar, mueve el foco al mensaje de bienvenida
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    if (done) headRef.current?.focus({ preventScroll: true });
  }, [done]);

  // Validación en línea: al salir del campo; y si ya tenía error, se corrige en vivo
  const onChange = (k) => (e) => {
    const v = e.target.value;
    setData((d) => ({ ...d, [k]: v }));
    if (k === 'correo') setSug('');
    if (errors[k] && reglas[k]) setErrors((er) => ({ ...er, [k]: reglas[k](v) }));
  };
  const onBlur = (k) => () => {
    if (k === 'password') { setFlip(false); setCaps(false); }
    if (k === 'correo') setSug(sugerir(data.correo));
    if (data[k] !== '' && reglas[k]) setErrors((er) => ({ ...er, [k]: reglas[k](data[k]) }));
  };

  const elegirRol = (e) => {
    const tipo = e.target.value;
    setData((d) => ({ ...d, tipo }));
    setErrors((er) => { const { negocio: _n, ...rest } = er; return rest; });
    setSp({ rol: tipo }, { replace: true });
  };
  const capsCheck = (e) => setCaps(!!e.getModifierState?.('CapsLock'));

  const google = async () => {
    setLoading('google'); setFormError('');
    try {
      const u = await registrarConGoogle(data.tipo);
      await crearCuenta({ tipo: data.tipo, via: 'google', ...u });
      setData((d) => ({ ...d, nombre: u.nombre, correo: u.correo }));
      setVia('google');
      setDone(true);
    } catch {
      setFormError('No pudimos conectar con Google. Inténtalo de nuevo o usa tu correo.');
    } finally { setLoading(null); }
  };

  const enviar = async (ev) => {
    ev.preventDefault();
    const er = {};
    campos.forEach((k) => { const m = reglas[k](data[k]); if (m) er[k] = m; });
    setErrors(er);
    if (Object.keys(er).length) { setFocusTick((t) => t + 1); return; } // no se borra lo escrito
    setLoading('submit'); setFormError('');
    try {
      await crearCuenta(data);
      setFlip(false);
      setVerif(true); // correo manual: pide el código de verificación (Google no pasa por aquí)
    } catch {
      setFormError('No pudimos crear tu cuenta. Revisa tu conexión e inténtalo de nuevo.');
    } finally { setLoading(null); }
  };

  return (
    <div className="ax">
      <Nav />

      <main>
        <section className="ax-hero ax-dark" aria-labelledby="axr-titulo">
          <GearBg gears={[{ n: 14, s: '38rem', l: '-12rem', t: '-8rem', dur: '120s' }, { n: 10, s: '26rem', l: '64%', t: '60%', rev: true, dur: '90s' }]} />
          <div className="ax-wrap ax-hero-grid axr-grid">

            {/* ---- Mensaje ---- */}
            <div className="axr-head">
              <Reveal><Badge tone="brand">Únete a la red de refacciones</Badge></Reveal>
              <h1 id="axr-titulo" className="ax-h1" style={{ marginTop: '1.25rem' }}>
                <Words text="Crea tu cuenta" />
                <Words text="en AutoRed." em base={3} />
              </h1>
              <Reveal delay={200}>
                <p className="ax-lede">Encuentra piezas o publica tu inventario sin llamadas ni visitas. Te toma menos de un minuto.</p>
                <ul className="ax-checks axr-fade" key={data.tipo}>
                  {COPY[data.tipo].checks.map((x) => (
                    <li key={x}><CheckCircle size={18} weight="fill" aria-hidden="true" />{x}</li>
                  ))}
                </ul>
              </Reveal>
            </div>

            {/* ---- Formulario ---- */}
            <div className="axr-formcol">
              <div className="axr-form-card">
                {!done ? (
                  <form ref={formRef} noValidate onSubmit={enviar} className="axr-panel">
                    <h2 className="axr-form-t">Crear cuenta</h2>
                    <p className="axr-form-s axr-fade" key={data.tipo}>{COPY[data.tipo].sub}</p>

                    <fieldset className="axr-roles" data-rol={data.tipo}>
                      <legend className="axr-sr">Tipo de cuenta</legend>
                      <span className="axr-thumb" aria-hidden="true" />
                      {TIPOS.map((t) => (
                        <label key={t.id} className="axr-role">
                          <input type="radio" name="tipo" className="axr-sr" value={t.id} checked={data.tipo === t.id} onChange={elegirRol} />
                          <span className="box">
                            <t.icon size={26} weight={W} aria-hidden="true" />
                            <b>{t.t}</b>
                            <small>{t.d}</small>
                          </span>
                        </label>
                      ))}
                    </fieldset>

                    <button type="button" className="axr-google" onClick={google} disabled={loading !== null} aria-busy={loading === 'google'}>
                      {loading === 'google' ? <CircleNotch className="axr-spin" size={22} weight="bold" aria-hidden="true" /> : <GoogleG />}
                      <span>{loading === 'google' ? 'Conectando con Google…' : 'Registrarme con Google'}</span>
                    </button>

                    <div className="axr-or" role="separator"><span>o con tu correo</span></div>

                    {formError && <p className="axr-alert" role="alert"><WarningCircle size={20} weight="fill" aria-hidden="true" />{formError}</p>}

                    <Field id={id('nombre')} name="nombre" label="Nombre completo" icon={User} autoComplete="name" autoFocus
                      value={data.nombre} onChange={onChange('nombre')} onBlur={onBlur('nombre')} error={errors.nombre} />
                    <div className={cx('axr-collapse', !esUsuario && 'is-open')}>
                      <div>
                        <Field id={id('negocio')} name="negocio" label="Nombre del negocio" icon={Storefront} autoComplete="organization"
                          value={data.negocio} onChange={onChange('negocio')} onBlur={onBlur('negocio')} error={errors.negocio} />
                      </div>
                    </div>

                    <Field id={id('correo')} name="correo" label="Correo electrónico" icon={Envelope} type="email" inputMode="email" autoComplete="email"
                      value={data.correo} onChange={onChange('correo')} onBlur={onBlur('correo')} error={errors.correo}
                      note={sug && !errors.correo ? (
                        <p className="axr-note axr-fade">¿Quisiste decir{' '}
                          <button type="button" className="axr-sug" onClick={() => { setData((d) => ({ ...d, correo: sug })); setSug(''); setErrors((er) => ({ ...er, correo: '' })); }}>{sug}</button>?
                        </p>
                      ) : null} />
                    <Field id={id('password')} name="password" label="Contraseña" icon={Lock} type={showPass ? 'text' : 'password'} autoComplete="new-password"
                      value={data.password} onChange={onChange('password')} onFocus={() => setFlip(true)} onBlur={onBlur('password')} onKeyDown={capsCheck} onKeyUp={capsCheck}
                      error={errors.password}
                      note={caps ? <p className="axr-note axr-fade" role="status"><WarningCircle size={16} weight="fill" aria-hidden="true" />Bloq Mayús está activado.</p> : null}
                      right={<button type="button" className="axr-eye" onClick={() => setShowPass((v) => !v)} aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={showPass}>{showPass ? <EyeSlash size={22} weight={W} aria-hidden="true" /> : <Eye size={22} weight={W} aria-hidden="true" />}</button>} />

                    {/* Requisitos visibles desde el inicio y marcados mientras escribe */}
                    <ul className="axr-req" aria-label="Requisitos de la contraseña">
                      {REQ.map((r) => {
                        const ok = r.ok(data.password);
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
                      <span>{data.password ? `Seguridad: ${ETQ[fz]}` : 'Más larga y variada es más segura.'}</span>
                    </div>

                    <button ref={submitRef} type="submit" className="axr-btn" disabled={loading !== null} aria-busy={loading === 'submit'}>
                      {loading === 'submit'
                        ? <><CircleNotch className="axr-spin" size={20} weight="bold" aria-hidden="true" />Creando cuenta…</>
                        : <>{COPY[data.tipo].cta}<ArrowRight size={20} weight="bold" aria-hidden="true" /></>}
                    </button>

                    <p className="axr-legal">Al crear tu cuenta aceptas los <a href="/terminos">Términos</a> y el <a href="/privacidad">Aviso de privacidad</a>.</p>
                    <p className="axr-login">¿Ya tienes cuenta? <Link to="/login">Iniciar sesión</Link></p>
                  </form>
                ) : (
                  <div className="axr-panel axr-done">
                    <div className="axr-burst" aria-hidden="true">
                      {Array.from({ length: 10 }, (_, i) => <i key={i} style={{ '--a': `${i * 36}deg`, '--k': i % 2 }} />)}
                      <svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="34" /><path d="M24 41 l12 12 l21 -25" /></svg>
                    </div>
                    <h2 className="axr-form-t" ref={headRef} tabIndex={-1}>¡Bienvenido a la red, {data.nombre.trim().split(' ')[0]}!</h2>
                    <p className="axr-form-s">{via === 'google' ? 'Tu cuenta quedó creada con Google.' : <>Verificamos <b>{data.correo}</b> y tu cuenta ya está activa.</>} {COPY[data.tipo].listo}</p>
                    <div className="axr-actions axr-actions-col">
                      <Link to="/" className="axr-btn">Ir al inicio<ArrowRight size={20} weight="bold" aria-hidden="true" /></Link>
                      <Link to="/acerca" className="axr-btn axr-btn-ghost">Conocer AutoRed</Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ---- Escena 3D: la credencial se llena mientras escribes ---- */}
            <div ref={surfaceRef} className="ax-scene" aria-hidden="true">
              <div ref={stageRef} className="ax-stage">
                <div className="ax-glow" />
                <div className="ax-floor"><div className="ax-floor-grid" /></div>

                <div className="axr-card">
                  <div className="axr-float">
                    <div className={cx('axr-card-in', flip && 'is-flip', done && 'is-done')}>
                      <div className="axr-face axr-front">
                        <svg className="axr-front-bg" viewBox="0 0 200 200"><path d={gearPath(16, 96, 80)} /><circle cx="100" cy="100" r="40" /></svg>
                        <div className="axr-card-top">
                          <span className="axr-brand"><Gear size={22} weight="fill" />AutoRed</span>
                          <span className="axr-tag">{TIPO_TXT[data.tipo]}</span>
                        </div>
                        <div className="axr-chipset"><i /><i /><i /></div>
                        <p className="axr-card-num ax-num">{cardId}</p>
                        <div className="axr-card-bot">
                          <p className="axr-card-name">{nombreCard}</p>
                          <p className="axr-card-city">Miembro {new Date().getFullYear()}</p>
                        </div>
                        <span className="axr-stamp">Activa</span>
                      </div>
                      <div className="axr-face axr-back">
                        <span className="axr-stripe" />
                        <p className="axr-back-t">Tu contraseña se queda contigo</p>
                        <div className="axr-sign"><span className="ax-num">{'•'.repeat(Math.min(data.password.length, 18)) || '••••••••'}</span></div>
                        <p className="axr-back-s"><Lock size={14} weight="fill" />Cifrada · {ETQ[fz]}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="axr-chip axr-chip-a"><div className="ax-fc-in ax-glass ax-row" style={{ '--d': '0s' }}><ArrowsClockwise size={18} weight="bold" />Inventario en tiempo real</div></div>
                <div className="axr-chip axr-chip-b"><div className="ax-fc-in ax-glass ax-row" style={{ '--d': '-2.4s' }}><WhatsappLogo size={18} weight="fill" />Clientes por WhatsApp</div></div>
              </div>
            </div>

          </div>
        </section>
      </main>

      <Footer />

      {verif && <VerifyModal correo={data.correo} returnRef={submitRef} onClose={() => setVerif(false)} onVerified={() => { setVerif(false); setVia('correo'); setDone(true); }} />}
    </div>
  );
}