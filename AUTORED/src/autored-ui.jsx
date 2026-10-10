// ============================================================
//  AUTORED UI — único archivo a importar.
//  Uso:  import { Button, Input, Card, Badge } from './autored-ui';
//  Ya incluye los estilos (autored-ui.css), no hay que importarlos aparte.
// ============================================================
import { forwardRef, useEffect, useId, useRef, useState } from 'react';
import './autored-ui.css';

const cx = (...c) => c.filter(Boolean).join(' ');

/* ---------- Spinner ---------- */
export function Spinner({ className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={cx('inline-block h-4 w-4 animate-spin-fast rounded-full border-2 border-current border-t-transparent', className)}
    />
  );
}

/* ---------- Button ---------- */
const buttonVariants = { primary: 'btn-primary', secondary: 'btn-secondary', ghost: 'btn-ghost', danger: 'btn-danger' };
const buttonSizes = { sm: 'btn-sm', md: '', lg: 'btn-lg' };

export function Button({
  variant = 'primary', size = 'md', loading = false, arrow = false, type = 'button',
  disabled, className, children, ...props
}) {
  return (
    <button
      type={type}
      className={cx('btn', buttonVariants[variant], buttonSizes[size], className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner />}
      {children}
      {arrow && (
        <svg className="arrow h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      )}
    </button>
  );
}

/* ---------- Input (usa as="textarea" para áreas de texto) ---------- */
export const Input = forwardRef(function Input(
  { label, hint, error, className, id, as: Tag = 'input', ...props }, ref
) {
  const auto = useId();
  const inputId = id || auto;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className="field">
      {label && <label htmlFor={inputId} className="label">{label}</label>}
      <Tag
        ref={ref}
        id={inputId}
        className={cx('input', className)}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        {...props}
      />
      {error
        ? <p id={`${inputId}-error`} className="field-error">{error}</p>
        : hint && <p id={`${inputId}-hint`} className="field-hint">{hint}</p>}
    </div>
  );
});

/* ---------- Card ---------- */
export function Card({ interactive = false, padded = true, as: Tag = 'div', className, ...props }) {
  return <Tag className={cx(interactive ? 'card-interactive' : 'card', padded && 'card-pad', className)} {...props} />;
}

/* ---------- Badge ---------- */
const badgeTones = { neutral: 'badge-neutral', brand: 'badge-brand', ok: 'badge-ok', warn: 'badge-warn', danger: 'badge-danger' };

export function Badge({ tone = 'neutral', className, ...props }) {
  return <span className={cx('badge', badgeTones[tone], className)} {...props} />;
}

/* ---------- Reveal: aparece (desvanece + sube) al entrar en pantalla ---------- */
export function Reveal({ as: Tag = 'div', delay = 0, className, style, children, ...props }) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setSeen(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref} className={cx('reveal', seen && 'is-visible', className)} style={{ '--reveal-delay': `${delay}ms`, ...style }} {...props}>
      {children}
    </Tag>
  );
}

/* ============================================================
   EJEMPLO DE USO (borra este bloque cuando quieras)

   import { Button, Card, Badge, Input, Reveal } from './autored-ui';

   <main className="page py-8">
     <h1 className="page-title mb-6">Catálogo</h1>
     <Input label="Buscar refacción" hint="Puedes buscar por número de parte" />

     <Card interactive className="animate-rise">
       <h2 className="section-title">Balatas delanteras</h2>
       <p className="sku">SKU BR-20418</p>
       <Badge tone="ok">En stock</Badge>
       <p className="price">$849.00</p>
       <Button size="sm">Agregar</Button>
     </Card>
   </main>
   ============================================================ */