// Mi perfil — AutoRed (SOLO VISTA: aún no hay backend). Ubicación: src/Usuario/Perfil.jsx (+ Perfil.css en la misma carpeta).
// Reutiliza los estilos ax- (index.css) y los del formulario/credencial de Registro (axr-). Lo propio lleva prefijo axp-.
//
// Ruta:  { path: "/perfil", element: <Perfil /> }
// Datos editables: nombre, apellidos, fecha de nacimiento, teléfono, correo, contraseña actual y nueva.
import { useEffect, useId, useRef, useState } from 'react';
import { Badge, Reveal } from '../autored-ui';
import NavUsuario from '../Components/NavUsuario';
import Footer from '../Components/Footer';
import '../index.css';
import './Perfil.css';
import {
  User, IdentificationCard, CalendarBlank, Phone, Envelope, Lock, LockKey, Eye, EyeSlash, Check, CheckCircle,
  WarningCircle, CircleNotch, Gear, ShieldCheck, ArrowRight,
} from '@phosphor-icons/react';

const cx = (...c) => c.filter(Boolean).join(' ');
const W = 'duotone';
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ======================= BACKEND (sustituye por el tuyo) ======================= */
// TODO: conecta con tu API (PHP/MySQL), con la sesión por cookie httpOnly.
//   · GET   /perfil                       → datos iniciales del usuario en sesión
//   · PATCH /perfil                       → guarda { nombre, apellidos, nacimiento, telefono, correo }
//   · POST  /perfil/password              → { actual, nueva }  (el servidor verifica la actual y guarda el hash de la nueva)
//   · Si cambia el correo, el servidor debe enviar un código a la dirección nueva y confirmarla antes de usarla.
// Simulación: la contraseña actual "incorrecta" devuelve error; cualquier otra se acepta.
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const PERFIL_INICIAL = { nombre: 'Carlos', apellidos: 'Ramírez López', nacimiento: '1995-04-12', telefono: '55 1234 5678', correo: 'carlos.ramirez@correo.com' };
async function guardarPerfil(/* datos */) { await wait(900); return { ok: true }; }
async function cambiarPassword({ actual /*, nueva */ }) {
  await wait(1000);
  if (actual.toLowerCase() === 'incorrecta') { const e = new Error('actual'); e.codigo = 'actual'; throw e; }
  return { ok: true };
}

/* ======================= REGLAS ======================= */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NOMBRE = /^\p{L}[\p{L}\s'’.-]*$/u;
const digitos = (v) => v.replace(/\D/g, '').slice(0, 10);
const fmtTel = (v) => { const d = digitos(v); return [d.slice(0, 2), d.slice(2, 6), d.slice(6, 10)].filter(Boolean).join(' '); };
const hoyISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const DOMINIOS = { 'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gamil.com': 'gmail.com', 'gmail.con': 'gmail.com', 'gmail.co': 'gmail.com', 'hotmial.com': 'hotmail.com', 'hotmal.com': 'hotmail.com', 'hotmail.con': 'hotmail.com', 'outlok.com': 'outlook.com', 'outlook.con': 'outlook.com', 'yaho.com': 'yahoo.com', 'yahoo.con': 'yahoo.com' };
const sugerir = (c) => { const [u, d] = c.trim().toLowerCase().split('@'); return u && d && DOMINIOS[d] ? `${u}@${DOMINIOS[d]}` : ''; };
const REQ = [
  { k: 'len', t: '8 caracteres o más', ok: (p) => p.length >= 8 },
  { k: 'case', t: 'Mayúscula y minúscula', ok: (p) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { k: 'num', t: 'Un número', ok: (p) => /\d/.test(p) },
];
const fuerza = (p) => REQ.filter((r) => r.ok(p)).length + (/[^A-Za-z0-9]/.test(p) && p.length >= 8 ? 1 : 0);
const ETQ = ['Muy débil', 'Débil', 'Aceptable', 'Buena', 'Fuerte'];

const reglas = {
  nombre: (v) => (v.trim().length < 2 ? 'Escribe tu nombre.' : !NOMBRE.test(v.trim()) ? 'Usa solo letras.' : ''),
  apellidos: (v) => (v.trim().length < 2 ? 'Escribe tus apellidos.' : !NOMBRE.test(v.trim()) ? 'Usa solo letras.' : ''),
  nacimiento: (v) => (!v ? 'Escribe tu fecha de nacimiento.' : Number.isNaN(+new Date(`${v}T00:00:00`)) ? 'La fecha no es válida.' : v > hoyISO() ? 'La fecha no puede ser futura.' : v < '1900-01-01' ? 'Escribe un año a partir de 1900.' : ''),
  telefono: (v) => (digitos(v).length === 10 ? '' : 'Escribe los 10 dígitos de tu teléfono.'),
  correo: (v) => (EMAIL.test(v.trim()) ? '' : 'Escribe un correo válido, por ejemplo nombre@correo.com.'),
};
const CAMPOS = ['nombre', 'apellidos', 'nacimiento', 'telefono', 'correo'];
const ETIQUETA = { nombre: 'Nombre', apellidos: 'Apellidos', nacimiento: 'Fecha de nacimiento', telefono: 'Teléfono', correo: 'Correo electrónico' };
const limpio = (d) => JSON.stringify(CAMPOS.map((k) => String(d[k]).trim()));

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

// Mismo marcado que el Field de Registro/Login (clases axr-*); `saved` hace un destello verde tras guardar
function Field({ id, label, error, note, hint, saved, icon: Icon, right, ...input }) {
  return (
    <div className={cx('axr-field', error && 'has-err', saved && 'is-saved')}>
      <label htmlFor={id}>{label}</label>
      <div className="axr-ctl">
        {Icon && <Icon className="axr-fi" size={20} weight={W} aria-hidden="true" />}
        <input id={id} aria-invalid={error ? 'true' : undefined} aria-describedby={error ? `${id}-e` : hint ? `${id}-h` : undefined} {...input} />
        {right}
      </div>
      {error
        ? <p id={`${id}-e`} className="axr-err" role="alert"><WarningCircle size={16} weight="fill" aria-hidden="true" />{error}</p>
        : hint && <p id={`${id}-h`} className="axp-hint">{hint}</p>}
      {note}
    </div>
  );
}

const ojo = (ver, set, etiqueta) => (
  <button type="button" className="axr-eye" onClick={() => set((v) => !v)} aria-label={ver ? `Ocultar ${etiqueta}` : `Mostrar ${etiqueta}`} aria-pressed={ver}>
    {ver ? <EyeSlash size={22} weight={W} aria-hidden="true" /> : <Eye size={22} weight={W} aria-hidden="true" />}
  </button>
);

// Anillo de progreso del perfil
function Anillo({ pct }) {
  const r = 28, c = 2 * Math.PI * r;
  return (
    <div className={cx('axp-ring', pct === 100 && 'is-full')} role="img" aria-label={`Perfil completo al ${pct} por ciento`}>
      <svg viewBox="0 0 70 70" aria-hidden="true">
        <circle className="t" cx="35" cy="35" r={r} />
        <circle className="p" cx="35" cy="35" r={r} strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} />
      </svg>
      <span className="ax-num">{pct}<small>%</small></span>
    </div>
  );
}

/* ======================= PÁGINA ======================= */
export default function Perfil() {
  const uid = useId().replace(/:/g, '');
  const id = (k) => `${uid}-${k}`;
  const { surfaceRef, stageRef } = useSceneTilt(10);
  const formRef = useRef(null);
  const pwRef = useRef(null);
  const timers = useRef([]);

  const [guardado, setGuardado] = useState(PERFIL_INICIAL);
  const [data, setData] = useState(PERFIL_INICIAL);
  const [errors, setErrors] = useState({});
  const [focusTick, setFocusTick] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [errForm, setErrForm] = useState('');
  const [aviso, setAviso] = useState('');
  const [flash, setFlash] = useState([]); // campos recién guardados
  const [sug, setSug] = useState('');
  const [toast, setToast] = useState('');
  const [sello, setSello] = useState(false);
  // contraseña
  const [pw, setPw] = useState({ actual: '', nueva: '' });
  const [errPw, setErrPw] = useState({});
  const [pwTick, setPwTick] = useState(0);
  const [verAct, setVerAct] = useState(false);
  const [verNue, setVerNue] = useState(false);
  const [capsA, setCapsA] = useState(false);
  const [capsN, setCapsN] = useState(false);
  const [cargandoPw, setCargandoPw] = useState(false);
  const [errFormPw, setErrFormPw] = useState('');
  const [okPw, setOkPw] = useState('');
  const [flip, setFlip] = useState(false);

  const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.current.push(t); };
  useEffect(() => { const ts = timers.current; return () => ts.forEach(clearTimeout); }, []);

  const sucio = limpio(data) !== limpio(guardado);
  const correoCambio = data.correo.trim().toLowerCase() !== guardado.correo.trim().toLowerCase();
  const completos = CAMPOS.filter((k) => !reglas[k](data[k]));
  const pct = Math.round((completos.length / CAMPOS.length) * 100);
  const faltan = CAMPOS.filter((k) => reglas[k](data[k]));
  const fz = fuerza(pw.nueva);

  // Aviso del navegador si hay cambios sin guardar
  useEffect(() => {
    if (!sucio) return;
    const f = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', f);
    return () => window.removeEventListener('beforeunload', f);
  }, [sucio]);
  useEffect(() => { if (focusTick) formRef.current?.querySelector('[aria-invalid="true"]')?.focus(); }, [focusTick]);
  useEffect(() => { if (pwTick) pwRef.current?.querySelector('[aria-invalid="true"]')?.focus(); }, [pwTick]);

  const avisar = (txt) => { setToast(txt); later(() => setToast(''), 3500); };
  const sellar = () => { setSello(true); later(() => setSello(false), 2400); };

  /* ---- datos personales ---- */
  const onChange = (k) => (e) => {
    const v = k === 'telefono' ? fmtTel(e.target.value) : e.target.value;
    setData((d) => ({ ...d, [k]: v }));
    if (k === 'correo') setSug('');
    setAviso(''); setErrForm('');
    if (errors[k]) setErrors((er) => ({ ...er, [k]: reglas[k](v) }));
  };
  const onBlur = (k) => () => {
    if (k === 'correo') setSug(sugerir(data.correo));
    if (data[k] !== '') setErrors((er) => ({ ...er, [k]: reglas[k](data[k]) }));
  };
  const descartar = () => { setData(guardado); setErrors({}); setSug(''); setErrForm(''); setAviso(''); };
  const guardar = async (e) => {
    e.preventDefault();
    const er = {};
    CAMPOS.forEach((k) => { const m = reglas[k](data[k]); if (m) er[k] = m; });
    setErrors(er);
    if (Object.keys(er).length) { setFocusTick((t) => t + 1); return; } // no se borra lo escrito
    setCargando(true); setErrForm(''); setAviso('');
    try {
      await guardarPerfil(data);
      const cambiados = CAMPOS.filter((k) => String(data[k]).trim() !== String(guardado[k]).trim());
      const limpioD = Object.fromEntries(CAMPOS.map((k) => [k, String(data[k]).trim()]));
      setGuardado(limpioD); setData(limpioD);
      setFlash(cambiados); later(() => setFlash([]), 1600);
      setAviso(correoCambio ? `Guardamos tus datos. Falta confirmar ${limpioD.correo}: te enviaremos un código a esa dirección.` : 'Tus datos se guardaron correctamente.');
      avisar('Cambios guardados'); sellar();
    } catch { setErrForm('No pudimos guardar tus cambios. Revisa tu conexión e inténtalo de nuevo.'); }
    finally { setCargando(false); }
  };

  /* ---- contraseña ---- */
  const valPw = {
    actual: (v) => (v ? '' : 'Escribe tu contraseña actual.'),
    nueva: (v, a) => (!REQ.every((r) => r.ok(v)) ? 'Tu nueva contraseña aún no cumple los requisitos.' : v === a ? 'La nueva contraseña debe ser distinta a la actual.' : ''),
  };
  const onPw = (k) => (e) => {
    const v = e.target.value;
    const n = { ...pw, [k]: v };
    setPw(n); setOkPw(''); setErrFormPw('');
    if (errPw[k] || (k === 'actual' && errPw.nueva)) setErrPw((er) => ({ ...er, [k]: valPw[k](v, n.actual), ...(k === 'actual' && er.nueva ? { nueva: valPw.nueva(n.nueva, v) } : {}) }));
  };
  const cambiarPass = async (e) => {
    e.preventDefault();
    const er = { actual: valPw.actual(pw.actual), nueva: valPw.nueva(pw.nueva, pw.actual) };
    setErrPw(er);
    if (er.actual || er.nueva) { setPwTick((t) => t + 1); return; }
    setCargandoPw(true); setErrFormPw(''); setOkPw('');
    try {
      await cambiarPassword(pw);
      setPw({ actual: '', nueva: '' }); setErrPw({}); setFlip(false);
      setOkPw('Tu contraseña se actualizó correctamente.');
      avisar('Contraseña actualizada'); sellar();
    } catch (err) {
      if (err?.codigo === 'actual') { setErrPw({ actual: 'La contraseña actual no es correcta.' }); setPwTick((t) => t + 1); }
      else setErrFormPw('No pudimos cambiar tu contraseña. Revisa tu conexión e inténtalo de nuevo.');
    } finally { setCargandoPw(false); }
  };
  const capsCheck = (set) => (e) => set(!!e.getModifierState?.('CapsLock'));

  const irACampo = (k) => document.getElementById(id(k))?.focus();
  const nombreCard = `${data.nombre.trim()} ${data.apellidos.trim().split(' ')[0] || ''}`.trim() || 'Tu nombre';

  return (
    <div className="ax">
      <NavUsuario usuario={{ nombre: guardado.nombre }} />

      <main>
        {/* ===== HERO: tu credencial se actualiza mientras editas ===== */}
        <section className="ax-hero ax-dark axp-hero" aria-labelledby={id('h')}>
          <GearBg gears={[{ n: 14, s: '38rem', l: '-12rem', t: '-8rem', dur: '120s' }, { n: 10, s: '26rem', l: '64%', t: '60%', rev: true, dur: '90s' }]} />
          <div className="ax-wrap ax-hero-grid axp-grid">
            <div>
              <Reveal><Badge tone="brand">Mi cuenta</Badge></Reveal>
              <h1 id={id('h')} className="ax-h1" style={{ marginTop: '1.25rem' }}>
                <Words text="Tu perfil," />
                <Words text="siempre al día." em base={2} />
              </h1>
              <Reveal delay={200}>
                <p className="ax-lede">Cambia tus datos y tu contraseña cuando quieras. Tu credencial se actualiza al instante mientras escribes.</p>
                <ul className="ax-checks">
                  {['Datos personales', 'Correo y teléfono de contacto', 'Contraseña segura'].map((x) => (
                    <li key={x}><CheckCircle size={18} weight="fill" aria-hidden="true" />{x}</li>
                  ))}
                </ul>
              </Reveal>
            </div>

            <div ref={surfaceRef} className="ax-scene axp-scene" aria-hidden="true">
              <div ref={stageRef} className="ax-stage">
                <div className="ax-glow" />
                <div className="ax-floor"><div className="ax-floor-grid" /></div>
                <div className="axr-card">
                  <div className="axr-float">
                    <div className={cx('axr-card-in', flip && 'is-flip', sello && 'is-done')}>
                      <div className="axr-face axr-front">
                        <svg className="axr-front-bg" viewBox="0 0 200 200"><path d={gearPath(16, 96, 80)} /><circle cx="100" cy="100" r="40" /></svg>
                        <div className="axr-card-top">
                          <span className="axr-brand"><Gear size={22} weight="fill" />AutoRed</span>
                          <span className="axr-tag">Usuario</span>
                        </div>
                        <div className="axr-chipset"><i /><i /><i /></div>
                        <p className="axr-card-num ax-num">AR 4821 0937</p>
                        <div className="axr-card-bot">
                          <p className="axr-card-name">{nombreCard}</p>
                          <p className="axr-card-city">Miembro {new Date().getFullYear()}</p>
                        </div>
                        <span className="axr-stamp">Guardado</span>
                      </div>
                      <div className="axr-face axr-back">
                        <span className="axr-stripe" />
                        <p className="axr-back-t">Tu contraseña se queda contigo</p>
                        <div className="axr-sign"><span className="ax-num">{'•'.repeat(Math.min(pw.nueva.length, 18)) || '••••••••'}</span></div>
                        <p className="axr-back-s"><Lock size={14} weight="fill" />Cifrada · {ETQ[fz]}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="axr-chip axr-chip-a"><div className="ax-fc-in ax-glass ax-row" style={{ '--d': '0s' }}><ShieldCheck size={18} weight="fill" />Datos protegidos</div></div>
                <div className="axr-chip axr-chip-b"><div className="ax-fc-in ax-glass ax-row" style={{ '--d': '-2.4s' }}><CheckCircle size={18} weight="fill" />Perfil al {pct} %</div></div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== FORMULARIOS ===== */}
        <section className="ax-sec ax-light axp-sec" aria-label="Editar perfil">
          <div className="ax-wrap axp-layout">

            {/* ---- Resumen lateral ---- */}
            <aside className="axp-aside" aria-label="Estado de tu perfil">
              <Reveal>
                <div className="axp-sumcard">
                  <div className="axp-sum-top">
                    <Anillo pct={pct} />
                    <div>
                      <h2 className="axp-sum-t">{pct === 100 ? '¡Perfil completo!' : 'Completa tu perfil'}</h2>
                      <p className="axp-sum-s">{pct === 100 ? 'Tienes todos tus datos al día.' : `Te ${faltan.length === 1 ? 'falta 1 dato' : `faltan ${faltan.length} datos`}.`}</p>
                    </div>
                  </div>
                  <ul className="axp-check" aria-label="Datos del perfil">
                    {CAMPOS.map((k, i) => {
                      const ok = !reglas[k](data[k]);
                      return (
                        <li key={k} className={ok ? 'is-ok' : ''} style={{ '--i': i }}>
                          {ok
                            ? <span className="axp-it"><span className="dot" aria-hidden="true"><Check size={12} weight="bold" /></span>{ETIQUETA[k]}</span>
                            : <button type="button" className="axp-it axp-it-btn" onClick={() => irACampo(k)}><span className="dot" aria-hidden="true" />{ETIQUETA[k]}<ArrowRight size={14} weight="bold" aria-hidden="true" /></button>}
                        </li>
                      );
                    })}
                  </ul>
                  <button type="button" className="axp-jump" onClick={() => document.getElementById(id('seg'))?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' })}>
                    <LockKey size={18} weight={W} aria-hidden="true" />Ir a cambiar contraseña
                  </button>
                </div>
              </Reveal>
            </aside>

            {/* ---- Formularios ---- */}
            <div className="axp-forms">
              <Reveal>
                <form ref={formRef} className="axp-card" noValidate onSubmit={guardar} aria-labelledby={id('dt')}>
                  <header className="axp-card-h">
                    <span className="ax-ico"><User size={28} weight={W} aria-hidden="true" /></span>
                    <div><h2 id={id('dt')} className="ax-card-t">Datos personales</h2><p className="axp-card-s">Así aparecerás en tu cuenta y ante las refaccionarias.</p></div>
                  </header>

                  {aviso && <p className="axp-ok" role="status"><CheckCircle size={20} weight="fill" aria-hidden="true" />{aviso}</p>}
                  {errForm && <p className="axr-alert" role="alert"><WarningCircle size={20} weight="fill" aria-hidden="true" />{errForm}</p>}

                  <div className="axp-fields">
                    <Field id={id('nombre')} name="nombre" label="Nombre(s)" icon={User} autoComplete="given-name" value={data.nombre} onChange={onChange('nombre')} onBlur={onBlur('nombre')} error={errors.nombre} saved={flash.includes('nombre')} />
                    <Field id={id('apellidos')} name="apellidos" label="Apellidos" icon={IdentificationCard} autoComplete="family-name" value={data.apellidos} onChange={onChange('apellidos')} onBlur={onBlur('apellidos')} error={errors.apellidos} saved={flash.includes('apellidos')} />
                    <Field id={id('nacimiento')} name="nacimiento" label="Fecha de nacimiento" icon={CalendarBlank} type="date" min="1900-01-01" max={hoyISO()} autoComplete="bday" value={data.nacimiento} onChange={onChange('nacimiento')} onBlur={onBlur('nacimiento')} error={errors.nacimiento} saved={flash.includes('nacimiento')} />
                    <Field id={id('telefono')} name="telefono" label="Teléfono" icon={Phone} type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="55 1234 5678" value={data.telefono} onChange={onChange('telefono')} onBlur={onBlur('telefono')} error={errors.telefono} saved={flash.includes('telefono')} hint="10 dígitos, sin lada internacional." />
                    <div className="axp-wide">
                      <Field id={id('correo')} name="correo" label="Correo electrónico" icon={Envelope} type="email" inputMode="email" autoComplete="email" value={data.correo} onChange={onChange('correo')} onBlur={onBlur('correo')} error={errors.correo} saved={flash.includes('correo')}
                        note={sug && !errors.correo ? (
                          <p className="axr-note axr-fade">¿Quisiste decir{' '}
                            <button type="button" className="axr-sug" onClick={() => { setData((d) => ({ ...d, correo: sug })); setSug(''); setErrors((er) => ({ ...er, correo: '' })); }}>{sug}</button>?
                          </p>
                        ) : correoCambio && !errors.correo ? (
                          <p className="axr-note axr-fade"><WarningCircle size={16} weight="fill" aria-hidden="true" />Te enviaremos un código a este correo para confirmarlo.</p>
                        ) : null} />
                    </div>
                  </div>

                  <div className="axp-actions">
                    <p className={cx('axp-dirty', sucio && 'on')} role="status">
                      <i aria-hidden="true" />{sucio ? 'Tienes cambios sin guardar' : 'Todo guardado'}
                    </p>
                    <button type="button" className="axp-btn axp-btn-ghost" onClick={descartar} disabled={!sucio || cargando}>Descartar</button>
                    <button type="submit" className="axp-btn" disabled={cargando} aria-busy={cargando}>
                      {cargando ? <><CircleNotch className="axr-spin" size={18} weight="bold" aria-hidden="true" />Guardando…</> : <><Check size={18} weight="bold" aria-hidden="true" />Guardar cambios</>}
                    </button>
                  </div>
                </form>
              </Reveal>

              <Reveal delay={80}>
                <form ref={pwRef} id={id('seg')} className="axp-card" noValidate onSubmit={cambiarPass} aria-labelledby={id('st')}>
                  <header className="axp-card-h">
                    <span className="ax-ico"><LockKey size={28} weight={W} aria-hidden="true" /></span>
                    <div><h2 id={id('st')} className="ax-card-t">Cambiar contraseña</h2><p className="axp-card-s">Escribe la actual y elige una nueva que no uses en otros sitios.</p></div>
                  </header>

                  {okPw && <p className="axp-ok" role="status"><CheckCircle size={20} weight="fill" aria-hidden="true" />{okPw}</p>}
                  {errFormPw && <p className="axr-alert" role="alert"><WarningCircle size={20} weight="fill" aria-hidden="true" />{errFormPw}</p>}

                  <div className="axp-fields">
                    <Field id={id('actual')} name="actual" label="Contraseña actual" icon={Lock} type={verAct ? 'text' : 'password'} autoComplete="current-password"
                      value={pw.actual} onChange={onPw('actual')} onBlur={() => setCapsA(false)} onKeyDown={capsCheck(setCapsA)} onKeyUp={capsCheck(setCapsA)} error={errPw.actual}
                      right={ojo(verAct, setVerAct, 'contraseña actual')}
                      note={capsA ? <p className="axr-note axr-fade" role="status"><WarningCircle size={16} weight="fill" aria-hidden="true" />Bloq Mayús está activado.</p> : null} />
                    <Field id={id('nueva')} name="nueva" label="Nueva contraseña" icon={LockKey} type={verNue ? 'text' : 'password'} autoComplete="new-password"
                      value={pw.nueva} onChange={onPw('nueva')} onFocus={() => setFlip(true)} onBlur={() => { setFlip(false); setCapsN(false); }} onKeyDown={capsCheck(setCapsN)} onKeyUp={capsCheck(setCapsN)} error={errPw.nueva}
                      right={ojo(verNue, setVerNue, 'nueva contraseña')}
                      note={capsN ? <p className="axr-note axr-fade" role="status"><WarningCircle size={16} weight="fill" aria-hidden="true" />Bloq Mayús está activado.</p> : null} />
                  </div>

                  <ul className="axr-req" aria-label="Requisitos de la nueva contraseña">
                    {REQ.map((r) => {
                      const ok = r.ok(pw.nueva);
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
                    <span>{pw.nueva ? `Seguridad: ${ETQ[fz]}` : 'Más larga y variada es más segura.'}</span>
                  </div>

                  <div className="axp-actions">
                    <button type="submit" className="axp-btn" disabled={cargandoPw} aria-busy={cargandoPw}>
                      {cargandoPw ? <><CircleNotch className="axr-spin" size={18} weight="bold" aria-hidden="true" />Actualizando…</> : <><LockKey size={18} weight="bold" aria-hidden="true" />Actualizar contraseña</>}
                    </button>
                  </div>
                </form>
              </Reveal>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {toast && <div className="axp-toast" role="status" key={toast}><CheckCircle size={20} weight="fill" aria-hidden="true" />{toast}</div>}
    </div>
  );
}
