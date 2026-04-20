'use client';

import { useOptimistic, useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ChevronDown, Loader2, Pencil, Plus, Star, Sun, Users } from 'lucide-react';
import type { GrupoConfigData, AlumnaConfigData, CursoEspecialData, DisciplinaConfigData, ProfesorData, ReasignacionResult } from '@/types/configuracion';
import { toggleInvitacionCompetencia, reasignarAlumna } from '@/lib/actions/config-grupos';
import { FMT_MXN } from '@/lib/format';
import CapacityBar from '@/components/ui/CapacityBar';
import TierBadge from '@/components/ui/TierBadge';
import CargoBadge from '@/components/ui/CargoBadge';
import GrupoDetailModal from '@/components/configuracion/modals/GrupoDetailModal';
import EditModal from '@/components/configuracion/modals/EditModal';
import EditCursoEspecialModal from '@/components/configuracion/modals/EditCursoEspecialModal';
import GrupoWizard from '@/components/admin/configuracion/GrupoWizard';
import ConfigCard from '@/components/ui/ConfigCard';

interface Props {
  grupos: GrupoConfigData[];
  alumnas: AlumnaConfigData[];
  cursosEspeciales: CursoEspecialData[];
  disciplinas: DisciplinaConfigData[];
  profesores: ProfesorData[];
}

type Vista = 'grupos' | 'alumnas';

interface ConfirmReasignacion {
  alumnaId: string;
  grupoId: string;
  mensaje: string;
}

export default function TabGruposAlumnas({ grupos, alumnas, cursosEspeciales, disciplinas, profesores }: Props) {
  const router = useRouter();
  const [vista, setVista] = useState<Vista>('grupos');

  // Estado de modales
  const [grupoDetalleId, setGrupoDetalleId] = useState<string | null>(null);
  const grupoDetalle = grupos.find((g) => g.id === grupoDetalleId) ?? null;

  const [grupoEditandoId, setGrupoEditandoId] = useState<string | null>(null);
  const grupoEditando = grupos.find((g) => g.id === grupoEditandoId) ?? null;

  const [cursoEditandoId, setCursoEditandoId] = useState<string | null>(null);
  const cursoEditando = cursosEspeciales.find((c) => c.id === cursoEditandoId) ?? null;

  const [nuevoGrupoOpen, setNuevoGrupoOpen] = useState(false);

  // Estado de interacciones
  const [confirm, setConfirm] = useState<ConfirmReasignacion | null>(null);
  const [pendingReasign, setPendingReasign] = useState<Set<string>>(new Set());

  // ── Optimistic UI — estrella de competencia ───────────────────────────────
  const [, startStarTransition] = useTransition();
  const [optimisticAlumnas, dispatchOptimisticStar] = useOptimistic(
    alumnas,
    (state, { id, invitadaCompetencia }: { id: string; invitadaCompetencia: boolean }) =>
      state.map((a) => (a.id === id ? { ...a, invitadaCompetencia } : a)),
  );

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleToggleStar(alumna: AlumnaConfigData) {
    startStarTransition(async () => {
      dispatchOptimisticStar({ id: alumna.id, invitadaCompetencia: !alumna.invitadaCompetencia });
      const res = await toggleInvitacionCompetencia(alumna.id);
      if (res.ok) {
        router.refresh();
      } else {
        // useOptimistic revierte automáticamente al estado original si no se refresca
        toast.error(res.error ?? 'Error al actualizar la estrella.');
      }
    });
  }

  async function handleReasignar(alumnaId: string, grupoId: string, forzar = false) {
    if (!grupoId) return;
    setPendingReasign((p) => new Set(p).add(alumnaId));

    const res: ReasignacionResult = await reasignarAlumna(alumnaId, grupoId, forzar);

    if (res.ok) {
      router.refresh();
      toast.success('Alumna reasignada correctamente.');
    } else if (!res.ok && res.error === 'FUERA_DE_RANGO' && 'edadAlumna' in res) {
      const grupoNombre = grupos.find((g) => g.id === grupoId)?.nombre ?? grupoId;
      setConfirm({
        alumnaId,
        grupoId,
        mensaje: `La alumna tiene ${res.edadAlumna} años y el grupo "${grupoNombre}" acepta ${res.edadMin}–${res.edadMax} años. ¿Confirmar asignación de todas formas?`,
      });
    } else if (!res.ok) {
      toast.error(res.error ?? 'Error al reasignar.');
    }

    setPendingReasign((p) => { const s = new Set(p); s.delete(alumnaId); return s; });
  }

  async function handleConfirmForzado() {
    if (!confirm) return;
    setConfirm(null);
    await handleReasignar(confirm.alumnaId, confirm.grupoId, true);
  }

  // ── Render: vista grupos ──────────────────────────────────────────────────

  function renderGrupos() {
    if (grupos.length === 0) {
      return (
        <div className="py-12 text-center">
          <p className="font-inter text-sm dark:text-epic-silver text-gray-500">No hay grupos configurados aún.</p>
        </div>
      );
    }

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
              <div className="flex items-center gap-3 mb-4">
                <span className="font-montserrat font-bold text-[11px] tracking-[0.15em] uppercase text-epic-gold shrink-0">{cat}</span>
                <div className="flex-1 h-px dark:bg-epic-gold/20 bg-amber-300/60" />
                <span className="font-inter text-[11px] dark:text-white/30 text-gray-400 shrink-0">
                  {items.length} grupo{items.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {items.map((g) => (
                  <ConfigCard
                    key={g.id}
                    as="button"
                    interactive
                    onClick={() => setGrupoDetalleId(g.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-montserrat font-bold text-sm dark:text-white text-gray-900 group-hover:text-epic-gold transition-colors leading-snug">
                        {g.nombre}
                      </p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={[
                          'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider',
                          g.activo ? 'bg-green-500/15 text-green-400' : 'bg-amber-500/15 text-amber-400',
                        ].join(' ')}>
                          {g.activo ? 'Activo' : 'Pendiente'}
                        </span>
                        <TierBadge tier={g.tier} />
                      </div>
                    </div>
                    <CapacityBar inscritos={g.inscritos} cupo={g.cupo} />
                    {g.disciplinas.length > 0 && (
                      <ul className="space-y-0.5">
                        {g.disciplinas.map((d) => (
                          <li key={d.id} className="font-inter text-xs dark:text-white/50 text-gray-600 truncate">
                            · {d.nombre}{d.horaTexto ? `: ${d.horaTexto}` : ''}
                          </li>
                        ))}
                      </ul>
                    )}
                    {g.profesorNombre && (
                      <p className="font-inter text-[11px] dark:text-white/40 text-gray-500 truncate">👤 {g.profesorNombre}</p>
                    )}
                    <div className="flex items-end justify-between gap-2 pt-0.5">
                      {g.tarifa ? (
                        <p className="font-montserrat font-bold text-sm text-epic-gold">
                          {FMT_MXN.format(g.tarifa.precioMensualidad)}
                          <span className="font-normal text-[11px] dark:text-white/30 text-gray-400"> / mes</span>
                        </p>
                      ) : <span />}
                      {g.grupoSiguienteNombre && (
                        <p className="font-inter text-[10px] dark:text-white/25 text-gray-400 truncate max-w-[110px] text-right">
                          → {g.grupoSiguienteNombre}
                        </p>
                      )}
                    </div>
                  </ConfigCard>
                ))}
              </div>
            </div>
          );
        })}

        {/* ── Sección vacaciones & cursos de verano ── */}
        {cursosEspeciales.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2 shrink-0">
                <Sun size={13} className="text-cyan-400 shrink-0" />
                <span className="font-montserrat font-bold text-[11px] tracking-[0.15em] uppercase text-cyan-400">
                  Vacaciones & Cursos de Verano
                </span>
              </div>
              <div className="flex-1 h-px dark:bg-cyan-500/20 bg-cyan-300/50" />
              <span className="font-inter text-[11px] dark:text-white/30 text-gray-400 shrink-0">
                {cursosEspeciales.length} curso{cursosEspeciales.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="mb-4 px-4 py-3 rounded-xl dark:bg-cyan-500/8 bg-cyan-50 border dark:border-cyan-500/15 border-cyan-200/60">
              <p className="font-inter text-xs dark:text-cyan-300/70 text-cyan-700 leading-relaxed">
                Programas de tiempo limitado con fechas definidas. No aparecen en el flujo de inscripción regular — actívalos cuando estés listo para abrir registro.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {cursosEspeciales.map((c) => {
                const fechaIni = new Date(c.fechaInicio).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
                const fechaFin = new Date(c.fechaFin).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
                const tipoBadge = c.tipo === 'CURSO_VERANO' ? 'Verano' : 'Vacaciones';
                return (
                  <ConfigCard key={c.id} variant="cyan">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-montserrat font-bold text-sm dark:text-white text-gray-900 leading-snug">{c.nombre}</p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={[
                          'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider',
                          c.activo ? 'bg-green-500/15 text-green-400' : 'bg-amber-500/15 text-amber-400',
                        ].join(' ')}>
                          {c.activo ? 'Activo' : 'Pendiente'}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider bg-cyan-500/15 text-cyan-400">
                          {tipoBadge}
                        </span>
                        <button
                          type="button"
                          title="Editar curso"
                          onClick={() => setCursoEditandoId(c.id)}
                          className="p-1 rounded-lg dark:text-white/30 text-gray-400 hover:dark:text-cyan-400 hover:text-cyan-600 hover:bg-cyan-500/10 transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                      </div>
                    </div>
                    <p className="font-inter text-xs dark:text-white/50 text-gray-600">{fechaIni} — {fechaFin}</p>
                    <CapacityBar inscritos={c.inscritas} cupo={c.cupo} />
                    <p className="font-inter text-xs dark:text-white/50 text-gray-600">
                      {c.diasSemana.join('-')} · {c.horaInicio} · {c.duracionMinutos} min
                    </p>
                    {c.profesorNombre && (
                      <p className="font-inter text-[11px] dark:text-white/40 text-gray-500 truncate">👤 {c.profesorNombre}</p>
                    )}
                    <p className="font-montserrat font-bold text-sm text-cyan-400">
                      {FMT_MXN.format(c.precio)}
                      <span className="font-normal text-[11px] dark:text-white/30 text-gray-400"> / curso</span>
                    </p>
                  </ConfigCard>
                );
              })}
            </div>
          </div>
        )}

      </div>
    );
  }

  // ── Render: vista alumnas ─────────────────────────────────────────────────

  function renderAlumnas() {
    return (
      <div className="space-y-1">
        {optimisticAlumnas.map((a) => {
          const inicial = `${a.nombre[0]}${a.apellido[0]}`.toUpperCase();
          const reasignPending = pendingReasign.has(a.id);

          return (
            <div
              key={a.id}
              className="flex items-center gap-3 px-3 py-3 rounded-xl dark:hover:bg-zinc-800 hover:bg-gray-50 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-epic-gold/15 flex items-center justify-center shrink-0 font-montserrat font-bold text-xs text-epic-gold">
                {inicial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-inter text-sm font-medium dark:text-white text-gray-900 truncate">
                  {a.nombre} {a.apellido}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <CargoBadge pendientes={a.cargosPendientes} vencidos={a.cargosVencidos} monto={a.montoDeuda} />
                </div>
              </div>

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

              <button
                type="button"
                onClick={() => handleToggleStar(a)}
                title={a.invitadaCompetencia ? 'Quitar de competencia' : 'Invitar a competencia'}
                className="shrink-0 p-1.5 rounded-lg transition-colors hover:bg-epic-gold/10"
              >
                <Star
                  size={15}
                  className={a.invitadaCompetencia ? 'fill-epic-gold text-epic-gold' : 'dark:text-white/25 text-gray-300'}
                />
              </button>
            </div>
          );
        })}

        {alumnas.length === 0 && (
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
      {vista === 'grupos' ? renderGrupos() : renderAlumnas()}

      {/* Modal detalle: alumnas + disciplinas */}
      {grupoDetalle && (
        <GrupoDetailModal
          grupo={grupoDetalle}
          alumnas={alumnas}
          onClose={() => setGrupoDetalleId(null)}
          onEditarConfig={() => setGrupoEditandoId(grupoDetalleId)}
          onAlumnaRemovida={() => router.refresh()}
          onDisciplinaRemovida={() => router.refresh()}
          onAlumnaAgregada={() => router.refresh()}
        />
      )}

      {/* Modal edición de configuración */}
      {grupoEditando && (
        <EditModal
          grupo={grupoEditando}
          todosGrupos={grupos}
          profesores={profesores}
          onClose={() => setGrupoEditandoId(null)}
          onSaved={() => { setGrupoEditandoId(null); router.refresh(); }}
        />
      )}

      {/* Modal edición curso especial */}
      {cursoEditando && (
        <EditCursoEspecialModal
          curso={cursoEditando}
          profesores={profesores}
          onClose={() => setCursoEditandoId(null)}
          onSaved={() => { setCursoEditandoId(null); router.refresh(); }}
        />
      )}

      {/* Modal nuevo grupo */}
      {nuevoGrupoOpen && (
        <GrupoWizard
          grupos={grupos}
          disciplinas={disciplinas}
          profesores={profesores}
          onClose={() => setNuevoGrupoOpen(false)}
          onCreado={() => { setNuevoGrupoOpen(false); router.refresh(); }}
        />
      )}

      {/* Confirm: reasignación fuera de rango de edad */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm dark:bg-[#1a1a1a] bg-white rounded-2xl border dark:border-white/8 border-gray-200 shadow-2xl p-6 space-y-4">
            <p className="font-montserrat font-bold text-sm dark:text-white text-gray-900">Rango de edad diferente</p>
            <p className="font-inter text-sm dark:text-epic-silver text-gray-600 leading-relaxed">{confirm.mensaje}</p>
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
