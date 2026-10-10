// Navegación de AutoRed — componente independiente (barra oscura + menú móvil).
import { useState } from 'react';
import { Link } from 'react-router';
import { List, X } from '@phosphor-icons/react';
import { Button } from '../autored-ui';
const enlaces = [
  { href: '#problema', label: 'Problemática' },
  { href: '#solucion', label: 'Solución' },
  { href: '#funciones', label: 'Funciones' },
  { href: '#identidad', label: 'Misión y visión' },
];

const irA = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

export default function Nav() {
  const [abierto, setAbierto] = useState(false);

  return (
    <header className="nav-dark">
      <div className="page mx-auto flex h-16 max-w-7xl items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5" aria-label="AutoRed, inicio">
          <span className="grid h-8 w-8 place-items-center rounded-control bg-brand-600 font-display text-lg font-bold text-white">A</span>
          <span className="font-display text-2xl font-semibold text-white">autored</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Secciones">
          {enlaces.map((e) => (
            <a key={e.href} className="nav-link" href={e.href}>{e.label}</a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button size="sm" effect="shine" onClick={() => irA('funciones')}>Conocer más</Button>
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
        className={`grid transition-[grid-template-rows] duration-300 ease-out md:hidden ${abierto ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <nav className="overflow-hidden" aria-label="Secciones (móvil)">
          <ul className="page mx-auto grid max-w-7xl gap-1 pb-4">
            {enlaces.map((e) => (
              <li key={e.href}>
                <a
                  href={e.href}
                  tabIndex={abierto ? 0 : -1}
                  onClick={() => setAbierto(false)}
                  className="block rounded-xl px-3 py-3 text-base font-medium text-white/90 hover:bg-white/10"
                >
                  {e.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
