// Presentación de autored. Todo sale del único import './autored-ui'.
import { useState } from 'react';
import { Button, Card, Badge, Input, Reveal } from './autored-ui';

const Section = ({ title, note, children }) => (
  <Reveal as="section" className="mt-14">
    <h2 className="section-title">{title}</h2>
    {note && <p className="muted mt-1">{note}</p>}
    <div className="mt-4">{children}</div>
  </Reveal>
);

const productos = [
  { n: 'Balatas delanteras', sku: 'BR-20418', p: '$849.00', total: '$929.00', t: 'ok', e: 'En stock' },
  { n: 'Filtro de aceite', sku: 'FO-1127', p: '$189.00', total: '$269.00', t: 'warn', e: 'Pocas piezas' },
  { n: 'Amortiguador trasero', sku: 'SH-5532', p: '$1,290.00', total: '$1,370.00', t: 'danger', e: 'Agotado' },
];
const pedidos = [
  ['#1042', 'Taller Hernández', '$2,340.00', 'ok', 'Entregado'],
  ['#1043', 'Refaccionaria Sur', '$870.00', 'warn', 'En camino'],
  ['#1044', 'AutoCentro Neza', '$5,120.00', 'brand', 'Nuevo'],
];
const confianza = ['Compatibilidad verificada', 'Precio final con envío', 'Devolución sencilla'];
const Check = () => (
  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10" /></svg>
);

export default function Index() {
  const [cargando, setCargando] = useState(false);
  const probar = () => { setCargando(true); setTimeout(() => setCargando(false), 1600); };

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-ink-200 bg-white/85 backdrop-blur">
        <div className="page flex h-16 items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-control bg-brand-600 font-display text-lg font-bold text-white">A</span>
            <span className="font-display text-2xl font-semibold">autored</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="chip" type="button"><span className="h-2 w-2 rounded-full bg-ok-700" />Mi garage · Versa 2018</button>
            <Button variant="secondary" size="sm" className="hidden sm:inline-flex">Iniciar sesión</Button>
          </div>
        </div>
      </header>

      <main className="page pb-20 pt-12">
        <Reveal>
          <Badge tone="brand">Refacciones para tu auto</Badge>
          <h1 className="page-title mt-3 max-w-2xl text-4xl sm:text-5xl">Encuentra la pieza exacta para tu auto</h1>
          <p className="muted mt-3 max-w-xl text-base">Elige tu vehículo una vez y te mostramos solo lo que le queda.</p>
        </Reveal>

        <Reveal delay={80} className="mt-8">
          <Card className="shadow-pop">
            <div className="grid gap-3 sm:grid-cols-3">
              <Input as="select" label="Año" defaultValue="2018">{[2020, 2019, 2018, 2017].map((a) => <option key={a}>{a}</option>)}</Input>
              <Input as="select" label="Marca" defaultValue="Nissan"><option>Nissan</option><option>Chevrolet</option><option>Volkswagen</option></Input>
              <Input as="select" label="Modelo" defaultValue="Versa"><option>Versa</option><option>March</option><option>Sentra</option></Input>
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1"><Input label="O busca por número de parte" placeholder="Ej. BR-20418" /></div>
              <Button size="lg" arrow>Buscar refacciones</Button>
            </div>
          </Card>
          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-600">
            {confianza.map((c) => <li key={c} className="inline-flex items-center gap-1.5 text-ok-700"><Check /><span className="text-ink-700">{c}</span></li>)}
          </ul>
        </Reveal>

        <Section title="Catálogo" note="Cada pieza confirma si le queda a tu auto y muestra el total con envío.">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {productos.map((x, i) => (
              <Reveal key={x.sku} delay={i * 60}>
                <Card interactive className="h-full">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold">{x.n}</h3>
                      <p className="sku">SKU {x.sku}</p>
                    </div>
                    <Badge tone={x.t}>{x.e}</Badge>
                  </div>
                  <Badge tone="ok"><Check />Compatible con tu Versa 2018</Badge>
                  <div className="mt-4 flex items-end justify-between">
                    <div><p className="price">{x.p}</p><p className="muted">Total con envío {x.total}</p></div>
                    <Button size="sm" disabled={x.t === 'danger'}>Agregar</Button>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </Section>

        <Section title="Botones" note="Se elevan al pasar el cursor, se hunden al presionar y la flecha se desliza. Prueba el de carga.">
          <div className="flex flex-wrap items-center gap-3">
            <Button arrow>Primario</Button>
            <Button variant="secondary">Secundario</Button>
            <Button variant="ghost">Fantasma</Button>
            <Button variant="danger">Eliminar</Button>
            <Button disabled>Deshabilitado</Button>
            <Button loading={cargando} onClick={probar}>{cargando ? 'Guardando…' : 'Probar carga'}</Button>
          </div>
        </Section>

        <Section title="Formularios">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Correo" defaultValue="taller@correo" error="Escribe un correo válido" />
            <Input label="Cliente" defaultValue="Taller Hernández" disabled />
          </div>
        </Section>

        <Section title="Pedidos recientes">
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Pedido</th><th>Cliente</th><th>Total</th><th>Estado</th></tr></thead>
              <tbody>
                {pedidos.map(([id, c, t, tone, e]) => (
                  <tr key={id}><td className="sku">{id}</td><td>{c}</td><td className="font-semibold tabular-nums">{t}</td><td><Badge tone={tone}>{e}</Badge></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </main>
    </>
  );
}
