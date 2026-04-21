'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Search, 
  GraduationCap, 
  ChevronRight, 
  Filter,
  MoreVertical,
  User,
  CreditCard,
  Calendar,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';

interface AlumnaItem {
  id: string;
  alumna: {
    id: string;
    nombre: string;
    apellido: string;
    estatus: string;
    fechaInscripcion: Date;
  };
  grupo: {
    id: string;
    nombre: string;
  } | null;
}

interface Props {
  alumnas: AlumnaItem[];
}

export default function StudentsManager({ alumnas }: Props) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Filtrado reactivo
  const filtered = useMemo(() => {
    return alumnas.filter(a => 
      `${a.alumna.nombre} ${a.alumna.apellido}`.toLowerCase().includes(search.toLowerCase()) ||
      a.grupo?.nombre.toLowerCase().includes(search.toLowerCase())
    );
  }, [alumnas, search]);

  const selectedAlumna = useMemo(() => 
    alumnas.find(a => a.alumna.id === selectedId),
    [alumnas, selectedId]
  );

  return (
    <div className="relative min-h-[calc(100vh-12rem)]">
      {/* Contenido Principal */}
      <div className={`space-y-6 transition-all duration-500 ${selectedId ? 'md:pr-[450px]' : ''}`}>
        {/* Encabezado y Herramientas */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-0.5 w-8 bg-epic-gold rounded-full" />
              <p className="text-[10px] font-montserrat font-bold text-epic-gold uppercase tracking-[0.3em]">
                Comunidad Epic
              </p>
            </div>
            <h1 className="text-3xl font-montserrat font-bold text-white tracking-tight">
              Control de <span className="text-epic-gold">Alumnas</span>
            </h1>
            <p className="mt-1 text-sm font-inter text-white/40">
              {filtered.length} registrada{filtered.length !== 1 ? 's' : ''} en este ciclo.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative group flex-1 md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-epic-gold transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por nombre o grupo..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm font-inter text-white placeholder:text-white/20 focus:outline-none focus:border-epic-gold/50 transition-all shadow-inner"
              />
            </div>
            <Button variante="secondary" className="px-4 rounded-2xl border-white/5 bg-white/[0.03]">
              <Filter size={18} />
            </Button>
          </div>
        </div>

        {/* Lista / Tabla */}
        {filtered.length === 0 ? (
          <div className="glass-card rounded-[2.5rem] border-white/5 p-20 text-center shadow-xl">
            <GraduationCap size={64} className="mx-auto mb-6 text-white/5" />
            <p className="text-xl font-montserrat font-bold text-white">No encontramos resultados</p>
            <p className="text-sm font-inter text-white/40 mt-2">Intenta con otro nombre o revisa los filtros aplicados.</p>
          </div>
        ) : (
          <div className="glass-card rounded-[2.5rem] border-white/5 overflow-hidden shadow-2xl">
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm font-inter border-separate border-spacing-0">
                <thead>
                  <tr className="bg-white/[0.02]">
                    <th className="text-left px-8 py-6 font-bold text-white/30 text-[10px] uppercase tracking-[0.2em]">Expediente</th>
                    <th className="text-left px-8 py-6 font-bold text-white/30 text-[10px] uppercase tracking-[0.2em]">Grupo Actual</th>
                    <th className="text-left px-8 py-6 font-bold text-white/30 text-[10px] uppercase tracking-[0.2em]">Registro</th>
                    <th className="text-center px-8 py-6 font-bold text-white/30 text-[10px] uppercase tracking-[0.2em]">Estatus</th>
                    <th className="px-8 py-6" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map((i) => {
                    const isSelected = selectedId === i.alumna.id;
                    return (
                      <tr
                        key={i.id}
                        onClick={() => setSelectedId(i.alumna.id)}
                        className={`hover:bg-white/[0.03] transition-all cursor-pointer group ${isSelected ? 'bg-white/[0.05]' : ''}`}
                      >
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs uppercase border transition-all duration-300 ${isSelected ? 'bg-epic-gold text-black border-epic-gold' : 'bg-epic-gold/10 text-epic-gold border-epic-gold/20 group-hover:scale-110'}`}>
                              {i.alumna.nombre[0]}{i.alumna.apellido[0]}
                            </div>
                            <span className={`font-bold tracking-tight transition-colors ${isSelected ? 'text-epic-gold' : 'text-white'}`}>
                              {i.alumna.nombre} {i.alumna.apellido}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className="text-white/60 font-medium">{i.grupo?.nombre ?? '—'}</span>
                        </td>
                        <td className="px-8 py-5 text-white/40">
                          {new Date(i.alumna.fechaInscripcion).toLocaleDateString('es-MX', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-8 py-5 text-center">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase border ${
                            i.alumna.estatus === 'ACTIVA' 
                              ? 'bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_12px_rgba(34,197,94,0.1)]' 
                              : 'bg-white/5 text-white/40 border-white/10'
                          }`}>
                            {i.alumna.estatus}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <Link 
                            href={`/admin/alumnas/${i.alumna.id}`}
                            className="p-2 rounded-xl bg-white/5 text-white/20 hover:text-epic-gold hover:bg-epic-gold/10 transition-all inline-flex items-center justify-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ChevronRight size={18} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden divide-y divide-white/5">
              {filtered.map((i) => (
                <div key={i.id} className="px-6 py-6 active:bg-white/5 transition-colors">
                  <Link href={`/admin/alumnas/${i.alumna.id}`} className="block space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-epic-gold/20 to-epic-gold/5 flex items-center justify-center text-epic-gold font-bold border border-epic-gold/20 shadow-lg">
                          {i.alumna.nombre[0]}{i.alumna.apellido[0]}
                        </div>
                        <div>
                          <p className="font-montserrat font-bold text-white text-lg leading-tight uppercase tracking-tight">
                            {i.alumna.nombre}
                          </p>
                          <p className="font-montserrat font-bold text-white/40 text-sm italic">
                            {i.alumna.apellido}
                          </p>
                        </div>
                      </div>
                      <ChevronRight size={20} className="text-white/20 mt-2" />
                    </div>
                    
                    <div className="flex items-center justify-between pt-2">
                       <div className="flex flex-col gap-1">
                         <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Grupo</span>
                         <span className="text-xs font-medium text-white/70">{i.grupo?.nombre ?? 'Sin grupo'}</span>
                       </div>
                       <span className={`px-3 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase border ${
                          i.alumna.estatus === 'ACTIVA' 
                            ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                            : 'bg-white/5 text-white/40 border-white/10'
                        }`}>
                          {i.alumna.estatus}
                        </span>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Panel Detalle (Desktop Lateral) */}
      <AnimatePresence>
        {selectedId && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-[450px] bg-black/80 backdrop-blur-2xl border-l border-white/10 z-50 overflow-y-auto hidden md:block"
          >
            <div className="sticky top-0 z-20 px-8 py-6 border-b border-white/5 bg-black/40 backdrop-blur-md flex items-center justify-between">
              <h2 className="font-montserrat font-bold text-sm uppercase tracking-[0.2em] text-epic-gold">Vista Rápida</h2>
              <button 
                onClick={() => setSelectedId(null)}
                className="p-2 rounded-xl bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8">
               {selectedAlumna ? (
                  <div className="space-y-8">
                    {/* Header Resume */}
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-epic-gold/20 to-epic-gold/5 border border-epic-gold/40 flex items-center justify-center shadow-2xl">
                        <span className="font-montserrat font-bold text-3xl text-epic-gold">
                          {selectedAlumna.alumna.nombre[0]}{selectedAlumna.alumna.apellido[0]}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-montserrat font-bold text-2xl text-white">
                          {selectedAlumna.alumna.nombre} {selectedAlumna.alumna.apellido}
                        </h3>
                        <p className="text-sm text-epic-silver/60 mt-1">{selectedAlumna.grupo?.nombre || 'General'}</p>
                      </div>
                    </div>

                    {/* Quick Info Grid */}
                    <div className="grid grid-cols-2 gap-3">
                       <div className="glass-card bg-white/[0.02] border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center text-center space-y-1">
                          <User size={16} className="text-epic-gold/40 mb-1" />
                          <span className="text-[10px] font-bold text-white/20 uppercase">Estatus</span>
                          <span className="text-sm font-bold text-green-400">{selectedAlumna.alumna.estatus}</span>
                       </div>
                       <div className="glass-card bg-white/[0.02] border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center text-center space-y-1">
                          <CreditCard size={16} className="text-epic-gold/40 mb-1" />
                          <span className="text-[10px] font-bold text-white/20 uppercase">Deuda</span>
                          <span className="text-sm font-bold text-white">$0.00</span>
                       </div>
                    </div>

                    <div className="space-y-4">
                      <Link href={`/admin/alumnas/${selectedId}`}>
                        <Button className="w-full h-12 rounded-2xl font-bold tracking-widest text-xs uppercase shadow-xl">
                          Ver Expediente Completo
                        </Button>
                      </Link>
                      <Button variante="secondary" className="w-full h-12 rounded-2xl font-bold tracking-widest text-xs uppercase border-white/5 bg-white/[0.02]">
                        Registrar Asistencia
                      </Button>
                    </div>

                    <div className="pt-8 border-t border-white/5">
                      <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-4 text-center">Actividades Recientes</p>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 px-4 py-3 rounded-2xl bg-white/[0.01] border border-white/5">
                          <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 text-xs font-bold">A</div>
                          <div>
                            <p className="text-xs font-bold text-white/80">Asistencia registrada</p>
                            <p className="text-[10px] text-white/30">Ayer, 18:30 · Jazz Principiante</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
               ) : (
                 <div className="flex flex-col items-center justify-center h-[60vh] text-center opacity-20">
                   <User size={48} />
                   <p className="mt-4 font-montserrat font-bold">Cargando datos...</p>
                 </div>
               )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
