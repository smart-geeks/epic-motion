'use client';

import { useRef, useState } from 'react';
import { Check, ChevronDown, Loader2, Pencil, Star, Users, X } from 'lucide-react';
import type { GrupoConfigData } from '@/app/api/configuracion/grupos/route';
import type { AlumnaConfigData } from '@/app/api/configuracion/alumnas/route';
import {
  getAlumnaDisciplinasEnGrupo,
  setAlumnaDisciplinasEnGrupo,
  removerAlumnaDeGrupo,
  removerDisciplinaDeGrupo,
} from '@/lib/actions/config-grupos';
import { calcularMonto } from '@/lib/logic/precios';
import { FMT_MXN } from '@/lib/format';
import CapacityBar from '@/components/ui/CapacityBar';
import TierBadge from '@/components/ui/TierBadge';

export interface GrupoDetailProps {
  grupo: GrupoConfigData;
  alumnas: AlumnaConfigData[];
  onClose: () => void;
  onEditarConfig: () => void;
  onAlumnaRemovida: (alumnaId: string) => void;
  onDisciplinaRemovida: (grupoId: string, disciplinaId: string) => void;
}

export default function GrupoDetailModal({
  grupo,
  alumnas,
  onClose,
  onEditarConfig,
  onAlumnaRemovida,
  onDisciplinaRemovida,
}: GrupoDetailProps) {
  const alumnaDelGrupo = alumnas.filter((a) => a.grupoActual?.id === grupo.id);
  const overlayRef = useRef<HTMLDivElement>(null);

  const [expandida, setExpandida] = useState<string | null>(null);
  const [discCargadas, setDiscCargadas] = useState<Record<string, string[]>>({});
  const [seleccion, setSeleccion] = useState<Record<string, string[]>>({});
  const [loadingDisc, setLoadingDisc] = useState<Set<string>>(new Set());
  const [guardandoDisc, setGuardandoDisc] = useState<Set<string>>(new Set());
  const [errorDisc, setErrorDisc] = useState<Record<string, string>>({});

  const [confirmBaja, setConfirmBaja] = useState<string | null>(null);
  const [pendingBaja, setPendingBaja] = useState<Set<string>>(new Set());

  const [confirmDisc, setConfirmDisc] = useState<string | null>(null);
  const [pendingDisc, setPendingDisc] = useState<Set<string>>(new Set());

  async function handleExpandir(alumnaId: string) {
    if (expandida === alumnaId) { setExpandida(null); return; }
    setExpandida(alumnaId);
    if (discCargadas[alumnaId] !== undefined) return;

    setLoadingDisc((p) => new Set(p).add(alumnaId));
    const saved = await getAlumnaDisciplinasEnGrupo(alumnaId, grupo.id);
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

    setGuardandoDisc((p) => new Set(p).add(alumnaId));
    setErrorDisc((p) => { const e = { ...p }; delete e[alumnaId]; return e; });
    const res = await setAlumnaDisciplinasEnGrupo(alumnaId, grupo.id, ids);
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
