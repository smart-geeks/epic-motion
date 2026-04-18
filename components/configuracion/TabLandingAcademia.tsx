'use client';

import { Globe } from 'lucide-react';

export default function TabLandingAcademia() {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-epic-gold/10 flex items-center justify-center shrink-0">
          <Globe size={18} className="text-epic-gold" />
        </div>
        <h2 className="font-montserrat font-bold text-xl text-epic-black dark:text-white tracking-[0.03em]">
          Landing y Academia
        </h2>
      </div>
      <p className="font-inter text-sm dark:text-epic-silver text-gray-500 leading-relaxed pl-12">
        Edita el contenido de la landing page pública: disciplinas, imágenes, descripciones
        y colores. Configura también los parámetros globales de la academia como umbrales
        de faltas, tiempo de check-in y datos de contacto.
      </p>
    </div>
  );
}
