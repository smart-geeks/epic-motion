'use client';

import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Star, CreditCard, Clock, UserCircle2, Phone, Mail, CalendarDays, Loader2, Check, Users, Link2, ChevronRight } from 'lucide-react';
import type { AlumnaConfigData, GrupoConfigData } from '@/types/configuracion';
import { getHermanasSummary, buscarAlumnasParaAsociar, asociarHermana } from '@/lib/actions/alumnas';
import { toast } from 'sonner';
import CargoBadge from '@/components/ui/CargoBadge';
import GrupoSelect from '@/components/ui/GrupoSelect';
import { FMT_MXN } from '@/lib/format';
import { calcularMonto } from '@/lib/logic/precios';

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

interface Props {
  alumna: AlumnaConfigData;
  grupos: GrupoConfigData[];
  isPendingReasign: boolean;
  isPendingDisciplinas: boolean;
  isPendingParent: boolean;
  onClose: () => void;
  onReasignar: (grupoId: string) => void;
  onUpdateDisciplinas: (disciplinaIds: string[], newGrupoId?: string) => void;
  onUpdateParent: (telefono: string, email: string) => void;
  onToggleStar: () => void;
}

export default function AlumnaDetailModal({
  alumna, grupos, isPendingReasign, isPendingDisciplinas, isPendingParent,
  onClose, onReasignar, onUpdateDisciplinas, onUpdateParent, onToggleStar,
}: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const inicial = `${alumna.nombre[0]}${alumna.apellido[0]}`.toUpperCase();
  const estatusClase = ESTATUS_STYLES[alumna.estatus] ?? 'bg-zinc-500/15 text-zinc-400';
  const edad = calcularEdad(alumna.fechaNacimiento);

  const grupoActualData = grupos.find((g) => g.id === alumna.grupoActual?.id) ?? null;
  const tarifa = grupoActualData?.tarifa?.precioMensualidad ?? 0;
  const totalDiscs = grupoActualData?.disciplinas.length ?? 0;

  const [selectedDiscs, setSelectedDiscs] = useState<Set<string>>(
    () => new Set(alumna.horarios.map((h) => h.disciplinaId)),
  );

  // Estado edición padre
  const [editingParent, setEditingParent] = useState(false);
  const [parentForm, setParentForm] = useState({
    telefono: alumna.padre.telefono ?? '',
    email: alumna.padre.email ?? '',
  });

  // Estado hermanas
  const [hermanas, setHermanas] = useState<any[]>([]);
  const [loadingHermanas, setLoadingHermanas] = useState(false);
  const [showSearchHermanas, setShowSearchHermanas] = useState(false);
  const [queryHermanas, setQueryHermanas] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchingHermanas, setIsSearchingHermanas] = useState(false);

  // Cargar hermanas
  useEffect(() => {
    async function load() {
      setLoadingHermanas(true);
      try {
        const res = await getHermanasSummary(alumna.id, alumna.padreId);
        setHermanas(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingHermanas(false);
      }
    }
    load();
  }, [alumna.id, alumna.padreId]);

  // Sincronizar cuando cambia el grupo o la alumna
  useEffect(() => {
    setSelectedDiscs(new Set(alumna.horarios.map((h) => h.disciplinaId)));
    setParentForm({
      telefono: alumna.padre.telefono ?? '',
      email: alumna.padre.email ?? '',
    });
    setEditingParent(false);
  }, [alumna.id, alumna.grupoActual?.id, alumna.padre.telefono, alumna.padre.email]); // eslint-disable-line react-hooks/exhaustive-deps

  const montoMensual = calcularMonto(tarifa, totalDiscs, selectedDiscs.size);

  function handleToggleDisc(discId: string) {
    const next = new Set(selectedDiscs);
    if (next.has(discId)) {
      next.delete(discId);
    } else {
      next.add(discId);
    }
    setSelectedDiscs(next);

    // Lógica de cambio automático de grupo por Tier
    const currentGrupo = grupos.find((g) => g.id === alumna.grupoActual?.id);
    if (currentGrupo) {
      const num = next.size;
      const targetTier = num === 0 ? 'BASE' : num === 1 ? 'T1' : num === 2 ? 'T2' : num === 3 ? 'T3' : num === 4 ? 'T4' : 'FULL';
      
      const matchingGrupo = grupos.find(g => 
        g.categoria === currentGrupo.categoria && 
        g.tier === targetTier &&
        g.id !== currentGrupo.id
      );

      if (matchingGrupo) {
        onUpdateDisciplinas(Array.from(next), matchingGrupo.id);
        return;
      }
    }

    onUpdateDisciplinas(Array.from(next));
  }

  async function handleSearchHermanas(q: string) {
    setQueryHermanas(q);
    if (q.length < 3) {
      setSearchResults([]);
      return;
    }
    setIsSearchingHermanas(true);
    try {
      const res = await buscarAlumnasParaAsociar(q, alumna.padreId);
      setSearchResults(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingHermanas(false);
    }
  }

  async function handleAsociarHermana(alumnaAAsociarId: string) {
    const ok = confirm('¿Confirmas que deseas asociar esta alumna como hermana? Esto unificará el responsable de pago y el expediente familiar.');
    if (!ok) return;

    try {
      await asociarHermana(alumnaAAsociarId, alumna.padreId);
      toast.success('Hermanas vinculadas correctamente');
      setShowSearchHermanas(false);
      // Recargar hermanas
      const res = await getHermanasSummary(alumna.id, alumna.padreId);
      setHermanas(res);
    } catch (err) {
      toast.error('Error al vincular hermanas');
      console.error(err);
    }
  }

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

          {/* ── 1. Edad ── */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl dark:bg-white/[0.05] bg-gray-100 flex items-center justify-center shrink-0">
              <CalendarDays size={14} className="dark:text-white/40 text-gray-500" />
            </div>
            <div className="min-w-0">
              <p className="font-inter text-[10px] tracking-[0.1em] uppercase dark:text-white/30 text-gray-400 mb-0.5">Edad</p>
              <p className="font-inter text-sm font-medium dark:text-white/80 text-gray-700">{edad} años</p>
            </div>
          </div>

          {/* ── 2. Grupo (editable) ── */}
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

          {/* ── 3. Disciplinas y horario ── */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <Clock size={13} className="dark:text-white/30 text-gray-400 shrink-0" />
                <p className="font-inter text-[10px] tracking-[0.1em] uppercase dark:text-white/30 text-gray-400">
                  Disciplinas y horario
                </p>
              </div>
              {isPendingDisciplinas && (
                <Loader2 size={12} className="animate-spin dark:text-white/40 text-gray-400 shrink-0" />
              )}
            </div>

            {!grupoActualData ? (
              <p className="font-inter text-xs dark:text-white/30 text-gray-400 px-1">
                Asigna un grupo para configurar las disciplinas.
              </p>
            ) : grupoActualData.disciplinas.length === 0 ? (
              <p className="font-inter text-xs dark:text-white/30 text-gray-400 px-1">
                Este grupo no tiene disciplinas configuradas.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {grupoActualData.disciplinas.map((d) => {
                  const activa = selectedDiscs.has(d.id);
                  return (
                    <li key={d.id}>
                      <button
                        type="button"
                        disabled={isPendingDisciplinas}
                        onClick={() => handleToggleDisc(d.id)}
                        className={[
                          'w-full flex items-center gap-3 px-3 py-2 rounded-xl border transition-all text-left',
                          activa
                            ? 'dark:bg-white/[0.05] bg-gray-50 dark:border-epic-gold/20 border-amber-200'
                            : 'dark:bg-white/[0.02] bg-gray-50/50 dark:border-white/[0.05] border-gray-100',
                          isPendingDisciplinas ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                        ].join(' ')}
                      >
                        {d.color && (
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: d.color }}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <span className={[
                            'font-inter text-xs block truncate',
                            activa ? 'dark:text-white text-gray-800 font-medium' : 'dark:text-white/40 text-gray-500',
                          ].join(' ')}>
                            {d.nombre}
                          </span>
                          {d.horaTexto && (
                            <span className="font-inter text-[10px] dark:text-white/20 text-gray-400">
                              {d.horaTexto}
                            </span>
                          )}
                        </div>
                        <div className={[
                          'w-4 h-4 rounded-md border shrink-0 flex items-center justify-center transition-all',
                          activa
                            ? 'bg-epic-gold border-epic-gold'
                            : 'dark:border-white/10 border-gray-300 bg-transparent',
                        ].join(' ')}>
                          {activa && <Check size={10} className="text-black" />}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* ── 4. Estado de cuenta ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CreditCard size={13} className="dark:text-white/30 text-gray-400 shrink-0" />
              <p className="font-inter text-[10px] tracking-[0.1em] uppercase dark:text-white/30 text-gray-400">
                Estado de cuenta
              </p>
            </div>
            <div className="glass-card rounded-2xl px-4 py-3 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <p className="font-inter text-xs dark:text-white/40 text-gray-500">
                  Mensualidad
                  {selectedDiscs.size > 0 && totalDiscs > 0 && selectedDiscs.size < totalDiscs && (
                    <span className="ml-1 dark:text-white/25 text-gray-400">
                      ({selectedDiscs.size}/{totalDiscs} disc.)
                    </span>
                  )}
                </p>
                <p className="font-montserrat font-bold text-sm dark:text-white/80 text-gray-700 shrink-0">
                  {grupoActualData ? FMT_MXN.format(montoMensual) : '—'}
                </p>
              </div>
              <div className="h-px dark:bg-white/[0.06] bg-gray-100" />
              <div className="flex items-center justify-between gap-4">
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
          </div>

          {/* ── 5. Padre / Tutor (Editable) ── */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <UserCircle2 size={13} className="dark:text-white/30 text-gray-400 shrink-0" />
                <p className="font-inter text-[10px] tracking-[0.1em] uppercase dark:text-white/30 text-gray-400">
                  Padre / Tutor
                </p>
              </div>
              {!editingParent && (
                <button
                  type="button"
                  onClick={() => setEditingParent(true)}
                  className="text-[10px] font-bold text-epic-gold hover:underline uppercase tracking-wider"
                >
                  Editar
                </button>
              )}
            </div>

            <div className={[
              'glass-card rounded-2xl px-4 py-3.5 space-y-3 transition-all',
              editingParent ? 'ring-1 ring-epic-gold/30 bg-epic-gold/5' : ''
            ].join(' ')}>
              <div className="flex items-center justify-between">
                <p className="font-inter text-sm font-bold dark:text-white/90 text-gray-800">
                  {alumna.padre.nombre} {alumna.padre.apellido}
                </p>
                {isPendingParent && <Loader2 size={12} className="animate-spin text-epic-gold" />}
              </div>

              {editingParent ? (
                <div className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-widest dark:text-white/40 text-gray-500 ml-1">Teléfono</label>
                    <input
                      type="tel"
                      value={parentForm.telefono}
                      onChange={(e) => setParentForm(p => ({ ...p, telefono: e.target.value }))}
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-epic-gold/50"
                      placeholder="10 dígitos"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-widest dark:text-white/40 text-gray-500 ml-1">Email</label>
                    <input
                      type="email"
                      value={parentForm.email}
                      onChange={(e) => setParentForm(p => ({ ...p, email: e.target.value }))}
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-epic-gold/50"
                      placeholder="correo@ejemplo.com"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingParent(false);
                        setParentForm({ telefono: alumna.padre.telefono ?? '', email: alumna.padre.email ?? '' });
                      }}
                      className="flex-1 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider dark:text-white/40 hover:bg-white/5 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={isPendingParent}
                      onClick={() => onUpdateParent(parentForm.telefono, parentForm.email)}
                      className="flex-1 bg-epic-gold px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider text-black hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 group">
                    <Phone size={12} className="dark:text-white/30 text-gray-400 shrink-0" />
                    {alumna.padre.telefono ? (
                      <a
                        href={`https://wa.me/52${alumna.padre.telefono.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-inter text-xs dark:text-white/60 text-gray-600 hover:text-epic-gold transition-colors"
                      >
                        {alumna.padre.telefono}
                      </a>
                    ) : (
                      <span className="font-inter text-xs dark:text-white/20 text-gray-400 italic">Sin teléfono</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={12} className="dark:text-white/30 text-gray-400 shrink-0" />
                    <span className="font-inter text-xs dark:text-white/60 text-gray-600 truncate">
                      {alumna.padre.email}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── 6. Hermanas (Familia) ── */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <Users size={13} className="dark:text-white/30 text-gray-400 shrink-0" />
                <p className="font-inter text-[10px] tracking-[0.1em] uppercase dark:text-white/30 text-gray-400">
                  Hermanas / Familia
                </p>
              </div>
              {!showSearchHermanas && (
                <button
                  type="button"
                  onClick={() => setShowSearchHermanas(true)}
                  className="text-[10px] font-bold text-epic-gold hover:underline uppercase tracking-wider"
                >
                  Asociar
                </button>
              )}
            </div>

            <div className="space-y-3">
              {loadingHermanas ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 size={16} className="animate-spin text-epic-gold/40" />
                </div>
              ) : hermanas.length === 0 && !showSearchHermanas ? (
                <p className="font-inter text-[10px] dark:text-white/20 text-gray-400 text-center py-2 italic border border-dashed dark:border-white/10 border-gray-200 rounded-2xl">
                  No se encontraron hermanas vinculadas
                </p>
              ) : (
                hermanas.map(h => (
                  <div key={h.id} className="glass-card rounded-2xl p-3 flex items-center justify-between group/h hover:bg-white/[0.04] transition-colors">
                    <div className="flex items-center gap-3">
                      {h.foto ? (
                        <img src={h.foto} alt={h.nombre} className="w-8 h-8 rounded-lg object-cover ring-1 ring-white/10" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-epic-gold/10 flex items-center justify-center text-[10px] font-bold text-epic-gold">
                          {h.nombre[0]}{h.apellido[0]}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-inter text-xs font-bold dark:text-white/90 text-gray-800">
                          {h.nombre} {h.apellido}
                        </p>
                        <p className="font-inter text-[9px] dark:text-white/30 text-gray-400 truncate">
                          {h.grupoNombre} • {h.estatus}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div className="hidden group-hover/h:block">
                        <p className="text-[10px] font-bold dark:text-red-400/80 text-red-600">
                          {h.deudaTotal > 0 ? FMT_MXN.format(h.deudaTotal) : 'Al corriente'}
                        </p>
                      </div>
                      <ChevronRight size={14} className="dark:text-white/10 text-gray-300" />
                    </div>
                  </div>
                ))
              )}

              {/* Buscador de hermanas */}
              {showSearchHermanas && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2 p-3 rounded-2xl bg-epic-gold/5 border border-epic-gold/20"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[9px] font-bold text-epic-gold uppercase tracking-wider">Vincular Hermana</p>
                    <button onClick={() => setShowSearchHermanas(false)} className="text-white/40 hover:text-white">
                      <X size={12} />
                    </button>
                  </div>
                  <input
                    type="text"
                    autoFocus
                    placeholder="Buscar por nombre..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-epic-gold/50"
                    onChange={(e) => handleSearchHermanas(e.target.value)}
                  />
                  
                  {isSearchingHermanas ? (
                    <div className="flex justify-center py-2"><Loader2 size={12} className="animate-spin text-epic-gold/40" /></div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-1 pt-1 max-h-32 overflow-y-auto custom-scrollbar">
                      {searchResults.map(r => (
                        <button
                          key={r.id}
                          onClick={() => handleAsociarHermana(r.id)}
                          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors text-left"
                        >
                          <div className="flex items-center gap-2">
                             <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center text-[8px]">{r.nombre[0]}</div>
                             <div>
                               <p className="text-[10px] font-bold text-white/80">{r.nombre} {r.apellido}</p>
                               <p className="text-[9px] text-white/30">Padre: {r.padre.nombre}</p>
                             </div>
                          </div>
                          <Link2 size={12} className="text-epic-gold" />
                        </button>
                      ))}
                    </div>
                  ) : queryHermanas.length > 2 && (
                    <p className="text-[9px] text-white/30 text-center py-2">No se encontraron resultados</p>
                  )}
                </motion.div>
              )}
            </div>
          </div>

          {/* ── 7. Invitar a grupo de competencia ── */}
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
