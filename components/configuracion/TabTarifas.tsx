'use client';

import { CircleDollarSign } from 'lucide-react';

export default function TabTarifas() {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
          <CircleDollarSign size={18} className="text-green-400" />
        </div>
        <h2 className="font-montserrat font-bold text-xl text-epic-black dark:text-white tracking-[0.03em]">
          Tarifas y Finanzas
        </h2>
      </div>
      <p className="font-inter text-sm dark:text-epic-silver text-gray-500 leading-relaxed pl-12">
        Catálogo de conceptos de cobro (mensualidades, inscripciones, uniformes, clases
        privadas), configuración de precios por tier y grupo, día de corte global y
        reglas de descuento automático.
      </p>
    </div>
  );
}
