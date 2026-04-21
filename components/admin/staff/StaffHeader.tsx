"use client";

import { Plus, Users } from "lucide-react";
import { useState } from "react";
import { StaffForm } from "./StaffForm";

export function StaffHeader() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-3xl font-montserrat font-bold text-white flex items-center gap-3">
          <Users className="text-epic-gold" size={32} />
          Equipo <span className="text-white/50">& Staff</span>
        </h1>
        <p className="text-white/40 font-inter text-sm">
          Administra maestros, recepcionistas y perfiles administrativos.
        </p>
      </div>

      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center gap-2 px-6 py-3 bg-epic-gold text-black font-montserrat font-bold rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-liquid"
      >
        <Plus size={20} />
        Añadir Miembro
      </button>

      <StaffForm isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
}
