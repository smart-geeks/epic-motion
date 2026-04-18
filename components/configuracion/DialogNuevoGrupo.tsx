'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, ChevronDown, Copy, Loader2, Plus, Trash2, X } from 'lucide-react';
import type { GrupoConfigData } from '@/app/api/configuracion/grupos/route';
import {
  crearGrupo,
  getTarifaReferencia,
  getGrupoDisciplinasCompletas,
} from '@/lib/actions/config-grupos';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DisciplinaDisp { id: string; nombre: string; color: string | null; }

interface DisciplinaRow {
  uid: string;
  disciplinaId: string;
  dias: string[];
  horaInicio: string;
  duracionMinutos: number;
}

interface Props {
  grupos: GrupoConfigData[];
  onClose: () => void;
  onCreado: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DIAS_SEMANA = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;

const DIA_CORTO: Record<string, string> = { L: 'Lu', M: 'Ma', X: 'Mi', J: 'Ju', V: 'Vi', S: 'Sá', D: 'Do' };
const DIA_LARGO: Record<string, string> = { L: 'Lun', M: 'Mar', X: 'Mié', J: 'Jue', V: 'Vie', S: 'Sáb', D: 'Dom' };

const CAT_OPTIONS = [
  { value: 'EPIC_TOTZ',    label: 'Epic Totz' },
  { value: 'HAPPY_FEET',   label: 'Happy Feet' },
  { value: 'EPIC_ONE',     label: 'Epic One' },
  { value: 'TEEN',         label: 'Teen' },
  { value: 'COMPETICION',  label: 'Competición' },
];

const TIER_OPTIONS = [
  { value: 'BASE', label: 'BASE' },
  { value: 'T1',   label: 'T1 – 1 clase' },
  { value: 'T2',   label: 'T2 – 2 clases' },
  { value: 'T3',   label: 'T3 – 3 clases' },
  { value: 'T4',   label: 'T4 – 4 clases' },
  { value: 'FULL', label: 'FULL – máximo' },
];

const DURACION_OPTIONS = [
  { value: 45,  label: '45 min' },
  { value: 60,  label: '60 min' },
  { value: 90,  label: '90 min' },
  { value: 120, label: '2 horas' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildHoraTexto(dias: string[], horaInicio: string, duracionMinutos: number): string {
  if (!dias.length || !horaInicio) return '';
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

function uid() { return Math.random().toString(36).slice(2, 9); }

// ─── Shared input class ───────────────────────────────────────────────────────

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

export default function DialogNuevoGrupo({ grupos, onClose, onCreado }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Paso 1 — mode selection
  type Paso = 'modo' | 'form';
  const [paso, setPaso] = useState<Paso>('modo');
  const [modoSel, setModoSel] = useState<'nuevo' | 'clonar'>('nuevo');
  const [origenId, setOrigenId] = useState('');
  const [loadingPrefill, setLoadingPrefill] = useState(false);

  // Available disciplines
  const [disciplinas, setDisciplinas] = useState<DisciplinaDisp[]>([]);

  // Form fields
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('');
  const [tier, setTier] = useState('T1');
  const [edadMin, setEdadMin] = useState('');
  const [edadMax, setEdadMax] = useState('');
  const [cupo, setCupo] = useState('');
  const [rows, setRows] = useState<DisciplinaRow[]>([]);
  const [precio, setPrecio] = useState('');
  const [precioAutoRef, setPrecioAutoRef] = useState(false);
  const [fetchingPrecio, setFetchingPrecio] = useState(false);

  // Validation & submit
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Fetch disciplines list on mount
  useEffect(() => {
    fetch('/api/configuracion/disciplinas')
      .then((r) => r.json())
      .then((d) => { if (d.disciplinas) setDisciplinas(d.disciplinas); })
      .catch(() => {});
  }, []);

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function handleCategoriaChange(cat: string) {
    setCategoria(cat);
    clearError('categoria');
    if (!cat) return;
    setFetchingPrecio(true);
    const ref = await getTarifaReferencia(cat);
    setFetchingPrecio(false);
    if (ref) {
      setPrecio(String(ref.precioMensualidad));
      setPrecioAutoRef(true);
    }
  }

  async function handleContinuar() {
    if (modoSel === 'nuevo') {
      setPaso('form');
      return;
    }
    if (!origenId) return;
    setLoadingPrefill(true);

    const [gds] = await Promise.all([getGrupoDisciplinasCompletas(origenId)]);
    const origen = grupos.find((g) => g.id === origenId);

    if (origen) {
      setNombre(`${origen.nombre} (copia)`);
      setCategoria(origen.categoria);
      setTier(origen.tier);
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

      const ref = await getTarifaReferencia(origen.categoria);
      if (ref) {
        setPrecio(String(ref.precioMensualidad));
        setPrecioAutoRef(true);
      } else if (origen.tarifa) {
        setPrecio(String(origen.tarifa.precioMensualidad));
        setPrecioAutoRef(false);
      }
    }

    setLoadingPrefill(false);
    setPaso('form');
  }

  function addRow() {
    setRows((prev) => [
      ...prev,
      { uid: uid(), disciplinaId: '', dias: [], horaInicio: '16:00', duracionMinutos: 60 },
    ]);
  }

  function updateRow(id: string, patch: Partial<DisciplinaRow>) {
    setRows((prev) => prev.map((r) => r.uid === id ? { ...r, ...patch } : r));
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.uid !== id));
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

  function clearError(key: string) {
    setErrors((p) => { const n = { ...p }; delete n[key]; return n; });
  }

  // ── Validation ───────────────────────────────────────────────────────────────

  function validar(): boolean {
    const e: Record<string, string> = {};
    if (!nombre.trim())                         e.nombre = 'El nombre es obligatorio.';
    if (!categoria)                              e.categoria = 'Elige una categoría.';
    if (!edadMin || !edadMax)                    e.edad = 'Indica el rango de edad.';
    else if (Number(edadMin) > Number(edadMax))  e.edad = 'La edad mínima no puede ser mayor que la máxima.';
    if (!cupo || Number(cupo) < 1)               e.cupo = 'El cupo debe ser mayor a 0.';
    if (rows.length === 0)                       e.disciplinas = 'Agrega al menos una disciplina.';
    else {
      for (const row of rows) {
        if (!row.disciplinaId)         { e.disciplinas = 'Selecciona la disciplina en cada fila.'; break; }
        if (row.dias.length === 0)     { e.disciplinas = 'Cada disciplina debe tener al menos un día.'; break; }
        if (!row.horaInicio)           { e.disciplinas = 'Indica la hora de inicio de cada disciplina.'; break; }
      }
    }
    if (!precio || isNaN(Number(precio))) e.precio = 'Indica un precio mensual válido.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Save ─────────────────────────────────────────────────────────────────────

  async function handleGuardar() {
    if (!validar()) return;
    setSaving(true);

    const res = await crearGrupo({
      nombre: nombre.trim(),
      categoria,
      esCompetitivo: categoria === 'COMPETICION',
      tier,
      edadMin: Number(edadMin),
      edadMax: Number(edadMax),
      cupo: Number(cupo),
      disciplinas: rows.map((r) => ({
        disciplinaId: r.disciplinaId,
        dias: r.dias,
        horaInicio: r.horaInicio,
        duracionMinutos: r.duracionMinutos,
        horaTexto: buildHoraTexto(r.dias, r.horaInicio, r.duracionMinutos),
      })),
      precioMensualidad: Number(precio),
      precioPreseason: 500,
    });

    setSaving(false);
    if (res.ok) {
      onCreado();
    } else {
      setErrors({ general: res.error });
    }
  }

  // ── Render helpers ────────────────────────────────────────────────────────────

  function renderModo() {
    return (
      <div className="px-6 py-6 space-y-5">
        {/* Mode cards */}
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
                <div
                  className={[
                    'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                    modoSel === key
                      ? 'bg-epic-gold text-black'
                      : 'dark:bg-white/10 bg-gray-200 dark:text-white/60 text-gray-500',
                  ].join(' ')}
                >
                  <Icon size={13} />
                </div>
                <p className="font-montserrat font-bold text-sm dark:text-white text-gray-900">{title}</p>
              </div>
              <p className="font-inter text-xs dark:text-white/50 text-gray-500 leading-relaxed">{desc}</p>
            </button>
          ))}
        </div>

        {/* Clone source selector */}
        {modoSel === 'clonar' && (
          <div>
            <label className={labelCls}>Grupo a clonar</label>
            <div className="relative">
              <select
                value={origenId}
                onChange={(e) => setOrigenId(e.target.value)}
                className={selectCls}
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

  function renderForm() {
    return (
      <div className="px-6 py-5 space-y-6">

        {errors.general && (
          <p className="font-inter text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-3">
            {errors.general}
          </p>
        )}

        {/* ── Identificación ──────────────────────────────────────────────── */}
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
              placeholder="Ej. EPIC ONE 3 CLASES"
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
                  onChange={(e) => handleCategoriaChange(e.target.value)}
                  className={selectCls}
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
              <label className={labelCls}>Tier</label>
              <div className="relative">
                <select value={tier} onChange={(e) => setTier(e.target.value)} className={selectCls}>
                  {TIER_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 dark:text-white/30 text-gray-400 pointer-events-none" />
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
              />
            </div>
            <div>
              <label className={labelCls}>Edad máx.</label>
              <input
                type="number" min={0} max={99}
                value={edadMax}
                onChange={(e) => { setEdadMax(e.target.value); clearError('edad'); }}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Cupo</label>
              <input
                type="number" min={1}
                value={cupo}
                onChange={(e) => { setCupo(e.target.value); clearError('cupo'); }}
                className={inputCls}
              />
            </div>
          </div>

          {errors.edad && <p className="font-inter text-xs text-red-400">{errors.edad}</p>}
          {errors.cupo && <p className="font-inter text-xs text-red-400">{errors.cupo}</p>}
        </section>

        {/* ── Disciplinas y Horarios ───────────────────────────────────────── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-montserrat text-[10px] font-bold uppercase tracking-[0.15em] text-epic-gold/70">
              Disciplinas y Horarios
            </h4>
            <button
              type="button"
              onClick={addRow}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-inter font-medium border dark:border-white/10 border-gray-200 dark:text-white/60 text-gray-600 dark:hover:text-white dark:hover:border-epic-gold/40 hover:text-gray-900 transition-all"
            >
              <Plus size={12} />
              Agregar disciplina
            </button>
          </div>

          {errors.disciplinas && (
            <p className="font-inter text-xs text-red-400 bg-red-500/8 rounded-xl px-3 py-2">
              {errors.disciplinas}
            </p>
          )}

          {rows.length === 0 ? (
            <div className="py-8 text-center rounded-xl border border-dashed dark:border-white/10 border-gray-200">
              <p className="font-inter text-xs dark:text-white/30 text-gray-400">
                Sin disciplinas. Haz clic en "Agregar disciplina".
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((row) => (
                <div
                  key={row.uid}
                  className="dark:bg-zinc-900 bg-gray-50 rounded-xl border dark:border-white/8 border-gray-200 p-4 space-y-3"
                >
                  {/* Disciplina select + delete */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <select
                        value={row.disciplinaId}
                        onChange={(e) => { updateRow(row.uid, { disciplinaId: e.target.value }); clearError('disciplinas'); }}
                        className="w-full appearance-none dark:bg-zinc-800 bg-white border dark:border-white/10 border-gray-200 rounded-lg px-3 py-2 pr-8 font-inter text-sm dark:text-white text-gray-900 focus:outline-none focus:border-epic-gold/60 transition-colors"
                      >
                        <option value="">Selecciona disciplina…</option>
                        {disciplinas.map((d) => (
                          <option key={d.id} value={d.id}>{d.nombre}</option>
                        ))}
                      </select>
                      <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 dark:text-white/30 text-gray-400 pointer-events-none" />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRow(row.uid)}
                      className="p-1.5 rounded-lg dark:text-white/30 text-gray-400 dark:hover:text-red-400 hover:text-red-500 dark:hover:bg-red-500/10 hover:bg-red-50 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Days */}
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

                  {/* Hora inicio + Duración */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <p className="font-inter text-[11px] dark:text-white/40 text-gray-500 uppercase tracking-wide">Hora inicio</p>
                      <input
                        type="time"
                        value={row.horaInicio}
                        onChange={(e) => updateRow(row.uid, { horaInicio: e.target.value })}
                        className="w-full dark:bg-zinc-800 bg-white border dark:border-white/10 border-gray-200 rounded-lg px-3 py-2 font-inter text-sm dark:text-white text-gray-900 focus:outline-none focus:border-epic-gold/60 transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <p className="font-inter text-[11px] dark:text-white/40 text-gray-500 uppercase tracking-wide">Duración</p>
                      <div className="relative">
                        <select
                          value={row.duracionMinutos}
                          onChange={(e) => updateRow(row.uid, { duracionMinutos: Number(e.target.value) })}
                          className="w-full appearance-none dark:bg-zinc-800 bg-white border dark:border-white/10 border-gray-200 rounded-lg px-3 py-2 pr-8 font-inter text-sm dark:text-white text-gray-900 focus:outline-none focus:border-epic-gold/60 transition-colors"
                        >
                          {DURACION_OPTIONS.map((d) => (
                            <option key={d.value} value={d.value}>{d.label}</option>
                          ))}
                        </select>
                        <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 dark:text-white/30 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Preview */}
                  {row.dias.length > 0 && row.horaInicio && (
                    <p className="font-inter text-[11px] dark:text-epic-gold/50 text-amber-600 italic">
                      {buildHoraTexto(row.dias, row.horaInicio, row.duracionMinutos)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Precio mensual ───────────────────────────────────────────────── */}
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="font-montserrat text-[10px] font-bold uppercase tracking-[0.15em] text-epic-gold/70">
              Precio mensual
            </h4>
            {fetchingPrecio && <Loader2 size={11} className="animate-spin dark:text-white/30 text-gray-400" />}
            {precioAutoRef && !fetchingPrecio && (
              <span className="font-inter text-[10px] px-2 py-0.5 rounded-full dark:bg-epic-gold/10 bg-amber-50 text-epic-gold border dark:border-epic-gold/20 border-amber-200">
                Auto · grupo FULL
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
              onChange={(e) => { setPrecio(e.target.value); setPrecioAutoRef(false); clearError('precio'); }}
              placeholder="0"
              className={inputCls.replace('px-4', 'pl-8 pr-4')}
            />
          </div>
          {errors.precio && <p className="font-inter text-xs text-red-400">{errors.precio}</p>}
        </section>

      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────────

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

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {paso === 'modo' ? renderModo() : renderForm()}
        </div>

        {/* Footer — solo en paso form */}
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
