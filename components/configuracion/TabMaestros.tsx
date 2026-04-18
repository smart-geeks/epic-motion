'use client';

import { GraduationCap } from 'lucide-react';

export default function TabMaestros() {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
          <GraduationCap size={18} className="text-purple-400" />
        </div>
        <h2 className="font-montserrat font-bold text-xl text-epic-black dark:text-white tracking-[0.03em]">
          Maestros y Staff
        </h2>
      </div>
      <p className="font-inter text-sm dark:text-epic-silver text-gray-500 leading-relaxed pl-12">
        Administra el equipo docente: alta de maestros, especialidades, tarifa por hora,
        asignación a grupos y gestión de accesos. También cubre recepcionistas y cualquier
        rol de staff con acceso al sistema.
      </p>
    </div>
  );
}
