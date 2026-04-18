'use client';

import { useState } from 'react';
import { Users, GraduationCap, CircleDollarSign, Globe } from 'lucide-react';
import TabGruposAlumnas from '@/components/configuracion/TabGruposAlumnas';
import TabMaestros from '@/components/configuracion/TabMaestros';
import TabTarifas from '@/components/configuracion/TabTarifas';
import TabLandingAcademia from '@/components/configuracion/TabLandingAcademia';

const TABS = [
  { id: 'grupos',   label: 'Grupos y Alumnas',   icon: Users,              component: TabGruposAlumnas  },
  { id: 'maestros', label: 'Maestros y Staff',    icon: GraduationCap,      component: TabMaestros       },
  { id: 'tarifas',  label: 'Tarifas y Finanzas',  icon: CircleDollarSign,   component: TabTarifas        },
  { id: 'landing',  label: 'Landing y Academia',  icon: Globe,              component: TabLandingAcademia },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState<TabId>('grupos');

  const ActiveComponent = TABS.find((t) => t.id === activeTab)!.component;

  return (
    <div>
      {/* Encabezado */}
      <div className="mb-6">
        <h1 className="text-2xl font-montserrat font-bold dark:text-white text-gray-900 tracking-[0.03em]">
          Centro de Mando
        </h1>
        <p className="mt-1 text-sm font-inter dark:text-epic-silver text-gray-500">
          Configura grupos, tarifas, staff y el contenido público de la academia.
        </p>
      </div>

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
        <ActiveComponent />
      </div>
    </div>
  );
}
