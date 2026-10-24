// Ilustraciones SVG de refacciones y la inclinación 3D de la escena. Ubicación: src/Catalogo/piezas.jsx
// Las clases axc-spin / axc-pump / axc-spark / axc-drop / axc-comp se animan desde Catalogo.css.
import { useEffect, useRef } from 'react';
import { reduced, finePointer } from './datos';

// Inclinación 3D de la escena del hero (decorativa; solo puntero fino)
export function useSceneTilt(max = 8) {
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
    const move = (e) => { const r = surface.getBoundingClientRect(); tx = ((e.clientX - r.left) / r.width - 0.5) * 2; ty = ((e.clientY - r.top) / r.height - 0.5) * 2; kick(); };
    const leave = () => { tx = 0; ty = 0; kick(); };
    surface.addEventListener('pointermove', move);
    surface.addEventListener('pointerleave', leave);
    return () => { surface.removeEventListener('pointermove', move); surface.removeEventListener('pointerleave', leave); cancelAnimationFrame(raf); };
  }, [max]);
  return { surfaceRef, stageRef };
}


/* ======================= ILUSTRACIONES (SVG propio) ======================= */
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
const ring = (n, r, c = 100) => Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2; return [c + Math.cos(a) * r, c + Math.sin(a) * r]; });
const resorte = (() => { let d = 'M60 46'; for (let i = 0; i < 9; i++) d += ` L${i % 2 ? 28 : 92} ${52 + i * 11}`; return `${d} L60 150`; })();

// Los degradados se declaran UNA vez para toda la página (evita ids repetidos en cada tarjeta)
export function Defs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="cg-disc" cx="40%" cy="35%" r="75%"><stop offset="0" stopColor="#9a8486" /><stop offset=".6" stopColor="#4a3638" /><stop offset="1" stopColor="#2a1618" /></radialGradient>
        <linearGradient id="cg-cal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ff5a4f" /><stop offset="1" stopColor="#9b111e" /></linearGradient>
        <linearGradient id="cg-gear" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ff8d85" /><stop offset="1" stopColor="#9b111e" /></linearGradient>
        <linearGradient id="cg-pis" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stopColor="#6b5456" /><stop offset=".5" stopColor="#e3d2d3" /><stop offset="1" stopColor="#6b5456" /></linearGradient>
        <linearGradient id="cg-cer" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stopColor="#c9b4b6" /><stop offset=".5" stopColor="#fff1f0" /><stop offset="1" stopColor="#c9b4b6" /></linearGradient>
        <linearGradient id="cg-can" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stopColor="#9b111e" /><stop offset=".45" stopColor="#ff5a4f" /><stop offset="1" stopColor="#7a0f1b" /></linearGradient>
      </defs>
    </svg>
  );
}

// Una pieza por categoría. Las clases axc-spin / axc-pump / axc-spark / axc-drop / axc-comp
// solo se animan al pasar el cursor por la tarjeta (o siempre dentro de .axc-on, en el hero).
export function Pieza({ cat }) {
  switch (cat) {
    case 'frenos':
      return (
        <svg viewBox="0 0 200 200">
          <g className="axc-spin">
            <circle cx="100" cy="100" r="96" fill="url(#cg-disc)" stroke="#ffc2bc" strokeOpacity=".35" />
            {ring(14, 66).map(([x, y], i) => <circle key={i} cx={x} cy={y} r="5.5" fill="#120a0b" />)}
            <circle cx="100" cy="100" r="40" fill="#5b4244" stroke="#ffc2bc" strokeOpacity=".3" />
            {ring(5, 26).map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3.6" fill="#120a0b" />)}
            <circle cx="100" cy="100" r="11" fill="#120a0b" />
            <circle cx="100" cy="13" r="4" fill="#ff5a4f" />
          </g>
          <path d="M142 46 L176 68 Q182 100 176 132 L142 154 Q150 100 142 46Z" fill="url(#cg-cal)" />
        </svg>
      );
    case 'motor':
      return (
        <svg viewBox="0 0 120 215">
          <g className="axc-pump">
            <rect x="16" y="12" width="88" height="96" rx="12" fill="url(#cg-pis)" stroke="#fff1f0" strokeOpacity=".35" />
            {[28, 40, 52].map((y) => <rect key={y} x="16" y={y} width="88" height="4" fill="#120a0b" opacity=".75" />)}
            <circle cx="60" cy="86" r="11" fill="#120a0b" stroke="#ff8d85" strokeWidth="2" />
            <path d="M52 96 L50 182 L70 182 L68 96Z" fill="#a89092" />
            <circle cx="60" cy="192" r="15" fill="#c81e2b" stroke="#fff1f0" strokeOpacity=".4" />
            <circle cx="60" cy="192" r="6" fill="#120a0b" />
          </g>
        </svg>
      );
    case 'encendido':
      return (
        <svg viewBox="0 0 80 215">
          <rect x="32" y="4" width="16" height="12" rx="3" fill="#c81e2b" />
          <rect x="24" y="14" width="32" height="76" rx="8" fill="url(#cg-cer)" stroke="#fff1f0" strokeOpacity=".35" />
          {[34, 48, 62].map((y) => <rect key={y} x="24" y={y} width="32" height="3" fill="#c81e2b" opacity=".55" />)}
          <rect x="16" y="90" width="48" height="26" rx="4" fill="#4a3638" stroke="#ffc2bc" strokeOpacity=".3" />
          <rect x="26" y="116" width="28" height="52" fill="#8d7b7d" />
          {[124, 132, 140, 148, 156].map((y) => <rect key={y} x="26" y={y} width="28" height="2" fill="#2a1618" opacity=".6" />)}
          <path d="M40 168 V182 H56 V174" stroke="#e3d2d3" strokeWidth="3" fill="none" strokeLinejoin="round" />
          <g className="axc-spark">
            <circle cx="52" cy="186" r="13" fill="#ff5a4f" opacity=".35" />
            <path d="M52 180 l-6 12 l8 -3 l-6 14" stroke="#fff1f0" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </svg>
      );
    case 'filtros':
      return (
        <svg viewBox="0 0 120 175">
          <rect x="30" y="8" width="60" height="22" rx="5" fill="#4a3638" stroke="#ffc2bc" strokeOpacity=".3" />
          <path d="M18 38 q0 -8 12 -8 h60 q12 0 12 8 v108 q0 12 -12 12 h-60 q-12 0 -12 -12z" fill="url(#cg-can)" stroke="#fff1f0" strokeOpacity=".35" />
          <rect x="18" y="72" width="84" height="38" fill="#fff1f0" opacity=".93" />
          <rect x="30" y="84" width="34" height="6" rx="3" fill="#c81e2b" />
          <rect x="30" y="95" width="52" height="5" rx="2.5" fill="#4a3638" opacity=".5" />
          {[48, 56].map((y) => <rect key={y} x="18" y={y} width="84" height="2" fill="#120a0b" opacity=".35" />)}
          <circle className="axc-drop" cx="60" cy="166" r="4.5" fill="#ff8d85" />
        </svg>
      );
    case 'transmision':
      return (
        <svg viewBox="0 0 200 200">
          <g className="axc-spin">
            <path d={gearPath(12, 96, 76)} fill="url(#cg-gear)" stroke="#fff1f0" strokeOpacity=".4" />
            <circle cx="100" cy="100" r="56" fill="none" stroke="#fff1f0" strokeOpacity=".35" />
            {ring(6, 40).map(([x, y], i) => <line key={i} x1="100" y1="100" x2={x} y2={y} stroke="#fff1f0" strokeOpacity=".3" strokeWidth="3" />)}
            <circle cx="100" cy="100" r="22" fill="#120a0b" stroke="#ffc2bc" strokeOpacity=".5" />
          </g>
        </svg>
      );
    default: // suspensión
      return (
        <svg viewBox="0 0 120 200">
          <rect x="38" y="6" width="44" height="14" rx="4" fill="#4a3638" stroke="#ffc2bc" strokeOpacity=".3" />
          <rect x="54" y="20" width="12" height="28" fill="#c9b4b6" />
          <g className="axc-comp"><path d={resorte} stroke="#ff8d85" strokeWidth="7" fill="none" strokeLinejoin="round" strokeLinecap="round" /></g>
          <rect x="40" y="148" width="40" height="44" rx="6" fill="url(#cg-pis)" stroke="#fff1f0" strokeOpacity=".35" />
          <rect x="40" y="160" width="40" height="4" fill="#c81e2b" />
        </svg>
      );
  }
}

