'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Clock, Package, Users, Zap } from 'lucide-react';
import type { GrupoCard } from '@/types/inscripciones';

// Categorías reconocidas por el wizard (academia regular, sin competición)
type CategoriaWizard = 'EPIC TOTZ' | 'HAPPY FEET' | 'EPIC ONE' | 'TEEN';

// Mapeo de nombre de categoría → enum de BD
const CATEGORIA_ENUM: Record<CategoriaWizard, string> = {
  'EPIC TOTZ': 'EPIC_TOTZ',
  'HAPPY FEET': 'HAPPY_FEET',
  'EPIC ONE':  'EPIC_ONE',
  'TEEN':      'TEEN',
};

// Tier según número de disciplinas seleccionadas
function tierForCount(count: number, total: number): string {
  if (count >= total) return 'FULL';
  if (count === 1) return 'T1';
  if (count === 2) return 'T2';
  if (count === 3) return 'T3';
  if (count === 4) return 'T4';
  return 'T1';
}

// Edad al 1° de agosto del ciclo activo (Ago–Jul del año académico)
export function calcularEdadCiclo(fechaISO: string): number | null {
  if (!fechaISO) return null;
  const nac = new Date(fechaISO);
  if (isNaN(nac.getTime())) return null;
  const ahora = new Date();
  const yearRef = ahora.getMonth() >= 7 ? ahora.getFullYear() : ahora.getFullYear() - 1;
  const agosto = new Date(yearRef, 7, 1);
  let edad = agosto.getFullYear() - nac.getFullYear();
  const dm = agosto.getMonth() - nac.getMonth();
  if (dm < 0 || (dm === 0 && agosto.getDate() < nac.getDate())) edad--;
  return edad;
}

function categoriaPorEdad(edad: number): CategoriaWizard | null {
  if (edad >= 2  && edad <= 4)  return 'EPIC TOTZ';
  if (edad >= 5  && edad <= 7)  return 'HAPPY FEET';
  if (edad >= 8  && edad <= 11) return 'EPIC ONE';
  if (edad >= 12 && edad <= 17) return 'TEEN';
  return null;
}

const FMT_MXN = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
});

interface ArmadorClasesProps {
  grupos: GrupoCard[];
  fechaNacimiento: string;
  grupoSeleccionadoId: string | null;
  onSelect: (grupo: GrupoCard | null) => void;
  cicloEscolar: string;
  error?: string;
}

export default function ArmadorClases({
  grupos,
  fechaNacimiento,
  grupoSeleccionadoId,
  onSelect,
  cicloEscolar,
  error,
}: ArmadorClasesProps) {
  // IDs de disciplinas seleccionadas (UUIDs de la BD)
  const [seleccionadas, setSeleccionadas] = useState<string[]>([]);

  // Solo grupos del academy regular (excluye competición)
  const gruposRegulares = useMemo(
    () => grupos.filter((g) => !g.esCompetitivo),
    [grupos]
  );

  const edadCiclo = useMemo(() => calcularEdadCiclo(fechaNacimiento), [fechaNacimiento]);
  const categoria = edadCiclo !== null ? categoriaPorEdad(edadCiclo) : null;

  // Limpiar selección al cambiar de categoría (nueva fecha de nacimiento)
  useEffect(() => {
    setSeleccionadas([]);
  }, [categoria]);

  // Grupo FULL (o BASE) de la categoría → fuente de disciplinas y horarios
  const grupoFull = useMemo((): GrupoCard | null => {
    if (!categoria) return null;
    const catEnum = CATEGORIA_ENUM[categoria];
    return (
      gruposRegulares.find(
        (g) => g.categoria === catEnum && (g.tier === 'FULL' || g.tier === 'BASE')
      ) ?? null
    );
  }, [gruposRegulares, categoria]);

  // Disciplinas disponibles para la categoría (vienen de la BD)
  const disciplinasDisponibles = useMemo(
    () => grupoFull?.disciplinas ?? [],
    [grupoFull]
  );

  // Grupo que coincide con la selección actual
  const grupoMatch = useMemo((): GrupoCard | null => {
    if (edadCiclo === null || !categoria) return null;
    const catEnum = CATEGORIA_ENUM[categoria];

    // EPIC TOTZ: paquete único, auto-match inmediato
    if (categoria === 'EPIC TOTZ') {
      return (
        gruposRegulares.find((g) => g.categoria === catEnum && g.tier === 'BASE') ?? null
      );
    }

    if (seleccionadas.length === 0) return null;

    const tier = tierForCount(seleccionadas.length, disciplinasDisponibles.length);
    return (
      gruposRegulares.find((g) => g.categoria === catEnum && g.tier === tier) ?? null
    );
  }, [gruposRegulares, edadCiclo, categoria, seleccionadas.length, disciplinasDisponibles.length]);

  // Sincronizar match con el store (Zustand)
  useEffect(() => {
    if (grupoMatch) {
      if (grupoMatch.id !== grupoSeleccionadoId) onSelect(grupoMatch);
    } else {
      if (grupoSeleccionadoId) onSelect(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grupoMatch?.id]);

  const toggleDisciplina = (id: string) =>
    setSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );

  const esMaximo =
    disciplinasDisponibles.length > 0 &&
    seleccionadas.length >= disciplinasDisponibles.length;

  // ── Sin fecha → placeholder ─────────────────────────────────────────────
  if (!fechaNacimiento) {
    return (
      <div className="rounded-sm border border-dashed border-gray-200 dark:border-white/10 p-8 text-center">
        <p className="font-inter text-sm text-gray-400 dark:text-white/30">
          Ingresa la fecha de nacimiento para armar el paquete de clases.
        </p>
      </div>
    );
  }

  // ── Fuera de rango de edad ──────────────────────────────────────────────
  if (!categoria) {
    return (
      <div className="rounded-sm border border-dashed border-amber-400/30 p-6 text-center">
        <p className="font-inter text-sm text-amber-500 dark:text-amber-400">
          Edad de ciclo: {edadCiclo ?? '—'} años — fuera del rango Academia Regular (2–17 años).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── Chip de categoría ─────────────────────────────────────────── */}
      <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-sm bg-epic-gold/8 border border-epic-gold/30">
        <Zap size={13} className="text-epic-gold shrink-0" />
        <span className="font-montserrat font-bold text-xs tracking-[0.15em] uppercase text-epic-gold">
          {categoria}
        </span>
        <span className="font-inter text-xs text-gray-500 dark:text-white/40 border-l border-epic-gold/20 pl-2.5">
          Edad de ciclo: <strong className="text-epic-gold">{edadCiclo}</strong> años
        </span>
        {cicloEscolar && (
          <span className="font-inter text-xs text-gray-500 dark:text-white/40 border-l border-epic-gold/20 pl-2.5">
            Ciclo <strong className="text-epic-gold">{cicloEscolar}</strong>
          </span>
        )}
      </div>

      {/* ── EPIC TOTZ: paquete base sin selección ─────────────────────── */}
      {categoria === 'EPIC TOTZ' ? (
        <div className="flex items-start gap-3 p-3.5 rounded-sm bg-epic-gold/5 border border-epic-gold/20">
          <Package size={15} className="text-epic-gold shrink-0 mt-0.5" />
          <div>
            <p className="font-inter text-sm font-medium text-epic-black dark:text-white">
              Paquete TOTZ incluido
            </p>
          </div>
        </div>
      ) : (
        /* ── Checkboxes desde la BD ────────────────────────────────────── */
        <div>
          {disciplinasDisponibles.length === 0 ? (
            <p className="font-inter text-xs text-amber-500 dark:text-amber-400">
              No hay disciplinas configuradas para {categoria}. Crea el grupo FULL en Configuración → Grupos.
            </p>
          ) : (
            <>
              <p className="font-inter text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-epic-silver mb-3">
                Selecciona las disciplinas
              </p>
              <div className="flex flex-wrap gap-2">
                {disciplinasDisponibles.map((d) => {
                  const activa = seleccionadas.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleDisciplina(d.id)}
                      className={[
                        'flex items-center gap-2 px-4 py-2.5 rounded-sm border transition-all duration-150',
                        'font-inter text-sm font-medium cursor-pointer focus:outline-none',
                        activa
                          ? 'border-epic-gold bg-epic-gold/10 dark:bg-epic-gold/10 text-epic-black dark:text-white ring-1 ring-epic-gold/30'
                          : [
                              'bg-transparent dark:bg-white/5',
                              'border-gray-200 dark:border-white/10',
                              'text-gray-600 dark:text-white/60',
                              'hover:border-epic-gold/50 hover:text-epic-black dark:hover:text-white dark:hover:bg-white/8',
                            ].join(' '),
                      ].join(' ')}
                    >
                      <span
                        className={[
                          'w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center shrink-0 transition-colors',
                          activa ? 'border-epic-gold bg-epic-gold' : 'border-gray-300 dark:border-white/20',
                        ].join(' ')}
                      >
                        {activa && <Check size={8} className="text-epic-black" strokeWidth={3} />}
                      </span>
                      {d.nombre}
                    </button>
                  );
                })}
              </div>
              {seleccionadas.length > 0 && (
                <p className="mt-2 font-inter text-xs text-gray-400 dark:text-white/30">
                  {seleccionadas.length} de {disciplinasDisponibles.length} disciplina
                  {seleccionadas.length !== 1 ? 's' : ''} seleccionada
                  {seleccionadas.length !== 1 ? 's' : ''}
                  {esMaximo && <span className="text-epic-gold font-medium"> · Paquete FULL</span>}
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Mini-ticket del grupo matcheado ───────────────────────────── */}
      {grupoMatch && (
        <div className="rounded-sm border border-epic-gold/40 bg-epic-gold/5 dark:bg-epic-gold/5 p-4 space-y-3">

          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-montserrat font-bold text-sm text-epic-black dark:text-white leading-tight">
                {grupoMatch.nombre}
              </p>
              <p className="font-inter text-xs text-gray-500 dark:text-white/40 mt-0.5">
                {grupoMatch.edadMin}–{grupoMatch.edadMax} años · {grupoMatch.horasPorSemana} h/semana
              </p>
            </div>
            <span className="shrink-0 w-5 h-5 rounded-full bg-epic-gold flex items-center justify-center">
              <Check size={10} className="text-epic-black" strokeWidth={3} />
            </span>
          </div>

          {/* Disciplinas con horarios */}
          {categoria === 'EPIC TOTZ' ? (
            /* EPIC TOTZ: sin detalle de disciplinas, solo horario */
            disciplinasDisponibles[0]?.horaTexto ? (
              <div className="flex items-center gap-1.5 font-inter text-xs text-gray-500 dark:text-white/50">
                <Clock size={10} className="shrink-0" />
                {disciplinasDisponibles[0].horaTexto}
              </div>
            ) : null
          ) : (
            /* Resto: mostrar las disciplinas seleccionadas con sus horarios */
            <div className="space-y-1.5">
              {seleccionadas.map((dId) => {
                const disc = disciplinasDisponibles.find((d) => d.id === dId);
                if (!disc) return null;
                return (
                  <div key={dId} className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-1.5 font-inter text-xs px-2.5 py-1 rounded-full bg-epic-gold/15 border border-epic-gold/30 text-epic-gold font-medium">
                      {disc.nombre}
                    </span>
                    {disc.horaTexto && (
                      <span className="flex items-center gap-1 font-inter text-xs text-gray-500 dark:text-white/50">
                        <Clock size={10} className="shrink-0" />
                        {disc.horaTexto}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Cupo disponible */}
          <div className="flex items-center gap-1.5 font-inter text-xs text-gray-500 dark:text-white/50 pt-1 border-t border-gray-200 dark:border-white/8">
            <Users size={11} className="shrink-0" />
            {(() => {
              const d = Math.max(0, grupoMatch.cupo - grupoMatch.inscritos);
              return `${d} lugar${d !== 1 ? 'es' : ''} disponible${d !== 1 ? 's' : ''}`;
            })()}
          </div>

          {/* Precio */}
          {grupoMatch.tarifa && (
            <div className="flex items-baseline justify-between pt-2 border-t border-gray-200 dark:border-white/8">
              <span className="font-inter text-xs text-gray-400 dark:text-white/40">Mensualidad</span>
              <div>
                <span className="font-montserrat font-bold text-xl text-epic-gold">
                  {FMT_MXN.format(grupoMatch.tarifa.precioMensualidad)}
                </span>
                <span className="font-inter font-normal text-xs text-gray-400 dark:text-white/30 ml-1">
                  /mes
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sin match con disciplinas seleccionadas */}
      {seleccionadas.length > 0 && !grupoMatch && categoria !== 'EPIC TOTZ' && (
        <div className="rounded-sm border border-dashed border-amber-400/30 p-4 text-center">
          <p className="font-inter text-xs text-amber-500 dark:text-amber-400">
            No hay paquete configurado para {seleccionadas.length} disciplina
            {seleccionadas.length !== 1 ? 's' : ''} en {categoria}.
            Crea el grupo correspondiente en Configuración → Grupos.
          </p>
        </div>
      )}

      {error && (
        <p className="font-inter text-xs text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
