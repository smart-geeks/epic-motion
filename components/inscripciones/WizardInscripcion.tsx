'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import PasoIndicador from '@/components/inscripciones/PasoIndicador';
import Paso1Datos from '@/components/inscripciones/Paso1Datos';
import Paso2POS from '@/components/inscripciones/Paso2POS';
import Paso3Confirmacion from '@/components/inscripciones/Paso3Confirmacion';
import { useWizardInscripcion } from '@/stores/wizard-inscripcion.store';
import type { GrupoCard } from '@/types/inscripciones';

export default function WizardInscripcion() {
  const { paso, setCuotaInscripcion } = useWizardInscripcion();

  const [grupos, setGrupos] = useState<GrupoCard[]>([]);
  const [cuotaInscripcion, setCuotaLocal] = useState(0);
  const [cargando, setCargando] = useState(true);

  // Carga inicial: grupos y configuración
  useEffect(() => {
    const cargar = async () => {
      try {
        const [resGrupos, resCfg] = await Promise.all([
          fetch('/api/grupos'),
          fetch('/api/configuracion?claves=cuota_inscripcion'),
        ]);

        if (!resGrupos.ok || !resCfg.ok) throw new Error('Error al cargar datos iniciales');

        const dataGrupos: GrupoCard[] = await resGrupos.json();
        const dataCfg: Record<string, string> = await resCfg.json();

        const cuota = parseFloat(dataCfg.cuota_inscripcion ?? '0');

        setGrupos(dataGrupos);
        setCuotaLocal(cuota);
        setCuotaInscripcion(cuota); // sincronizar con el store
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : 'Error al cargar el wizard');
      } finally {
        setCargando(false);
      }
    };

    cargar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-epic-gold border-t-transparent rounded-full animate-spin" />
          <p className="font-inter text-sm text-gray-400 dark:text-white/30">Cargando wizard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <PasoIndicador pasoActual={paso} />

      {paso === 1 && <Paso1Datos grupos={grupos} cuotaInscripcion={cuotaInscripcion} />}
      {paso === 2 && <Paso2POS />}
      {paso === 3 && <Paso3Confirmacion />}
    </div>
  );
}
