"use client";

import { motion } from "framer-motion";
import { User, Mail, Phone, Briefcase, GraduationCap, DollarSign, Edit2 } from "lucide-react";
import { Rol } from "@/app/generated/prisma/enums";
import { useState } from "react";
import { StaffForm } from "./StaffForm";

interface StaffCardProps {
  member: any;
}

export function StaffCard({ member }: StaffCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  
  const getRolLabel = (rol: Rol) => {
    switch (rol) {
      case Rol.ADMIN: return "Administrador";
      case Rol.MAESTRO: return "Maestro";
      case Rol.RECEPCIONISTA: return "Recepción";
      default: return rol;
    }
  };

  const getRolColor = (rol: Rol) => {
    switch (rol) {
      case Rol.ADMIN: return "text-epic-gold bg-epic-gold/10 border-epic-gold/20";
      case Rol.MAESTRO: return "text-purple-400 bg-purple-400/10 border-purple-400/20";
      case Rol.RECEPCIONISTA: return "text-cyan-400 bg-cyan-400/10 border-cyan-400/20";
      default: return "text-white/40 bg-white/5 border-white/10";
    }
  };

  return (
    <>
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 }
        }}
        className="group glass p-6 rounded-[2rem] border-white/5 relative overflow-hidden transition-all hover:border-white/20"
      >
        {/* Decorative Light Glow */}
        <div className="absolute -top-12 -right-12 w-24 h-24 bg-white/5 blur-3xl group-hover:bg-white/10 transition-all rounded-full" />
        
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
              <User className="text-white/60" size={24} />
            </div>
            <div>
              <h3 className="text-white font-montserrat font-bold text-lg leading-tight">
                {member.nombre} {member.apellido}
              </h3>
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-montserrat font-bold uppercase tracking-wider border ${getRolColor(member.rol)}`}>
                {getRolLabel(member.rol)}
              </span>
            </div>
          </div>
          
          <button 
            onClick={() => setIsEditing(true)}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all"
          >
            <Edit2 size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm text-white/50">
            <Mail size={16} className="text-white/20" />
            <span className="truncate">{member.email}</span>
          </div>
          
          {member.telefono && (
            <div className="flex items-center gap-3 text-sm text-white/50">
              <Phone size={16} className="text-white/20" />
              <span>{member.telefono}</span>
            </div>
          )}

          {member.rol === Rol.MAESTRO && member.profesor && (
            <div className="pt-4 mt-4 border-t border-white/5 space-y-4">
              <div className="flex items-center gap-3 text-sm text-white/60 italic">
                <GraduationCap size={16} className="text-epic-gold/40" />
                <span>{member.profesor.especialidades?.join(", ") || "Sin especialidad"}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-2 text-xs font-montserrat font-medium text-white/40 uppercase tracking-widest">
                  <DollarSign size={14} />
                  Tarifa / Hora
                </div>
                <div className="text-epic-gold font-montserrat font-bold text-lg">
                  ${Number(member.profesor.tarifaHora).toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      <StaffForm 
        isOpen={isEditing} 
        onClose={() => setIsEditing(false)} 
        initialData={{
          id: member.id,
          nombre: member.nombre,
          apellido: member.apellido,
          email: member.email,
          rol: member.rol,
          telefono: member.telefono || "",
          tarifaHora: member.profesor?.tarifaHora,
          especialidades: member.profesor?.especialidades,
          activo: member.activo
        }}
      />
    </>
  );
}
