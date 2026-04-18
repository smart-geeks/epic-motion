'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Loader2, Pencil, Plus, Star, Users, X } from 'lucide-react';
import type { GrupoConfigData } from '@/app/api/configuracion/grupos/route';
import type { AlumnaConfigData } from '@/app/api/configuracion/alumnas/route';
import {
  toggleInvitacionCompetencia,
  updateGrupoConfig,
  reasignarAlumna,
  removerAlumnaDeGrupo,
  removerDisciplinaDeGrupo,
  getAlumnaDisciplinasEnGrupo,
  setAlumnaDisciplinasEnGrupo,
  type ReasignacionResult,
} from '@/lib/actions/config-grupos';
import DialogNuevoGrupo from './DialogNuevoGrupo';

// ─────────────────────────────────────────────
// Utilitarios de Tier
// ─────────────────────────────────────────────

const TIER_LABELS: Record<string, string> = {
  BASE: 'BASE', T1: 'T1', T2: 'T2', T3: 'T3', T4: 'T4', FULL: 'FULL',
};

const TIER_COLORS: Record<string, string> = {
  BASE: 'bg-gray-500/15 text-gray-400',
  T1:   'bg-blue-500/15 text-blue-400',
  T2:   'bg-purple-500/15 text-purple-400',
  T3:   'bg-orange-500/15 text-orange-400',
  T4:   'bg-pink-500/15 text-pink-400',
  FULL: 'bg-epic-gold text-black',
};

const FMT_MXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });

// ─────────────────────────────────────────────
// Skeletons de carga
// ─────────────────────────────────────────────

function SkeletonGrupo() {
  return (
    <div className="dark:bg-[#121212] bg-white rounded-xl border dark:border-white/8 border-gray-200 p-4 space-y-3 animate-pulse">
      <div className="flex items-start justify-between gap-2">
        <div className="h-4 w-28 rounded dark:bg-white/10 bg-gray-200" />
        <div className="h-4 w-10 rounded dark:bg-white/10 bg-gray-200" />
      </div>
      <div className="space-y-1.5">
        <div className="h-1.5 w-full rounded-full dark:bg-white/10 bg-gray-200" />
        <div className="h-3 w-16 rounded dark:bg-white/10 bg-gray-200" />
      </div>
      <div className="space-y-1">
        <div className="h-3 w-32 rounded dark:bg-white/10 bg-gray-200" />
        <div className="h-3 w-24 rounded dark:bg-white/10 bg-gray-200" />
      </div>
      <div className="h-4 w-20 rounded dark:bg-white/10 bg-gray-200" />
    </div>
  );
}

function SkeletonAlumna() {
  return (
    <div className="flex items-center gap-3 px-3 py-3 animate-pulse">
      <div className="w-9 h-9 rounded-full dark:bg-white/10 bg-gray-200 shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 w-32 rounded dark:bg-white/10 bg-gray-200" />
        <div className="h-3 w-20 rounded dark:bg-white/10 bg-gray-200" />
      </div>
      <div className="h-7 w-36 rounded-lg dark:bg-white/10 bg-gray-200 shrink-0" />
      <div className="h-6 w-6 rounded dark:bg-white/10 bg-gray-200 shrink-0" />
    </div>
  );
}

// ─────────────────────────────────────────────
// Sub-componentes
// ─────────────────────────────────────────────

function CapacityBar({ inscritos, cupo }: { inscritos: number; cupo: number }) {
  const pct = cupo > 0 ? Math.min((inscritos / cupo) * 100, 100) : 0;
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-400' : 'bg-green-500';
  return (
    <div className="space-y-1">
      <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="font-inter text-xs dark:text-white/40 text-gray-500">
        {inscritos} / {cupo} alumnas
      </p>
    </div>
  );
}

function TierBadge({ tier }: { tier: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider ${TIER_COLORS[tier] ?? TIER_COLORS.T1}`}>
      {TIER_LABELS[tier] ?? tier}
    </span>
  );
}

function CargoBadge({ pendientes, vencidos, monto }: { pendientes: number; vencidos: number; monto: number }) {
  if (vencidos > 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-inter font-medium bg-red-500/10 text-red-400 border border-red-500/20">
        {vencidos} vencido{vencidos !== 1 ? 's' : ''} · {FMT_MXN.format(monto)}
      </span>
    );
  }
  if (pendientes > 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-inter font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
        {pendientes} pendiente{pendientes !== 1 ? 's' : ''} · {FMT_MXN.format(monto)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-inter font-medium bg-green-500/10 text-green-400 border border-green-500/20">
      <Check size={9} strokeWidth={3} /> Al día
    </span>
  );
}

// ─────────────────────────────────────────────
// Modal de detalle de grupo (alumnas + disciplinas)
// ─────────────────────────────────────────────

interface GrupoDetailProps {
  grupo: GrupoConfigData;
  alumnas: AlumnaConfigData[];
  onClose: () => void;
  onEditarConfig: () => void;
  onAlumnaRemovida: (alumnaId: string) => void;
  onDisciplinaRemovida: (grupoId: string, disciplinaId: string) => void;
}

function calcularMonto(tarifa: number, total: number, selected: number): number {
  if (total === 0 || selected === 0) return 0;
  if (selected >= total) return tarifa;
  return Math.round(tarifa * selected / total);
}

function GrupoDetailModal({ grupo, alumnas, onClose, onEditarConfig, onAlumnaRemovida, onDisciplinaRemovida }: GrupoDetailProps) {
  const alumnaDelGrupo = alumnas.filter((a) => a.grupoActual?.id === grupo.id);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Alumna expandida para editar sus disciplinas
  const [expandida, setExpandida] = useState<string | null>(null);
  // Disciplinas cargadas desde BD por alumnaId (undefined = no cargado aún)
  const [discCargadas, setDiscCargadas] = useState<Record<string, string[]>>({});
  // Selección temporal mientras el admin edita
  const [seleccion, setSeleccion] = useState<Record<string, string[]>>({});
  const [loadingDisc, setLoadingDisc] = useState<Set<string>>(new Set());
  const [guardandoDisc, setGuardandoDisc] = useState<Set<string>>(new Set());
  const [errorDisc, setErrorDisc] = useState<Record<string, string>>({});

  // Confirmación de baja del grupo
  const [confirmBaja, setConfirmBaja] = useState<string | null>(null);
  const [pendingBaja, setPendingBaja] = useState<Set<string>>(new Set());

  // Confirmación de quitar disciplina del grupo
  const [confirmDisc, setConfirmDisc] = useState<string | null>(null);
  const [pendingDisc, setPendingDisc] = useState<Set<string>>(new Set());

  async function handleExpandir(alumnaId: string) {
    if (expandida === alumnaId) { setExpandida(null); return; }
    setExpandida(alumnaId);
    if (discCargadas[alumnaId] !== undefined) return;

    setLoadingDisc((p) => new Set(p).add(alumnaId));
    const saved = await getAlumnaDisciplinasEnGrupo(alumnaId, grupo.id);
    // Si no hay registros aún, por defecto asignar todas las disciplinas del grupo
    const inicial = saved.length > 0 ? saved : grupo.disciplinas.map((d) => d.id);
    setDiscCargadas((p) => ({ ...p, [alumnaId]: inicial }));
    setSeleccion((p) => ({ ...p, [alumnaId]: inicial }));
    setLoadingDisc((p) => { const s = new Set(p); s.delete(alumnaId); return s; });
  }

  function handleToggleDisc(alumnaId: string, disciplinaId: string) {
    setSeleccion((prev) => {
      const current = prev[alumnaId] ?? [];
      const existe = current.includes(disciplinaId);
      return { ...prev, [alumnaId]: existe ? current.filter((id) => id !== disciplinaId) : [...current, disciplinaId] };
    });
  }

  async function handleGuardarDisc(alumnaId: string) {
    const ids = seleccion[alumnaId] ?? [];
    const tarifa = grupo.tarifa?.precioMensualidad ?? 0;
    const monto = calcularMonto(tarifa, grupo.disciplinas.length, ids.length);

    setGuardandoDisc((p) => new Set(p).add(alumnaId));
    setErrorDisc((p) => { const e = { ...p }; delete e[alumnaId]; return e; });
    const res = await setAlumnaDisciplinasEnGrupo(alumnaId, grupo.id, ids, monto);
    setGuardandoDisc((p) => { const s = new Set(p); s.delete(alumnaId); return s; });

    if (res.ok) {
      setDiscCargadas((p) => ({ ...p, [alumnaId]: ids }));
      setExpandida(null);
    } else {
      setErrorDisc((p) => ({ ...p, [alumnaId]: res.error ?? 'Error al guardar.' }));
    }
  }

  async function handleBaja(alumnaId: string) {
    setPendingBaja((p) => new Set(p).add(alumnaId));
    const res = await removerAlumnaDeGrupo(alumnaId);
    setPendingBaja((p) => { const s = new Set(p); s.delete(alumnaId); return s; });
    setConfirmBaja(null);
    if (res.ok) onAlumnaRemovida(alumnaId);
  }

  async function handleQuitarDisc(disciplinaId: string) {
    setPendingDisc((p) => new Set(p).add(disciplinaId));
    const res = await removerDisciplinaDeGrupo(grupo.id, disciplinaId);
    setPendingDisc((p) => { const s = new Set(p); s.delete(disciplinaId); return s; });
    setConfirmDisc(null);
    if (res.ok) onDisciplinaRemovida(grupo.id, disciplinaId);
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="w-full max-w-lg dark:bg-zinc-950 bg-white rounded-2xl border dark:border-white/8 border-gray-200 shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-6 py-4 border-b dark:border-white/8 border-gray-100">
          <div>
            <h3 className="font-montserrat font-bold text-base dark:text-white text-gray-900">{grupo.nombre}</h3>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <TierBadge tier={grupo.tier} />
              <span className="font-inter text-xs dark:text-white/40 text-gray-500">{grupo.edadMin}–{grupo.edadMax} años</span>
              {grupo.tarifa && (
                <span className="font-montserrat font-semibold text-xs text-epic-gold">
                  {FMT_MXN.format(grupo.tarifa.precioMensualidad)}/mes
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => { onClose(); onEditarConfig(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-inter font-medium border dark:border-epic-gold/40 border-gray-300 dark:text-epic-gold/70 text-gray-600 dark:hover:bg-epic-gold/10 dark:hover:border-epic-gold dark:hover:text-epic-gold hover:border-gray-400 hover:text-gray-900 transition-all duration-150"
            >
              <Pencil size={11} />
              Editar
            </button>
            <button
              type="button"
              aria-label="Cerrar"
              onClick={onClose}
              className="p-1 rounded-lg dark:text-white/40 text-gray-400 dark:hover:text-white dark:hover:bg-white/8 hover:text-gray-900 hover:bg-gray-100 transition-all duration-150"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="px-6 py-5 space-y-6 max-h-[65vh] overflow-y-auto">

          {/* ── Alumnas inscritas ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users size={12} className="text-epic-gold/80 shrink-0" />
              <h4 className="font-montserrat text-[10px] font-bold uppercase tracking-widest dark:text-white/50 text-gray-500">
                Alumnas inscritas ({alumnaDelGrupo.length})
              </h4>
            </div>

            {alumnaDelGrupo.length === 0 ? (
              <p className="font-inter text-xs dark:text-white/30 text-gray-400 italic">No hay alumnas inscritas en este grupo.</p>
            ) : (
              <div className="space-y-1">
                {alumnaDelGrupo.map((a) => {
                  const inicial = `${a.nombre[0]}${a.apellido[0]}`.toUpperCase();
                  const isExpandida = expandida === a.id;
                  const isLoading = loadingDisc.has(a.id);
                  const isGuardando = guardandoDisc.has(a.id);
                  const isBajaConfirm = confirmBaja === a.id;
                  const isBajaPending = pendingBaja.has(a.id);
                  const sel = seleccion[a.id] ?? [];
                  const tarifa = grupo.tarifa?.precioMensualidad ?? 0;
                  const montoPreview = calcularMonto(tarifa, grupo.disciplinas.length, sel.length);

                  return (
                    <div key={a.id} className="rounded-xl border dark:border-white/6 border-gray-100 overflow-hidden">
                      {/* Fila principal — click para expandir */}
                      <button
                        type="button"
                        onClick={() => handleExpandir(a.id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 dark:hover:bg-zinc-800 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-epic-gold/15 flex items-center justify-center shrink-0 font-montserrat font-bold text-xs text-epic-gold">
                          {inicial}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-inter text-sm dark:text-white text-gray-900 truncate">{a.nombre} {a.apellido}</p>
                          {discCargadas[a.id] !== undefined && !isExpandida && (
                            <p className="font-inter text-xs dark:text-white/40 text-gray-500">
                              {discCargadas[a.id].length} disciplina{discCargadas[a.id].length !== 1 ? 's' : ''} · {FMT_MXN.format(calcularMonto(tarifa, grupo.disciplinas.length, discCargadas[a.id].length))}/mes
                            </p>
                          )}
                        </div>
                        {isLoading
                          ? <Loader2 size={13} className="animate-spin dark:text-white/30 text-gray-400 shrink-0" />
                          : <ChevronDown size={13} className={`shrink-0 dark:text-white/30 text-gray-400 transition-transform ${isExpandida ? 'rotate-180' : ''}`} />
                        }
                      </button>

                      {/* Panel expandido: disciplinas de esta alumna */}
                      {isExpandida && !isLoading && (
                        <div className="px-4 pb-4 pt-1 border-t dark:border-white/6 border-gray-100 space-y-3">

                          {grupo.disciplinas.length === 0 ? (
                            <p className="font-inter text-xs dark:text-white/30 text-gray-400 italic">
                              Este grupo no tiene disciplinas configuradas.
                            </p>
                          ) : (
                            <>
                              <p className="font-inter text-[11px] dark:text-white/40 text-gray-500">
                                Selecciona las disciplinas que toma esta alumna:
                              </p>

                              {/* Checkboxes de disciplinas */}
                              <div className="space-y-1.5">
                                {grupo.disciplinas.map((d) => {
                                  const checked = sel.includes(d.id);
                                  return (
                                    <label
                                      key={d.id}
                                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg dark:bg-zinc-900 bg-gray-50 border dark:border-white/8 border-transparent cursor-pointer dark:hover:bg-zinc-800 hover:bg-gray-100 transition-colors"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => handleToggleDisc(a.id, d.id)}
                                        className="w-3.5 h-3.5 rounded accent-[#C9A227] cursor-pointer"
                                      />
                                      {d.color && (
                                        <span
                                          className="w-2.5 h-2.5 rounded-full shrink-0"
                                          style={{ backgroundColor: d.color, boxShadow: `0 0 4px ${d.color}80` }}
                                        />
                                      )}
                                      <span className="flex-1 font-inter text-sm font-medium dark:text-white text-gray-900">{d.nombre}</span>
                                      {d.horaTexto && (
                                        <span className="font-inter text-xs dark:text-zinc-500 text-gray-500">{d.horaTexto}</span>
                                      )}
                                    </label>
                                  );
                                })}
                              </div>

                              {/* Preview de precio */}
                              {tarifa > 0 && (
                                <div className="flex items-center justify-between px-3 py-2 rounded-lg dark:bg-epic-gold/8 bg-amber-50 border dark:border-epic-gold/20 border-amber-200">
                                  <span className="font-inter text-xs dark:text-epic-silver text-gray-600">
                                    Mensualidad ({sel.length} de {grupo.disciplinas.length} disc.)
                                  </span>
                                  <span className="font-montserrat font-bold text-sm text-epic-gold">
                                    {FMT_MXN.format(montoPreview)}/mes
                                  </span>
                                </div>
                              )}

                              {errorDisc[a.id] && (
                                <p className="font-inter text-xs text-red-400">{errorDisc[a.id]}</p>
                              )}

                              {/* Acciones */}
                              <div className="flex items-center justify-between pt-1">
                                {isBajaConfirm ? (
                                  <div className="flex items-center gap-2">
                                    <span className="font-inter text-xs dark:text-white/50 text-gray-500">¿Dar de baja del grupo?</span>
                                    <button
                                      type="button"
                                      onClick={() => handleBaja(a.id)}
                                      disabled={isBajaPending}
                                      className="px-2 py-1 text-[11px] font-inter font-medium rounded bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors"
                                    >
                                      {isBajaPending ? <Loader2 size={10} className="animate-spin" /> : 'Sí, dar de baja'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmBaja(null)}
                                      className="px-2 py-1 text-[11px] font-inter rounded dark:text-white/40 text-gray-500 hover:dark:text-white hover:text-gray-900 transition-colors"
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmBaja(a.id)}
                                    className="font-inter text-xs text-red-400/70 hover:text-red-400 transition-colors"
                                  >
                                    Dar de baja del grupo
                                  </button>
                                )}

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => { setExpandida(null); setSeleccion((p) => ({ ...p, [a.id]: discCargadas[a.id] ?? [] })); }}
                                    className="font-inter text-xs dark:text-white/40 text-gray-500 hover:dark:text-white hover:text-gray-900 transition-colors"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleGuardarDisc(a.id)}
                                    disabled={isGuardando || sel.length === 0}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-inter font-medium bg-epic-gold text-black hover:bg-epic-gold/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                  >
                                    {isGuardando ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                                    Guardar
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Disciplinas del grupo ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Star size={12} className="text-epic-gold/80 shrink-0" />
              <h4 className="font-montserrat text-[10px] font-bold uppercase tracking-widest dark:text-white/50 text-gray-500">
                Disciplinas del grupo ({grupo.disciplinas.length})
              </h4>
            </div>

            {grupo.disciplinas.length === 0 ? (
              <p className="font-inter text-xs dark:text-white/30 text-gray-400 italic">No hay disciplinas asignadas.</p>
            ) : (
              <div className="space-y-1.5">
                {grupo.disciplinas.map((d) => {
                  const isPending = pendingDisc.has(d.id);
                  const isConfirming = confirmDisc === d.id;
                  return (
                    <div key={d.id} className="flex items-center gap-3 px-4 py-3 rounded-lg dark:bg-zinc-900 bg-gray-50 border dark:border-white/8 border-gray-200">
                      {d.color && (
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: d.color, boxShadow: `0 0 6px ${d.color}99` }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-inter text-sm font-medium dark:text-white text-gray-900">{d.nombre}</p>
                        {d.horaTexto && <p className="font-inter text-xs dark:text-zinc-500 text-gray-500 mt-0.5">{d.horaTexto}</p>}
                      </div>
                      {isConfirming ? (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="font-inter text-xs dark:text-white/50 text-gray-500">¿Quitar?</span>
                          <button type="button" onClick={() => handleQuitarDisc(d.id)} disabled={isPending} className="px-2 py-1 text-[11px] font-inter font-medium rounded bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors disabled:opacity-50">
                            {isPending ? <Loader2 size={10} className="animate-spin" /> : 'Sí'}
                          </button>
                          <button type="button" onClick={() => setConfirmDisc(null)} className="px-2 py-1 text-[11px] font-inter rounded dark:bg-white/5 bg-gray-100 dark:text-white/50 text-gray-500 hover:dark:text-white hover:text-gray-900 transition-colors">No</button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => setConfirmDisc(d.id)} disabled={isPending} title="Quitar disciplina del grupo" className="shrink-0 p-1.5 rounded-lg dark:text-white/20 text-gray-300 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40">
                          {isPending ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Modal de edición de grupo
// ─────────────────────────────────────────────

const TIERS = ['BASE', 'T1', 'T2', 'T3', 'T4', 'FULL'] as const;

interface EditModalProps {
  grupo: GrupoConfigData;
  todosGrupos: GrupoConfigData[];
  onClose: () => void;
  onSaved: (updated: GrupoConfigData) => void;
}

function EditModal({ grupo, todosGrupos, onClose, onSaved }: EditModalProps) {
  const [form, setForm] = useState({
    nombre: grupo.nombre,
    cupo: grupo.cupo,
    edadMin: grupo.edadMin,
    edadMax: grupo.edadMax,
    tier: grupo.tier,
    idGrupoSiguiente: grupo.idGrupoSiguiente ?? '',
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);

  const otros = todosGrupos.filter((g) => g.id !== grupo.id);

  async function handleGuardar() {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio.'); return; }
    if (form.edadMin >= form.edadMax) { setError('La edad mínima debe ser menor a la máxima.'); return; }
    setGuardando(true);
    setError('');
    const res = await updateGrupoConfig({
      id: grupo.id,
      nombre: form.nombre.trim(),
      cupo: form.cupo,
      edadMin: form.edadMin,
      edadMax: form.edadMax,
      tier: form.tier,
      idGrupoSiguiente: form.idGrupoSiguiente || null,
    });
    setGuardando(false);
    if (!res.ok) { setError(res.error ?? 'Error al guardar.'); return; }
    onSaved({ ...grupo, ...form, idGrupoSiguiente: form.idGrupoSiguiente || null });
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="w-full max-w-lg dark:bg-[#1a1a1a] bg-white rounded-2xl border dark:border-white/8 border-gray-200 shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-white/8 border-gray-100">
          <div>
            <h3 className="font-montserrat font-bold text-base dark:text-white text-gray-900">
              Editar grupo
            </h3>
            <p className="font-inter text-xs dark:text-epic-silver text-gray-500 mt-0.5">{grupo.nombre}</p>
          </div>
          <button type="button" aria-label="Cerrar" onClick={onClose} className="dark:text-white/40 text-gray-400 hover:dark:text-white hover:text-gray-900 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Formulario */}
        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">

          {/* Nombre */}
          <div>
            <label htmlFor="edit-nombre" className="block font-inter text-xs font-medium dark:text-epic-silver text-gray-600 mb-1.5 tracking-wide uppercase">Nombre</label>
            <input
              id="edit-nombre"
              title="Nombre del grupo"
              value={form.nombre}
              onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg text-sm font-inter dark:bg-white/5 bg-gray-50 dark:text-white text-gray-900 border dark:border-white/10 border-gray-200 focus:outline-none focus:border-epic-gold/50 transition-colors"
            />
          </div>

          {/* Cupo + Tier */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-cupo" className="block font-inter text-xs font-medium dark:text-epic-silver text-gray-600 mb-1.5 tracking-wide uppercase">Cupo máx.</label>
              <input
                id="edit-cupo"
                type="number" min={1} max={100}
                title="Cupo máximo del grupo"
                value={form.cupo}
                onChange={(e) => setForm((p) => ({ ...p, cupo: +e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg text-sm font-inter dark:bg-white/5 bg-gray-50 dark:text-white text-gray-900 border dark:border-white/10 border-gray-200 focus:outline-none focus:border-epic-gold/50 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="edit-tier" className="block font-inter text-xs font-medium dark:text-epic-silver text-gray-600 mb-1.5 tracking-wide uppercase">Tier</label>
              <div className="relative">
                <select
                  id="edit-tier"
                  title="Tier del grupo"
                  value={form.tier}
                  onChange={(e) => setForm((p) => ({ ...p, tier: e.target.value }))}
                  className="w-full appearance-none px-3 py-2.5 pr-8 rounded-lg text-sm font-inter dark:bg-white/5 bg-gray-50 dark:text-white text-gray-900 border dark:border-white/10 border-gray-200 focus:outline-none focus:border-epic-gold/50 transition-colors"
                >
                  {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 dark:text-white/30 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Rango de edad */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-edad-min" className="block font-inter text-xs font-medium dark:text-epic-silver text-gray-600 mb-1.5 tracking-wide uppercase">Edad mín.</label>
              <input
                id="edit-edad-min"
                type="number" min={0} max={99}
                title="Edad mínima del grupo"
                value={form.edadMin}
                onChange={(e) => setForm((p) => ({ ...p, edadMin: +e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg text-sm font-inter dark:bg-white/5 bg-gray-50 dark:text-white text-gray-900 border dark:border-white/10 border-gray-200 focus:outline-none focus:border-epic-gold/50 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="edit-edad-max" className="block font-inter text-xs font-medium dark:text-epic-silver text-gray-600 mb-1.5 tracking-wide uppercase">Edad máx.</label>
              <input
                id="edit-edad-max"
                type="number" min={0} max={99}
                title="Edad máxima del grupo"
                value={form.edadMax}
                onChange={(e) => setForm((p) => ({ ...p, edadMax: +e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg text-sm font-inter dark:bg-white/5 bg-gray-50 dark:text-white text-gray-900 border dark:border-white/10 border-gray-200 focus:outline-none focus:border-epic-gold/50 transition-colors"
              />
            </div>
          </div>

          {/* Grupo siguiente para promoción */}
          <div>
            <label htmlFor="edit-grupo-siguiente" className="block font-inter text-xs font-medium dark:text-epic-silver text-gray-600 mb-1.5 tracking-wide uppercase">
              Grupo siguiente (promoción 1 Jul)
            </label>
            <div className="relative">
              <select
                id="edit-grupo-siguiente"
                title="Grupo al que se promoverán las alumnas el 1 de julio"
                value={form.idGrupoSiguiente}
                onChange={(e) => setForm((p) => ({ ...p, idGrupoSiguiente: e.target.value }))}
                className="w-full appearance-none px-3 py-2.5 pr-8 rounded-lg text-sm font-inter dark:bg-white/5 bg-gray-50 dark:text-white text-gray-900 border dark:border-white/10 border-gray-200 focus:outline-none focus:border-epic-gold/50 transition-colors"
              >
                <option value="">— Sin promoción automática —</option>
                {otros.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nombre} ({g.edadMin}–{g.edadMax} años)
                  </option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 dark:text-white/30 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Disciplinas (read-only) */}
          {grupo.disciplinas.length > 0 && (
            <div>
              <label className="block font-inter text-xs font-medium dark:text-epic-silver text-gray-600 mb-2 tracking-wide uppercase">
                Disciplinas del grupo
              </label>
              <div className="flex flex-wrap gap-2">
                {grupo.disciplinas.map((d) => (
                  <div key={d.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-epic-gold/8 border border-epic-gold/20">
                    <span className="font-inter text-xs font-medium text-epic-gold">{d.nombre}</span>
                    {d.horaTexto && (
                      <span className="font-inter text-[10px] dark:text-white/30 text-gray-400 border-l border-epic-gold/20 pl-2">{d.horaTexto}</span>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-1.5 font-inter text-[10px] dark:text-white/25 text-gray-400">
                Para modificar disciplinas ve a Configuración → Grupos → Editor de disciplinas.
              </p>
            </div>
          )}

          {error && <p className="font-inter text-xs text-red-400">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t dark:border-white/8 border-gray-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-inter dark:text-white/60 text-gray-500 hover:dark:text-white hover:text-gray-900 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleGuardar}
            disabled={guardando}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-inter font-medium bg-epic-gold text-black hover:bg-epic-gold/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {guardando ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────

type Vista = 'grupos' | 'alumnas';

interface ConfirmReasignacion {
  alumnaId: string;
  grupoId: string;
  mensaje: string;
}

export default function TabGruposAlumnas() {
  const [vista, setVista] = useState<Vista>('grupos');

  // Datos
  const [grupos, setGrupos] = useState<GrupoConfigData[]>([]);
  const [alumnas, setAlumnas] = useState<AlumnaConfigData[]>([]);
  const [cargando, setCargando] = useState(true);

  // Modal detalle (alumnas + disciplinas)
  const [grupoDetalleId, setGrupoDetalleId] = useState<string | null>(null);
  const grupoDetalle = grupos.find((g) => g.id === grupoDetalleId) ?? null;

  // Modal edición de configuración
  const [grupoEditandoId, setGrupoEditandoId] = useState<string | null>(null);
  const grupoEditando = grupos.find((g) => g.id === grupoEditandoId) ?? null;

  // Modal nuevo grupo
  const [nuevoGrupoOpen, setNuevoGrupoOpen] = useState(false);

  // Confirm para reasignación fuera de rango de edad
  const [confirm, setConfirm] = useState<ConfirmReasignacion | null>(null);

  // IDs con acción en curso (estrella / select)
  const [pendingStars, setPendingStars] = useState<Set<string>>(new Set());
  const [pendingReasign, setPendingReasign] = useState<Set<string>>(new Set());

  // Carga de datos
  const cargarDatos = useCallback(async () => {
    setCargando(true);
    const [resGrupos, resAlumnas] = await Promise.all([
      fetch('/api/configuracion/grupos').then((r) => r.json()),
      fetch('/api/configuracion/alumnas').then((r) => r.json()),
    ]);
    if (resGrupos.grupos) setGrupos(resGrupos.grupos);
    if (resAlumnas.alumnas) setAlumnas(resAlumnas.alumnas);
    setCargando(false);
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleToggleStar(alumnaId: string) {
    setPendingStars((p) => new Set(p).add(alumnaId));
    // Optimistic update
    setAlumnas((prev) =>
      prev.map((a) => a.id === alumnaId ? { ...a, invitadaCompetencia: !a.invitadaCompetencia } : a),
    );
    const res = await toggleInvitacionCompetencia(alumnaId);
    if (!res.ok) {
      // Revert on error
      setAlumnas((prev) =>
        prev.map((a) => a.id === alumnaId ? { ...a, invitadaCompetencia: !a.invitadaCompetencia } : a),
      );
    }
    setPendingStars((p) => { const s = new Set(p); s.delete(alumnaId); return s; });
  }

  async function handleReasignar(alumnaId: string, grupoId: string, forzar = false) {
    if (!grupoId) return;
    setPendingReasign((p) => new Set(p).add(alumnaId));

    const res: ReasignacionResult = await reasignarAlumna(alumnaId, grupoId, forzar);

    if (res.ok) {
      const grupoNuevo = grupos.find((g) => g.id === grupoId);
      setAlumnas((prev) =>
        prev.map((a) => a.id === alumnaId
          ? { ...a, grupoActual: grupoNuevo ? { id: grupoNuevo.id, nombre: grupoNuevo.nombre } : null }
          : a,
        ),
      );
    } else if (!res.ok && res.error === 'FUERA_DE_RANGO' && 'edadAlumna' in res) {
      const grupoNombre = grupos.find((g) => g.id === grupoId)?.nombre ?? grupoId;
      setConfirm({
        alumnaId,
        grupoId,
        mensaje: `La alumna tiene ${res.edadAlumna} años y el grupo "${grupoNombre}" acepta ${res.edadMin}–${res.edadMax} años. ¿Confirmar asignación de todas formas?`,
      });
    }

    setPendingReasign((p) => { const s = new Set(p); s.delete(alumnaId); return s; });
  }

  async function handleConfirmForzado() {
    if (!confirm) return;
    setConfirm(null);
    await handleReasignar(confirm.alumnaId, confirm.grupoId, true);
  }

  function handleAlumnaRemovida(alumnaId: string) {
    setAlumnas((prev) =>
      prev.map((a) => a.id === alumnaId ? { ...a, grupoActual: null } : a),
    );
  }

  function handleDisciplinaRemovida(grupoId: string, disciplinaId: string) {
    setGrupos((prev) =>
      prev.map((g) =>
        g.id === grupoId
          ? { ...g, disciplinas: g.disciplinas.filter((d) => d.id !== disciplinaId) }
          : g,
      ),
    );
  }

  // ── Render: vista grupos ──────────────────────────────────────────────────

  function renderGrupos() {
    if (grupos.length === 0 && !cargando) {
      return (
        <div className="py-12 text-center">
          <p className="font-inter text-sm dark:text-epic-silver text-gray-500">
            No hay grupos configurados aún.
          </p>
        </div>
      );
    }

    // Agrupar por categoría y ordenar cada sección por nombre
    const agrupados = grupos.reduce<Record<string, GrupoConfigData[]>>((acc, g) => {
      const cat = g.categoria?.trim() || 'General';
      (acc[cat] ??= []).push(g);
      return acc;
    }, {});
    const categorias = Object.keys(agrupados).sort();

    return (
      <div className="space-y-8">
        {categorias.map((cat) => {
          const items = agrupados[cat].slice().sort((a, b) => a.nombre.localeCompare(b.nombre));
          return (
            <div key={cat}>
              {/* Encabezado de categoría */}
              <div className="flex items-center gap-3 mb-4">
                <span className="font-montserrat font-bold text-[11px] tracking-[0.15em] uppercase text-epic-gold shrink-0">
                  {cat}
                </span>
                <div className="flex-1 h-px dark:bg-epic-gold/20 bg-amber-300/60" />
                <span className="font-inter text-[11px] dark:text-white/30 text-gray-400 shrink-0">
                  {items.length} grupo{items.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {items.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGrupoDetalleId(g.id)}
                    className="text-left dark:bg-[#121212] bg-white rounded-xl border dark:border-white/8 border-gray-200 p-4 space-y-3 hover:border-epic-gold/50 dark:hover:bg-[#181818] hover:shadow-md transition-all duration-200 group cursor-pointer"
                  >
                    {/* Nombre + Tier */}
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-montserrat font-bold text-sm dark:text-white text-gray-900 group-hover:text-epic-gold transition-colors leading-snug">
                        {g.nombre}
                      </p>
                      <TierBadge tier={g.tier} />
                    </div>

                    {/* Barra de capacidad */}
                    <CapacityBar inscritos={g.inscritos} cupo={g.cupo} />

                    {/* Disciplinas */}
                    {g.disciplinas.length > 0 && (
                      <ul className="space-y-0.5">
                        {g.disciplinas.map((d) => (
                          <li key={d.id} className="font-inter text-xs dark:text-white/50 text-gray-600 truncate">
                            · {d.nombre}{d.horaTexto ? `: ${d.horaTexto}` : ''}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Footer: precio + promoción */}
                    <div className="flex items-end justify-between gap-2 pt-0.5">
                      {g.tarifa ? (
                        <p className="font-montserrat font-bold text-sm text-epic-gold">
                          {FMT_MXN.format(g.tarifa.precioMensualidad)}
                          <span className="font-normal text-[11px] dark:text-white/30 text-gray-400"> / mes</span>
                        </p>
                      ) : (
                        <span />
                      )}
                      {g.grupoSiguienteNombre && (
                        <p className="font-inter text-[10px] dark:text-white/25 text-gray-400 truncate max-w-[110px] text-right">
                          → {g.grupoSiguienteNombre}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ── Render: vista alumnas ─────────────────────────────────────────────────

  function renderAlumnas() {
    return (
      <div className="space-y-1">
        {alumnas.map((a) => {
          const inicial = `${a.nombre[0]}${a.apellido[0]}`.toUpperCase();
          const starPending = pendingStars.has(a.id);
          const reasignPending = pendingReasign.has(a.id);

          return (
            <div
              key={a.id}
              className="flex items-center gap-3 px-3 py-3 rounded-xl dark:hover:bg-zinc-800 hover:bg-gray-50 transition-colors"
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-epic-gold/15 flex items-center justify-center shrink-0 font-montserrat font-bold text-xs text-epic-gold">
                {inicial}
              </div>

              {/* Nombre */}
              <div className="flex-1 min-w-0">
                <p className="font-inter text-sm font-medium dark:text-white text-gray-900 truncate">
                  {a.nombre} {a.apellido}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <CargoBadge
                    pendientes={a.cargosPendientes}
                    vencidos={a.cargosVencidos}
                    monto={a.montoDeuda}
                  />
                </div>
              </div>

              {/* Select de grupo */}
              <div className="relative shrink-0">
                {reasignPending ? (
                  <div className="w-36 flex items-center justify-center py-2">
                    <Loader2 size={13} className="animate-spin dark:text-white/40 text-gray-400" />
                  </div>
                ) : (
                  <>
                    <select
                      aria-label={`Grupo de ${a.nombre} ${a.apellido}`}
                      title={`Grupo actual de ${a.nombre} ${a.apellido}`}
                      value={a.grupoActual?.id ?? ''}
                      onChange={(e) => handleReasignar(a.id, e.target.value)}
                      className="appearance-none w-36 pl-2 pr-7 py-1.5 rounded-lg text-xs font-inter dark:bg-white/5 bg-gray-100 dark:text-white/70 text-gray-700 border dark:border-white/8 border-gray-200 focus:outline-none focus:border-epic-gold/50 cursor-pointer transition-colors"
                    >
                      <option value="">Sin grupo</option>
                      {grupos.map((g) => (
                        <option key={g.id} value={g.id}>{g.nombre}</option>
                      ))}
                    </select>
                    <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 dark:text-white/30 text-gray-400 pointer-events-none" />
                  </>
                )}
              </div>

              {/* Estrella de competencia */}
              <button
                type="button"
                onClick={() => handleToggleStar(a.id)}
                disabled={starPending}
                title={a.invitadaCompetencia ? 'Quitar de competencia' : 'Invitar a competencia'}
                className="shrink-0 p-1.5 rounded-lg transition-colors hover:bg-epic-gold/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {starPending ? (
                  <Loader2 size={15} className="animate-spin dark:text-white/30 text-gray-400" />
                ) : (
                  <Star
                    size={15}
                    className={a.invitadaCompetencia ? 'fill-epic-gold text-epic-gold' : 'dark:text-white/25 text-gray-300'}
                  />
                )}
              </button>
            </div>
          );
        })}

        {alumnas.length === 0 && !cargando && (
          <div className="py-12 text-center">
            <p className="font-inter text-sm dark:text-epic-silver text-gray-500">No hay alumnas registradas.</p>
          </div>
        )}
      </div>
    );
  }

  // ── Render principal ──────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Pill switch */}
        <div className="inline-flex items-center gap-1 p-1 rounded-xl dark:bg-white/5 bg-gray-100 border dark:border-white/8 border-gray-200">
          {(['grupos', 'alumnas'] as Vista[]).map((v) => (
            <button
              key={v}
              type="button"
            onClick={() => setVista(v)}
              className={[
                'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-inter font-medium transition-all',
                vista === v
                  ? 'bg-white dark:bg-epic-gray shadow-sm dark:text-white text-gray-900'
                  : 'dark:text-white/40 text-gray-500 hover:dark:text-white/70 hover:text-gray-700',
              ].join(' ')}
            >
              <Users size={13} className="shrink-0" />
              {v === 'grupos' ? 'Ver Grupos' : 'Ver Alumnas'}
            </button>
          ))}
        </div>

        {/* Botón nuevo grupo (solo en vista grupos) */}
        {vista === 'grupos' && (
          <button
            type="button"
            onClick={() => setNuevoGrupoOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-inter font-medium bg-epic-gold text-black hover:bg-epic-gold/90 transition-colors"
          >
            <Plus size={14} />
            Nuevo Grupo
          </button>
        )}
      </div>

      {/* Contenido */}
      {cargando ? (
        vista === 'grupos' ? (
          <div className="space-y-8">
            {[3, 4].map((count, si) => (
              <div key={si}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-3 w-24 rounded dark:bg-white/10 bg-gray-200 animate-pulse" />
                  <div className="flex-1 h-px dark:bg-white/8 bg-gray-200" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {Array.from({ length: count }).map((_, i) => <SkeletonGrupo key={i} />)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonAlumna key={i} />)}
          </div>
        )
      ) : (
        vista === 'grupos' ? renderGrupos() : renderAlumnas()
      )}

      {/* Modal detalle: alumnas + disciplinas del grupo */}
      {grupoDetalle && (
        <GrupoDetailModal
          grupo={grupoDetalle}
          alumnas={alumnas}
          onClose={() => setGrupoDetalleId(null)}
          onEditarConfig={() => setGrupoEditandoId(grupoDetalleId)}
          onAlumnaRemovida={handleAlumnaRemovida}
          onDisciplinaRemovida={handleDisciplinaRemovida}
        />
      )}

      {/* Modal edición de configuración del grupo */}
      {grupoEditando && (
        <EditModal
          grupo={grupoEditando}
          todosGrupos={grupos}
          onClose={() => setGrupoEditandoId(null)}
          onSaved={(updated) => {
            setGrupos((prev) => prev.map((g) => g.id === updated.id ? updated : g));
            setGrupoEditandoId(null);
          }}
        />
      )}

      {/* Modal nuevo grupo */}
      {nuevoGrupoOpen && (
        <DialogNuevoGrupo
          grupos={grupos}
          onClose={() => setNuevoGrupoOpen(false)}
          onCreado={() => { setNuevoGrupoOpen(false); cargarDatos(); }}
        />
      )}

      {/* Confirm: reasignación fuera de rango de edad */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm dark:bg-[#1a1a1a] bg-white rounded-2xl border dark:border-white/8 border-gray-200 shadow-2xl p-6 space-y-4">
            <p className="font-montserrat font-bold text-sm dark:text-white text-gray-900">
              Rango de edad diferente
            </p>
            <p className="font-inter text-sm dark:text-epic-silver text-gray-600 leading-relaxed">
              {confirm.mensaje}
            </p>
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setConfirm(null)}
                className="flex-1 py-2 rounded-lg text-sm font-inter border dark:border-white/10 border-gray-200 dark:text-white/60 text-gray-600 hover:dark:text-white hover:text-gray-900 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmForzado}
                className="flex-1 py-2 rounded-lg text-sm font-inter font-medium bg-epic-gold text-black hover:bg-epic-gold/90 transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
