import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Badge, Reveal } from '../autored-ui';
import Footer from '../Components/Footer';
import logo from '../assets/autored.png';
import '../index.css';
import './RegistrarRefaccionaria.css';
import {
  Storefront, Hash, Phone, Signpost, MapPinArea, Buildings, MapTrifold, MapPin, MagnifyingGlass, Crosshair,
  FileText, IdentificationCard, FilePdf, Image as ImageIcon, UploadSimple, Trash, Check, CheckCircle, WarningCircle,
  CircleNotch, ArrowRight, ArrowLeft, Gear, PencilSimple, CaretDown,
} from '@phosphor-icons/react';

const cx = (...c) => c.filter(Boolean).join(' ');
const W = 'duotone';
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ======================= BACKEND (sustituye por el tuyo) ======================= */
// TODO: POST multipart/form-data a tu API (PHP/MySQL) con los campos del formulario y los dos archivos.
//   El SERVIDOR debe: validar el RFC y todos los campos otra vez, revisar el tipo REAL de los archivos (no confiar en el
//   navegador), analizarlos con antivirus, guardarlos fuera de la carpeta pública y dejar la solicitud en "pendiente de revisión".
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function enviarSolicitud(/* datos, archivos */) { await wait(1500); return { folio: `REF-${Math.floor(100000 + Math.random() * 900000)}` }; }

// Geocodificación con Nominatim (OpenStreetMap). Para pruebas y poco tráfico: máximo 1 solicitud por segundo y sin autocompletar.
// En producción usa tu propio geocodificador (a través de tu backend) o un proveedor con llave.
const NOMINATIM = 'https://nominatim.openstreetmap.org';
async function geoJson(ruta, signal) {
  const r = await fetch(`${NOMINATIM}${ruta}`, { signal, headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error('geo');
  return r.json();
}

/* ======================= DATOS Y REGLAS ======================= */
const ESTADOS = ['Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima', 'Durango', 'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'];
const quitar = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
const estadoDesde = (n) => {
  const q = quitar(n);
  if (!q) return '';
  if (q === 'mexico' || q.includes('estado de mexico')) return 'Estado de México';
  if (q.includes('ciudad de mexico') || q.includes('distrito federal')) return 'Ciudad de México';
  return ESTADOS.find((e) => { const k = quitar(e); return q === k || q.startsWith(k) || k.startsWith(q); }) || '';
};
const direccionDe = (a = {}) => ({
  calle: a.road || a.pedestrian || a.footway || '',
  numero: a.house_number || '',
  colonia: a.suburb || a.neighbourhood || a.quarter || a.city_district || '',
  cp: String(a.postcode || '').replace(/\D/g, '').slice(0, 5),
  ciudad: a.city || a.town || a.village || a.municipality || a.county || '',
  estado: estadoDesde(a.state),
});

const digitos = (v) => v.replace(/\D/g, '').slice(0, 10);
const fmtTel = (v) => { const d = digitos(v); return [d.slice(0, 2), d.slice(2, 6), d.slice(6, 10)].filter(Boolean).join(' '); };
// RFC: persona moral = 12 caracteres (3 letras + fecha + homoclave); persona física = 13 (4 letras + fecha + homoclave)
const RFC = /^([A-ZÑ&]{3,4})(\d{2})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])([A-Z\d]{3})$/;
const NUM = /^[\p{L}\d][\p{L}\d\s./#-]{0,9}$/u;

const reglas = {
  nombre: (v) => (v.trim().length < 2 ? 'Escribe el nombre de tu refaccionaria.' : v.trim().length > 80 ? 'Usa 80 caracteres o menos.' : ''),
  rfc: (v) => (!v ? 'Escribe el RFC del negocio.' : !RFC.test(v) ? 'El RFC no es válido. Debe tener 12 caracteres (persona moral) o 13 (persona física).' : ''),
  telefono: (v) => (digitos(v).length === 10 ? '' : 'Escribe los 10 dígitos del teléfono de mostrador.'),
  calle: (v) => (v.trim().length < 2 ? 'Escribe la calle o avenida.' : ''),
  numero: (v) => (!v.trim() ? 'Escribe el número (o S/N).' : !NUM.test(v.trim()) ? 'Usa hasta 10 caracteres, por ejemplo 123, 45-B o S/N.' : ''),
  colonia: (v) => (v.trim().length < 2 ? 'Escribe la colonia.' : ''),
  cp: (v) => (/^\d{5}$/.test(v) ? '' : 'El código postal tiene 5 dígitos.'),
  ciudad: (v) => (v.trim().length < 2 ? 'Escribe la ciudad o municipio.' : ''),
  estado: (v) => (ESTADOS.includes(v) ? '' : 'Selecciona el estado.'),
};
const PASOS = [
  { t: 'Negocio', campos: ['nombre', 'rfc'] },
  { t: 'Ubicación', campos: ['telefono', 'calle', 'numero', 'colonia', 'cp', 'ciudad', 'estado'] },
  { t: 'Documentos', campos: [] },
];
const DOCS = {
  csf: { t: 'Constancia de situación fiscal (SAT)', ayuda: 'PDF de tu constancia vigente, completo y legible.', tipos: ['application/pdf'], ext: ['pdf'], accept: 'application/pdf,.pdf', maxMB: 5, icono: FileText },
  ine: { t: 'Identificación oficial (INE)', ayuda: 'Foto o PDF de tu INE vigente, por ambos lados, sin reflejos.', tipos: ['image/jpeg', 'image/png', 'application/pdf'], ext: ['jpg', 'jpeg', 'png', 'pdf'], accept: 'image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf', maxMB: 5, icono: IdentificationCard },
};
const tamano = (b) => (b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`);
const validarArchivo = (f, d) => {
  if (!f) return `Sube tu ${d.t.toLowerCase()}.`;
  const ext = f.name.split('.').pop().toLowerCase();
  if (!(d.tipos.includes(f.type) || (!f.type && d.ext.includes(ext)))) return `Formato no permitido. Sube ${d.ext.map((e) => e.toUpperCase()).join(', ')}.`;
  if (f.size === 0) return 'El archivo está vacío.';
  if (f.size > d.maxMB * 1024 * 1024) return `El archivo pesa ${tamano(f.size)} y el máximo es ${d.maxMB} MB.`;
  return '';
};

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

// Mismo marcado que el Field de Registro (clases axr-*); `auto` resalta lo que se rellenó desde el mapa
function Campo({ id, label, error, note, hint, auto, icon: Icon, select, children, ...input }) {
  return (
    <div className={cx('axr-field', error && 'has-err', auto && 'is-auto')}>
      <label htmlFor={id}>{label}</label>
      <div className="axr-ctl">
        {Icon && <Icon className="axr-fi" size={20} weight={W} aria-hidden="true" />}
        {select
          ? <select id={id} aria-invalid={error ? 'true' : undefined} aria-describedby={error ? `${id}-e` : hint ? `${id}-h` : undefined} {...input}>{children}</select>
          : <input id={id} aria-invalid={error ? 'true' : undefined} aria-describedby={error ? `${id}-e` : hint ? `${id}-h` : undefined} {...input} />}
        {select && <CaretDown className="axf-caret" size={18} weight="bold" aria-hidden="true" />}
      </div>
      {error
        ? <p id={`${id}-e`} className="axr-err" role="alert"><WarningCircle size={16} weight="fill" aria-hidden="true" />{error}</p>
        : hint && <p id={`${id}-h`} className="axf-hint">{hint}</p>}
      {note}
    </div>
  );
}

/* ======================= SUBIDA DE ARCHIVOS ======================= */
function Subida({ id, doc, archivo, onArchivo, error, onError }) {
  const input = useRef(null);
  const [sobre, setSobre] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const Icono = doc.icono;
  const esImg = archivo?.type?.startsWith('image/');
  const url = useMemo(() => (esImg ? URL.createObjectURL(archivo) : ''), [archivo, esImg]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  const recibir = (f) => {
    if (!f) return;
    const m = validarArchivo(f, doc);
    if (m) { onError(m); return; }
    onError('');
    onArchivo(f);
    setSubiendo(true);
    setTimeout(() => setSubiendo(false), reduced() ? 100 : 900); // solo efecto visual: aquí aún no se sube nada
  };
  const quitar = () => { onArchivo(null); if (input.current) input.current.value = ''; input.current?.focus(); };

  return (
    <div className={cx('axf-up', sobre && 'is-over', archivo && 'has-file', error && 'has-err')}>
      <p className="axf-up-t" id={`${id}-t`}><Icono size={20} weight={W} aria-hidden="true" />{doc.t}</p>
      <p className="axf-up-s" id={`${id}-s`}>{doc.ayuda} Máximo {doc.maxMB} MB.</p>

      <input ref={input} id={id} type="file" className="axr-sr" accept={doc.accept} aria-labelledby={`${id}-t`} aria-describedby={error ? `${id}-e` : `${id}-s`} aria-invalid={error ? 'true' : undefined}
        onChange={(e) => { recibir(e.target.files?.[0]); e.target.value = ''; }} />

      {!archivo ? (
        <label htmlFor={id} className="axf-drop"
          onDragEnter={(e) => { e.preventDefault(); setSobre(true); }} onDragOver={(e) => { e.preventDefault(); setSobre(true); }} onDragLeave={() => setSobre(false)}
          onDrop={(e) => { e.preventDefault(); setSobre(false); recibir(e.dataTransfer.files?.[0]); }}>
          <span className="axf-drop-ico"><UploadSimple size={26} weight="bold" aria-hidden="true" /></span>
          <b>Arrastra tu archivo aquí</b>
          <span>o <u>elige uno de tu equipo</u></span>
        </label>
      ) : (
        <div className="axf-file">
          <span className="axf-thumb" aria-hidden="true">{esImg ? <img src={url} alt="" /> : archivo.type === 'application/pdf' ? <FilePdf size={30} weight={W} /> : <ImageIcon size={30} weight={W} />}</span>
          <div className="axf-file-i">
            <p className="axf-file-n">{archivo.name}</p>
            <p className="axf-file-m">{tamano(archivo.size)} · {subiendo ? 'Preparando…' : 'Listo para enviar'}</p>
            <div className="axf-bar" aria-hidden="true"><i className={subiendo ? 'go' : 'done'} /></div>
          </div>
          <div className="axf-file-a">
            <label htmlFor={id} className="axf-mini">Cambiar</label>
            <button type="button" className="axf-mini axf-mini-x" onClick={quitar} aria-label={`Quitar ${doc.t}`}><Trash size={16} weight="bold" aria-hidden="true" /></button>
          </div>
        </div>
      )}
      {error && <p id={`${id}-e`} className="axr-err" role="alert"><WarningCircle size={16} weight="fill" aria-hidden="true" />{error}</p>}
    </div>
  );
}

/* ======================= MAPA (Leaflet) ======================= */
const PIN_HTML = '<span class="axf-pin"><svg viewBox="0 0 40 48" aria-hidden="true"><path d="M20 46C20 46 4 30 4 18a16 16 0 0 1 32 0c0 12-16 28-16 28z"/><circle cx="20" cy="18" r="6"/></svg><i></i></span>';

function MapaUbicacion({ pos, onPick, foco }) {
  const box = useRef(null);
  const map = useRef(null);
  const pin = useRef(null);
  const cb = useRef(onPick);
  cb.current = onPick;

  useEffect(() => {
    const m = L.map(box.current, { zoomControl: false, scrollWheelZoom: false, zoomSnap: 0.5 }).setView([23.6, -102.5], 5);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>' }).addTo(m);
    L.control.zoom({ position: 'topright', zoomInTitle: 'Acercar', zoomOutTitle: 'Alejar' }).addTo(m);
    m.on('click', (e) => { m.scrollWheelZoom.enable(); cb.current(e.latlng.lat, e.latlng.lng); });
    m.getContainer().addEventListener('mouseleave', () => m.scrollWheelZoom.disable());
    map.current = m;
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => m.invalidateSize()) : null;
    ro?.observe(box.current);
    return () => { ro?.disconnect(); m.remove(); map.current = null; pin.current = null; };
  }, []);

  // Cada vez que se marca un punto, el pin "cae" sobre él; se puede arrastrar para afinarlo
  useEffect(() => {
    const m = map.current;
    pin.current?.remove(); pin.current = null;
    if (!m || !pos) return;
    const mk = L.marker([pos.lat, pos.lng], {
      draggable: true, keyboard: false, title: 'Ubicación de tu refaccionaria (arrástrala para afinarla)', alt: 'Ubicación de tu refaccionaria',
      icon: L.divIcon({ className: 'axf-mk', html: PIN_HTML, iconSize: [40, 48], iconAnchor: [20, 46] }),
    }).addTo(m);
    mk.on('dragend', () => { const p = mk.getLatLng(); cb.current(p.lat, p.lng); });
    pin.current = mk;
  }, [pos]);

  useEffect(() => {
    const m = map.current;
    if (!m || !foco) return;
    if (reduced()) m.setView([foco.lat, foco.lng], foco.z, { animate: false });
    else m.flyTo([foco.lat, foco.lng], foco.z, { duration: 0.9 });
  }, [foco]);

  return <div ref={box} className="axf-leaflet" role="region" aria-label="Mapa para marcar la ubicación. También puedes escribir la dirección en los campos." />;
}

/* ======================= PÁGINA ======================= */
const VACIO = { nombre: '', rfc: '', telefono: '', calle: '', numero: '', colonia: '', cp: '', ciudad: '', estado: '' };

export default function RegistrarRefaccionaria() {
  const uid = useId().replace(/:/g, '');
  const id = (k) => `${uid}-${k}`;
  const { surfaceRef, stageRef } = useSceneTilt(10);
  const formRef = useRef(null);
  const headRef = useRef(null);
  const mounted = useRef(false);
  const geoId = useRef(0);
  const ctrl = useRef(null);
  const timers = useRef([]);

  const [paso, setPaso] = useState(0);
  const [dir, setDir] = useState(1);
  const [data, setData] = useState(VACIO);
  const [pos, setPos] = useState(null); // { lat, lng, n }
  const [foco, setFoco] = useState(null);
  const [archivos, setArchivos] = useState({ csf: null, ine: null });
  const [errArch, setErrArch] = useState({ csf: '', ine: '' });
  const [acepto, setAcepto] = useState(false);
  const [errors, setErrors] = useState({});
  const [focusTick, setFocusTick] = useState(0);
  const [auto, setAuto] = useState([]); // campos recién rellenados desde el mapa
  const [geo, setGeo] = useState({ estado: 'idle', msg: '' });
  const [q, setQ] = useState('');
  const [res, setRes] = useState({ cargando: false, lista: null, error: '' });
  const [cargando, setCargando] = useState(false);
  const [formError, setFormError] = useState('');
  const [folio, setFolio] = useState('');

  const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.current.push(t); };
  useEffect(() => { const ts = timers.current; return () => { ts.forEach(clearTimeout); ctrl.current?.abort(); }; }, []);
  useEffect(() => { if (focusTick) formRef.current?.querySelector('[aria-invalid="true"]')?.focus(); }, [focusTick]);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    headRef.current?.focus({ preventScroll: true });
  }, [paso, folio]);

  /* ---- campos ---- */
  const onChange = (k) => (e) => {
    let v = e.target.value;
    if (k === 'telefono') v = fmtTel(v);
    if (k === 'rfc') v = v.toUpperCase().replace(/[^A-ZÑ&0-9]/g, '').slice(0, 13);
    if (k === 'cp') v = v.replace(/\D/g, '').slice(0, 5);
    setData((d) => ({ ...d, [k]: v }));
    setFormError(''); setAuto((a) => a.filter((x) => x !== k));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: reglas[k](v) }));
  };
  const onBlur = (k) => () => { if (data[k] !== '') setErrors((er) => ({ ...er, [k]: reglas[k](data[k]) })); };

  /* ---- mapa y dirección ---- */
  // Marca un punto; con `rellenar` pide la dirección a Nominatim y completa los campos
  const colocar = async (lat, lng, { rellenar = true, volar = true } = {}) => {
    const n = ++geoId.current;
    setPos({ lat, lng, n });
    setErrors((er) => ({ ...er, ubicacion: '' }));
    if (volar) setFoco({ lat, lng, z: 17, n });
    if (!rellenar) { setGeo({ estado: 'ok', msg: 'Ubicación marcada. Revisa que sea la correcta.' }); return; }
    ctrl.current?.abort();
    ctrl.current = new AbortController();
    setGeo({ estado: 'buscando', msg: 'Buscando la dirección…' });
    try {
      const j = await geoJson(`/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=es`, ctrl.current.signal);
      if (n !== geoId.current) return; // llegó tarde: ya hay otro punto
      const d = direccionDe(j.address);
      const llenos = Object.keys(d).filter((k) => d[k]);
      setData((x) => ({ ...x, ...Object.fromEntries(llenos.map((k) => [k, d[k]])) }));
      setErrors((er) => ({ ...er, ...Object.fromEntries(llenos.map((k) => [k, ''])) }));
      setAuto(llenos); later(() => setAuto([]), 2200);
      setGeo({ estado: 'ok', msg: llenos.length ? 'Rellenamos la dirección con el mapa. Revísala y corrige lo que haga falta.' : 'Marcamos el punto, pero no encontramos una dirección ahí. Escríbela en los campos.' });
    } catch (e) {
      if (e?.name === 'AbortError' || n !== geoId.current) return;
      setGeo({ estado: 'error', msg: 'No pudimos obtener la dirección del mapa. Escríbela en los campos; el punto sí quedó marcado.' });
    }
  };
  const buscar = async () => {
    const t = q.trim();
    if (t.length < 4) { setRes({ cargando: false, lista: null, error: 'Escribe al menos 4 caracteres para buscar.' }); return; }
    ctrl.current?.abort();
    ctrl.current = new AbortController();
    setRes({ cargando: true, lista: null, error: '' });
    try {
      const j = await geoJson(`/search?format=jsonv2&q=${encodeURIComponent(t)}&countrycodes=mx&limit=5&addressdetails=1&accept-language=es`, ctrl.current.signal);
      setRes({ cargando: false, lista: j, error: j.length ? '' : 'No encontramos ese lugar. Prueba con calle, colonia y ciudad, o toca el mapa.' });
    } catch (e) {
      if (e?.name === 'AbortError') return;
      setRes({ cargando: false, lista: null, error: 'No pudimos buscar ahora. Toca el mapa para marcar tu ubicación.' });
    }
  };
  const elegirResultado = (r) => {
    setRes({ cargando: false, lista: null, error: '' }); setQ('');
    colocar(Number(r.lat), Number(r.lon));
  };
  const miUbicacion = () => {
    if (!('geolocation' in navigator)) { setGeo({ estado: 'error', msg: 'Tu navegador no ofrece ubicación. Busca la dirección o toca el mapa.' }); return; }
    setGeo({ estado: 'buscando', msg: 'Buscando tu ubicación…' });
    navigator.geolocation.getCurrentPosition(
      (p) => colocar(p.coords.latitude, p.coords.longitude),
      () => setGeo({ estado: 'error', msg: 'No pudimos usar tu ubicación (permiso bloqueado o sin señal). Busca la dirección o toca el mapa.' }),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  };
  // Con la dirección escrita a mano, ubica el punto en el mapa (sin cambiar lo escrito)
  const ubicarEscrita = async () => {
    const t = [`${data.calle} ${data.numero}`.trim(), data.colonia, data.cp, data.ciudad, data.estado, 'México'].filter(Boolean).join(', ');
    if (!data.calle.trim() || !data.ciudad.trim()) { setGeo({ estado: 'error', msg: 'Escribe al menos la calle y la ciudad para ubicarla en el mapa.' }); return; }
    ctrl.current?.abort();
    ctrl.current = new AbortController();
    setGeo({ estado: 'buscando', msg: 'Ubicando tu dirección…' });
    try {
      const j = await geoJson(`/search?format=jsonv2&q=${encodeURIComponent(t)}&countrycodes=mx&limit=1&accept-language=es`, ctrl.current.signal);
      if (!j.length) { setGeo({ estado: 'error', msg: 'No encontramos esa dirección. Toca el mapa para marcarla tú.' }); return; }
      colocar(Number(j[0].lat), Number(j[0].lon), { rellenar: false });
    } catch (e) {
      if (e?.name !== 'AbortError') setGeo({ estado: 'error', msg: 'No pudimos ubicarla ahora. Toca el mapa para marcarla tú.' });
    }
  };

  /* ---- pasos ---- */
  const errPaso = (n) => {
    const er = {};
    PASOS[n].campos.forEach((k) => { const m = reglas[k](data[k]); if (m) er[k] = m; });
    if (n === 1 && !pos) er.ubicacion = 'Marca la ubicación en el mapa para que tus clientes te encuentren.';
    if (n === 2) { ['csf', 'ine'].forEach((k) => { const m = validarArchivo(archivos[k], DOCS[k]); if (m) er[k] = m; }); if (!acepto) er.acepto = 'Confirma que los datos y documentos son de tu negocio.'; }
    return er;
  };
  const irA = (n) => { setDir(n > paso ? 1 : -1); setPaso(n); setErrors({}); setFormError(''); };
  const enviar = async (ev) => {
    ev.preventDefault();
    const er = errPaso(paso);
    setErrors(er);
    if (Object.keys(er).length) {
      setErrArch((e) => ({ csf: er.csf || e.csf, ine: er.ine || e.ine }));
      setFocusTick((t) => t + 1); return; // no se borra lo escrito
    }
    if (paso < 2) { irA(paso + 1); return; }
    setCargando(true); setFormError('');
    try { const r = await enviarSolicitud(data, archivos); setFolio(r.folio); }
    catch { setFormError('No pudimos enviar tu solicitud. Revisa tu conexión e inténtalo de nuevo.'); }
    finally { setCargando(false); }
  };

  const done = !!folio;
  const nombreCard = data.nombre.trim() || 'Tu refaccionaria';
  const rfcCard = data.rfc ? data.rfc.replace(/^(.{3,4})(\d{6})(.*)$/, '$1 $2 $3') : 'RFC ·· ······ ···';
  const docsOk = { csf: !!archivos.csf, ine: !!archivos.ine };

  return (
    <div className="ax">
      {/* Solo un enlace para volver: sin barra de navegación ni animación */}
      <header className="axf-top">
        <div className="ax-wrap axf-top-in">
          <Link to="/" className="axf-brand" aria-label="AutoRed, ir al inicio"><img src={logo} alt="" width="40" height="40" /><span>AutoRed</span></Link>
          <Link to="/" className="axf-back"><ArrowLeft size={18} weight="bold" aria-hidden="true" />Volver al inicio</Link>
        </div>
      </header>

      <main>
        <section className="ax-hero ax-dark axf-hero" aria-labelledby={id('h')}>
          <GearBg gears={[{ n: 14, s: '38rem', l: '-12rem', t: '-8rem', dur: '120s' }, { n: 10, s: '26rem', l: '64%', t: '60%', rev: true, dur: '90s' }]} />
          <div className="ax-wrap ax-hero-grid axf-grid">

            {/* ---- Mensaje ---- */}
            <div className="axf-head">
              <Reveal><Badge tone="brand">Registro de refaccionaria</Badge></Reveal>
              <h1 id={id('h')} className="ax-h1" style={{ marginTop: '1.25rem' }}>
                <Words text="Lleva tu refaccionaria" />
                <Words text="a la red." em base={3} />
              </h1>
              <Reveal delay={200}>
                <p className="ax-lede">Registra tu negocio, márcalo en el mapa y deja que los clientes cercanos te encuentren.</p>
                <p className="axf-need"><b>Ten a la mano:</b> tu RFC, tu constancia de situación fiscal del SAT y tu INE vigente.</p>
              </Reveal>
            </div>

            {/* ---- Formulario ---- */}
            <div className="axf-formcol">
              <div className="axr-form-card axf-card">
                {!done && (
                  <ol className="axf-steps" aria-label="Progreso del registro">
                    <span className="axf-steps-line" aria-hidden="true" />
                    <span className="axf-steps-fill" aria-hidden="true" style={{ transform: `scaleX(${paso / 2})` }} />
                    {PASOS.map((p, i) => (
                      <li key={p.t} className={cx(i < paso && 'is-done', i === paso && 'is-now')} aria-current={i === paso ? 'step' : undefined}>
                        <span className="axf-dot">{i < paso ? <Check size={16} weight="bold" aria-hidden="true" /> : <span className="ax-num">{i + 1}</span>}</span>
                        <span className="axf-st">{p.t}</span>
                      </li>
                    ))}
                  </ol>
                )}

                {!done ? (
                  <form ref={formRef} noValidate onSubmit={enviar} key={paso} className="axf-panel" data-dir={dir} aria-labelledby={id('pt')}>
                    <h2 id={id('pt')} className="axr-form-t" ref={headRef} tabIndex={-1}>
                      {['Datos del negocio', 'Contacto y ubicación', 'Documentos de validación'][paso]}
                    </h2>
                    <p className="axr-form-s">{['Cuéntanos cómo se llama tu refaccionaria y su RFC.', 'Dinos cómo contactarte y dónde está tu mostrador.', 'Sube tus documentos para validar tu negocio y revisa el resumen.'][paso]}</p>
                    {formError && <p className="axr-alert" role="alert"><WarningCircle size={20} weight="fill" aria-hidden="true" />{formError}</p>}

                    {/* ===== Paso 1: negocio ===== */}
                    {paso === 0 && (
                      <>
                        <Campo id={id('nombre')} name="nombre" label="Nombre de la refaccionaria" icon={Storefront} autoComplete="organization" autoFocus maxLength={80}
                          value={data.nombre} onChange={onChange('nombre')} onBlur={onBlur('nombre')} error={errors.nombre} />
                        <Campo id={id('rfc')} name="rfc" label="RFC del negocio" icon={Hash} autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={13} placeholder="Ej. ABC010101AB1"
                          value={data.rfc} onChange={onChange('rfc')} onBlur={onBlur('rfc')} error={errors.rfc} hint="12 caracteres si es persona moral o 13 si es persona física. Lo encuentras en tu constancia del SAT." />
                      </>
                    )}

                    {/* ===== Paso 2: contacto y ubicación ===== */}
                    {paso === 1 && (
                      <>
                        <div className="axf-grid6">
                          <div className="s6"><Campo id={id('telefono')} name="telefono" label="Teléfono de mostrador" icon={Phone} type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="55 1234 5678"
                            value={data.telefono} onChange={onChange('telefono')} onBlur={onBlur('telefono')} error={errors.telefono} hint="10 dígitos, sin lada internacional." /></div>
                          <div className="s4"><Campo id={id('calle')} name="calle" label="Calle o avenida" icon={Signpost} autoComplete="address-line1" auto={auto.includes('calle')}
                            value={data.calle} onChange={onChange('calle')} onBlur={onBlur('calle')} error={errors.calle} /></div>
                          <div className="s2"><Campo id={id('numero')} name="numero" label="Número" icon={Hash} autoComplete="off" maxLength={10} auto={auto.includes('numero')}
                            value={data.numero} onChange={onChange('numero')} onBlur={onBlur('numero')} error={errors.numero} /></div>
                          <div className="s4"><Campo id={id('colonia')} name="colonia" label="Colonia" icon={MapPinArea} autoComplete="address-line2" auto={auto.includes('colonia')}
                            value={data.colonia} onChange={onChange('colonia')} onBlur={onBlur('colonia')} error={errors.colonia} /></div>
                          <div className="s2"><Campo id={id('cp')} name="cp" label="Código postal" icon={Hash} inputMode="numeric" autoComplete="postal-code" maxLength={5} auto={auto.includes('cp')}
                            value={data.cp} onChange={onChange('cp')} onBlur={onBlur('cp')} error={errors.cp} /></div>
                        </div>

                        {/* Mapa */}
                        <div className={cx('axf-mapbox', errors.ubicacion && 'has-err')}>
                          <p className="axf-map-t"><MapPin size={20} weight={W} aria-hidden="true" />Ubicación en el mapa</p>
                          <p className="axf-map-s">Busca tu dirección, usa tu ubicación o toca el mapa. Después arrastra el pin para afinarlo; la dirección se rellena sola.</p>
                          <div className="axf-search">
                            <MagnifyingGlass size={20} weight="bold" aria-hidden="true" className="axf-search-ico" />
                            <label htmlFor={id('q')} className="axr-sr">Buscar dirección o lugar</label>
                            <input id={id('q')} type="search" enterKeyHint="search" autoComplete="off" placeholder="Buscar dirección o lugar…" value={q}
                              onChange={(e) => { setQ(e.target.value); if (res.error || res.lista) setRes({ cargando: false, lista: null, error: '' }); }}
                              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); buscar(); } }} />
                            <button type="button" onClick={buscar} disabled={res.cargando} aria-busy={res.cargando}>{res.cargando ? <CircleNotch className="axr-spin" size={18} weight="bold" aria-hidden="true" /> : 'Buscar'}</button>
                          </div>
                          {res.error && <p className="axr-err" role="alert"><WarningCircle size={16} weight="fill" aria-hidden="true" />{res.error}</p>}
                          {res.lista?.length > 0 && (
                            <ul className="axf-res" aria-label="Resultados de la búsqueda">
                              {res.lista.map((r) => <li key={r.place_id}><button type="button" onClick={() => elegirResultado(r)}><MapPin size={18} weight="fill" aria-hidden="true" /><span>{r.display_name}</span></button></li>)}
                            </ul>
                          )}
                          <div className="axf-maptools">
                            <button type="button" className="axf-chip" onClick={miUbicacion}><Crosshair size={16} weight="bold" aria-hidden="true" />Usar mi ubicación</button>
                            <button type="button" className="axf-chip" onClick={ubicarEscrita}><MapTrifold size={16} weight="bold" aria-hidden="true" />Ubicar la dirección que escribí</button>
                          </div>
                          <div className="axf-map"><MapaUbicacion pos={pos} onPick={(lat, lng) => colocar(lat, lng)} foco={foco} /></div>
                          <p className={cx('axf-geo', geo.estado)} role="status" aria-live="polite">
                            {geo.estado === 'buscando' && <CircleNotch className="axr-spin" size={16} weight="bold" aria-hidden="true" />}
                            {geo.estado === 'ok' && <CheckCircle size={16} weight="fill" aria-hidden="true" />}
                            {geo.estado === 'error' && <WarningCircle size={16} weight="fill" aria-hidden="true" />}
                            <span>{geo.msg || (pos ? '' : 'Aún no has marcado tu ubicación.')}</span>
                          </p>
                          {pos && <p className="axf-coords ax-num">{pos.lat.toFixed(5)}, {pos.lng.toFixed(5)}</p>}
                          {errors.ubicacion && <p className="axr-err" role="alert" id={id('ub-e')}><WarningCircle size={16} weight="fill" aria-hidden="true" />{errors.ubicacion}</p>}
                        </div>

                        <div className="axf-grid6">
                          <div className="s3"><Campo id={id('ciudad')} name="ciudad" label="Ciudad / municipio" icon={Buildings} autoComplete="address-level2" auto={auto.includes('ciudad')}
                            value={data.ciudad} onChange={onChange('ciudad')} onBlur={onBlur('ciudad')} error={errors.ciudad} /></div>
                          <div className="s3"><Campo id={id('estado')} name="estado" label="Estado" icon={MapTrifold} select autoComplete="address-level1" auto={auto.includes('estado')}
                            value={data.estado} onChange={onChange('estado')} onBlur={onBlur('estado')} error={errors.estado}>
                            <option value="">Selecciona…</option>
                            {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
                          </Campo></div>
                        </div>
                      </>
                    )}

                    {/* ===== Paso 3: documentos y resumen ===== */}
                    {paso === 2 && (
                      <>
                        <Subida id={id('csf')} doc={DOCS.csf} archivo={archivos.csf} error={errArch.csf || errors.csf}
                          onArchivo={(f) => { setArchivos((a) => ({ ...a, csf: f })); setErrors((er) => ({ ...er, csf: '' })); }} onError={(m) => setErrArch((e) => ({ ...e, csf: m }))} />
                        <Subida id={id('ine')} doc={DOCS.ine} archivo={archivos.ine} error={errArch.ine || errors.ine}
                          onArchivo={(f) => { setArchivos((a) => ({ ...a, ine: f })); setErrors((er) => ({ ...er, ine: '' })); }} onError={(m) => setErrArch((e) => ({ ...e, ine: m }))} />

                        <section className="axf-sum" aria-label="Resumen de tu solicitud">
                          <h3 className="axf-sum-t">Revisa tu información</h3>
                          <dl>
                            <div><dt>Refaccionaria</dt><dd>{data.nombre}<button type="button" onClick={() => irA(0)} aria-label="Editar nombre y RFC"><PencilSimple size={14} weight="bold" aria-hidden="true" />Editar</button></dd></div>
                            <div><dt>RFC</dt><dd className="ax-num">{data.rfc}</dd></div>
                            <div><dt>Teléfono</dt><dd>{data.telefono}<button type="button" onClick={() => irA(1)} aria-label="Editar teléfono y ubicación"><PencilSimple size={14} weight="bold" aria-hidden="true" />Editar</button></dd></div>
                            <div><dt>Dirección</dt><dd>{data.calle} {data.numero}, {data.colonia}, C.P. {data.cp}, {data.ciudad}, {data.estado}</dd></div>
                            <div><dt>En el mapa</dt><dd className="ax-num">{pos ? `${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}` : '—'}</dd></div>
                          </dl>
                        </section>

                        <div className={cx('axf-check', errors.acepto && 'has-err')}>
                          <label>
                            <input type="checkbox" checked={acepto} onChange={(e) => { setAcepto(e.target.checked); if (errors.acepto) setErrors((er) => ({ ...er, acepto: '' })); }}
                              aria-invalid={errors.acepto ? 'true' : undefined} aria-describedby={errors.acepto ? id('ac-e') : undefined} />
                            <span className="box" aria-hidden="true"><Check size={14} weight="bold" /></span>
                            <span>Confirmo que los datos y documentos son de mi negocio y están vigentes.</span>
                          </label>
                          {errors.acepto && <p id={id('ac-e')} className="axr-err" role="alert"><WarningCircle size={16} weight="fill" aria-hidden="true" />{errors.acepto}</p>}
                        </div>
                      </>
                    )}

                    <div className="axf-nav">
                      {paso > 0 && <button type="button" className="axf-btn axf-btn-ghost" onClick={() => irA(paso - 1)} disabled={cargando}><ArrowLeft size={18} weight="bold" aria-hidden="true" />Atrás</button>}
                      <button type="submit" className="axf-btn" disabled={cargando} aria-busy={cargando}>
                        {cargando ? <><CircleNotch className="axr-spin" size={18} weight="bold" aria-hidden="true" />Enviando solicitud…</>
                          : paso < 2 ? <>Continuar<ArrowRight size={18} weight="bold" aria-hidden="true" /></>
                          : <>Enviar solicitud<Check size={18} weight="bold" aria-hidden="true" /></>}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="axf-panel axr-done" data-dir="1">
                    <div className="axr-burst" aria-hidden="true">
                      {Array.from({ length: 10 }, (_, i) => <i key={i} style={{ '--a': `${i * 36}deg`, '--k': i % 2 }} />)}
                      <svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="34" /><path d="M24 41 l12 12 l21 -25" /></svg>
                    </div>
                    <h2 className="axr-form-t" ref={headRef} tabIndex={-1}>¡Solicitud enviada!</h2>
                    <p className="axr-form-s">Recibimos los datos de <b>{data.nombre.trim()}</b>. Revisaremos tu documentación y te avisaremos cuando tu refaccionaria esté validada.</p>
                    <p className="axf-folio">Tu folio: <b className="ax-num">{folio}</b></p>
                    <div className="axf-nav axf-nav-col"><Link to="/" className="axf-btn">Volver al inicio<ArrowRight size={18} weight="bold" aria-hidden="true" /></Link></div>
                  </div>
                )}
              </div>
            </div>

            {/* ---- Escena 3D: tu credencial de refaccionaria ---- */}
            <div ref={surfaceRef} className="ax-scene axf-scene" aria-hidden="true">
              <div ref={stageRef} className="ax-stage">
                <div className="ax-glow" />
                <div className="ax-floor"><div className="ax-floor-grid" /></div>
                <div className="axr-card">
                  <div className="axr-float">
                    <div className={cx('axr-card-in', paso === 2 && !done && 'is-flip', done && 'is-done')}>
                      <div className="axr-face axr-front">
                        <svg className="axr-front-bg" viewBox="0 0 200 200"><path d={gearPath(16, 96, 80)} /><circle cx="100" cy="100" r="40" /></svg>
                        <div className="axr-card-top">
                          <span className="axr-brand"><Gear size={22} weight="fill" />AutoRed</span>
                          <span className="axr-tag">Refaccionaria</span>
                        </div>
                        <div className="axr-chipset"><i /><i /><i /></div>
                        <p className="axr-card-num ax-num">{rfcCard}</p>
                        <div className="axr-card-bot">
                          <p className="axr-card-name">{nombreCard}</p>
                          <p className="axr-card-city">{data.ciudad.trim() || 'Tu ciudad'}</p>
                        </div>
                        <span className="axr-stamp">Enviada</span>
                      </div>
                      <div className="axr-face axr-back">
                        <span className="axr-stripe" />
                        <p className="axr-back-t">Documentos</p>
                        <ul className="axf-backdocs">
                          <li className={docsOk.csf ? 'ok' : ''}><span className="dot"><Check size={12} weight="bold" /></span>Constancia SAT</li>
                          <li className={docsOk.ine ? 'ok' : ''}><span className="dot"><Check size={12} weight="bold" /></span>Identificación INE</li>
                        </ul>
                        <p className="axr-back-s"><FileText size={14} weight="fill" />Revisión pendiente</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="axr-chip axr-chip-a"><div className="ax-fc-in ax-glass ax-row" style={{ '--d': '0s' }}><MapPin size={18} weight="fill" />{pos ? 'Ubicación marcada' : 'Márcala en el mapa'}</div></div>
                <div className="axr-chip axr-chip-b"><div className="ax-fc-in ax-glass ax-row" style={{ '--d': '-2.4s' }}><CheckCircle size={18} weight="fill" />{done ? 'Solicitud enviada' : `Paso ${paso + 1} de 3`}</div></div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
