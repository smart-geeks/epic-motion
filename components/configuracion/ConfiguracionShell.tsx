'use client';

import { useState } from 'react';
import { Users, GraduationCap, CircleDollarSign, Globe, Zap } from 'lucide-react';
import type { GrupoConfigData, AlumnaConfigData, CursoEspecialData, DisciplinaConfigData, ProfesorData } from '@/types/configuracion';
import TabGruposAlumnas from './TabGruposAlumnas';
import TabMaestros from './TabMaestros';
import TabTarifas from './TabTarifas';
import TabLandingAcademia from './TabLandingAcademia';
import TabOperaciones from './TabOperaciones';

const TABS = [
  { id: 'grupos',      label: 'Grupos y Alumnas',  icon: Users            },
  { id: 'maestros',    label: 'Maestros y Staff',   icon: GraduationCap    },
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
  profesores: ProfesorData[];
}

export default function ConfiguracionShell({ grupos, alumnas, cursosEspeciales, disciplinas, profesores }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('grupos');

  return (
    <>
      {/* Barra de tabs */}
      <div className="border-b dark:border-white/8 border-gray-200 mb-8">
        <nav className="-mb-px flex gap-1 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => {
            const activo = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={[
                  'flex items-center gap-2 px-4 py-3 text-sm font-inter font-medium whitespace-nowrap',
                  'border-b-2 transition-colors duration-150 focus:outline-none',
                  activo
                    ? 'border-epic-gold text-epic-gold'
                    : 'border-transparent dark:text-epic-silver text-gray-500 hover:dark:text-white hover:text-gray-900 hover:border-gray-300 dark:hover:border-white/20',
                ].join(' ')}
              >
                <Icon size={15} className="shrink-0" />
                {label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Contenido del tab activo */}
      <div className="dark:bg-epic-gray bg-white rounded-2xl border dark:border-white/5 border-gray-200 p-6 shadow-sm">
        {activeTab === 'grupos' && (
          <TabGruposAlumnas
            grupos={grupos}
            alumnas={alumnas}
            cursosEspeciales={cursosEspeciales}
            disciplinas={disciplinas}
            profesores={profesores}
          />
        )}
        {activeTab === 'maestros'    && <TabMaestros />}
        {activeTab === 'tarifas'     && <TabTarifas />}
        {activeTab === 'landing'     && <TabLandingAcademia />}
        {activeTab === 'operaciones' && <TabOperaciones />}
      </div>
    </>
  );
}
