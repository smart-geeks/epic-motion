'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
      <AnimatePresence>
        {abierto && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto px-4 py-8">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={cerrar}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
            />
  
            {/* Panel Central */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-4xl glass-card rounded-[2.5rem] overflow-hidden flex flex-col max-h-[90vh] shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-8 py-6 bg-white/[0.03] border-b border-white/5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="h-px w-6 bg-epic-gold/30" />
                    <h2 className="font-montserrat font-bold text-[10px] tracking-[0.25em] uppercase text-white/40">
                      Proceso Administrativo
                    </h2>
                  </div>
                  <h1 className="font-montserrat font-extrabold text-2xl text-white tracking-tight">
                    Nueva <span className="text-epic-gold">Inscripción</span>
                  </h1>
                </div>
                <button
                  onClick={cerrar}
                  className="w-10 h-10 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] flex items-center justify-center text-white/30 hover:text-white transition-all border border-white/5"
                  aria-label="Cerrar"
                >
                  <X size={20} />
                </button>
              </div>
  
              {/* Contenido Scrollable */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                <WizardInscripcion 
                  gruposIniciales={gruposIniciales} 
                  cuotaInicial={cuotaInicial} 
                  cicloInicial={cicloInicial} 
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
