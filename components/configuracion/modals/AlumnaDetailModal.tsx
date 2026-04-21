'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Star, CreditCard, Clock, UserCircle2, Phone, Mail, CalendarDays, Loader2 } from 'lucide-react';
import type { AlumnaConfigData, GrupoConfigData } from '@/types/configuracion';
import CargoBadge from '@/components/ui/CargoBadge';
import GrupoSelect from '@/components/ui/GrupoSelect';
import { FMT_MXN } from '@/lib/format';

interface Props {
  alumna: AlumnaConfigData;
  grupo: GrupoConfigData | null;
  grupos: GrupoConfigData[];
  isPendingReasign: boolean;
  onClose: () => void;
  onReasignar: (grupoId: string) => void;
  onToggleStar: () => void;
}

const SPRING = { type: 'spring', mass: 0.35, damping: 22, stiffness: 130 } as const;

const ESTATUS_STYLES: Record<string, string> = {
  ACTIVA:    'bg-green-500/15 text-green-400',
  INACTIVA:  'bg-zinc-500/15 text-zinc-400',
  BAJA:      'bg-red-500/15 text-red-400',
  PENDIENTE: 'bg-amber-500/15 text-amber-400',
};

function calcularEdad(fechaNacimiento: string): number {
  const hoy = new Date();
  const nac = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

export default function AlumnaDetailModal({
  alumna, grupo, grupos, isPendingReasign, onClose, onReasignar, onToggleStar,
}: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const inicial = `${alumna.nombre[0]}${alumna.apellido[0]}`.toUpperCase();
  const estatusClase = ESTATUS_STYLES[alumna.estatus] ?? 'bg-zinc-500/15 text-zinc-400';
  const edad = calcularEdad(alumna.fechaNacimiento);

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === overlayRef.current) onClose();
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1,    y: 0,  transition: SPRING }}
        exit={{   opacity: 0, scale: 0.96, y: 8,  transition: { duration: 0.15 } }}
        className={[
          'w-full max-w-sm flex flex-col max-h-[90vh]',
          'rounded-3xl overflow-hidden',
          'glass-card',
          'dark:border dark:border-white/[0.08] border border-gray-200',
          'shadow-[0_32px_80px_rgba(0,0,0,0.70)]',
        ].join(' ')}
      >

        {/* ── Header — fijo ── */}
        <div className="flex items-start justify-between px-6 pt-6 pb-5 shrink-0">
          <div className="flex items-center gap-4">
            {alumna.foto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={alumna.foto}
                alt={`${alumna.nombre} ${alumna.apellido}`}
                className="w-14 h-14 rounded-2xl object-cover ring-1 ring-white/10"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-epic-gold/15 flex items-center justify-center shrink-0">
                <span className="font-montserrat font-bold text-xl text-epic-gold">{inicial}</span>
              </div>
            )}
            <div className="min-w-0">
              <p className="font-montserrat font-bold text-base dark:text-white text-gray-900 leading-snug">
                {alumna.nombre} {alumna.apellido}
              </p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold tracking-wider ${estatusClase}`}>
                  {alumna.estatus}
                </span>
                {alumna.invitadaCompetencia && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold tracking-wider bg-epic-gold/15 text-epic-gold">
                    <Star size={9} className="fill-epic-gold" />
                    COMPETENCIA
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            title="Cerrar"
            className="p-2 rounded-xl dark:text-white/30 text-gray-400 hover:dark:text-white hover:text-gray-700 dark:hover:bg-white/[0.06] hover:bg-gray-100 transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mx-6 h-px dark:bg-white/[0.06] bg-gray-100 shrink-0" />

        {/* ── Cuerpo — desplazable ── */}
        <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">

          {/* Edad */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl dark:bg-white/[0.05] bg-gray-100 flex items-center justify-center shrink-0">
              <CalendarDays size={14} className="dark:text-white/40 text-gray-500" />
            </div>
            <div className="min-w-0">
              <p className="font-inter text-[10px] tracking-[0.1em] uppercase dark:text-white/30 text-gray-400 mb-0.5">Edad</p>
              <p className="font-inter text-sm font-medium dark:text-white/80 text-gray-700">{edad} años</p>
            </div>
          </div>

          {/* Grupo (editable) */}
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <UserCircle2 size={13} className="dark:text-white/30 text-gray-400 shrink-0" />
              <p className="font-inter text-[10px] tracking-[0.1em] uppercase dark:text-white/30 text-gray-400">
                Grupo
              </p>
            </div>
            {isPendingReasign ? (
              <div className="flex items-center gap-2 px-3 py-2">
                <Loader2 size={13} className="animate-spin dark:text-white/40 text-gray-400" />
                <span className="font-inter text-xs dark:text-white/40 text-gray-400">Reasignando...</span>
              </div>
            ) : (
              <GrupoSelect
                value={alumna.grupoActual?.id ?? ''}
                grupos={grupos}
                alumnaLabel={`${alumna.nombre} ${alumna.apellido}`}
                className="w-full"
                onChange={onReasignar}
              />
            )}
          </div>

          {/* Padre / Tutor */}
          <div className="glass-card rounded-2xl px-4 py-3 space-y-2.5">
            <p className="font-inter text-[10px] tracking-[0.1em] uppercase dark:text-white/30 text-gray-400">
              Padre / Tutor
            </p>
            <p className="font-inter text-sm font-medium dark:text-white/80 text-gray-700">
              {alumna.padre.nombre} {alumna.padre.apellido}
            </p>
            <div className="space-y-1.5">
              {alumna.padre.telefono && (
                <a
                  href={`https://wa.me/52${alumna.padre.telefono.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 group"
                >
                  <Phone size={12} className="dark:text-white/30 text-gray-400 shrink-0" />
                  <span className="font-inter text-xs dark:text-white/60 text-gray-600 group-hover:text-epic-gold transition-colors">
                    {alumna.padre.telefono}
                  </span>
                </a>
              )}
              <div className="flex items-center gap-2">
                <Mail size={12} className="dark:text-white/30 text-gray-400 shrink-0" />
                <span className="font-inter text-xs dark:text-white/60 text-gray-600 truncate">
                  {alumna.padre.email}
                </span>
              </div>
            </div>
          </div>

          {/* Pagos */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CreditCard size={13} className="dark:text-white/30 text-gray-400 shrink-0" />
              <p className="font-inter text-[10px] tracking-[0.1em] uppercase dark:text-white/30 text-gray-400">
                Estado de cuenta
              </p>
            </div>
            <div className="glass-card rounded-2xl px-4 py-3 flex items-center justify-between gap-4">
              <CargoBadge
                pendientes={alumna.cargosPendientes}
                vencidos={alumna.cargosVencidos}
                monto={alumna.montoDeuda}
              />
              {alumna.montoDeuda > 0 ? (
                <p className="font-montserrat font-bold text-base text-red-400 shrink-0">
                  {FMT_MXN.format(alumna.montoDeuda)}
                </p>
              ) : (
                <p className="font-inter text-xs dark:text-green-400 text-green-600 shrink-0">Al corriente</p>
              )}
            </div>
          </div>

          {/* Horarios */}
          {grupo && grupo.disciplinas.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock size={13} className="dark:text-white/30 text-gray-400 shrink-0" />
                <p className="font-inter text-[10px] tracking-[0.1em] uppercase dark:text-white/30 text-gray-400">
                  Horarios
                </p>
              </div>
              <ul className="space-y-1.5">
                {grupo.disciplinas.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl dark:bg-white/[0.03] bg-gray-50 border dark:border-white/[0.05] border-gray-100"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {d.color && (
                        // eslint-disable-next-line react/forbid-dom-props
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: d.color }}
                        />
                      )}
                      <span className="font-inter text-xs dark:text-white/70 text-gray-700 truncate">
                        {d.nombre}
                      </span>
                    </div>
                    {d.horaTexto && (
                      <span className="font-mono text-[10px] dark:text-white/35 text-gray-400 shrink-0 tracking-wider">
                        {d.horaTexto}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Invitar a grupo de competencia ── */}
          <div className="pt-1">
            <div className="h-px dark:bg-white/[0.06] bg-gray-100 mb-5" />
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-inter text-sm font-medium dark:text-white/80 text-gray-700">
                  Invitar a grupo de competencia
                </p>
                <p className="font-inter text-xs dark:text-white/30 text-gray-400 mt-0.5 leading-relaxed">
                  {alumna.invitadaCompetencia
                    ? 'Invitación enviada. Toca la estrella para cancelar.'
                    : 'Envía invitación al padre por WhatsApp.'}
                </p>
              </div>
              <button
                type="button"
                onClick={onToggleStar}
                title={alumna.invitadaCompetencia ? 'Quitar de competencia' : 'Invitar a competencia'}
                className={[
                  'shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center transition-all',
                  alumna.invitadaCompetencia
                    ? 'bg-epic-gold/15 hover:bg-epic-gold/25'
                    : 'dark:bg-white/[0.05] bg-gray-100 hover:bg-epic-gold/10',
                ].join(' ')}
              >
                <Star
                  size={18}
                  className={alumna.invitadaCompetencia ? 'fill-epic-gold text-epic-gold' : 'dark:text-white/25 text-gray-300'}
                />
              </button>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
