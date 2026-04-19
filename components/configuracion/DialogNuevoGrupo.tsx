'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, ChevronDown, Copy, Loader2, Plus, X } from 'lucide-react';
import type { GrupoConfigData } from '@/app/api/configuracion/grupos/route';
import type { DisciplinaConfigData } from '@/app/api/configuracion/disciplinas/route';
import type { ProfesorData } from '@/lib/actions/config-grupos';
import { toast } from 'sonner';
import { crearGrupo, getTarifaPorTier, getGrupoDisciplinasCompletas } from '@/lib/actions/config-grupos';
import { CAT_OPTIONS } from '@/lib/constants';

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
  onClose: () => void;
  onCreado: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DIAS_SEMANA = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;

const DIA_CORTO: Record<string, string> = { L: 'Lu', M: 'Ma', X: 'Mi', J: 'Ju', V: 'Vi', S: 'Sá', D: 'Do' };


const TIER_COLOR: Record<string, string> = {
  BASE: 'dark:bg-white/8 bg-gray-100 dark:text-white/50 text-gray-500 border-transparent',
  T1:   'dark:bg-blue-500/10 bg-blue-50 dark:text-blue-300 text-blue-600 dark:border-blue-500/20 border-blue-200',
  T2:   'dark:bg-violet-500/10 bg-violet-50 dark:text-violet-300 text-violet-600 dark:border-violet-500/20 border-violet-200',
  T3:   'dark:bg-epic-gold/10 bg-amber-50 text-epic-gold dark:border-epic-gold/20 border-amber-200',
  T4:   'dark:bg-orange-500/10 bg-orange-50 dark:text-orange-300 text-orange-600 dark:border-orange-500/20 border-orange-200',
  FULL: 'dark:bg-green-500/10 bg-green-50 dark:text-green-300 text-green-600 dark:border-green-500/20 border-green-200',
};

const DURACION_OPTIONS = [
  { value: 45,  label: '45 min' },
  { value: 60,  label: '60 min' },
  { value: 90,  label: '90 min' },
  { value: 120, label: '2 horas' },
];

// ─── Helpers (sólo UI — sin lógica de negocio) ────────────────────────────────

// Usado únicamente para el preview visual en el formulario, no se envía al servidor
function horaTextoPreview(dias: string[], horaInicio: string, duracionMinutos: number): string {
  if (!dias.length || !horaInicio) return '';
  const DIA_LARGO: Record<string, string> = {
    L: 'Lun', M: 'Mar', X: 'Mié', J: 'Jue', V: 'Vie', S: 'Sáb', D: 'Dom',
  };
  const [h, m] = horaInicio.split(':').map(Number);
  const finTotal = h * 60 + m + duracionMinutos;
  const horaFin = `${String(Math.floor(finTotal / 60)).padStart(2, '0')}:${String(finTotal % 60).padStart(2, '0')}`;
  const labels = dias.map((d) => DIA_LARGO[d]).filter(Boolean);
  const diaStr =
    labels.length === 1 ? labels[0]
    : labels.length === 2 ? `${labels[0]} y ${labels[1]}`
    : `${labels.slice(0, -1).join(', ')} y ${labels.at(-1)}`;
  return `${diaStr} ${horaInicio}–${horaFin}`;
}

// Espejo sólo-lectura del tier para el badge — la fuente de verdad vive en el backend
function tierLabel(n: number): string {
  if (n <= 0) return 'BASE';
  if (n === 1) return 'T1';
  if (n === 2) return 'T2';
  if (n === 3) return 'T3';
  if (n === 4) return 'T4';
  return 'FULL';
}

function uid() { return Math.random().toString(36).slice(2, 9); }

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputCls =
  'w-full dark:bg-zinc-900 bg-gray-50 border dark:border-white/10 border-gray-200 rounded-xl ' +
  'px-4 py-2.5 font-inter text-sm dark:text-white text-gray-900 ' +
  'placeholder:dark:text-white/20 placeholder:text-gray-400 ' +
  'focus:outline-none focus:border-epic-gold/60 transition-colors';

const selectCls =
  'w-full appearance-none dark:bg-zinc-900 bg-gray-50 border dark:border-white/10 border-gray-200 ' +
  'rounded-xl px-4 py-2.5 pr-10 font-inter text-sm dark:text-white text-gray-900 ' +
  'focus:outline-none focus:border-epic-gold/60 transition-colors';

const labelCls =
  'block font-inter text-xs font-medium dark:text-epic-silver text-gray-600 mb-1.5 tracking-wide uppercase';

// ─── Component ────────────────────────────────────────────────────────────────

export default function DialogNuevoGrupo({ grupos, disciplinas, profesores, onClose, onCreado }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  type Paso = 'modo' | 'form';
  const [paso, setPaso] = useState<Paso>('modo');
  const [modoSel, setModoSel] = useState<'nuevo' | 'clonar'>('nuevo');
  const [origenId, setOrigenId] = useState('');
  const [loadingPrefill, setLoadingPrefill] = useState(false);

  // Form fields
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('');
  const [edadMin, setEdadMin] = useState('');
  const [edadMax, setEdadMax] = useState('');
  const [cupo, setCupo] = useState('');
  const [rows, setRows] = useState<DisciplinaRow[]>([]);
  const [precio, setPrecio] = useState('');
  const [precioOrigen, setPrecioOrigen] = useState<'auto' | 'manual'>('auto');
  const [fetchingPrecio, setFetchingPrecio] = useState(false);
  const [activo, setActivo] = useState(true);
  const [profesorId, setProfesorId] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Auto-recalcula precio cuando cambia el número de disciplinas o la categoría
  useEffect(() => {
    if (!categoria || rows.length === 0 || precioOrigen === 'manual') return;

    const tier = tierLabel(rows.length);
    setFetchingPrecio(true);

    getTarifaPorTier(categoria, tier)
      .then((ref) => {
        if (ref) setPrecio(String(ref.precioMensualidad));
      })
      .finally(() => setFetchingPrecio(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows.length, categoria]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  function toggleDisciplina(disciplinaId: string) {
    clearError('disciplinas');
    const existing = rows.find((r) => r.disciplinaId === disciplinaId);
    if (existing) {
      setRows((prev) => prev.filter((r) => r.uid !== existing.uid));
    } else {
      setRows((prev) => [
        ...prev,
        { uid: uid(), disciplinaId, dias: [], horaInicio: '16:00', duracionMinutos: 60 },
      ]);
    }
    // Restaurar auto si el usuario vuelve a cambiar disciplinas después de edición manual
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

  async function handleContinuar() {
    if (modoSel === 'nuevo') { setPaso('form'); return; }
    if (!origenId) return;

    setLoadingPrefill(true);
    const [gds] = await Promise.all([getGrupoDisciplinasCompletas(origenId)]);
    const origen = grupos.find((g) => g.id === origenId);

    if (origen) {
      setNombre(`${origen.nombre} (copia)`);
      setCategoria(origen.categoria);
      setEdadMin(String(origen.edadMin));
      setEdadMax(String(origen.edadMax));
      setCupo(String(origen.cupo));
      setRows(
        gds.map((gd) => ({
          uid: uid(),
          disciplinaId: gd.disciplinaId,
          dias: gd.dias,
          horaInicio: gd.horaInicio || '16:00',
          duracionMinutos: gd.duracionMinutos || 60,
        })),
      );
      setPrecioOrigen('auto');
    }

    setLoadingPrefill(false);
    setPaso('form');
  }

  function clearError(key: string) {
    setErrors((p) => { const n = { ...p }; delete n[key]; return n; });
  }

  // ── Validation ────────────────────────────────────────────────────────────

  function validar(): boolean {
    const e: Record<string, string> = {};
    if (!nombre.trim())                          e.nombre = 'El nombre es obligatorio.';
    if (!categoria)                              e.categoria = 'Elige una categoría.';
    if (!edadMin || !edadMax)                    e.edad = 'Indica el rango de edad.';
    else if (Number(edadMin) > Number(edadMax))  e.edad = 'La edad mínima no puede ser mayor que la máxima.';
    if (!cupo || Number(cupo) < 1)               e.cupo = 'El cupo debe ser mayor a 0.';
    if (rows.length === 0)                       e.disciplinas = 'Selecciona al menos una disciplina.';
    else {
      for (const row of rows) {
        if (row.dias.length === 0)  { e.disciplinas = 'Cada disciplina necesita al menos un día.'; break; }
        if (!row.horaInicio)        { e.disciplinas = 'Indica la hora de inicio de cada disciplina.'; break; }
      }
    }
    if (!precio || isNaN(Number(precio))) e.precio = 'Indica un precio mensual válido.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  async function handleGuardar() {
    if (!validar()) return;
    setSaving(true);

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
      descripcion: descripcion.trim() || null,
    });

    setSaving(false);
    if (res.ok) {
      const { resumen } = res;
      const fmtPrecio = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(resumen.precioMensualidad);
      toast.success(`Grupo "${resumen.nombre}" creado`, {
        description: `${resumen.tier} · ${resumen.numDisciplinas} disciplina${resumen.numDisciplinas !== 1 ? 's' : ''} · ${fmtPrecio}/mes · ${resumen.activo ? 'Activo' : 'Inactivo — pendiente de activar'}`,
      });
      onCreado();
    } else {
      setErrors({ general: res.error });
    }
  }

  // ── Render: paso modo ─────────────────────────────────────────────────────

  function renderModo() {
    return (
      <div className="px-6 py-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              key: 'nuevo' as const,
              Icon: Plus,
              title: 'Desde cero',
              desc: 'Configura nombre, disciplinas y horarios manualmente.',
            },
            {
              key: 'clonar' as const,
              Icon: Copy,
              title: 'Clonar grupo',
              desc: 'Precarga disciplinas y horarios de un grupo existente como base.',
            },
          ].map(({ key, Icon, title, desc }) => (
            <button
              key={key}
              type="button"
              onClick={() => setModoSel(key)}
              className={[
                'text-left p-4 rounded-xl border transition-all duration-150',
                modoSel === key
                  ? 'border-epic-gold dark:bg-epic-gold/5 bg-amber-50'
                  : 'dark:border-white/8 border-gray-200 dark:hover:border-white/20 hover:border-gray-300 dark:bg-zinc-900 bg-gray-50',
              ].join(' ')}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={[
                  'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                  modoSel === key ? 'bg-epic-gold text-black' : 'dark:bg-white/10 bg-gray-200 dark:text-white/60 text-gray-500',
                ].join(' ')}>
                  <Icon size={13} />
                </div>
                <p className="font-montserrat font-bold text-sm dark:text-white text-gray-900">{title}</p>
              </div>
              <p className="font-inter text-xs dark:text-white/50 text-gray-500 leading-relaxed">{desc}</p>
            </button>
          ))}
        </div>

        {modoSel === 'clonar' && (
          <div>
            <label className={labelCls}>Grupo a clonar</label>
            <div className="relative">
              <select
                value={origenId}
                onChange={(e) => setOrigenId(e.target.value)}
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
          </div>
        )}

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={handleContinuar}
            disabled={(modoSel === 'clonar' && !origenId) || loadingPrefill}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-inter font-semibold bg-epic-gold text-black hover:bg-epic-gold/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
          >
            {loadingPrefill && <Loader2 size={14} className="animate-spin" />}
            Continuar →
          </button>
        </div>
      </div>
    );
  }

  // ── Render: paso form ─────────────────────────────────────────────────────

  function renderForm() {
    const tier = tierLabel(rows.length);

    return (
      <div className="px-6 py-5 space-y-6">

        {errors.general && (
          <p className="font-inter text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-3">
            {errors.general}
          </p>
        )}

        {/* ── Identificación ──────────────────────────────────────────── */}
        <section className="space-y-4">
          <h4 className="font-montserrat text-[10px] font-bold uppercase tracking-[0.15em] text-epic-gold/70">
            Identificación
          </h4>

          <div>
            <label className={labelCls}>Nombre del grupo</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => { setNombre(e.target.value); clearError('nombre'); }}
              placeholder="Ej. EPIC ONE Ballet + Jazz"
              className={inputCls}
            />
            {errors.nombre && <p className="mt-1 font-inter text-xs text-red-400">{errors.nombre}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Categoría</label>
              <div className="relative">
                <select
                  value={categoria}
                  onChange={(e) => { setCategoria(e.target.value); clearError('categoria'); setPrecioOrigen('auto'); }}
                  className={selectCls}
                  title="Categoría del grupo"
                >
                  <option value="">Selecciona…</option>
                  {CAT_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 dark:text-white/30 text-gray-400 pointer-events-none" />
              </div>
              {errors.categoria && <p className="mt-1 font-inter text-xs text-red-400">{errors.categoria}</p>}
            </div>

            <div>
              <label className={labelCls}>Tier (automático)</label>
              <div className={[
                'flex items-center justify-center h-[42px] rounded-xl border font-inter text-sm font-bold tracking-wider transition-all duration-200',
                TIER_COLOR[tier],
              ].join(' ')}>
                {tier}
                <span className="ml-2 text-[10px] font-normal opacity-60">
                  · {rows.length} disciplina{rows.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Edad mín.</label>
              <input
                type="number" min={0} max={99}
                value={edadMin}
                onChange={(e) => { setEdadMin(e.target.value); clearError('edad'); }}
                className={inputCls}
                placeholder="0"
                title="Edad mínima"
              />
            </div>
            <div>
              <label className={labelCls}>Edad máx.</label>
              <input
                type="number" min={0} max={99}
                value={edadMax}
                onChange={(e) => { setEdadMax(e.target.value); clearError('edad'); }}
                className={inputCls}
                placeholder="99"
                title="Edad máxima"
              />
            </div>
            <div>
              <label className={labelCls}>Cupo</label>
              <input
                type="number" min={1}
                value={cupo}
                onChange={(e) => { setCupo(e.target.value); clearError('cupo'); }}
                className={inputCls}
                title="Cupo máximo de alumnas"
                placeholder="20"
              />
            </div>
          </div>

          {errors.edad && <p className="font-inter text-xs text-red-400">{errors.edad}</p>}
          {errors.cupo && <p className="font-inter text-xs text-red-400">{errors.cupo}</p>}
        </section>

        {/* ── Disciplinas y Horarios ───────────────────────────────────── */}
        <section className="space-y-3">
          <h4 className="font-montserrat text-[10px] font-bold uppercase tracking-[0.15em] text-epic-gold/70">
            Disciplinas y Horarios
          </h4>

          {/* Chips multiselect */}
          {disciplinas.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {disciplinas.map((d) => {
                const selected = rows.some((r) => r.disciplinaId === d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDisciplina(d.id)}
                    className={[
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-inter font-semibold border transition-all duration-150',
                      selected
                        ? 'bg-epic-gold text-black border-epic-gold shadow-sm'
                        : 'dark:bg-zinc-800 bg-gray-100 dark:text-white/60 text-gray-600 dark:border-white/10 border-gray-200 dark:hover:border-epic-gold/40 hover:border-amber-300 dark:hover:text-white hover:text-gray-900',
                    ].join(' ')}
                  >
                    {selected && <Check size={11} strokeWidth={3} />}
                    {d.nombre}
                  </button>
                );
              })}
            </div>
          )}

          {errors.disciplinas && (
            <p className="font-inter text-xs text-red-400 bg-red-500/8 rounded-xl px-3 py-2">
              {errors.disciplinas}
            </p>
          )}

          {/* Cards de configuración por disciplina seleccionada */}
          {rows.length === 0 ? (
            <div className="py-8 text-center rounded-xl border border-dashed dark:border-white/10 border-gray-200">
              <p className="font-inter text-xs dark:text-white/30 text-gray-400">
                Selecciona las disciplinas arriba para configurar sus horarios.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((row) => {
                const disc = disciplinas.find((d) => d.id === row.disciplinaId);
                return (
                  <div
                    key={row.uid}
                    className="dark:bg-zinc-900 bg-gray-50 rounded-xl border dark:border-white/8 border-gray-200 p-4 space-y-3"
                  >
                    {/* Header de la card */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 dark:bg-epic-gold/70 bg-amber-400"
                        />
                        <span className="font-inter font-semibold text-sm dark:text-white text-gray-900">
                          {disc?.nombre ?? 'Disciplina'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleDisciplina(row.disciplinaId)}
                        className="p-1 rounded-lg dark:text-white/30 text-gray-400 dark:hover:text-red-400 hover:text-red-500 dark:hover:bg-red-500/10 hover:bg-red-50 transition-all"
                        title="Quitar disciplina"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {/* Días */}
                    <div className="space-y-1.5">
                      <p className="font-inter text-[11px] dark:text-white/40 text-gray-500 uppercase tracking-wide">Días</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {DIAS_SEMANA.map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => toggleDia(row.uid, d)}
                            className={[
                              'w-8 h-8 rounded-lg text-[11px] font-inter font-semibold transition-all duration-100',
                              row.dias.includes(d)
                                ? 'bg-epic-gold text-black'
                                : 'dark:bg-zinc-800 bg-gray-100 dark:text-white/50 text-gray-500 dark:hover:bg-zinc-700 hover:bg-gray-200',
                            ].join(' ')}
                          >
                            {DIA_CORTO[d]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Hora + Duración */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <p className="font-inter text-[11px] dark:text-white/40 text-gray-500 uppercase tracking-wide">Hora inicio</p>
                        <input
                          type="time"
                          value={row.horaInicio}
                          onChange={(e) => updateRow(row.uid, { horaInicio: e.target.value })}
                          className="w-full dark:bg-zinc-800 bg-white border dark:border-white/10 border-gray-200 rounded-lg px-3 py-2 font-inter text-sm dark:text-white text-gray-900 focus:outline-none focus:border-epic-gold/60 transition-colors"
                          title={`Hora de inicio — ${disc?.nombre ?? 'disciplina'}`}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <p className="font-inter text-[11px] dark:text-white/40 text-gray-500 uppercase tracking-wide">Duración</p>
                        <div className="relative">
                          <select
                            value={row.duracionMinutos}
                            onChange={(e) => updateRow(row.uid, { duracionMinutos: Number(e.target.value) })}
                            className="w-full appearance-none dark:bg-zinc-800 bg-white border dark:border-white/10 border-gray-200 rounded-lg px-3 py-2 pr-8 font-inter text-sm dark:text-white text-gray-900 focus:outline-none focus:border-epic-gold/60 transition-colors"
                            title={`Duración — ${disc?.nombre ?? 'disciplina'}`}
                          >
                            {DURACION_OPTIONS.map((d) => (
                              <option key={d.value} value={d.value}>{d.label}</option>
                            ))}
                          </select>
                          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 dark:text-white/30 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    {/* Preview horario */}
                    {row.dias.length > 0 && row.horaInicio && (
                      <p className="font-inter text-[11px] dark:text-epic-gold/50 text-amber-600 italic">
                        {horaTextoPreview(row.dias, row.horaInicio, row.duracionMinutos)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Precio mensual ───────────────────────────────────────────── */}
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
                  : 'dark:bg-white/5 bg-gray-100 dark:text-white/40 text-gray-500 dark:border-white/10 border-gray-200',
              ].join(' ')}>
                {precioOrigen === 'auto' ? `Auto · ${tier}` : 'Editado manualmente'}
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
              onChange={(e) => {
                setPrecio(e.target.value);
                setPrecioOrigen('manual');
                clearError('precio');
              }}
              placeholder="0"
              className={inputCls.replace('px-4', 'pl-8 pr-4')}
            />
          </div>
          {errors.precio && <p className="font-inter text-xs text-red-400">{errors.precio}</p>}
        </section>

        {/* ── Ajustes adicionales ───────────────────────────────────── */}
        <section className="space-y-4">
          <h4 className="font-montserrat text-[10px] font-bold uppercase tracking-[0.15em] text-epic-gold/70">
            Ajustes adicionales
          </h4>

          {/* Estado activo / inactivo */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className={labelCls}>Estado del grupo</p>
              <p className="font-inter text-xs dark:text-white/40 text-gray-500 leading-relaxed mt-0.5">
                Los grupos inactivos no aparecen en inscripciones. Útil para cursos de verano o grupos en preparación.
              </p>
            </div>
            <button
              type="button"
              title={activo ? 'Grupo activo — clic para desactivar' : 'Grupo inactivo — clic para activar'}
              onClick={() => setActivo((v) => !v)}
              className={[
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none mt-0.5',
                activo ? 'bg-epic-gold' : 'dark:bg-white/15 bg-gray-300',
              ].join(' ')}
            >
              <span
                className={[
                  'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transform transition-transform duration-200',
                  activo ? 'translate-x-5' : 'translate-x-0',
                ].join(' ')}
              />
            </button>
          </div>
          <p className="font-inter text-xs font-medium -mt-2">
            {activo
              ? <span className="text-green-500">Activo</span>
              : <span className="dark:text-white/40 text-gray-400">Inactivo</span>}
          </p>

          {/* Profesor asignado */}
          <div>
            <label className={labelCls}>Profesor asignado</label>
            <div className="relative">
              <select
                value={profesorId}
                onChange={(e) => setProfesorId(e.target.value)}
                className={selectCls}
                title="Profesor asignado al grupo"
              >
                <option value="">— Sin asignar —</option>
                {profesores.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 dark:text-white/30 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Notas internas */}
          <div>
            <label className={labelCls}>Notas internas</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej. Grupo creado para curso de verano julio–agosto 2025. Sin inscripción formal."
              rows={3}
              title="Notas internas del grupo"
              className={[
                'w-full dark:bg-zinc-900 bg-gray-50 border dark:border-white/10 border-gray-200 rounded-xl',
                'px-4 py-2.5 font-inter text-sm dark:text-white text-gray-900 resize-none',
                'placeholder:dark:text-white/20 placeholder:text-gray-400',
                'focus:outline-none focus:border-epic-gold/60 transition-colors',
              ].join(' ')}
            />
          </div>
        </section>

      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="w-full max-w-2xl dark:bg-zinc-950 bg-white rounded-2xl border dark:border-white/8 border-gray-200 shadow-2xl flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="shrink-0 flex items-center justify-between gap-3 px-6 py-4 border-b dark:border-white/8 border-gray-100">
          <div className="flex items-center gap-3">
            {paso === 'form' && (
              <button
                type="button"
                title="Volver al paso anterior"
                onClick={() => setPaso('modo')}
                className="p-1 rounded-lg dark:text-white/40 text-gray-400 dark:hover:text-white dark:hover:bg-white/8 hover:text-gray-900 hover:bg-gray-100 transition-all duration-150"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <div>
              <h3 className="font-montserrat font-bold text-base dark:text-white text-gray-900">
                {paso === 'form' && nombre ? nombre : 'Nuevo Grupo'}
              </h3>
              <p className="font-inter text-xs dark:text-white/40 text-gray-500 mt-0.5">
                {paso === 'modo' ? 'Elige cómo crear el grupo' : 'Configura nombre, disciplinas y horarios'}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="p-1 rounded-lg dark:text-white/40 text-gray-400 dark:hover:text-white dark:hover:bg-white/8 hover:text-gray-900 hover:bg-gray-100 transition-all duration-150"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body scrollable */}
        <div className="flex-1 overflow-y-auto">
          {paso === 'modo' ? renderModo() : renderForm()}
        </div>

        {/* Footer */}
        {paso === 'form' && (
          <div className="shrink-0 flex gap-3 px-6 py-4 border-t dark:border-white/8 border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-inter border dark:border-white/10 border-gray-200 dark:text-white/60 text-gray-600 hover:dark:text-white hover:text-gray-900 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleGuardar}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-inter font-semibold bg-epic-gold text-black hover:bg-epic-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {saving ? 'Guardando…' : 'Guardar Grupo'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
