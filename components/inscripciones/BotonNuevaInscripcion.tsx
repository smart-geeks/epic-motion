'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import WizardInscripcion from '@/components/inscripciones/WizardInscripcion';
import { useWizardInscripcion } from '@/stores/wizard-inscripcion.store';
import type { GrupoCard } from '@/types/inscripciones';

interface Props {
  gruposIniciales: GrupoCard[];
  cuotaInicial: number;
  cicloInicial: string;
}

export default function BotonNuevaInscripcion({ gruposIniciales, cuotaInicial, cicloInicial }: Props) {
  const [abierto, setAbierto] = useState(false);
  const resetWizard = useWizardInscripcion((s) => s.resetWizard);

  const abrir = () => {
    resetWizard();
    setAbierto(true);
  };

  const cerrar = () => setAbierto(false);

  return (
    <>
      <Button tamano="md" onClick={abrir}>
        <Plus size={15} />
        Nueva Inscripción
      </Button>

      {/* Modal del wizard */}
      {abierto && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
            onClick={cerrar}
          />

          {/* Panel deslizante */}
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-6 px-4">
            <div className="relative w-full max-w-3xl bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/8 shadow-2xl rounded-sm min-h-[calc(100vh-3rem)]">
              {/* Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white dark:bg-[#141414] border-b border-gray-100 dark:border-white/8">
                <div>
                  <h2 className="font-montserrat font-bold text-sm tracking-[0.15em] uppercase text-epic-black dark:text-white">
                    Nueva Inscripción
                  </h2>
                  <p className="font-inter text-xs dark:text-epic-silver text-gray-500 mt-0.5">
                    Epic Motion High Performance Dance Studio
                  </p>
                </div>
                <button
                  onClick={cerrar}
                  className="p-1.5 text-gray-400 dark:text-white/30 hover:text-epic-black dark:hover:text-white transition-colors"
                  aria-label="Cerrar"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Contenido del wizard */}
              <div className="px-6 py-6">
                <WizardInscripcion 
                  gruposIniciales={gruposIniciales} 
                  cuotaInicial={cuotaInicial} 
                  cicloInicial={cicloInicial} 
                />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
