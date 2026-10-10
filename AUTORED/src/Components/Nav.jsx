// Navegación de AutoRed — UN SOLO archivo para todos los roles.
//
//   <Nav />                                              → visitante (Iniciar sesión / Registro)
//   <Nav usuario={{ nombre: 'Ana', rol: 'admin' }} onSalir={cerrarSesion} />
//   <Nav rol="comprador" usuario={{ nombre: 'Luis' }} onSalir={cerrarSesion} />
//
// El rol se valida: si no es uno conocido (o viene vacío) se muestra la barra pública,
// nunca un menú de administrador por error.
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router';
import { List, X } from '@phosphor-icons/react';
import { Badge, Button } from '../autored-ui';
import logo from '../assets/autored.png';

const cx = (...c) => c.filter(Boolean).join(' ');

/* ======================= CONFIGURACIÓN POR ROL (edita aquí las rutas) ======================= */
const PUBLICO = {
  inicio: '/',
  etiqueta: null,
  enlaces: [
    { href: '#problema', label: 'Problemática' },
    { href: '#solucion', label: 'Solución' },
    { href: '#funciones', label: 'Funciones' },
    { href: '#identidad', label: 'Misión y visión' },
  ],
};

const ROLES = {
  admin: {
    inicio: '/admin',
    etiqueta: 'Administrador',
    enlaces: [
      { to: '/admin', label: 'Panel', end: true },
      { to: '/admin/usuarios', label: 'Usuarios' },
      { to: '/admin/refaccionarias', label: 'Refaccionarias' },
      { to: '/admin/productos', label: 'Productos' },
      { to: '/admin/reportes', label: 'Reportes' },
    ],
  },
  comprador: {
    inicio: '/catalogo',
    etiqueta: 'Comprador',
    enlaces: [
      { to: '/catalogo', label: 'Catálogo' },
      { to: '/comparar', label: 'Comparar' },
      { to: '/sucursales', label: 'Sucursales' },
      { to: '/asistente', label: 'Asistente IA' },
    ],
  },
  refaccionaria: {
    inicio: '/refaccionaria',
    etiqueta: 'Refaccionaria',
    enlaces: [
      { to: '/refaccionaria', label: 'Panel', end: true },
      { to: '/refaccionaria/productos', label: 'Mis productos' },
      { to: '/refaccionaria/inventario', label: 'Inventario' },
      { to: '/refaccionaria/negocio', label: 'Mi negocio' },
    ],
  },
};

// Nombres alternativos que puede traer tu base de datos
const ALIAS = {
  administrador: 'admin',
  usuario: 'comprador',
  cliente: 'comprador',
  distribuidor: 'refaccionaria',
};

// Valida el rol: devuelve 'admin' | 'comprador' | 'refaccionaria' o null si no es válido
export function resolverRol(valor) {
  const r = String(valor ?? '').trim().toLowerCase();
  const clave = ALIAS[r] ?? r;
  return Object.prototype.hasOwnProperty.call(ROLES, clave) ? clave : null;
}

/* ======================= PIEZAS ======================= */
// NavLink pone aria-current="page" en la ruta activa; aquí solo se le da estilo.
const enlaceEscritorio =
  'nav-link aria-[current=page]:!text-brand-300 aria-[current=page]:underline aria-[current=page]:decoration-2 aria-[current=page]:decoration-brand-500 aria-[current=page]:underline-offset-8';
const enlaceMovil =
  'block rounded-xl px-3 py-3 text-base font-medium text-white/90 hover:bg-white/10 aria-[current=page]:bg-white/10 aria-[current=page]:text-white';

function Enlace({ e, className, ...props }) {
  if (e.to) return <NavLink to={e.to} end={e.end} className={className} {...props}>{e.label}</NavLink>;
  return <a href={e.href} className={className} {...props}>{e.label}</a>;
}

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

// Usuario con sesión: inicial + nombre + salir
function SesionUsuario({ usuario, onSalir, full }) {
  const nombre = usuario?.nombre || 'Mi cuenta';
  return (
    <div className={cx('flex items-center gap-2', full && 'w-full justify-between')}>
      <span className={cx('items-center gap-2 text-sm font-medium text-white', full ? 'inline-flex' : 'hidden lg:inline-flex')}>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-600 font-semibold text-white" aria-hidden="true">
          {nombre.charAt(0).toUpperCase()}
        </span>
        <span className="max-w-[10rem] truncate">{nombre}</span>
      </span>
      <Button size="sm" variant="secondary" onClick={onSalir}>Cerrar sesión</Button>
    </div>
  );
}

/* ======================= NAV ======================= */
export default function Nav({ rol, usuario, onSalir }) {
  const ir = useNavigate();
  const [abierto, setAbierto] = useState(false);
  const panel = useRef(null);

  // Validación: el rol puede venir como prop o dentro de `usuario`
  const pedido = rol ?? usuario?.rol;
  const clave = resolverRol(pedido);
  const cfg = clave ? ROLES[clave] : PUBLICO;
  if (import.meta.env.DEV && pedido && !clave) {
    console.warn(`[Nav] Rol "${pedido}" no reconocido; se muestra la barra pública. Válidos: ${Object.keys(ROLES).join(', ')}.`);
  }

  const acciones = (full) => clave ? (
    <SesionUsuario usuario={usuario} onSalir={onSalir} full={full} />
  ) : (
    <>
      <Button size="sm" variant="secondary" className={full ? 'w-full' : undefined} onClick={() => ir('/login')}>Iniciar sesión</Button>
      <Button size="sm" effect="shine" className={full ? 'w-full' : undefined} onClick={() => ir('/registro')}>Registro</Button>
    </>
  );

  // Cerrado = inert: ni el foco ni los lectores de pantalla entran al panel oculto
  useEffect(() => {
    const el = panel.current;
    if (!el) return;
    if (abierto) el.removeAttribute('inert'); else el.setAttribute('inert', '');
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;
    const f = (e) => { if (e.key === 'Escape') setAbierto(false); };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, [abierto]);

  return (
    <header className="nav-dark">
      <div className="page mx-auto flex h-16 max-w-7xl items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Logo to={cfg.inicio} />
          {cfg.etiqueta && <span className="hidden lg:inline-flex"><Badge tone="brand">{cfg.etiqueta}</Badge></span>}
        </div>

        <nav className="hidden items-center gap-7 md:flex" aria-label={cfg.etiqueta ? `Navegación de ${cfg.etiqueta.toLowerCase()}` : 'Secciones'}>
          {cfg.enlaces.map((e) => <Enlace key={e.to || e.href} e={e} className={enlaceEscritorio} />)}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 md:flex">{acciones(false)}</div>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white md:hidden"
            aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={abierto}
            aria-controls="menu-movil"
            onClick={() => setAbierto((v) => !v)}
          >
            {abierto ? <X size={24} aria-hidden="true" /> : <List size={24} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Menú móvil: se abre con una transición de altura (grid-rows 0fr → 1fr) */}
      <div
        id="menu-movil"
        ref={panel}
        className={cx('grid transition-[grid-template-rows] duration-300 ease-out md:hidden', abierto ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}
      >
        <div className="overflow-hidden">
          <nav className="page mx-auto max-w-7xl pb-4" aria-label="Menú móvil">
            <ul className="grid gap-1">
              {cfg.enlaces.map((e) => (
                <li key={e.to || e.href}><Enlace e={e} className={enlaceMovil} onClick={() => setAbierto(false)} /></li>
              ))}
            </ul>
            <div className="mt-3 grid gap-2 border-t border-white/15 pt-3">{acciones(true)}</div>
          </nav>
        </div>
      </div>
    </header>
  );
}