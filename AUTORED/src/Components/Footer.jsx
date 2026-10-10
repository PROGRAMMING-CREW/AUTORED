// Footer de AutoRed — componente independiente. Fondo oscuro con texto de alto contraste.
import { Link } from 'react-router';
import { ArrowUp, MapPin, WhatsappLogo, ShieldCheck } from '@phosphor-icons/react';

const secciones = [
  { href: '#problema', label: 'Problemática' },
  { href: '#solucion', label: 'Solución' },
  { href: '#funciones', label: 'Funcionalidades' },
  { href: '#identidad', label: 'Misión y visión' },
];

const plataforma = [
  'Catálogo de refacciones',
  'Comparación de productos',
  'Consulta de sucursales',
  'Chatbot con IA',
];

const linkCls =
  'text-[0.9375rem] text-white/80 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';

export default function Footer() {
  const arriba = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer className="bg-ink-900 text-white">
      <div className="page mx-auto max-w-7xl py-14 sm:py-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Marca */}
          <div>
            <Link to="/" className="inline-flex items-center gap-2.5" aria-label="AutoRed, inicio">
              <span className="grid h-9 w-9 place-items-center rounded-control bg-brand-600 font-display text-lg font-bold text-white">A</span>
              <span className="font-display text-2xl font-semibold">autored</span>
            </Link>
            <p className="mt-4 max-w-xs text-[0.9375rem] leading-relaxed text-white/80">
              La red que conecta refaccionarias y distribuidoras para encontrar la pieza correcta sin llamadas ni visitas.
            </p>
            <p className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-white/90">
              <ShieldCheck size={20} weight="duotone" aria-hidden="true" />
              Información de clientes e inventarios protegida
            </p>
          </div>

          {/* Secciones */}
          <nav aria-label="Secciones del sitio">
            <h2 className="text-sm font-semibold text-white">Explora</h2>
            <ul className="mt-4 grid gap-2.5">
              {secciones.map((s) => (
                <li key={s.href}><a className={linkCls} href={s.href}>{s.label}</a></li>
              ))}
            </ul>
          </nav>

          {/* Plataforma */}
          <div>
            <h2 className="text-sm font-semibold text-white">Plataforma</h2>
            <ul className="mt-4 grid gap-2.5">
              {plataforma.map((p) => (
                <li key={p}><a className={linkCls} href="#funciones">{p}</a></li>
              ))}
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h2 className="text-sm font-semibold text-white">Contacto</h2>
            <ul className="mt-4 grid gap-2.5 text-[0.9375rem] text-white/80">
              <li className="inline-flex items-center gap-2"><WhatsappLogo size={18} weight="fill" aria-hidden="true" />WhatsApp directo con el distribuidor</li>
              <li className="inline-flex items-center gap-2"><MapPin size={18} weight="fill" aria-hidden="true" />Sucursales registradas en la red</li>
              <li><Link to="/acerca" className={linkCls}>Acerca de AutoRed</Link></li>
            </ul>
          </div>
        </div>

        {/* Barra inferior */}
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/20 pt-6">
          <p className="text-sm text-white/75">© 2026 AutoRed. Red de refaccionarias y distribuidoras.</p>
          <button
            type="button"
            onClick={arriba}
            className="inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white hover:text-ink-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <ArrowUp size={16} weight="bold" aria-hidden="true" />
            Volver arriba
          </button>
        </div>
      </div>
    </footer>
  );
}
