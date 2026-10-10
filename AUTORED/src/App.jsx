import { Routes, Route, Link, useLocation } from 'react-router';
import { useEffect } from 'react';
import Index from './Index';

// Vuelve arriba al cambiar de ruta
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function Acerca() {
  return (
    <main className="page mx-auto max-w-3xl py-24">
      <p className="eyebrow text-brand-700">Acerca de</p>
      <h1 className="display display-lg mt-3 text-ink-900">AutoRed</h1>
      <p className="lede mt-5 text-ink-600">
        Plataforma web que conecta refaccionarias y distribuidoras en una red segura.
      </p>
      <Link to="/" className="link mt-8 inline-block">← Volver al inicio</Link>
    </main>
  );
}

function NoEncontrado() {
  return (
    <main className="page mx-auto max-w-3xl py-24 text-center">
      <h1 className="display display-lg text-ink-900">404</h1>
      <p className="lede mt-4 text-ink-600">Esta página no existe.</p>
      <Link to="/" className="link mt-6 inline-block">Ir al inicio</Link>
    </main>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/acerca" element={<Acerca />} />
        <Route path="*" element={<NoEncontrado />} />
      </Routes>
    </>
  );
}