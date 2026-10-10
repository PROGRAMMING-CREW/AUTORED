// Registro de usuario — AutoRed. Reutiliza los estilos de ./index.css (prefijo ax-).
// Los extras (formulario, credencial 3D) llevan prefijo axr- y van al final de Index.css.
// Ubicación: src/Login/Registro.jsx
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Badge, Reveal } from '../autored-ui';
import Nav from '../Components/Nav';
import Footer from '../Components/Footer';
import '../index.css';
import {
  Storefront, SteeringWheel, User, Envelope, Lock, Eye, EyeSlash, Check, CheckCircle,
  WarningCircle, CircleNotch, Gear, ArrowsClockwise, WhatsappLogo, ArrowRight,
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
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function registrarConGoogle(/* tipo */) {
  await wait(900); // simulación
  return { nombre: 'Carlos Ramírez', correo: 'carlos.ramirez@gmail.com' };
}
async function crearCuenta(/* datos */) {
  await wait(1100); // simulación
  return { ok: true };
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
      setDone(true);
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

                    <button type="submit" className="axr-btn" disabled={loading !== null} aria-busy={loading === 'submit'}>
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
                    <p className="axr-form-s">Tu cuenta quedó creada. Te enviamos un correo a <b>{data.correo}</b> para confirmarla. {COPY[data.tipo].listo}</p>
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
    </div>
  );
}