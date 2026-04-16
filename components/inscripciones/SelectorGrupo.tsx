'use client';

import { Check, Clock, Users } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import type { GrupoCard } from '@/types/inscripciones';

const DIAS_LABEL: Record<string, string> = {
  L: 'Lun',
  M: 'Mar',
  X: 'Mié',
  J: 'Jue',
  V: 'Vie',
  S: 'Sáb',
  D: 'Dom',
};

interface SelectorGrupoProps {
  grupos: GrupoCard[];
  grupoSeleccionadoId: string | null;
  onSelect: (grupo: GrupoCard) => void;
}

export default function SelectorGrupo({
  grupos,
  grupoSeleccionadoId,
  onSelect,
}: SelectorGrupoProps) {
  if (grupos.length === 0) {
    return (
      <div className="rounded-sm border border-dashed border-gray-200 dark:border-white/10 p-8 text-center">
        <p className="font-inter text-sm text-gray-400 dark:text-white/30">
          No hay grupos activos configurados.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {grupos.map((grupo) => {
        const seleccionado = grupo.id === grupoSeleccionadoId;
        const disponible = grupo.cupo - grupo.inscritos;
        const sinCupo = disponible <= 0;

        return (
          <button
            key={grupo.id}
            type="button"
            disabled={sinCupo}
            onClick={() => !sinCupo && onSelect(grupo)}
            className={[
              'relative text-left p-4 border rounded-sm transition-all duration-150 focus:outline-none',
              seleccionado
                ? 'border-epic-gold bg-epic-gold/8 dark:bg-epic-gold/5 ring-1 ring-epic-gold'
                : sinCupo
                ? 'border-gray-200 dark:border-white/5 opacity-50 cursor-not-allowed bg-gray-50 dark:bg-white/2'
                : 'border-gray-200 dark:border-white/10 bg-white dark:bg-epic-gray hover:border-epic-gold/50 cursor-pointer',
            ].join(' ')}
          >
            {/* Check de seleccionado */}
            {seleccionado && (
              <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-epic-gold flex items-center justify-center">
                <Check size={11} className="text-epic-black" strokeWidth={3} />
              </span>
            )}

            {/* Header: nombre + edad */}
            <div className="mb-2 pr-6">
              <h3 className="font-montserrat font-bold text-sm text-epic-black dark:text-white leading-tight">
                {grupo.nombre}
              </h3>
              <p className="font-inter text-xs text-gray-500 dark:text-epic-silver mt-0.5">
                {grupo.edadMin}–{grupo.edadMax} años
              </p>
            </div>

            {/* Disciplinas */}
            {grupo.disciplinas.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {grupo.disciplinas.map((d) => (
                  <Badge key={d.id} label={d.nombre} color={d.color} />
                ))}
              </div>
            )}

            {/* Horario y horas */}
            <div className="flex flex-col gap-1 mb-3">
              <div className="flex items-center gap-1.5 text-xs font-inter text-gray-500 dark:text-epic-silver">
                <Clock size={11} className="shrink-0" />
                <span>
                  {grupo.dias.map((d) => DIAS_LABEL[d] ?? d).join(', ')} · {grupo.horaInicio}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-inter text-gray-500 dark:text-epic-silver">
                <Users size={11} className="shrink-0" />
                <span>
                  {sinCupo
                    ? 'Sin cupo'
                    : `${disponible} lugar${disponible !== 1 ? 'es' : ''} disponible${disponible !== 1 ? 's' : ''}`}
                </span>
              </div>
            </div>

            {/* Precio */}
            {grupo.tarifa && (
              <div className="border-t border-gray-100 dark:border-white/8 pt-2.5 mt-2">
                <p className="font-montserrat font-bold text-base text-epic-black dark:text-white">
                  {new Intl.NumberFormat('es-MX', {
                    style: 'currency',
                    currency: 'MXN',
                    maximumFractionDigits: 0,
                  }).format(grupo.tarifa.precioMensualidad)}
                  <span className="font-inter font-normal text-xs text-gray-400 dark:text-white/30 ml-1">
                    /mes
                  </span>
                </p>
                <p className="font-inter text-xs text-gray-400 dark:text-white/30">
                  {grupo.horasPorSemana} h/semana
                </p>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
