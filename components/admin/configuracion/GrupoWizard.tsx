'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Transition, Variants } from 'framer-motion';
import { ArrowLeft, Check, ChevronDown, Copy, Loader2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import type { GrupoConfigData, DisciplinaConfigData, ProfesorData, SalonData } from '@/types/configuracion';
import {
  crearGrupo,
  getTarifaPorTier,
  obtenerDatosDeClonacion,
} from '@/lib/actions/config-grupos';
import { CAT_OPTIONS, DURACION_OPTIONS } from '@/lib/constants';

// ─── Types ────────────────────────────────────────────────────────────────────

type Modo = 'nuevo' | 'clonar';
type PasoId = 1 | 2 | 3 | 4;

interface DisciplinaRow {
  uid: string;
  disciplinaId: string;
  dias: string[];
  horaInicio: string;
  duracionMinutos: number;
}

interface Props {
  grupos: GrupoConfigData[];
  disciplinas: DisciplinaConfigData[];
  profesores: ProfesorData[];
  salones: SalonData[];
  onClose: () => void;
  onCreado: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;
const DIA_CORTO: Record<string, string> = { L: 'Lu', M: 'Ma', X: 'Mi', J: 'Ju', V: 'Vi', S: 'Sá', D: 'Do' };
const DIA_LARGO: Record<string, string> = { L: 'Lun', M: 'Mar', X: 'Mié', J: 'Jue', V: 'Vie', S: 'Sáb', D: 'Dom' };

function uid() { return Math.random().toString(36).slice(2, 9); }

function tierLabel(n: number): string {
  if (n <= 0) return 'BASE';
  if (n === 1) return 'T1';
  if (n === 2) return 'T2';
  if (n === 3) return 'T3';
  if (n === 4) return 'T4';
  return 'FULL';
}

function horaTextoPreview(dias: string[], horaInicio: string, duracion: number): string {
  if (!dias.length || !horaInicio) return '';
  const [h, m] = horaInicio.split(':').map(Number);
  const fin = h * 60 + m + duracion;
  const horaFin = `${String(Math.floor(fin / 60)).padStart(2, '0')}:${String(fin % 60).padStart(2, '0')}`;
  const labels = dias.map((d) => DIA_LARGO[d]).filter(Boolean);
  const diaStr =
    labels.length === 1 ? labels[0]
    : labels.length === 2 ? `${labels[0]} y ${labels[1]}`
    : `${labels.slice(0, -1).join(', ')} y ${labels.at(-1)}`;
  return `${diaStr} · ${horaInicio}–${horaFin}`;
}

const fmtMXN = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

// ─── Animations ───────────────────────────────────────────────────────────────

const SPRING: Transition = { type: 'spring', mass: 0.4, damping: 22, stiffness: 130 };

const stepVariants: Variants = {
  enter:  (dir: number) => ({ x: dir > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: SPRING },
  exit:   (dir: number) => ({
    x: dir > 0 ? -48 : 48,
    opacity: 0,
    transition: { duration: 0.15, ease: 'easeIn' },
  }),
};

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputCls =
  'w-full dark:bg-white/[0.06] bg-white border dark:border-white/[0.10] border-gray-200 rounded-xl ' +
  'px-4 py-2.5 font-inter text-sm dark:text-white text-gray-900 ' +
  'placeholder:dark:text-white/25 placeholder:text-gray-400 ' +
  'focus:outline-none dark:focus:border-epic-gold/60 focus:border-epic-gold/80 transition-colors';

const selectCls =
  'w-full appearance-none dark:bg-white/[0.06] bg-white border dark:border-white/[0.10] border-gray-200 ' +
  'rounded-xl px-4 py-2.5 pr-10 font-inter text-sm dark:text-white text-gray-900 ' +
  'focus:outline-none dark:focus:border-epic-gold/60 focus:border-epic-gold/80 transition-colors';

const labelCls =
  'block font-inter text-xs font-medium dark:text-white/50 text-gray-500 mb-1.5 tracking-wide uppercase';

// ─── Progress Bar ─────────────────────────────────────────────────────────────

const PASO_LABELS = ['Modo', 'Básicos', 'Técnico', 'Revisión'];

function ProgressBar({ paso }: { paso: PasoId }) {
  return (
    <div className="px-6 pt-4 pb-5 border-b dark:border-white/[0.06] border-gray-100">
      <div className="flex items-center">
        {PASO_LABELS.map((label, i) => {
          const num = (i + 1) as PasoId;
          const done = paso > num;
          const active = paso === num;
          return (
            <div key={num} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1 shrink-0">
                <motion.div
                  animate={{
                    background: done || active
                      ? 'rgba(201,162,39,1)'
                      : 'rgba(255,255,255,0.06)',
                    borderColor: active && !done
                      ? 'rgba(201,162,39,0.6)'
                      : 'transparent',
                  }}
                  transition={{ duration: 0.3 }}
                  className={[
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-montserrat border',
                    done || active ? 'text-black' : 'dark:text-white/30 text-gray-400',
                    active && !done ? 'dark:!bg-epic-gold/10 !bg-amber-50' : '',
                  ].join(' ')}
                >
                  {done ? <Check size={12} strokeWidth={3} /> : num}
                </motion.div>
                <span className={[
                  'text-[9px] font-inter uppercase tracking-wider transition-colors duration-300',
                  active ? 'text-epic-gold' : done ? 'dark:text-white/50 text-gray-400' : 'dark:text-white/25 text-gray-300',
                ].join(' ')}>
                  {label}
                </span>
              </div>
              {i < PASO_LABELS.length - 1 && (
                <div className="flex-1 mx-2 mb-4 h-px overflow-hidden dark:bg-white/[0.08] bg-gray-100">
                  <motion.div
                    className="h-full bg-epic-gold/50"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: done ? 1 : 0 }}
                    style={{ transformOrigin: 'left' }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GrupoWizard({ grupos, disciplinas, profesores, salones, onClose, onCreado }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const [paso, setPaso] = useState<PasoId>(1);
  const [dir, setDir] = useState<1 | -1>(1);

  // Paso 1
  const [modo, setModo] = useState<Modo>('nuevo');
  const [origenId, setOrigenId] = useState('');
  const [loadingOrigen, setLoadingOrigen] = useState(false);

  // Paso 2
  const [nombre, setNombre] = useState('');
  const [cicloEscolar, setCicloEscolar] = useState('');
  const [categoria, setCategoria] = useState('');
  const [edadMin, setEdadMin] = useState('');
  const [edadMax, setEdadMax] = useState('');
  const [cupo, setCupo] = useState('');

  // Paso 3
  const [rows, setRows] = useState<DisciplinaRow[]>([]);
  const [precio, setPrecio] = useState('');
  const [precioOrigen, setPrecioOrigen] = useState<'auto' | 'manual'>('auto');
  const [fetchingPrecio, setFetchingPrecio] = useState(false);
  const [profesorId, setProfesorId] = useState('');
  const [salonId, setSalonId] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [activo, setActivo] = useState(true);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Auto-precio cuando cambia el tier o la categoría
  useEffect(() => {
    if (!categoria || rows.length === 0 || precioOrigen === 'manual') return;
    const tier = tierLabel(rows.length);
    setFetchingPrecio(true);
    getTarifaPorTier(categoria, tier)
      .then((ref) => { if (ref) setPrecio(String(ref.precioMensualidad)); })
      .finally(() => setFetchingPrecio(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows.length, categoria]);

  // ─── Helpers de errores ───────────────────────────────────────────────────

  function clearError(key: string) {
    setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
  }

  // ─── Validación por paso ──────────────────────────────────────────────────

  function validarPaso(p: PasoId): boolean {
    const e: Record<string, string> = {};

    if (p === 1) {
      if (modo === 'clonar' && !origenId) e.origenId = 'Selecciona un grupo para clonar.';
    }

    if (p === 2) {
      if (!nombre.trim())                              e.nombre = 'El nombre es obligatorio.';
      if (!categoria)                                  e.categoria = 'Elige una categoría.';
      if (!edadMin || !edadMax)                        e.edad = 'Indica el rango de edad.';
      else if (Number(edadMin) >= Number(edadMax))     e.edad = 'La edad mínima debe ser menor a la máxima.';
      if (!cupo || Number(cupo) < 1)                   e.cupo = 'El cupo debe ser mayor a 0.';
    }

    if (p === 3) {
      if (rows.length === 0) {
        e.disciplinas = 'Selecciona al menos una disciplina.';
      } else {
        for (const row of rows) {
          if (row.dias.length === 0)  { e.disciplinas = 'Cada disciplina necesita al menos un día.'; break; }
          if (!row.horaInicio)        { e.disciplinas = 'Indica la hora de inicio de cada disciplina.'; break; }
        }
      }
      if (!precio || isNaN(Number(precio))) e.precio = 'Indica un precio mensual válido.';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ─── Navegación ───────────────────────────────────────────────────────────

  async function handleContinuar() {
    if (!validarPaso(paso)) return;

    if (paso === 1 && modo === 'clonar' && origenId) {
      setLoadingOrigen(true);
      const datos = await obtenerDatosDeClonacion(origenId);
      if (datos) {
        setNombre(`${datos.nombre} (copia)`);
        setCategoria(datos.categoria);
        setEdadMin(String(datos.edadMin));
        setEdadMax(String(datos.edadMax));
        setCupo(String(datos.cupo));
        setDescripcion(datos.descripcion ?? '');
        setProfesorId(datos.profesorId ?? '');
        setSalonId(datos.salonId ?? '');
        setActivo(datos.activo);
        setRows(datos.disciplinas.map((d) => ({
          uid: uid(),
          disciplinaId: d.disciplinaId,
          dias: d.dias,
          horaInicio: d.horaInicio,
          duracionMinutos: d.duracionMinutos,
        })));
        if (datos.precioMensualidad) {
          setPrecio(String(datos.precioMensualidad));
          setPrecioOrigen('auto');
        }
      }
      setLoadingOrigen(false);
    }

    setDir(1);
    setPaso((p) => (p < 4 ? (p + 1) as PasoId : p));
  }

  function handleRetroceder() {
    setDir(-1);
    setPaso((p) => (p > 1 ? (p - 1) as PasoId : p));
  }

  // ─── Disciplinas ──────────────────────────────────────────────────────────

  function toggleDisciplina(disciplinaId: string) {
    clearError('disciplinas');
    const existing = rows.find((r) => r.disciplinaId === disciplinaId);
    if (existing) {
      setRows((prev) => prev.filter((r) => r.uid !== existing.uid));
    } else {
      setRows((prev) => [...prev, { uid: uid(), disciplinaId, dias: [], horaInicio: '16:00', duracionMinutos: 60 }]);
    }
    if (precioOrigen === 'manual') setPrecioOrigen('auto');
  }

  function updateRow(id: string, patch: Partial<DisciplinaRow>) {
    setRows((prev) => prev.map((r) => r.uid === id ? { ...r, ...patch } : r));
  }

  function toggleDia(rowId: string, dia: string) {
    setRows((prev) =>
      prev.map((r) =>
        r.uid === rowId
          ? { ...r, dias: r.dias.includes(dia) ? r.dias.filter((d) => d !== dia) : [...r.dias, dia] }
          : r,
      ),
    );
    clearError('disciplinas');
  }

  // ─── Guardar ──────────────────────────────────────────────────────────────

  async function handleGuardar() {
    if (!validarPaso(3)) { setDir(-1); setPaso(3); return; }
    setSaving(true);

    const descFinal = [
      cicloEscolar ? `Ciclo: ${cicloEscolar}` : '',
      descripcion.trim(),
    ].filter(Boolean).join('\n') || null;

    const res = await crearGrupo({
      nombre: nombre.trim(),
      categoria,
      edadMin: Number(edadMin),
      edadMax: Number(edadMax),
      cupo: Number(cupo),
      disciplinas: rows.map((r) => ({
        disciplinaId: r.disciplinaId,
        dias: r.dias,
        horaInicio: r.horaInicio,
        duracionMinutos: r.duracionMinutos,
      })),
      precioMensualidad: Number(precio),
      activo,
      profesorId: profesorId || null,
      salonId: salonId || null,
      descripcion: descFinal,
    });

    setSaving(false);
    if (res.ok) {
      const { resumen } = res;
      toast.success(`Grupo "${resumen.nombre}" creado`, {
        description: `${resumen.tier} · ${resumen.numDisciplinas} disciplina${resumen.numDisciplinas !== 1 ? 's' : ''} · ${fmtMXN(resumen.precioMensualidad)}/mes`,
      });
      onCreado();
    } else {
      setErrors({ general: res.error });
    }
  }

  // ─── Paso 1: Modo ─────────────────────────────────────────────────────────

  function renderPaso1() {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {([
            { key: 'nuevo' as Modo, Icon: Plus, title: 'Desde cero', desc: 'Configura nombre, disciplinas y horarios de forma libre.' },
            { key: 'clonar' as Modo, Icon: Copy, title: 'Clonar grupo', desc: 'Precarga la configuración de un grupo existente como base.' },
          ] as const).map(({ key, Icon, title, desc }) => (
            <button
              key={key}
              type="button"
              onClick={() => { setModo(key); clearError('origenId'); }}
              className={[
                'text-left p-5 rounded-2xl border transition-all duration-200 group',
                modo === key
                  ? 'border-epic-gold/40 dark:bg-epic-gold/[0.06] bg-amber-50'
                  : 'dark:border-white/[0.08] border-gray-200 dark:hover:border-white/20 hover:border-gray-300 dark:bg-white/[0.02] bg-gray-50',
              ].join(' ')}
            >
              <div className={[
                'w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-all duration-200',
                modo === key
                  ? 'bg-epic-gold text-black'
                  : 'dark:bg-white/[0.08] bg-gray-200 dark:text-white/50 text-gray-500 group-hover:dark:text-white/70',
              ].join(' ')}>
                <Icon size={18} />
              </div>
              <p className="font-montserrat font-bold text-sm dark:text-white text-gray-900 mb-1">{title}</p>
              <p className="font-inter text-xs dark:text-white/40 text-gray-500 leading-relaxed">{desc}</p>
            </button>
          ))}
        </div>

        {modo === 'clonar' && (
          <div>
            <label className={labelCls}>Grupo a clonar</label>
            <div className="relative">
              <select
                value={origenId}
                onChange={(e) => { setOrigenId(e.target.value); clearError('origenId'); }}
                className={selectCls}
                title="Grupo a clonar"
              >
                <option value="">Selecciona un grupo…</option>
                {grupos
                  .slice()
                  .sort((a, b) => a.nombre.localeCompare(b.nombre))
                  .map((g) => (
                    <option key={g.id} value={g.id}>{g.nombre}</option>
                  ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 dark:text-white/30 text-gray-400 pointer-events-none" />
            </div>
            {errors.origenId && (
              <p className="mt-1.5 font-inter text-xs text-red-400">{errors.origenId}</p>
            )}
          </div>
        )}
      </div>
    );
  }

  // ─── Paso 2: Datos básicos ────────────────────────────────────────────────

  function renderPaso2() {
    return (
      <div className="space-y-4">
        <div>
          <label className={labelCls}>Nombre del grupo</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => { setNombre(e.target.value); clearError('nombre'); }}
            placeholder="Ej. EPIC ONE Ballet + Jazz"
            className={inputCls}
          />
          {errors.nombre && <p className="mt-1.5 font-inter text-xs text-red-400">{errors.nombre}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Categoría</label>
            <div className="relative">
              <select
                value={categoria}
                onChange={(e) => { setCategoria(e.target.value); clearError('categoria'); setPrecioOrigen('auto'); }}
                className={selectCls}
                title="Categoría"
              >
                <option value="">Selecciona…</option>
                {CAT_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 dark:text-white/30 text-gray-400 pointer-events-none" />
            </div>
            {errors.categoria && <p className="mt-1.5 font-inter text-xs text-red-400">{errors.categoria}</p>}
          </div>
          <div>
            <label className={labelCls}>Ciclo escolar</label>
            <input
              type="text"
              value={cicloEscolar}
              onChange={(e) => setCicloEscolar(e.target.value)}
              placeholder="2025–2026"
              className={inputCls}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Edad mín.</label>
            <input
              type="number" min={0} max={99}
              value={edadMin}
              onChange={(e) => { setEdadMin(e.target.value); clearError('edad'); }}
              placeholder="0"
              className={inputCls}
              title="Edad mínima"
            />
          </div>
          <div>
            <label className={labelCls}>Edad máx.</label>
            <input
              type="number" min={0} max={99}
              value={edadMax}
              onChange={(e) => { setEdadMax(e.target.value); clearError('edad'); }}
              placeholder="18"
              className={inputCls}
              title="Edad máxima"
            />
          </div>
          <div>
            <label className={labelCls}>Cupo</label>
            <input
              type="number" min={1}
              value={cupo}
              onChange={(e) => { setCupo(e.target.value); clearError('cupo'); }}
              placeholder="20"
              className={inputCls}
              title="Cupo máximo"
            />
          </div>
        </div>
        {errors.edad && <p className="font-inter text-xs text-red-400">{errors.edad}</p>}
        {errors.cupo && <p className="font-inter text-xs text-red-400">{errors.cupo}</p>}
      </div>
    );
  }

  // ─── Paso 3: Configuración técnica ────────────────────────────────────────

  function renderPaso3() {
    const tier = tierLabel(rows.length);
    return (
      <div className="space-y-5">

        {/* Disciplinas */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-montserrat text-[10px] font-bold uppercase tracking-[0.15em] text-epic-gold/70">
              Disciplinas y Horarios
            </h4>
            <span className="font-inter text-[10px] px-2 py-0.5 rounded-full dark:bg-white/[0.06] bg-gray-100 dark:border-white/[0.08] border-gray-200 border dark:text-white/40 text-gray-500">
              Tier {tier}
            </span>
          </div>

          {disciplinas.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {disciplinas.map((d) => {
                const sel = rows.some((r) => r.disciplinaId === d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDisciplina(d.id)}
                    className={[
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-inter font-semibold border transition-all duration-150',
                      sel
                        ? 'bg-epic-gold text-black border-epic-gold'
                        : 'dark:bg-white/[0.04] bg-gray-100 dark:text-white/60 text-gray-600 dark:border-white/[0.08] border-gray-200 dark:hover:border-epic-gold/40 hover:border-amber-300',
                    ].join(' ')}
                  >
                    {sel && <Check size={11} strokeWidth={3} />}
                    {d.nombre}
                  </button>
                );
              })}
            </div>
          )}

          {errors.disciplinas && (
            <p className="font-inter text-xs text-red-400 dark:bg-red-500/[0.08] bg-red-50 rounded-xl px-3 py-2">
              {errors.disciplinas}
            </p>
          )}

          {rows.length === 0 ? (
            <div className="py-8 text-center rounded-xl border border-dashed dark:border-white/[0.08] border-gray-200">
              <p className="font-inter text-xs dark:text-white/25 text-gray-400">
                Selecciona las disciplinas arriba para configurar sus horarios.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {rows.map((row) => {
                const disc = disciplinas.find((d) => d.id === row.disciplinaId);
                return (
                  <div
                    key={row.uid}
                    className="dark:bg-white/[0.03] bg-gray-50 rounded-xl border dark:border-white/[0.07] border-gray-200 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-inter font-semibold text-sm dark:text-white text-gray-900">
                        {disc?.nombre ?? 'Disciplina'}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleDisciplina(row.disciplinaId)}
                        className="p-1 rounded-lg dark:text-white/30 text-gray-400 dark:hover:text-red-400 hover:text-red-500 dark:hover:bg-red-500/10 hover:bg-red-50 transition-all"
                        title="Quitar"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div className="flex gap-1.5 flex-wrap">
                      {DIAS.map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => toggleDia(row.uid, d)}
                          className={[
                            'w-8 h-8 rounded-lg text-[11px] font-inter font-semibold transition-all duration-100',
                            row.dias.includes(d)
                              ? 'bg-epic-gold text-black'
                              : 'dark:bg-white/[0.06] bg-gray-100 dark:text-white/50 text-gray-500 dark:hover:bg-white/[0.10] hover:bg-gray-200',
                          ].join(' ')}
                        >
                          {DIA_CORTO[d]}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="font-inter text-[11px] dark:text-white/40 text-gray-500 uppercase tracking-wide mb-1">Hora inicio</p>
                        <input
                          type="time"
                          value={row.horaInicio}
                          onChange={(e) => updateRow(row.uid, { horaInicio: e.target.value })}
                          className="w-full dark:bg-white/[0.06] bg-white border dark:border-white/[0.10] border-gray-200 rounded-lg px-3 py-2 font-inter text-sm dark:text-white text-gray-900 focus:outline-none focus:border-epic-gold/60 transition-colors"
                          title={`Hora inicio — ${disc?.nombre ?? ''}`}
                        />
                      </div>
                      <div>
                        <p className="font-inter text-[11px] dark:text-white/40 text-gray-500 uppercase tracking-wide mb-1">Duración</p>
                        <div className="relative">
                          <select
                            value={row.duracionMinutos}
                            onChange={(e) => updateRow(row.uid, { duracionMinutos: Number(e.target.value) })}
                            className="w-full appearance-none dark:bg-white/[0.06] bg-white border dark:border-white/[0.10] border-gray-200 rounded-lg px-3 py-2 pr-8 font-inter text-sm dark:text-white text-gray-900 focus:outline-none focus:border-epic-gold/60 transition-colors"
                            title={`Duración — ${disc?.nombre ?? ''}`}
                          >
                            {DURACION_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 dark:text-white/30 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    {row.dias.length > 0 && row.horaInicio && (
                      <p className="font-inter text-[11px] text-epic-gold/50 italic">
                        {horaTextoPreview(row.dias, row.horaInicio, row.duracionMinutos)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Precio */}
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="font-montserrat text-[10px] font-bold uppercase tracking-[0.15em] text-epic-gold/70">
              Precio mensual
            </h4>
            {fetchingPrecio && <Loader2 size={11} className="animate-spin dark:text-white/30 text-gray-400" />}
            {!fetchingPrecio && rows.length > 0 && (
              <span className={[
                'font-inter text-[10px] px-2 py-0.5 rounded-full border',
                precioOrigen === 'auto'
                  ? 'dark:bg-epic-gold/10 bg-amber-50 text-epic-gold dark:border-epic-gold/20 border-amber-200'
                  : 'dark:bg-white/[0.05] bg-gray-100 dark:text-white/40 text-gray-500 dark:border-white/[0.10] border-gray-200',
              ].join(' ')}>
                {precioOrigen === 'auto' ? `Auto · ${tier}` : 'Manual'}
              </span>
            )}
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-inter text-sm dark:text-white/30 text-gray-400 select-none">
              $
            </span>
            <input
              type="number"
              min={0}
              value={precio}
              onChange={(e) => { setPrecio(e.target.value); setPrecioOrigen('manual'); clearError('precio'); }}
              placeholder="0"
              className={inputCls.replace('px-4', 'pl-8 pr-4')}
            />
          </div>
          {errors.precio && <p className="font-inter text-xs text-red-400">{errors.precio}</p>}
        </section>

        {/* Ajustes adicionales */}
        <section className="space-y-3">
          <h4 className="font-montserrat text-[10px] font-bold uppercase tracking-[0.15em] text-epic-gold/70">
            Ajustes adicionales
          </h4>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className={labelCls}>Estado</p>
              <p className="font-inter text-xs mt-0.5">
                {activo
                  ? <span className="text-green-500">Activo</span>
                  : <span className="dark:text-white/40 text-gray-400">Inactivo</span>}
              </p>
            </div>
            <button
              type="button"
              title={activo ? 'Activo — clic para desactivar' : 'Inactivo — clic para activar'}
              onClick={() => setActivo((v) => !v)}
              className={[
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
                activo ? 'bg-epic-gold' : 'dark:bg-white/15 bg-gray-300',
              ].join(' ')}
            >
              <span className={[
                'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transform transition-transform duration-200',
                activo ? 'translate-x-5' : 'translate-x-0',
              ].join(' ')} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Salón asignado</label>
              <div className="relative">
                <select
                  value={salonId}
                  onChange={(e) => setSalonId(e.target.value)}
                  className={selectCls}
                  title="Salón asignado"
                >
                  <option value="">— Sin asignar —</option>
                  {salones.map((s) => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 dark:text-white/30 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className={labelCls}>Profesor asignado</label>
              <div className="relative">
                <select
                  value={profesorId}
                  onChange={(e) => setProfesorId(e.target.value)}
                  className={selectCls}
                  title="Profesor asignado"
                >
                  <option value="">— Sin asignar —</option>
                  {profesores.map((p) => (
                    <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 dark:text-white/30 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div>
            <label className={labelCls}>Notas internas</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Observaciones del grupo (opcional)"
              rows={2}
              title="Notas internas"
              className="w-full dark:bg-white/[0.06] bg-white border dark:border-white/[0.10] border-gray-200 rounded-xl px-4 py-2.5 font-inter text-sm dark:text-white text-gray-900 resize-none placeholder:dark:text-white/25 placeholder:text-gray-400 focus:outline-none focus:border-epic-gold/60 transition-colors"
            />
          </div>
        </section>
      </div>
    );
  }

  // ─── Paso 4: Revisión ─────────────────────────────────────────────────────

  function renderPaso4() {
    const tier = tierLabel(rows.length);
    const catLabel = CAT_OPTIONS.find((c) => c.value === categoria)?.label ?? categoria;
    const prof = profesores.find((p) => p.id === profesorId);
    const precioNum = Number(precio);
    const discNames = rows
      .map((r) => disciplinas.find((d) => d.id === r.disciplinaId)?.nombre ?? '?')
      .join(', ');

    const items: { label: string; val: string; accent?: boolean }[] = [
      { label: 'Nombre',         val: nombre || '—', accent: true },
      { label: 'Categoría',      val: catLabel || '—' },
      ...(cicloEscolar ? [{ label: 'Ciclo', val: cicloEscolar }] : []),
      { label: 'Rango de edad',  val: edadMin && edadMax ? `${edadMin}–${edadMax} años` : '—' },
      { label: 'Cupo',           val: cupo ? `${cupo} alumnas` : '—' },
      { label: 'Tier',           val: tier },
      { label: 'Disciplinas',    val: rows.length > 0 ? `${rows.length} — ${discNames}` : '—' },
      { label: 'Precio mensual', val: !isNaN(precioNum) && precioNum > 0 ? fmtMXN(precioNum) : '—', accent: true },
      { label: 'Salón',          val: salones.find((s) => s.id === salonId)?.nombre || 'Sin asignar' },
      { label: 'Profesor',       val: prof ? `${prof.nombre} ${prof.apellido}` : 'Sin asignar' },
      { label: 'Estado',         val: activo ? 'Activo' : 'Inactivo' },
    ];

    return (
      <div className="space-y-4">
        <p className="font-inter text-xs dark:text-white/40 text-gray-500">
          Revisa la configuración antes de confirmar. Podrás editar cualquier campo desde la tabla de grupos después.
        </p>

        {errors.general && (
          <p className="font-inter text-sm text-red-400 dark:bg-red-500/10 bg-red-50 rounded-xl px-4 py-3">
            {errors.general}
          </p>
        )}

        <div className="rounded-2xl border dark:border-white/[0.08] border-gray-200 dark:bg-white/[0.02] bg-gray-50 overflow-hidden">
          {items.map(({ label, val, accent }, i) => (
            <div
              key={label}
              className={[
                'flex items-start justify-between gap-4 px-4 py-3',
                i < items.length - 1 ? 'border-b dark:border-white/[0.06] border-gray-100' : '',
              ].join(' ')}
            >
              <span className="font-inter text-xs dark:text-white/40 text-gray-500 uppercase tracking-wide shrink-0 mt-0.5">
                {label}
              </span>
              <span className={[
                'font-inter text-sm text-right',
                accent ? 'font-semibold dark:text-white text-gray-900' : 'dark:text-white/80 text-gray-700',
              ].join(' ')}>
                {val}
              </span>
            </div>
          ))}
        </div>

        {modo === 'clonar' && origenId && (
          <div className="flex items-center gap-2 font-inter text-xs text-epic-gold/70 dark:bg-epic-gold/[0.06] bg-amber-50 border dark:border-epic-gold/20 border-amber-200 rounded-xl px-4 py-3">
            <Copy size={12} className="shrink-0" />
            <span>
              Basado en: <strong>{grupos.find((g) => g.id === origenId)?.nombre}</strong>
            </span>
          </div>
        )}
      </div>
    );
  }

  // ─── Render principal ─────────────────────────────────────────────────────

  const subtitulos: Record<PasoId, string> = {
    1: 'Elige cómo crear el grupo',
    2: 'Datos de identificación',
    3: 'Configuración técnica',
    4: 'Revisión final',
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className={[
          'w-full max-w-2xl flex flex-col max-h-[92vh]',
          'rounded-3xl overflow-hidden',
          'dark:bg-white/[0.03] bg-white',
          'dark:border dark:border-white/[0.08] border border-gray-200',
          'shadow-[0_24px_80px_rgba(0,0,0,0.65)]',
          'dark:[backdrop-filter:blur(40px)_saturate(160%)]',
        ].join(' ')}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between gap-3 px-6 py-4 dark:border-b dark:border-white/[0.06] border-b border-gray-100">
          <div>
            <h3 className="font-montserrat font-bold text-base dark:text-white text-gray-900">
              Nuevo Grupo
            </h3>
            <p className="font-inter text-xs dark:text-white/40 text-gray-500 mt-0.5">
              {subtitulos[paso]}
            </p>
          </div>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="p-1.5 rounded-xl dark:text-white/40 text-gray-400 dark:hover:text-white hover:text-gray-900 dark:hover:bg-white/[0.08] hover:bg-gray-100 transition-all duration-150"
          >
            <X size={16} />
          </button>
        </div>

        {/* Barra de progreso */}
        <ProgressBar paso={paso} />

        {/* Cuerpo con slide animation */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={paso}
              custom={dir}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="px-6 py-5"
            >
              {paso === 1 && renderPaso1()}
              {paso === 2 && renderPaso2()}
              {paso === 3 && renderPaso3()}
              {paso === 4 && renderPaso4()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer de navegación */}
        <div className="shrink-0 flex items-center gap-3 px-6 py-4 dark:border-t dark:border-white/[0.06] border-t border-gray-100">
          {paso > 1 ? (
            <button
              type="button"
              onClick={handleRetroceder}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-inter dark:border dark:border-white/[0.10] border border-gray-200 dark:text-white/60 text-gray-600 dark:hover:text-white hover:text-gray-900 dark:hover:border-white/20 hover:border-gray-300 transition-all duration-150"
            >
              <ArrowLeft size={14} />
              Atrás
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-inter dark:border dark:border-white/[0.10] border border-gray-200 dark:text-white/60 text-gray-600 dark:hover:text-white hover:text-gray-900 transition-all duration-150"
            >
              Cancelar
            </button>
          )}

          <div className="flex-1" />

          {paso === 4 ? (
            <button
              type="button"
              onClick={handleGuardar}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-inter font-semibold bg-epic-gold text-black hover:bg-epic-gold/90 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 shadow-liquid"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {saving ? 'Guardando…' : 'Crear Grupo'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleContinuar}
              disabled={loadingOrigen}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-inter font-semibold bg-epic-gold text-black hover:bg-epic-gold/90 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all duration-150 shadow-liquid"
            >
              {loadingOrigen && <Loader2 size={14} className="animate-spin" />}
              Continuar →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
