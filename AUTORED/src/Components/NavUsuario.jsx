import { useEffect, useId, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router';
import { CaretDown, List, X, SignOut } from '@phosphor-icons/react';
import { Badge, Button } from '../autored-ui';
import { resolverRol } from './Nav';
import logo from '../assets/autored.png';

const cx = (...c) => c.filter(Boolean).join(' ');

// Fondo de la barra (cambia 'FONDO_AL_BAJAR' a 'transparent' si la quieres 100 % transparente siempre)
const FONDO_AL_BAJAR = 'rgb(18 10 11 / 0.55)';
const FONDO_MENU = 'rgb(18 10 11 / 0.94)';
const BLUR = 'blur(14px) saturate(160%)';

/* ======================= CONFIGURACIÓN (edita aquí las rutas) ======================= */
const INICIO = '/inicio'; // tu ruta de Inicio (router: { path: "/inicio", element: <Inicio /> })
const PERFIL = '/perfil';
const ENLACES = [
  { to: INICIO, label: 'Inicio', end: true },
  { to: '/catalogo', label: 'Catálogo' },
  { to: '/sucursales', label: 'Sucursales' },
];
// Opciones extra del menú de "Mi perfil" (antes de "Cerrar sesión"). Ej.: { to: '/mis-cotizaciones', label: 'Mis cotizaciones' }
const MENU_PERFIL = [
  { to: PERFIL, label: 'Ver mi perfil' },
];

/* ======================= ESTILOS (los mismos de Nav.jsx) ======================= */
const enlaceEscritorio =
  'nav-link text-sm font-semibold text-white/90 [text-shadow:0_1px_8px_rgb(0_0_0/0.45)] transition-colors duration-150 hover:!text-brand-300 aria-[current=page]:!text-brand-300 aria-[current=page]:underline aria-[current=page]:decoration-2 aria-[current=page]:decoration-brand-500 aria-[current=page]:underline-offset-8';
const enlaceMovil =
  'block rounded-xl px-3 py-3 text-base font-medium text-white/90 hover:bg-white/10 aria-[current=page]:bg-white/10 aria-[current=page]:text-white';
const itemMenu =
  'flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-white/90 transition-colors duration-150 hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white aria-[current=page]:bg-white/10 aria-[current=page]:text-white';

function Logo({ to }) {
  return (
    <Link
      to={to}
      aria-label="AutoRed, inicio"
      className="flex shrink-0 items-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
    >
      <img
        src={logo}
        alt=""
        width="56"
        height="56"
        decoding="async"
        className="h-14 w-14 rounded-full object-cover transition-transform duration-200 ease-out hover:scale-105 active:scale-95"
      />
    </Link>
  );
}

/* ======================= BOTÓN "MI PERFIL" CON MENÚ ======================= */
function MenuPerfil({ usuario, onSalir }) {
  const uid = useId().replace(/:/g, '');
  const [abierto, setAbierto] = useState(false);
  const caja = useRef(null);
  const boton = useRef(null);
  const lista = useRef(null);
  const { pathname } = useLocation();
  const enPerfil = pathname === PERFIL || pathname.startsWith(`${PERFIL}/`);
  const items = () => [...(lista.current?.querySelectorAll('[role="menuitem"]') ?? [])];

  const cerrar = (devolverFoco = false) => {
    setAbierto(false);
    if (devolverFoco) boton.current?.focus();
  };

  // Clic fuera, Esc y cambio de ruta lo cierran
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e) => { if (!caja.current?.contains(e.target)) setAbierto(false); };
    const tecla = (e) => { if (e.key === 'Escape') { e.preventDefault(); cerrar(true); } };
    document.addEventListener('pointerdown', fuera);
    document.addEventListener('keydown', tecla);
    return () => { document.removeEventListener('pointerdown', fuera); document.removeEventListener('keydown', tecla); };
  }, [abierto]);
  useEffect(() => { setAbierto(false); }, [pathname]);

  // Al abrirlo con teclado, el foco entra al primer elemento
  const abrirConFoco = (ultimo = false) => {
    setAbierto(true);
    requestAnimationFrame(() => { const it = items(); (ultimo ? it[it.length - 1] : it[0])?.focus(); });
  };
  const teclasBoton = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); abrirConFoco(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); abrirConFoco(true); }
  };
  const teclasMenu = (e) => {
    const it = items(), i = it.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); it[(i + 1) % it.length]?.focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); it[(i - 1 + it.length) % it.length]?.focus(); }
    else if (e.key === 'Home') { e.preventDefault(); it[0]?.focus(); }
    else if (e.key === 'End') { e.preventDefault(); it[it.length - 1]?.focus(); }
    else if (e.key === 'Tab') setAbierto(false);
  };

  return (
    <div ref={caja} className="relative">
      <button
        ref={boton}
        type="button"
        className="btn btn-sm btn-secondary aria-[current=page]:ring-2 aria-[current=page]:ring-brand-400"
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-controls={`${uid}-menu`}
        aria-current={enPerfil ? 'page' : undefined}
        onClick={() => setAbierto((v) => !v)}
        onKeyDown={teclasBoton}
      >
        Mi perfil
        <CaretDown size={16} weight="bold" aria-hidden="true" className={cx('transition-transform duration-200 ease-out', abierto && 'rotate-180')} />
      </button>

      {abierto && (
        <div
          id={`${uid}-menu`}
          ref={lista}
          role="menu"
          aria-label="Mi perfil"
          onKeyDown={teclasMenu}
          className="animate-rise absolute right-0 top-full z-50 mt-2 w-64 origin-top-right rounded-surface border border-white/15 bg-ink-900 p-2 text-white shadow-pop"
        >
          <div className="px-3 pb-2 pt-1.5" role="none">
            <p className="text-xs text-white/60">Sesión iniciada como</p>
            <p className="truncate text-sm font-semibold">{usuario?.nombre || 'Mi cuenta'}</p>
          </div>
          <div className="my-1 h-px bg-white/15" role="separator" />
          {MENU_PERFIL.map((e) => (
            <NavLink key={e.to} to={e.to} end role="menuitem" className={itemMenu} onClick={() => cerrar()}>{e.label}</NavLink>
          ))}
          <button type="button" role="menuitem" className={cx(itemMenu, 'text-brand-300')} onClick={() => { cerrar(); onSalir?.(); }}>
            <SignOut size={18} weight="bold" aria-hidden="true" />Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

/* ======================= NAV ======================= */
export default function NavUsuario({ usuario, onSalir, menuPerfil = true, superpuesto = true, siempreVidrio = false }) {
  const ir = useNavigate();
  const { pathname } = useLocation();
  const nombre = usuario?.nombre?.trim() || '';
  const [abierto, setAbierto] = useState(false);
  const [bajo, setBajo] = useState(false);
  const panel = useRef(null);

  // Esta barra es solo para compradores: si llega otro rol válido, avisa en desarrollo
  const clave = resolverRol(usuario?.rol);
  if (import.meta.env.DEV && clave && clave !== 'comprador') {
    console.warn(`[NavUsuario] Rol "${clave}" recibido; esta barra es para "comprador". Usa <Nav usuario={...} /> para los demás roles.`);
  }

 const enPerfil = pathname === PERFIL || pathname.startsWith(`${PERFIL}/`);
// Cerrar sesión: llama a tu función (o, si no pasas ninguna, va a /login)
const salirTodo = () => {
  if (onSalir) onSalir(); else ir('/login', { replace: true });
};
const salir = () => { setAbierto(false); salirTodo(); };

  // La barra sigue al usuario y se vuelve "cristal" en cuanto baja
  useEffect(() => {
    const f = () => setBajo((v) => { const n = window.scrollY > 8; return v === n ? v : n; });
    f();
    window.addEventListener('scroll', f, { passive: true });
    return () => window.removeEventListener('scroll', f);
  }, []);
  const vidrio = siempreVidrio || bajo || abierto;
  const fondo = abierto ? FONDO_MENU : vidrio ? FONDO_AL_BAJAR : 'transparent';

  // Cerrado = inert: ni el foco ni los lectores de pantalla entran al panel oculto
  useEffect(() => {
    const el = panel.current;
    if (!el) return;
    if (abierto) el.removeAttribute('inert'); else el.setAttribute('inert', '');
  }, [abierto]);
  useEffect(() => { setAbierto(false); }, [pathname]);
  useEffect(() => {
    if (!abierto) return;
    const f = (e) => { if (e.key === 'Escape') setAbierto(false); };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, [abierto]);

  return (
    <header
      className={cx('nav-dark sticky top-0 z-50 transition-[background-color,backdrop-filter,box-shadow,border-color] duration-300 ease-out', superpuesto && '-mb-16')}
      style={{
        background: fondo,
        backdropFilter: vidrio ? BLUR : 'none',
        WebkitBackdropFilter: vidrio ? BLUR : 'none',
        borderBottom: `1px solid ${vidrio ? 'rgb(255 255 255 / 0.12)' : 'transparent'}`,
        boxShadow: bajo ? '0 12px 30px -18px rgb(0 0 0 / 0.65)' : 'none',
      }}
    >
      <div className="page mx-auto flex h-16 max-w-7xl items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Logo to={INICIO} />
          <span className="hidden lg:inline-flex" title={nombre ? `Sesión de ${nombre}` : undefined}><Badge tone="brand"><span className="block max-w-[12rem] truncate">{nombre || 'Mi cuenta'}</span></Badge></span>
        </div>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Navegación principal">
          {ENLACES.map((e) => <NavLink key={e.to} to={e.to} end={e.end} className={enlaceEscritorio}>{e.label}</NavLink>)}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 md:flex">
            {menuPerfil ? (
              <MenuPerfil usuario={usuario} onSalir={salirTodo} />
            ) : (
              <>
                <Button size="sm" variant="secondary" aria-current={enPerfil ? 'page' : undefined} onClick={() => ir(PERFIL)}>Mi perfil</Button>
                <Button size="sm" variant="ghost" onClick={salirTodo}>Cerrar sesión</Button>
              </>
            )}
          </div>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white md:hidden"
            aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={abierto}
            aria-controls="menu-movil-usuario"
            onClick={() => setAbierto((v) => !v)}
          >
            {abierto ? <X size={24} aria-hidden="true" /> : <List size={24} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Menú móvil: se abre con una transición de altura (grid-rows 0fr → 1fr) */}
      <div
        id="menu-movil-usuario"
        ref={panel}
        className={cx('grid transition-[grid-template-rows] duration-300 ease-out md:hidden', abierto ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}
      >
        <div className="overflow-hidden">
          <nav className="page mx-auto max-w-7xl pb-4" aria-label="Menú móvil">
            <ul className="grid gap-1">
              {ENLACES.map((e) => (
                <li key={e.to}><NavLink to={e.to} end={e.end} className={enlaceMovil} onClick={() => setAbierto(false)}>{e.label}</NavLink></li>
              ))}
            </ul>
            <div className="mt-3 grid gap-2 border-t border-white/15 pt-3">
              <p className="px-1 text-sm text-white/70">Sesión de <span className="font-semibold text-white">{nombre || 'mi cuenta'}</span></p>
              <Button size="sm" variant="secondary" className="w-full" aria-current={enPerfil ? 'page' : undefined} onClick={() => { setAbierto(false); ir(PERFIL); }}>Mi perfil</Button>
              <Button size="sm" variant="ghost" className="w-full" onClick={salir}>Cerrar sesión</Button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}