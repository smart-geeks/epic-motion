'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Users, MapPin, Clock, Search, Filter, Maximize2, ChevronLeft, ChevronRight, Info, X
} from 'lucide-react';
import { actualizarHorarioClase } from '@/lib/actions/config-grupos';
import { getGrupoAsistencia } from '@/lib/actions/horarios-actions';
import { toast } from 'sonner';

interface Disciplina {
  id: string;
  nombre: string;
  color: string | null;
  dias: string[];
  horaInicio: string;
  duracionMinutos: number;
}

interface Grupo {
  id: string;
  nombre: string;
  categoria: any;
  cupo: number;
  inscritos: number;
  profesor: string;
  salonId: string | null;
  disciplinas: Disciplina[];
}

interface Props {
  initialData: {
    salones: any[];
    grupos: Grupo[];
  };
}

const DIAS = [
  { key: 'L', label: 'Lunes' },
  { key: 'M', label: 'Martes' },
  { key: 'X', label: 'Miércoles' },
  { key: 'J', label: 'Jueves' },
  { key: 'V', label: 'Viernes' },
  { key: 'S', label: 'Sábado' },
  { key: 'D', label: 'Domingo' },
];

const HORAS = Array.from({ length: 10 }, (_, i) => i + 13); // 13:00 a 22:00

export default function GruposClient({ initialData }: Props) {
  const [selectedSalonId, setSelectedSalonId] = useState<string | 'all'>('all');
  const [hoveredClass, setHoveredClass] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Modal de Asistencia
  const [selectedClassForAttendance, setSelectedClassForAttendance] = useState<any>(null);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  const filteredGrupos = useMemo(() => {
    const grupos = initialData?.grupos || [];
    // Decouple competitive/special groups from the main grid
    let filtrados = grupos.filter(g => g.categoria !== 'COMPETICION' && g.categoria !== 'Eventos');
    
    if (selectedSalonId === 'all') return filtrados;
    return filtrados.filter(g => g.salonId === selectedSalonId);
  }, [selectedSalonId, initialData]);

  const consolidatedBlocks = useMemo(() => {
    const rawBlocks: any[] = [];
    filteredGrupos.forEach(grupo => {
      if (grupo?.disciplinas) {
        grupo.disciplinas.forEach(disc => {
          if (disc?.dias && Array.isArray(disc.dias)) {
            disc.dias.forEach(dia => {
              const parts = (disc.horaInicio || '00:00').split(':');
              const start = (Number(parts[0]) || 0) * 60 + (Number(parts[1]) || 0);
              const end = start + (disc.duracionMinutos || 60);

              rawBlocks.push({
                ...disc,
                dia,
                grupoNombre: grupo.nombre,
                grupoCategoria: grupo.categoria,
                profesor: grupo.profesor,
                cupo: grupo.cupo || 1,
                inscritos: grupo.inscritos || 0,
                grupoId: grupo.id,
                salonId: grupo.salonId,
                start,
                end,
                originalId: disc.id,
                disciplinaNombre: disc.nombre
              });
            });
          }
        });
      }
    });

    const grouped = rawBlocks.reduce((acc: any, block: any) => {
      const key = `${block.grupoId}-${block.dia}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(block);
      return acc;
    }, {});

    const mergedBlocks: any[] = [];

    Object.values(grouped).forEach((groupBlocks: any) => {
      groupBlocks.sort((a: any, b: any) => a.start - b.start);

      let currentSuperBlock: any = null;

      groupBlocks.forEach((block: any) => {
        if (!currentSuperBlock) {
          currentSuperBlock = {
            id: `super-${block.grupoId}-${block.dia}-${block.start}`,
            grupoId: block.grupoId,
            dia: block.dia,
            grupoNombre: block.grupoNombre,
            grupoCategoria: block.grupoCategoria,
            profesor: block.profesor,
            cupo: block.cupo,
            inscritos: block.inscritos,
            salonId: block.salonId,
            color: block.color,
            start: block.start,
            end: block.end,
            subBlocks: [block]
          };
        } else {
          if (block.start <= currentSuperBlock.end) {
            currentSuperBlock.end = Math.max(currentSuperBlock.end, block.end);
            currentSuperBlock.subBlocks.push(block);
          } else {
            mergedBlocks.push(currentSuperBlock);
            currentSuperBlock = {
              id: `super-${block.grupoId}-${block.dia}-${block.start}`,
              grupoId: block.grupoId,
              dia: block.dia,
              grupoNombre: block.grupoNombre,
              grupoCategoria: block.grupoCategoria,
              profesor: block.profesor,
              cupo: block.cupo,
              inscritos: block.inscritos,
              salonId: block.salonId,
              color: block.color,
              start: block.start,
              end: block.end,
              subBlocks: [block]
            };
          }
        }
      });
      if (currentSuperBlock) {
        mergedBlocks.push(currentSuperBlock);
      }
    });

    return mergedBlocks.map(sb => {
      const h = Math.floor(sb.start / 60);
      const m = sb.start % 60;
      return {
        ...sb,
        horaInicio: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`,
        duracionMinutos: sb.end - sb.start,
      };
    });
  }, [filteredGrupos]);

  const getPositionStyles = (horaInicio: string, duracionMinutos: number) => {
    if (!horaInicio || typeof horaInicio !== 'string') return { top: '0px', height: '0px', display: 'none' };
    const parts = horaInicio.split(':');
    if (parts.length < 2) return { top: '0px', height: '0px', display: 'none' };
    const h = Number(parts[0]) || 0;
    const m = Number(parts[1]) || 0;
    const startMinutes = h * 60 + m;
    const baseMinutes = 13 * 60; // 1:00 PM start
    const top = ((startMinutes - baseMinutes) / 60) * 80; // 80px per hour
    const height = ((duracionMinutos || 60) / 60) * 80;
    
    return {
      top: `${top}px`,
      height: `${height}px`,
    };
  };

  const handleDragStart = (e: React.DragEvent, block: any) => {
    setIsDragging(true);
    e.dataTransfer.setData('block', JSON.stringify(block));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent, targetDia: string) => {
    e.preventDefault();
    setIsDragging(false);
    
    const blockData = e.dataTransfer.getData('block');
    if (!blockData) return;
    
    const superBlock = JSON.parse(blockData);
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    
    const hourOffset = y / 80;
    const newTotalMinutes = Math.floor((13 + hourOffset) * 60);
    const snappedMinutes = Math.round(newTotalMinutes / 15) * 15;

    const timeDelta = snappedMinutes - superBlock.start;
    const originalDia = superBlock.dia;

    if (timeDelta === 0 && originalDia === targetDia) {
      return; // No hubo cambio
    }

    const toastId = toast.loading('Actualizando horario...');
    try {
      const promises = superBlock.subBlocks.map((sub: any) => {
        let nuevosDias = [...sub.dias];
        if (originalDia !== targetDia) {
          if (nuevosDias.includes(targetDia)) {
            nuevosDias = nuevosDias.filter((d: string) => d !== originalDia);
            if (!nuevosDias.includes(targetDia)) nuevosDias.push(targetDia);
          } else {
            nuevosDias = nuevosDias.map((d: string) => d === originalDia ? targetDia : d);
          }
        }

        const newStart = sub.start + timeDelta;
        const newH = Math.floor(newStart / 60);
        const newM = newStart % 60;
        const nuevaHoraInicio = `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;

        return actualizarHorarioClase(superBlock.grupoId, sub.originalId, nuevosDias, nuevaHoraInicio);
      });

      const results = await Promise.all(promises);
      const allOk = results.every(res => res.ok);
      
      if (allOk) {
        toast.success('Horario actualizado con éxito', { id: toastId });
      } else {
        toast.error('Hubo un problema al actualizar algunas clases', { id: toastId });
      }
    } catch (error) {
      toast.error('Error al actualizar', { id: toastId });
    }
  };

  const openAttendance = async (block: any) => {
    setSelectedClassForAttendance(block);
    setLoadingAttendance(true);
    setAttendanceData([]);
    try {
      const res = await getGrupoAsistencia(block.grupoId);
      if (res.ok && 'alumnas' in res && res.alumnas) {
        setAttendanceData(res.alumnas);
      } else {
        toast.error('Error al cargar la asistencia');
      }
    } catch (err) {
      toast.error('Error de conexión');
    } finally {
      setLoadingAttendance(false);
    }
  };

  const getDayBlocksWithLayout = (dayBlocks: any[]) => {
    const blocksWithTimes = [...dayBlocks].sort((a, b) => a.start - b.start);

    const clusters: any[][] = [];
    let currentCluster: any[] = [];
    let currentClusterEnd = 0;

    blocksWithTimes.forEach(b => {
      if (currentCluster.length === 0) {
        currentCluster.push(b);
        currentClusterEnd = b.end;
      } else if (b.start < currentClusterEnd) {
        currentCluster.push(b);
        currentClusterEnd = Math.max(currentClusterEnd, b.end);
      } else {
        clusters.push(currentCluster);
        currentCluster = [b];
        currentClusterEnd = b.end;
      }
    });
    if (currentCluster.length > 0) {
      clusters.push(currentCluster);
    }

    const layoutedBlocks: any[] = [];

    clusters.forEach(cluster => {
      const columns: any[][] = [];
      cluster.forEach(b => {
        let placed = false;
        for (let i = 0; i < columns.length; i++) {
          const col = columns[i];
          const lastInCol = col[col.length - 1];
          if (lastInCol.end <= b.start) {
            col.push(b);
            b.colIdx = i;
            placed = true;
            break;
          }
        }
        if (!placed) {
          b.colIdx = columns.length;
          columns.push([b]);
        }
      });

      const numCols = columns.length;
      cluster.forEach(b => {
        layoutedBlocks.push({
          ...b,
          colIdx: b.colIdx,
          numCols: numCols
        });
      });
    });

    return layoutedBlocks;
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 glass-card rounded-2xl border border-white/10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-epic-gold" />
            <div className="flex bg-white/5 rounded-lg border border-white/10 p-1">
              <button
                onClick={() => setSelectedSalonId('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  selectedSalonId === 'all' 
                    ? 'bg-epic-gold text-[#0a0a0b] shadow-md' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                Todos
              </button>
              {(initialData?.salones || []).map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSalonId(s.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    selectedSalonId === s.id 
                      ? 'bg-epic-gold text-[#0a0a0b] shadow-md' 
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {s.nombre}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500/50 border border-emerald-500" />
            <span className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500/50 border border-amber-500" />
            <span className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Casi Lleno</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/50 border border-rose-500" />
            <span className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Lleno</span>
          </div>
          <div className="flex items-center gap-2">
             <span className="text-[10px] text-white/40 uppercase tracking-wider font-bold">
               ℹ️ Clic en clase para asistencia
             </span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="relative glass-card rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
        {/* Days Header */}
        <div className="grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr_1fr_1fr] border-b border-white/10 bg-white/5">
          <div className="p-4 flex items-center justify-center border-r border-white/10">
            <Clock className="w-4 h-4 text-white/20" />
          </div>
          {DIAS.map((dia, idx) => (
            <div key={dia.key} className={`p-4 text-center ${idx < DIAS.length - 1 ? 'border-r border-white/10' : ''}`}>
              <span className="text-[10px] font-black text-epic-gold uppercase tracking-[0.2em]">{dia.label}</span>
            </div>
          ))}
        </div>

        {/* Time Grid */}
        <div className="relative overflow-y-auto max-h-[600px] custom-scrollbar">
          <div className="grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr_1fr_1fr] relative">
            
            {/* Hour Labels */}
            <div className="flex flex-col">
              {HORAS.map(hora => (
                <div key={hora} className="h-[80px] flex items-start justify-center pt-2 border-r border-white/10">
                  <span className="text-[10px] font-mono text-white/30 font-bold">{hora}:00</span>
                </div>
              ))}
            </div>

            {/* Day Columns & Grid Lines */}
            {DIAS.map((dia, dayIdx) => (
              <div 
                key={dia.key} 
                className={`relative flex flex-col ${dayIdx < DIAS.length - 1 ? 'border-r border-white/5' : ''} ${isDragging ? 'bg-white/[0.02] hover:bg-white/[0.05] transition-colors' : ''}`}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                onDrop={(e) => handleDrop(e, dia.key)}
              >
                {/* Horizontal lines */}
                {HORAS.map(hora => (
                  <div key={hora} className="h-[80px] border-b border-white/[0.03] pointer-events-none" />
                ))}

                {/* Class Blocks for this day */}
                <div className="absolute inset-0 pointer-events-none">
                  {getDayBlocksWithLayout(consolidatedBlocks.filter(b => b.dia === dia.key)).map((block, bIdx) => {
                    const styles = getPositionStyles(block.horaInicio, block.duracionMinutos);
                    const occupancyRatio = block.inscritos / block.cupo;
                    const statusColor = occupancyRatio >= 1 ? 'rose' : occupancyRatio >= 0.8 ? 'amber' : 'emerald';
                    
                    const leftPct = (block.colIdx / block.numCols) * 100;
                    const widthPct = 100 / block.numCols;
                    const computedStyles = {
                      ...styles,
                      left: `calc(${leftPct}% + 4px)`,
                      width: `calc(${widthPct}% - 8px)`,
                    };

                    return (
                      <div
                        key={`${block.grupoId}-${block.id}-${dayIdx}-${bIdx}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, block)}
                        onDragEnd={handleDragEnd}
                        className="absolute pointer-events-auto group cursor-grab active:cursor-grabbing hover:z-20 transition-transform hover:scale-[1.02]"
                        style={computedStyles}
                        onMouseEnter={() => setHoveredClass(block)}
                        onMouseLeave={() => setHoveredClass(null)}
                        onClick={() => openAttendance(block)}
                      >
                        <div 
                          className="h-full w-full rounded-xl p-2 flex flex-col gap-1 shadow-lg overflow-hidden relative"
                          style={{ 
                            backgroundColor: `${block.color}22`,
                            border: `1px solid ${block.color}44`,
                            boxShadow: `0 4px 12px -2px ${block.color}33`
                          }}
                        >
                          {/* Drag Handle indicator */}
                          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-4 h-1 border-t border-b border-white/20" />
                          </div>

                          {/* Intensity indicator bar */}
                          <div className={`absolute top-0 left-0 w-1 h-full rounded-l-xl bg-${statusColor}-500/50`} />

                          <div className="flex items-center justify-between">
                             <span className="text-[9px] font-bold text-white/40 uppercase tracking-tighter truncate">
                              {block.grupoCategoria}
                            </span>
                            <div className={`w-1.5 h-1.5 rounded-full bg-${statusColor}-500 shadow-[0_0_8px_${statusColor === 'emerald' ? '#10b981' : statusColor === 'amber' ? '#f59e0b' : '#f43f5e'}]`} />
                          </div>

                          <span className="text-[11px] font-black text-white leading-none group-hover:text-epic-gold transition-colors">
                            {block.grupoNombre}
                          </span>
                          
                          {/* Desglose de disciplinas */}
                          <div className="flex flex-col gap-0.5 mt-1 overflow-hidden">
                            {block.subBlocks.map((sub: any) => {
                              const endH = Math.floor(sub.end / 60);
                              const endM = sub.end % 60;
                              const endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
                              return (
                                <div key={sub.originalId} className="text-[9px] text-white/80 leading-tight truncate">
                                  <span className="font-bold">{sub.disciplinaNombre}</span> {sub.horaInicio}-{endTime}
                                </div>
                              );
                            })}
                          </div>
                          
                          <div className="mt-auto flex flex-col gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                            <div className="flex items-center gap-1">
                              <Users className="w-2.5 h-2.5 text-epic-gold" />
                              <span className="text-[9px] text-white font-medium">{block.inscritos}/{block.cupo}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-2.5 h-2.5 text-epic-gold" />
                              <span className="text-[9px] text-white font-medium truncate">
                                {(initialData?.salones || []).find(s => s.id === block.salonId)?.nombre || 'Sin salón'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Info Card (Animate on Hover) */}
      <AnimatePresence>
        {hoveredClass && !isDragging && !selectedClassForAttendance && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 w-[400px] glass-card p-6 rounded-3xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden pointer-events-none"
          >
            {/* Background Glow */}
            <div 
              className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-20"
              style={{ backgroundColor: hoveredClass.color }}
            />

            <div className="relative flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-md bg-white/5 text-[9px] font-bold text-epic-gold uppercase tracking-widest border border-epic-gold/20">
                      {hoveredClass.grupoCategoria}
                    </span>
                    <span className="text-[10px] text-white/40 font-medium">| ID: {hoveredClass.id.split('-')[0]}</span>
                  </div>
                  <h3 className="text-2xl font-montserrat font-bold text-white tracking-tight">
                    {hoveredClass.grupoNombre}
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-[9px] font-bold text-white/40 uppercase mb-1">Profesor(a)</p>
                  <p className="text-sm font-bold text-white truncate">{hoveredClass.profesor}</p>
                </div>
                <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-[9px] font-bold text-white/40 uppercase mb-1">Horario</p>
                  <p className="text-sm font-bold text-white">{hoveredClass.horaInicio} ({hoveredClass.duracionMinutos} min)</p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                  <span className="text-white/40">Ocupación del Grupo</span>
                  <span className={hoveredClass.inscritos >= hoveredClass.cupo ? 'text-rose-400' : 'text-emerald-400'}>
                    {Math.round((hoveredClass.inscritos / hoveredClass.cupo) * 100)}%
                  </span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(hoveredClass.inscritos / hoveredClass.cupo) * 100}%` }}
                    className={`h-full rounded-full ${
                      hoveredClass.inscritos >= hoveredClass.cupo ? 'bg-rose-500' 
                      : hoveredClass.inscritos >= hoveredClass.cupo * 0.8 ? 'bg-amber-500' 
                      : 'bg-emerald-500'
                    }`}
                  />
                </div>
                <p className="text-[10px] text-white/40 text-center italic">
                  Arrastra para mover • Clic para ver asistencia
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attendance Modal */}
      <AnimatePresence>
        {selectedClassForAttendance && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg glass-card rounded-3xl border border-white/10 p-6 flex flex-col gap-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-montserrat font-bold text-white">Lista de Asistencia</h2>
                  <p className="text-sm text-white/40">Grupo: <span className="text-epic-gold font-bold">{selectedClassForAttendance.grupoNombre}</span></p>
                </div>
                <button
                  onClick={() => setSelectedClassForAttendance(null)}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/10"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="min-h-[200px] max-h-[400px] overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-3">
                {loadingAttendance ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-epic-gold border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : attendanceData.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-3 opacity-50">
                    <Users className="w-12 h-12 text-white/40" />
                    <p className="text-sm text-white/60">No hay alumnas inscritas en este grupo.</p>
                  </div>
                ) : (
                  attendanceData.map((alumna: any, index: number) => (
                    <div key={alumna.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-epic-gold/20 flex items-center justify-center text-epic-gold font-bold text-xs">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white leading-tight">
                            {alumna.nombre} {alumna.apellido}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                         <div className="w-6 h-6 rounded border border-white/20 flex items-center justify-center text-[10px] text-white/40 cursor-not-allowed">✓</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
