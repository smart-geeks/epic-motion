'use client';

import { useEffect } from 'react';
import PasoIndicador from '@/components/inscripciones/PasoIndicador';
import Paso1Datos from '@/components/inscripciones/Paso1Datos';
import Paso2POS from '@/components/inscripciones/Paso2POS';
import Paso3Confirmacion from '@/components/inscripciones/Paso3Confirmacion';
import { useWizardInscripcion } from '@/stores/wizard-inscripcion.store';
import type { GrupoCard } from '@/types/inscripciones';

interface Props {
  gruposIniciales: GrupoCard[];
  cuotaInicial: number;
  cicloInicial: string;
}

export default function WizardInscripcion({ gruposIniciales, cuotaInicial, cicloInicial }: Props) {
  const { paso, setCuotaInscripcion, setCicloEscolar } = useWizardInscripcion();

  // Cargamos los datos iniciales en el store para que estén disponibles en todos los pasos
  useEffect(() => {
    setCuotaInscripcion(cuotaInicial);
    setCicloEscolar(cicloInicial);
  }, [cuotaInicial, cicloInicial, setCuotaInscripcion, setCicloEscolar]);

  return (
    <div className="max-w-3xl mx-auto">
      <PasoIndicador pasoActual={paso} />

      {paso === 1 && (
        <Paso1Datos 
          grupos={gruposIniciales} 
          cuotaInscripcion={cuotaInicial} 
          cicloEscolar={cicloInicial} 
        />
      )}
      {paso === 2 && <Paso2POS />}
      {paso === 3 && <Paso3Confirmacion />}
    </div>
  );
}
