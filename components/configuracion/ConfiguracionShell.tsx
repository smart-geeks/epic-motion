'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  GraduationCap, 
  CircleDollarSign, 
  Globe, 
  Zap,
  LayoutGrid
} from 'lucide-react';
import type { GrupoConfigData, AlumnaConfigData, CursoEspecialData, DisciplinaConfigData, ProfesorData } from '@/types/configuracion';
import TabGruposAlumnas from './TabGruposAlumnas';
import TabMaestros from './TabMaestros';
import TabTarifas from './TabTarifas';
import TabLandingAcademia from './TabLandingAcademia';
import TabOperaciones from './TabOperaciones';

const TABS = [
  { id: 'grupos',      label: 'Grupos y Alumnas',  icon: LayoutGrid       },
  { id: 'maestros',    label: 'Maestros y Staff',   icon: Users            },
  { id: 'tarifas',     label: 'Tarifas y Finanzas', icon: CircleDollarSign },
  { id: 'landing',     label: 'Landing y Academia', icon: Globe            },
  { id: 'operaciones', label: 'Operaciones',         icon: Zap              },
] as const;

type TabId = (typeof TABS)[number]['id'];

interface Props {
  grupos: GrupoConfigData[];
  alumnas: AlumnaConfigData[];
  cursosEspeciales: CursoEspecialData[];
  disciplinas: DisciplinaConfigData[];
  staff: any[];
  salones: { id: string; nombre: string }[];
}

export default function ConfiguracionShell({ grupos, alumnas, cursosEspeciales, disciplinas, staff, salones }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('grupos');

  return (
    <div className="space-y-8">
      {/* Barra de tabs - Diseño flotante Liquid Glass */}
      <div className="sticky top-0 z-20 pt-2 pb-4 -mx-4 px-4 bg-transparent backdrop-blur-[2px]">
        <nav className="flex items-center gap-1 p-1.5 glass-card rounded-2xl border-white/5 overflow-x-auto no-scrollbar shadow-2xl">
          {TABS.map(({ id, label, icon: Icon }) => {
            const activo = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={[
                  'relative flex items-center gap-2 px-5 py-2.5 text-xs font-montserrat font-bold whitespace-nowrap transition-all duration-300 rounded-xl outline-none',
                  activo ? 'text-black' : 'text-white/40 hover:text-white/70'
                ].join(' ')}
              >
                {activo && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-epic-gold rounded-xl shadow-[0_0_15px_rgba(255,184,3,0.3)]"
                    transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                  />
                )}
                <Icon size={14} className={['relative z-10 shrink-0 transition-transform', activo ? 'scale-110' : ''].join(' ')} />
                <span className="relative z-10 tracking-wider uppercase">{label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Contenido del tab activo con transición */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="glass-card rounded-[2.5rem] border-white/5 p-8 shadow-2xl min-h-[500px]"
        >
          {activeTab === 'grupos' && (
            <TabGruposAlumnas
              grupos={grupos}
              alumnas={alumnas}
              cursosEspeciales={cursosEspeciales}
              disciplinas={disciplinas}
              profesores={staff.filter(s => s.rol === 'MAESTRO')}
              salones={salones}
            />
          )}
          {activeTab === 'maestros'    && <TabMaestros staff={staff} />}
          {activeTab === 'tarifas'     && <TabTarifas />}
          {activeTab === 'landing'     && <TabLandingAcademia />}
          {activeTab === 'operaciones' && <TabOperaciones />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
